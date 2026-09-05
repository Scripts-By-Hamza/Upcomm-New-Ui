import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  canViewConversation,
} from '../../utils/messages/messagePermissions';
import { ConversationList } from '../../components/messages/ConversationList';
import { ConversationHeader } from '../../components/messages/ConversationHeader';
import { MessageThread } from '../../components/messages/MessageThread';
import { MessageComposer } from '../../components/messages/MessageComposer';
import { ConversationDetailsDrawer } from '../../components/messages/ConversationDetailsDrawer';
import { NewMessageDialog } from '../../components/messages/NewMessageDialog';
import {
  MessageSquare,
  Plus,
} from 'lucide-react';

export function MessagesPage() {
  const { currentUser, users = [] } = useAuth();
  const {
    conversations = [],
    conversationParticipants = [],
    messages = [],
    sendMessage,
    getOrCreateDirectConversation,
    markConversationAsRead,
  } = useAppData();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Dialog & Drawer States
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  // Active Conversation ID from URL or local state
  const urlConvId = searchParams.get('conversationId');
  const urlUserId = searchParams.get('userId');
  const handledUserIdRef = useRef(null);

  // Filter conversations that the current user is permitted to view & participates in
  const userConversations = useMemo(() => {
    return (conversations || []).filter((c) =>
      canViewConversation(currentUser, c, conversationParticipants)
    );
  }, [conversations, currentUser, conversationParticipants]);

  const [activeConversationId, setActiveConversationId] = useState(() => {
    if (urlConvId && userConversations.some((c) => String(c.id) === String(urlConvId))) {
      return urlConvId;
    }
    return userConversations[0]?.id || null;
  });

  // Handle ?userId param to open/create direct chat without duplicate loops
  useEffect(() => {
    if (!urlUserId || !currentUser?.id || String(urlUserId) === String(currentUser.id)) {
      return;
    }

    if (handledUserIdRef.current === urlUserId) {
      return;
    }

    handledUserIdRef.current = urlUserId;

    // Look for existing direct conversation
    const currentUid = String(currentUser.id);
    const targetUid = String(urlUserId);

    const existing = userConversations.find((c) => {
      if (c.type !== 'direct') return false;
      const pList = (conversationParticipants || []).filter(
        (p) => String(p.conversation_id) === String(c.id)
      );
      const pIds = pList.map((p) => String(p.user_id));
      return pIds.includes(currentUid) && pIds.includes(targetUid);
    });

    if (existing) {
      setActiveConversationId(existing.id);
      setSearchParams({ conversationId: existing.id }, { replace: true });
    } else {
      getOrCreateDirectConversation({
        recipientId: urlUserId,
      }).then((conv) => {
        if (conv && conv.id) {
          setActiveConversationId(conv.id);
          setSearchParams({ conversationId: conv.id }, { replace: true });
        }
      });
    }
  }, [
    urlUserId,
    currentUser?.id,
    userConversations,
    conversationParticipants,
    getOrCreateDirectConversation,
    setSearchParams,
  ]);

  // Keep activeConversationId synced with URL params and available conversations
  useEffect(() => {
    if (urlConvId && userConversations.some((c) => String(c.id) === String(urlConvId))) {
      if (activeConversationId !== urlConvId) {
        setActiveConversationId(urlConvId);
      }
    } else if (!activeConversationId && userConversations.length > 0) {
      setActiveConversationId(userConversations[0].id);
    }
  }, [urlConvId, userConversations, activeConversationId]);

  // Mark active conversation as read when selected or when new messages arrive while viewing
  useEffect(() => {
    if (activeConversationId) {
      markConversationAsRead(activeConversationId);
    }
  }, [activeConversationId, messages.length, markConversationAsRead]);

  const handleSelectConversation = (convId) => {
    setActiveConversationId(convId);
    setSearchParams({ conversationId: convId });
    setReplyingTo(null);
  };

  const handleSendMessage = async ({ body, replyToId }) => {
    if (!activeConversationId || !body.trim()) return;

    await sendMessage({
      conversationId: activeConversationId,
      body,
      replyToId,
    });
    setReplyingTo(null);
  };

  // Active Conversation Object
  const activeConversation = userConversations.find(
    (c) => String(c.id) === String(activeConversationId)
  );

  // Active Participants
  const activeParticipants = useMemo(() => {
    if (!activeConversationId) return [];
    return (conversationParticipants || [])
      .filter((p) => String(p.conversation_id) === String(activeConversationId))
      .map((p) => users.find((u) => String(u.id) === String(p.user_id)))
      .filter(Boolean);
  }, [activeConversationId, conversationParticipants, users]);

  // Active Messages
  const activeMessages = useMemo(() => {
    if (!activeConversationId) return [];
    return (messages || [])
      .filter((m) => String(m.conversation_id) === String(activeConversationId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [activeConversationId, messages]);

  return (
    <div className="space-y-4 max-w-full font-['Inter']">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        <div>
          <h1 className="text-[22px] font-bold text-[#18181B] dark:text-[#F4F4F5] tracking-tight leading-tight">
            Messages
          </h1>
          <p className="text-[13px] text-[#71717A] dark:text-[#8E949E] mt-0.5">
            Private conversations with your UPCOMM team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsNewMessageOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 h-[38px] bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Message</span>
        </button>
      </div>

      {/* 2. Main Messaging Workspace Surface */}
      <div className="h-[calc(100vh-215px)] min-h-[560px] bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[10px] overflow-hidden flex shadow-none">
        {/* Left Column: Conversation List (hidden on mobile if a chat is active) */}
        <div
          className={`w-full md:w-80 lg:w-[320px] flex-shrink-0 flex flex-col border-r border-[#E5E7EB] dark:border-[#2A2E34] ${
            activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ConversationList
            conversations={userConversations}
            activeConversationId={activeConversationId}
            onSelectConversation={handleSelectConversation}
            onOpenNewMessage={() => setIsNewMessageOpen(true)}
          />
        </div>

        {/* Right Column: Active Conversation Workspace */}
        <div
          className={`flex-1 flex h-full min-w-0 bg-white dark:bg-[#17191C] ${
            !activeConversationId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <div className="flex-1 flex flex-col h-full min-w-0">
              <ConversationHeader
                conversation={activeConversation}
                participants={activeParticipants}
                onBack={() => setActiveConversationId(null)}
                isDetailsOpen={isDetailsOpen}
                onToggleDetails={() => setIsDetailsOpen(!isDetailsOpen)}
              />

              <div className="flex-1 flex overflow-hidden min-h-0">
                {/* Main Message Thread + Composer */}
                <div className="flex-1 flex flex-col min-w-0 h-full">
                  <MessageThread
                    conversation={activeConversation}
                    messages={activeMessages}
                    participants={activeParticipants}
                    onReply={(msg) => setReplyingTo(msg)}
                  />

                  <MessageComposer
                    conversation={activeConversation}
                    participants={activeParticipants}
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    onSendMessage={handleSendMessage}
                  />
                </div>

                {/* Optional Right Details Drawer */}
                {isDetailsOpen && (
                  <ConversationDetailsDrawer
                    conversation={activeConversation}
                    participants={activeParticipants}
                    messages={activeMessages}
                    onClose={() => setIsDetailsOpen(false)}
                  />
                )}
              </div>
            </div>
          ) : (
            /* Restrained Empty State when no conversation is selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#17191C] select-none">
              <div className="w-14 h-14 rounded-2xl bg-[#F4F4F5] dark:bg-[#1D2024] flex items-center justify-center text-[#71717A] dark:text-[#8E949E] mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-[16px] font-bold text-[#18181B] dark:text-[#F4F4F5] mb-1">
                {userConversations.length === 0 ? 'Start a conversation' : 'Select a conversation'}
              </h3>
              <p className="text-[13px] text-[#71717A] dark:text-[#8E949E] max-w-sm mb-5">
                {userConversations.length === 0
                  ? 'Send a private message to someone on your UPCOMM team.'
                  : 'Choose a conversation from the left or start a new message.'}
              </p>
              <button
                type="button"
                onClick={() => setIsNewMessageOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 h-[36px] bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>New Message</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog
        isOpen={isNewMessageOpen}
        onClose={() => setIsNewMessageOpen(false)}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
}

export default MessagesPage;
