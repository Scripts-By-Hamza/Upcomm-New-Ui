import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getConversationTitle, getDirectOtherUser } from '../../utils/messages/messageSelectors';
import { Avatar } from '../common/Avatar';
import {
  Send,
  X,
  CornerDownRight,
  AtSign,
  Paperclip,
  Smile,
} from 'lucide-react';

export function MessageComposer({
  conversation,
  participants = [],
  replyingTo,
  onCancelReply,
  onSendMessage,
  disabled = false,
}) {
  const { currentUser, users = [] } = useAuth();
  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const isGroup = conversation?.type === 'group';
  const otherUser = !isGroup
    ? getDirectOtherUser(currentUser?.id, conversation, participants, users)
    : null;

  const targetName = isGroup
    ? conversation?.name || 'Group'
    : otherUser?.full_name?.split(' ')[0] || 'User';

  // Eligible mention candidates: other participants in this conversation
  const currentUid = String(currentUser?.id || '');
  const mentionCandidates = (participants || []).filter(
    (p) => p && String(p.id) !== currentUid
  );

  const filteredMentions =
    mentionQuery !== null
      ? mentionCandidates.filter((u) =>
          (u.full_name || '').toLowerCase().includes(mentionQuery.toLowerCase())
        )
      : [];

  // Handle textarea text change and detect @mentions
  const handleChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setText(val);

    // Look backward from cursor to find if user is typing an @mention
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      // Ensure no spaces or newline in the current mention token
      if (!/[\s\n]/.test(query)) {
        setMentionQuery(query);
        setMentionIndex(lastAtIndex);
        setSelectedMentionIdx(0);
        return;
      }
    }

    setMentionQuery(null);
  };

  const handleSelectMention = (user) => {
    if (mentionIndex === null || !user) return;
    const before = text.slice(0, mentionIndex);
    const after = text.slice(textareaRef.current.selectionStart || text.length);
    const newText = `${before}@${user.full_name} ${after}`;
    setText(newText);
    setMentionQuery(null);

    // Refocus and place cursor after inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const nextPos = mentionIndex + user.full_name.length + 2;
        textareaRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };

  const handleKeyDown = (e) => {
    // If mention popup is open
    if (mentionQuery !== null && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIdx((prev) => (prev + 1) % filteredMentions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIdx(
          (prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length
        );
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSelectMention(filteredMentions[selectedMentionIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionQuery(null);
        return;
      }
    }

    // Normal send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSendMessage({
      body: trimmed,
      replyToId: replyingTo?.id || null,
    });

    setText('');
    setMentionQuery(null);
    if (onCancelReply) onCancelReply();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleAddEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  return (
    <div className="relative border-t border-[#E5E7EB] dark:border-[#2A2E34] bg-white dark:bg-[#17191C] px-5 py-3 select-none">
      {/* @Mention Autocomplete Dropdown */}
      {mentionQuery !== null && filteredMentions.length > 0 && (
        <div className="absolute bottom-full mb-2 left-5 w-72 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[10px] shadow-xl z-30 max-h-48 overflow-y-auto p-1 animate-fade-in">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold text-[#8B8B95] uppercase tracking-wider border-b border-[#F4F4F5] dark:border-[#2A2E34] flex items-center gap-1">
            <AtSign className="w-3 h-3 text-[#059669]" />
            <span>Mention participant</span>
          </div>
          <div className="divide-y divide-[#F4F4F5] dark:divide-[#2A2E34]">
            {filteredMentions.map((user, idx) => (
              <div
                key={user.id}
                onClick={() => handleSelectMention(user)}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[7px] text-[13px] cursor-pointer transition-colors ${
                  idx === selectedMentionIdx
                    ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/30 text-[#065F46] dark:text-emerald-300 font-semibold'
                    : 'text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B]'
                }`}
              >
                <Avatar
                  src={user.avatar_url}
                  name={user.full_name || 'User'}
                  size="xs"
                />
                <div className="min-w-0 flex-1">
                  <span className="truncate block leading-tight">{user.full_name}</span>
                  <span className="text-[10.5px] text-[#71717A] dark:text-[#8E949E] truncate block">
                    {user.designation || user.email}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quoted Replying Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-[#F4F4F5] dark:bg-[#22262B] rounded-[8px] text-[12px] text-[#52525B] dark:text-[#C4C7CE] border border-[#E5E7EB] dark:border-[#2A2E34]">
          <div className="flex items-center gap-2 min-w-0">
            <CornerDownRight className="w-3.5 h-3.5 text-[#059669] shrink-0" />
            <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">
              Replying to message:
            </span>
            <span className="truncate italic max-w-xs text-[#71717A] dark:text-[#8E949E]">
              "{replyingTo.body}"
            </span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] rounded hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="flex items-center gap-2 bg-[#F9FAFB] dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] focus-within:border-[#059669] dark:focus-within:border-[#059669] focus-within:ring-1 focus-within:ring-[#059669]/20 rounded-[10px] px-3 py-1.5 transition-all">
        {/* Attachment Icon Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] rounded-[6px] transition-colors cursor-pointer shrink-0"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input ref={fileInputRef} type="file" className="hidden" />

        {/* Emoji Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] rounded-[6px] transition-colors cursor-pointer shrink-0"
            title="Insert emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 p-2 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[10px] shadow-xl z-30 flex gap-2 animate-fade-in">
              {['👍', '👏', '✅', '❤️', '😊', '🎉', '🚀', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="p-1.5 text-lg hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] rounded-[6px] transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled
              ? 'You do not have permission to send messages here.'
              : `Message ${targetName}...`
          }
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-[13.5px] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none resize-none max-h-28 py-1 leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="px-4 py-2 rounded-[8px] bg-[#059669] hover:bg-[#047857] disabled:opacity-40 disabled:hover:bg-[#059669] text-white text-[13px] font-semibold transition-colors cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
          title="Send Message (Enter)"
        >
          <span>Send</span>
        </button>
      </div>

      {/* Keyboard Hint Subtext */}
      <div className="text-center text-[11px] text-[#8B8B95] dark:text-[#71717A] mt-1.5 select-none">
        Enter to send • Shift + Enter for new line
      </div>
    </div>
  );
}

export default MessageComposer;
