/**
 * UPCOMM AI Assistant - Bounded Agent Loop
 * 
 * Manages the multi-turn inference and safe tool-calling loop (max 5 iterations).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedUser } from './auth.ts';
import { callAIProvider, ChatMessage } from './nvidia.ts';
import { getSystemPrompt } from './systemPrompt.ts';
import { REGISTERED_TOOLS, executeTool } from './toolRegistry.ts';
import { normalizeAgentResponse } from './responseNormalizer.ts';

const MAX_ITERATIONS = 5;

export async function runAgentLoop(params: {
  supabaseAdmin: SupabaseClient;
  user: AuthenticatedUser;
  conversationId: string;
  userPrompt: string;
}) {
  const { supabaseAdmin, user, conversationId, userPrompt } = params;

  // 1. Load recent conversation history (last 20 messages)
  const { data: pastMessages } = await supabaseAdmin
    .from('ai_agent_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(20);

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: getSystemPrompt(user),
    },
  ];

  (pastMessages || []).forEach((m: any) => {
    if (m.role === 'user' || m.role === 'assistant') {
      messages.push({
        role: m.role,
        content: m.content || '',
      });
    }
  });

  // Add the current user prompt
  messages.push({
    role: 'user',
    content: userPrompt,
  });

  // Save user message to database
  await supabaseAdmin.from('ai_agent_messages').insert({
    conversation_id: conversationId,
    role: 'user',
    content: userPrompt,
    message_type: 'text',
  });

  let iterations = 0;
  let finalAssistantContent: string | null = null;
  const toolOutputs: Array<{ name: string; output: any }> = [];
  let pendingAction: any = null;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalLatencyMs = 0;
  let modelUsed = 'nvidia/nemotron-3-super-120b-a12b';

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const providerResponse = await callAIProvider({
      messages,
      tools: REGISTERED_TOOLS,
      toolChoice: 'auto',
    });

    if (providerResponse.usage) {
      totalPromptTokens += providerResponse.usage.prompt_tokens;
      totalCompletionTokens += providerResponse.usage.completion_tokens;
    }
    totalLatencyMs += providerResponse.latency_ms;
    modelUsed = providerResponse.model;

    const assistantMsg = providerResponse.message;
    messages.push(assistantMsg);

    // If model produced a text answer without tool calls
    if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
      finalAssistantContent = assistantMsg.content || '';
      break;
    }

    // Execute tool calls
    let hasPrepareWrite = false;

    for (const toolCall of assistantMsg.tool_calls) {
      const toolName = toolCall.function.name;
      const rawArgs = toolCall.function.arguments;

      let toolResult: any;
      try {
        toolResult = await executeTool(toolName, rawArgs, {
          supabaseAdmin,
          user,
          conversationId,
        });

        toolOutputs.push({ name: toolName, output: toolResult });

        if (toolName.startsWith('prepare_')) {
          pendingAction = toolResult;
          hasPrepareWrite = true;
        }
      } catch (err: any) {
        console.error(`[agentLoop] Tool '${toolName}' error:`, err);
        toolResult = { error: err.message || 'Tool execution failed' };
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        name: toolName,
        content: JSON.stringify(toolResult),
      });
    }

    // If a write was prepared, we can let model synthesize the final confirmation prompt or stop
    if (hasPrepareWrite) {
      finalAssistantContent = pendingAction?.message || assistantMsg.content || 'I have prepared the task. Please review the details below.';
      break;
    }
  }

  if (!finalAssistantContent && iterations >= MAX_ITERATIONS) {
    finalAssistantContent = "I've analyzed your workspace with the available data. Please see the details below or make your request more specific.";
  }

  // 2. Normalize structured response blocks
  const normalized = normalizeAgentResponse({
    conversationId,
    assistantContent: finalAssistantContent,
    toolOutputs,
    pendingAction,
  });

  // 3. Persist Assistant Message turn to DB
  await supabaseAdmin.from('ai_agent_messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: finalAssistantContent,
    message_type: pendingAction ? 'action_confirmation' : (toolOutputs.some((t) => t.name === 'get_department_report') ? 'report' : 'text'),
    metadata: {
      blocks: normalized.blocks,
      pendingAction: normalized.pendingAction,
    },
  });

  // 4. Update conversation timestamp & title if first message
  const titleSnippet = userPrompt.length > 30 ? `${userPrompt.substring(0, 30)}...` : userPrompt;
  await supabaseAdmin
    .from('ai_agent_conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  // 5. Record operational telemetry
  await supabaseAdmin.from('ai_agent_usage').insert({
    user_id: user.id,
    provider: 'nvidia',
    model: modelUsed,
    prompt_tokens: totalPromptTokens,
    completion_tokens: totalCompletionTokens,
    latency_ms: totalLatencyMs,
  });

  return normalized;
}
