/**
 * Message and Conversation Selectors / Utility Helpers
 */

/**
 * Formats relative timestamp for conversation list and message bubbles.
 */
export function formatMessageTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export const formatRelativeMessageTime = formatMessageTime;

/**
 * Formats full timestamp for message tooltips/details.
 */
export function formatFullMessageTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Formats time for within-bubble timestamp (e.g. "10:42 AM").
 */
export function formatBubbleTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Helper to normalize conversation and userId arguments regardless of parameter order.
 */
function normalizeConvAndUser(arg1, arg2) {
  let conv = null;
  let userId = null;

  if (typeof arg1 === 'object' && arg1 !== null) {
    conv = arg1;
    userId = typeof arg2 === 'string' ? arg2 : arg2?.id || null;
  } else if (typeof arg2 === 'object' && arg2 !== null) {
    conv = arg2;
    userId = typeof arg1 === 'string' ? arg1 : arg1?.id || null;
  } else if (typeof arg1 === 'string' && typeof arg2 === 'string') {
    // If one is conv-xxx, identify it
    if (arg1.startsWith('conv-') || arg1.startsWith('dm-')) {
      conv = { id: arg1 };
      userId = arg2;
    } else {
      userId = arg1;
      conv = { id: arg2 };
    }
  }

  return { conv, userId };
}

/**
 * Gets the other participant user object in a direct 1-to-1 conversation.
 */
export function getDirectOtherParticipant(arg1, arg2, participants = [], users = []) {
  const { conv, userId } = normalizeConvAndUser(arg1, arg2);
  if (!conv || !userId) return null;

  // 1. If participants already contains full user objects (with .id, .full_name/.email)
  const directMatch = (participants || []).find(
    (p) => p && p.id && String(p.id) !== String(userId) && (p.full_name || p.email)
  );
  if (directMatch) return directMatch;

  // 2. If participants contains conversation_participants rows
  const convId = conv.id;
  const convParticipants = (participants || []).filter(
    (p) => p && (p.conversation_id === convId || !p.conversation_id)
  );

  const otherParticipant = convParticipants.find(
    (p) => p && (p.user_id ? String(p.user_id) !== String(userId) : String(p.id) !== String(userId))
  );

  const targetId = otherParticipant?.user_id || otherParticipant?.id;
  if (!targetId) return null;

  return (users || []).find((u) => u && String(u.id) === String(targetId)) || null;
}

export const getDirectOtherUser = getDirectOtherParticipant;

/**
 * Returns all user objects participating in a conversation.
 */
export function getConversationParticipants(conversationId, participants = [], users = []) {
  if (!conversationId) return [];

  // If participants is already an array of full user objects
  if (Array.isArray(participants) && participants.length > 0 && participants[0]?.full_name) {
    return participants;
  }

  const userMap = new Map();
  (users || []).forEach((u) => {
    if (u?.id) userMap.set(String(u.id), u);
  });

  return (participants || [])
    .filter((p) => p && (p.conversation_id === conversationId || !p.conversation_id))
    .map((p) => userMap.get(String(p.user_id || p.id)))
    .filter(Boolean);
}

/**
 * Derives the canonical conversation display title.
 */
export function formatConversationTitle(conversation, currentUserId, participants = [], users = []) {
  if (!conversation) return 'Conversation';

  if (conversation.type === 'direct') {
    const otherUser = getDirectOtherParticipant(conversation, currentUserId, participants, users);
    if (otherUser?.full_name) return otherUser.full_name;
    if (otherUser?.email) return otherUser.email;
    return 'Direct Message';
  }

  // Group conversation
  if (conversation.name && conversation.name.trim()) {
    return conversation.name.trim();
  }

  // Derive title from members excluding current user
  const members = getConversationParticipants(conversation.id, participants, users).filter(
    (u) => u && String(u.id) !== String(currentUserId)
  );

  if (members.length === 0) return 'Private Group';
  if (members.length === 1) return members[0].full_name || 'Group Member';
  if (members.length === 2) {
    return `${members[0].full_name?.split(' ')[0] || ''}, ${members[1].full_name?.split(' ')[0] || ''}`;
  }

  return `${members[0].full_name?.split(' ')[0] || ''}, ${members[1].full_name?.split(' ')[0] || ''} +${members.length - 2}`;
}

export const getConversationTitle = formatConversationTitle;

/**
 * Calculates the number of unread messages for a specific conversation and user.
 * CRITICAL PRIVACY & ACCURACY FIX: If the user is NOT a participant, immediately return 0.
 */
export function getConversationUnreadCount(currentUserId, conversationId, participants = [], messages = []) {
  let convId = conversationId;
  let userId = currentUserId;
  if (typeof currentUserId === 'string' && typeof conversationId === 'string') {
    if (currentUserId.startsWith('conv-') && !conversationId.startsWith('conv-')) {
      convId = currentUserId;
      userId = conversationId;
    }
  }

  if (!convId || !userId) return 0;

  const participant = (participants || []).find(
    (p) => p && String(p.conversation_id) === String(convId) && String(p.user_id) === String(userId)
  );

  // If user is NOT a participant in this conversation, they have 0 unread messages
  if (!participant) return 0;

  const lastReadAt = participant.last_read_at ? new Date(participant.last_read_at).getTime() : 0;

  return (messages || []).filter((m) => {
    if (!m || String(m.conversation_id) !== String(convId)) return false;
    if (String(m.sender_id) === String(userId)) return false; // Exclude own sent messages
    if (m.deleted_at) return false;

    const messageTime = new Date(m.created_at || 0).getTime();
    return messageTime > lastReadAt;
  }).length;
}

/**
 * Calculates the global total unread private messages for the logged-in user.
 */
export function getTotalUnreadMessagesCount(currentUserId, userConversations = [], participants = [], messages = []) {
  if (!currentUserId || !Array.isArray(userConversations)) return 0;

  let total = 0;
  userConversations.forEach((conv) => {
    if (conv?.id) {
      total += getConversationUnreadCount(currentUserId, conv.id, participants, messages);
    }
  });

  return total;
}

/**
 * Resolves the parent message for replies, checking both reply_to_message_id and reply_to_id.
 */
export function getParentMessage(message, allMessages = []) {
  if (!message) return null;
  const parentId = message.reply_to_message_id || message.reply_to_id;
  if (!parentId) return null;
  return (allMessages || []).find((m) => m && String(m.id) === String(parentId)) || null;
}

/**
 * Groups messages by calendar date for clear chat separators. Returns { [dateLabel]: messages[] }.
 */
export function groupMessagesByDate(messages = []) {
  const groups = {};

  messages.forEach((msg) => {
    if (!msg || !msg.created_at) return;
    const msgDate = new Date(msg.created_at);
    const dateKey = msgDate.toISOString().split('T')[0];

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    let dateLabel = msgDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: msgDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });

    if (dateKey === today) dateLabel = 'Today';
    else if (dateKey === yesterday) dateLabel = 'Yesterday';

    if (!groups[dateLabel]) {
      groups[dateLabel] = [];
    }

    groups[dateLabel].push(msg);
  });

  return groups;
}
