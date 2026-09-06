/**
 * UPCOMM Solutions Task Manager - AI Assistant Client Service
 * 
 * Invokes the ai-agent Edge Function securely using Bearer authorization.
 * Provides functions for chat turns, action confirmations, and conversation management.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

async function getAuthHeaders(currentUser) {
  let token = currentUser?.id || '';

  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        token = data.session.access_token;
      }
    } catch (_) {}
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function getFunctionEndpoint() {
  const supaUrl = import.meta.env.VITE_SUPABASE_URL || '';
  if (supaUrl && !supaUrl.includes('placeholder')) {
    return `${supaUrl.replace(/\/+$/, '')}/functions/v1/ai-agent`;
  }
  return '/functions/v1/ai-agent';
}

export async function sendAiMessage({ conversationId, message, currentUser }) {
  if (!message || !message.trim()) {
    throw new Error('Message content is required.');
  }

  const headers = await getAuthHeaders(currentUser);
  const endpoint = getFunctionEndpoint();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      conversationId: conversationId || undefined,
      message: message.trim(),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('UPCOMM AI is temporarily busy. Please wait a few seconds and try again.');
    }
    throw new Error(data.error || `AI request failed (${response.status})`);
  }

  return data;
}

export async function confirmAiPendingAction({ pendingActionId, currentUser }) {
  if (!pendingActionId) {
    throw new Error('pendingActionId is required.');
  }

  const headers = await getAuthHeaders(currentUser);
  const endpoint = `${getFunctionEndpoint()}?action=confirm`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pendingActionId,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Confirmation failed (${response.status})`);
  }

  return data;
}

export async function cancelAiPendingAction({ pendingActionId, currentUser }) {
  if (!pendingActionId) {
    throw new Error('pendingActionId is required.');
  }

  const headers = await getAuthHeaders(currentUser);
  const endpoint = `${getFunctionEndpoint()}?action=cancel`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      pendingActionId,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Cancellation failed (${response.status})`);
  }

  return data;
}

export async function fetchUserAiConversations(userId) {
  if (!userId || !isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('ai_agent_conversations')
      .select('*')
      .eq('user_id', String(userId))
      .is('archived_at', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Could not fetch AI conversations from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.warn('Fetch AI conversations exception:', e);
    return [];
  }
}

export async function fetchConversationMessages(conversationId) {
  if (!conversationId || !isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('ai_agent_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.warn('Could not fetch AI messages from Supabase:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.warn('Fetch AI messages exception:', e);
    return [];
  }
}

export async function archiveAiConversation(conversationId) {
  if (!conversationId || !isSupabaseConfigured || !supabase) return;

  try {
    await supabase
      .from('ai_agent_conversations')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', conversationId);
  } catch (e) {
    console.warn('Archive conversation error:', e);
  }
}
