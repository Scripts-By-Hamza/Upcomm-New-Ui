import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { canReportMessage } from '../../utils/messages/messagePermissions';
import { formatBubbleTime } from '../../utils/messages/messageSelectors';
import { Avatar } from '../common/Avatar';
import {
  Reply,
  Copy,
  Check,
  Flag,
  Radio,
  CornerDownRight,
  MoreHorizontal,
} from 'lucide-react';

export function MessageBubble({
  message,
  conversation,
  senderUser,
  parentMessage,
  parentSenderUser,
  onReply,
  onReport,
  isGroup = false,
  isFirstInGroup = true,
  isLastInGroup = true,
}) {
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isMe = String(message.sender_id) === String(currentUser?.id);
  const isBroadcast = message.source_type === 'broadcast';
  const canReport = !isMe && canReportMessage(currentUser, message);
  const isReported = Boolean(message.is_reported || message.has_reported);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(message.body || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsMenuOpen(false);
  };

  // Render text with styled @mentions
  const renderMessageBody = (text) => {
    if (!text) return null;
    const mentionRegex = /(@[\w\s.-]+?)(?=\s@|\s|[.,!?:;]|$)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <span
          key={match.index}
          className={`inline-block font-semibold px-1.5 py-0.2 rounded text-[12.5px] ${
            isMe
              ? 'bg-[#A7F3D0]/60 dark:bg-emerald-900/40 text-[#065F46] dark:text-emerald-300'
              : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          }`}
        >
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts;
  };

  const senderName = isMe
    ? currentUser?.full_name || 'Hasan Ali'
    : senderUser?.full_name || 'Team Member';

  return (
    <div
      className={`group relative flex gap-3 px-6 select-none transition-all ${
        isMe ? 'justify-end' : 'justify-start'
      } ${isFirstInGroup ? 'mt-4' : 'mt-1'}`}
    >
      {/* Left Avatar for Incoming Message (Shown on first in group) */}
      {!isMe && (
        <div className="w-8 shrink-0 flex items-start">
          {isFirstInGroup ? (
            <Avatar
              src={senderUser?.avatar_url}
              name={senderName}
              size="sm"
              className="w-8 h-8 text-[11px]"
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`flex flex-col max-w-[70%] sm:max-w-[62%] ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* Header line: Sender Name + Timestamp (Only on first in group) */}
        {isFirstInGroup && (
          <div
            className={`flex items-baseline gap-2 mb-1 px-1 ${
              isMe ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <span className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
              {senderName}
            </span>
            <span className="text-[11px] text-[#71717A] dark:text-[#8E949E]">
              {formatBubbleTime(message.created_at)}
            </span>
          </div>
        )}

        {/* Quoted Reply Block */}
        {parentMessage && (
          <div
            className={`flex items-center gap-1.5 text-[11.5px] px-2.5 py-1 mb-1 rounded-[6px] border border-dashed transition-all ${
              isMe
                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-[#065F46] dark:text-emerald-300'
                : 'bg-gray-100/80 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700 text-[#52525B] dark:text-gray-300'
            }`}
          >
            <CornerDownRight className="w-3 h-3 text-[#71717A] shrink-0" />
            <span className="font-semibold truncate max-w-[120px]">
              {parentSenderUser?.full_name || 'User'}:
            </span>
            <span className="truncate italic">"{parentMessage.body}"</span>
          </div>
        )}

        {/* Bubble Surface & Text */}
        <div className="relative group/bubble">
          <div
            className={`px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed break-words whitespace-pre-wrap select-text transition-shadow ${
              isMe
                ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/25 text-[#18181B] dark:text-[#F4F4F5] border border-[#A7F3D0]/60 dark:border-[#059669]/25 rounded-tr-xs'
                : 'bg-[#F4F4F5] dark:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5] rounded-tl-xs'
            }`}
          >
            {/* Broadcast Announcement Label */}
            {isBroadcast && (
              <div
                className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full mb-1.5 ${
                  isMe
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-[#065F46] dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Broadcast</span>
              </div>
            )}

            <div>{renderMessageBody(message.body)}</div>
          </div>

          {/* Floating Action Strip on Hover */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 hidden group-hover/bubble:flex items-center gap-0.5 p-1 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] shadow-md z-20 ${
              isMe ? 'right-full mr-2' : 'left-full ml-2'
            }`}
          >
            {onReply && (
              <button
                type="button"
                onClick={() => onReply(message)}
                title="Reply"
                className="p-1 rounded-[5px] text-[#71717A] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors cursor-pointer"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              title={copied ? 'Copied' : 'Copy message'}
              className="p-1 rounded-[5px] text-[#71717A] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors cursor-pointer"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#059669]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Three-dot dropdown menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1 rounded-[5px] text-[#71717A] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors cursor-pointer"
                title="More actions"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] shadow-lg py-1 z-30 animate-fade-in">
                  {onReply && (
                    <button
                      type="button"
                      onClick={() => {
                        onReply(message);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
                    >
                      <Reply className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>

                  {canReport && onReport && (
                    <button
                      type="button"
                      disabled={isReported}
                      onClick={() => {
                        onReport(message);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] transition-colors text-left ${
                        isReported
                          ? 'text-[#A1A1AA] cursor-not-allowed'
                          : 'text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer'
                      }`}
                    >
                      <Flag className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>{isReported ? 'Reported' : 'Report message'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Avatar for Outgoing Message (Shown on first in group) */}
      {isMe && (
        <div className="w-8 shrink-0 flex items-start">
          {isFirstInGroup ? (
            <Avatar
              src={currentUser?.avatar_url}
              name={senderName}
              size="sm"
              className="w-8 h-8 text-[11px] bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
