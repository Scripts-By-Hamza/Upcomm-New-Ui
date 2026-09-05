import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { groupMessagesByDate } from '../../utils/messages/messageSelectors';
import { MessageBubble } from './MessageBubble';
import { MessageSquare, ArrowDown } from 'lucide-react';

export function MessageThread({
  conversation,
  messages = [],
  participants = [],
  onReply,
  highlightedMessageId,
  onJumpToMessage,
  searchQuery = '',
}) {
  const { currentUser, users = [] } = useAuth();
  const {
    messageReactions = [],
    pinnedMessages = [],
    toggleMessageReaction,
    pinMessage,
    unpinMessage,
    deleteMessage,
  } = useAppData();

  const threadContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessagesCountRef = useRef(messages.length);

  const [localHighlightedId, setLocalHighlightedId] = useState(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);

  const isGroup = conversation?.type === 'group';

  // Group messages chronologically by date
  const groupedDates = groupMessagesByDate(messages);

  // Check scroll position to determine if user is near bottom
  const handleScroll = useCallback(() => {
    if (!threadContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = threadContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;

    setShowScrollBottomBtn(!isNearBottom);
    if (isNearBottom) {
      setHasUnreadBelow(false);
    }
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
      setHasUnreadBelow(false);
    }
  }, []);

  // Handle messages list changes
  useEffect(() => {
    if (!threadContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = threadContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 140;

    const isInitialLoad = prevMessagesCountRef.current === 0 && messages.length > 0;
    const isNewMessage = messages.length > prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    if (isInitialLoad) {
      scrollToBottom('auto');
    } else if (isNewMessage) {
      if (isNearBottom) {
        scrollToBottom('smooth');
      } else {
        setHasUnreadBelow(true);
      }
    }
  }, [messages.length, scrollToBottom]);

  // Jump to specific message and briefly flash highlight
  const handleJumpToMessage = useCallback((targetMessageId) => {
    if (!targetMessageId) return;
    const element = document.getElementById(`message-${targetMessageId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setLocalHighlightedId(targetMessageId);
      setTimeout(() => {
        setLocalHighlightedId(null);
      }, 2200);
    } else if (onJumpToMessage) {
      onJumpToMessage(targetMessageId);
    }
  }, [onJumpToMessage]);

  // Sync external highlightedMessageId
  useEffect(() => {
    if (highlightedMessageId) {
      handleJumpToMessage(highlightedMessageId);
    }
  }, [highlightedMessageId, handleJumpToMessage]);

  return (
    <div
      ref={threadContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-[#F7F8FA] dark:bg-[#17191C] flex flex-col justify-between min-h-0 relative select-none"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#8B8B95]">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-center text-[#71717A] dark:text-[#8E949E] mb-3 shadow-xs">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h4 className="text-[15px] font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-1">
            No messages yet
          </h4>
          <p className="text-[13px] max-w-sm text-[#71717A] dark:text-[#8E949E]">
            Say hello to start the conversation! You can also use @ to mention participants.
          </p>
        </div>
      ) : (
        <div className="py-4 space-y-3">
          {Object.entries(groupedDates).map(([dateLabel, dateMsgs]) => (
            <div key={dateLabel} className="space-y-1">
              {/* Minimal Centered Date Pill Separator */}
              <div className="flex items-center justify-center my-4 px-6 select-none">
                <div className="px-3 py-0.5 bg-white dark:bg-[#22262B] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-full text-[11px] font-medium text-[#71717A] dark:text-[#8E949E] shadow-2xs">
                  {dateLabel}
                </div>
              </div>

              {/* Message Bubbles with Smart Sender Grouping */}
              {dateMsgs.map((msg, index) => {
                const prevMsg = index > 0 ? dateMsgs[index - 1] : null;
                const nextMsg = index < dateMsgs.length - 1 ? dateMsgs[index + 1] : null;

                const isSameSenderAsPrev =
                  prevMsg &&
                  String(prevMsg.sender_id) === String(msg.sender_id) &&
                  new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime() <
                    5 * 60 * 1000;

                const isSameSenderAsNext =
                  nextMsg &&
                  String(nextMsg.sender_id) === String(msg.sender_id) &&
                  new Date(nextMsg.created_at).getTime() - new Date(msg.created_at).getTime() <
                    5 * 60 * 1000;

                const isFirstInGroup = !isSameSenderAsPrev;
                const isLastInGroup = !isSameSenderAsNext;

                const sender = (users || []).find((u) => String(u.id) === String(msg.sender_id));
                const parentId = msg.reply_to_message_id || msg.reply_to_id;
                const parentMsg = parentId
                  ? messages.find((m) => String(m.id) === String(parentId))
                  : null;
                const parentSender = parentMsg
                  ? (users || []).find((u) => String(u.id) === String(parentMsg.sender_id))
                  : null;

                const msgReactions = (messageReactions || []).filter(
                  (r) => String(r.message_id) === String(msg.id)
                );

                const isPinned = (pinnedMessages || []).some(
                  (p) =>
                    String(p.conversation_id) === String(conversation?.id) &&
                    String(p.message_id) === String(msg.id)
                );

                const isHighlighted =
                  String(msg.id) === String(localHighlightedId) ||
                  String(msg.id) === String(highlightedMessageId);

                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    conversation={conversation}
                    senderUser={sender}
                    parentMessage={parentMsg}
                    parentSenderUser={parentSender}
                    reactions={msgReactions}
                    isPinned={isPinned}
                    isHighlighted={isHighlighted}
                    searchQuery={searchQuery}
                    onReply={onReply}
                    onToggleReaction={toggleMessageReaction}
                    onPinMessage={pinMessage}
                    onUnpinMessage={unpinMessage}
                    onDeleteMessage={deleteMessage}
                    onJumpToMessage={handleJumpToMessage}
                    isGroup={isGroup}
                    isFirstInGroup={isFirstInGroup}
                    isLastInGroup={isLastInGroup}
                    allUsers={users}
                  />
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      )}

      {/* Floating Scroll-to-Bottom / New Messages Pill Button */}
      {showScrollBottomBtn && (
        <div className="sticky bottom-3 right-0 left-0 flex justify-center pointer-events-none z-20">
          <button
            type="button"
            onClick={() => scrollToBottom('smooth')}
            className={`pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold shadow-lg transition-all cursor-pointer ${
              hasUnreadBelow
                ? 'bg-[#059669] hover:bg-[#047857] text-white animate-bounce'
                : 'bg-white dark:bg-[#1D2024] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5] border border-[#E5E7EB] dark:border-[#2A2E34]'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>{hasUnreadBelow ? '↓ New messages' : 'Scroll to bottom'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MessageThread;
