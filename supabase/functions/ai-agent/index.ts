/**
 * UPCOMM Solutions Task Manager - NVIDIA NIM AI Assistant Edge Function
 * 
 * Secure backend entrypoint orchestrating conversational AI, tool execution, and confirmed mutations.
 */

import { createClient } from '@supabase/supabase-js';
import { verifyAdminAuth } from './auth.ts';
import { runAgentLoop } from './agentLoop.ts';
import { executePendingAction, cancelPendingAction } from './mutationExecutor.ts';
import { callAIProvider } from './nvidia.ts';

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // 1. Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);

  // 2. Health & Provider Connectivity Test
  if (req.method === 'GET' && url.pathname.endsWith('/health')) {
    try {
      const ping = await callAIProvider({
        messages: [{ role: 'user', content: 'Reply with "UPCOMM_OK"' }],
        maxTokens: 10,
      });

      return new Response(
        JSON.stringify({
          status: 'healthy',
          provider: 'nvidia',
          model: ping.model,
          latency_ms: ping.latency_ms,
        }),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    } catch (err: any) {
      return new Response(
        JSON.stringify({ status: 'unhealthy', error: err.message }),
        { status: 503, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }
  }

  // 3. Authenticate and authorize caller as Admin / IT Support
  const authResult = await verifyAdminAuth(req, supabaseAdmin);
  if (!authResult.success || !authResult.user) {
    return new Response(
      JSON.stringify({ error: authResult.error || 'Unauthorized' }),
      {
        status: authResult.status || 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  const user = authResult.user;

  try {
    const body = await req.json().catch(() => ({}));
    const actionQuery = url.searchParams.get('action') || body.action;

    // 4. Handle Pending Action Confirmation (Idempotent execution)
    if (actionQuery === 'confirm') {
      const pendingActionId = body.pendingActionId || body.pending_action_id;
      if (!pendingActionId) {
        return new Response(
          JSON.stringify({ error: 'pendingActionId is required for confirmation.' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      const execResult = await executePendingAction(supabaseAdmin, user, pendingActionId);
      return new Response(
        JSON.stringify(execResult),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Handle Pending Action Cancellation
    if (actionQuery === 'cancel') {
      const pendingActionId = body.pendingActionId || body.pending_action_id;
      const cancelResult = await cancelPendingAction(supabaseAdmin, user, pendingActionId);
      return new Response(
        JSON.stringify(cancelResult),
        { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Handle Standard Conversational AI Agent Turn
    const message = (body.message || body.prompt || '').trim();
    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message content is required.' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    let conversationId = body.conversationId || body.conversation_id;

    // Auto-create conversation thread if new
    if (!conversationId) {
      const initialTitle = message.length > 35 ? `${message.substring(0, 35)}...` : message;
      const { data: newConv, error: convErr } = await supabaseAdmin
        .from('ai_agent_conversations')
        .insert({
          user_id: user.id,
          title: initialTitle,
        })
        .select()
        .single();

      if (convErr || !newConv) {
        throw new Error(`Failed to initialize conversation thread: ${convErr?.message}`);
      }
      conversationId = newConv.id;
    }

    // Run safe bounded agent loop
    const result = await runAgentLoop({
      supabaseAdmin,
      user,
      conversationId,
      userPrompt: message,
    });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[ai-agent] Handler exception:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Internal AI Assistant error.' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
