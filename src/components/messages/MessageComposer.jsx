import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { getDirectOtherUser, formatFileSize } from '../../utils/messages/messageSelectors';
import { Avatar } from '../common/Avatar';
import {
  Send,
  X,
  CornerDownRight,
  AtSign,
  Paperclip,
  Smile,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  AlertCircle,
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
  const { uploadMessageAttachment } = useAppData();
  const [text, setText] = useState('');
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Attachment states
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

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

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle textarea text change and detect @mentions
  const handleChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setText(val);

    const textBeforeCursor = val.slice(0, cursorPos);

    // Look backward from cursor to find if user is typing an @mention
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1 && (lastAtIndex === 0 || /\s/.test(textBeforeCursor[lastAtIndex - 1]))) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
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

  // Handle File Attachments
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploadError(null);
    setIsUploadingAttachment(true);

    try {
      for (const file of files) {
        if (file.size > 50 * 1024 * 1024) {
          setUploadError(`"${file.name}" exceeds the 50MB file size limit.`);
          continue;
        }
        if (uploadMessageAttachment) {
          const uploaded = await uploadMessageAttachment(file);
          if (uploaded) {
            setPendingAttachments((prev) => [...prev, uploaded]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to upload file attachment:', err);
      setUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (attId) => {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== attId));
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
    if ((!trimmed && pendingAttachments.length === 0) || disabled || isUploadingAttachment) return;

    onSendMessage({
      body: trimmed,
      replyToId: replyingTo?.id || null,
      attachments: pendingAttachments,
    });

    setText('');
    setPendingAttachments([]);
    setMentionQuery(null);
    setUploadError(null);
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

  // Auto-resize textarea height (up to ~5 lines then scrolls)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollH = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollH, 120)}px`;
    }
  }, [text]);

  // Focus textarea when replyingTo changes
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Derive replying sender name
  const replyingSender = replyingTo
    ? (users || []).find((u) => String(u.id) === String(replyingTo.sender_id))
    : null;
  const replyingSenderName = replyingTo
    ? replyingSender?.id === currentUser?.id
      ? 'yourself'
      : replyingSender?.full_name || 'Participant'
    : '';

  return (
    <div className="relative border-t border-[#E5E7EB] dark:border-[#2A2E34] bg-white dark:bg-[#17191C] px-4 sm:px-5 py-3 select-none flex-shrink-0">
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
        <div className="flex items-center justify-between px-3.5 py-2 mb-2 bg-[#F4F4F5] dark:bg-[#1D2024] rounded-[8px] border-l-[3px] border-[#059669] border-t border-r border-b border-[#E5E7EB] dark:border-[#2A2E34] text-[12.5px] animate-fade-in">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CornerDownRight className="w-4 h-4 text-[#059669] shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[#059669] dark:text-emerald-400 text-[12px] truncate">
                Replying to {replyingSenderName}
              </div>
              <p className="text-[#52525B] dark:text-[#C4C7CE] text-[12px] truncate italic">
                "{replyingTo.body}"
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0 ml-2"
            title="Cancel reply"
            aria-label="Cancel reply"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Error Alert */}
      {uploadError && (
        <div className="flex items-center justify-between px-3 py-1.5 mb-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-[8px] text-[12px] text-red-700 dark:text-red-300 animate-fade-in">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 dark:text-red-400" />
            <span className="truncate">{uploadError}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="p-0.5 text-red-600 dark:text-red-400 hover:text-red-800 rounded cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Pending Attachments List */}
      {(pendingAttachments.length > 0 || isUploadingAttachment) && (
        <div className="flex flex-wrap items-center gap-2 mb-2 p-2 bg-[#F9FAFB] dark:bg-[#1D2024] rounded-[10px] border border-[#E5E7EB] dark:border-[#2A2E34] animate-fade-in">
          {pendingAttachments.map((att) => {
            const isImg =
              att.type === 'image' ||
              ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes((att.ext || '').toUpperCase());

            return (
              <div
                key={att.id}
                className="flex items-center gap-2 pl-2 pr-1.5 py-1 bg-white dark:bg-[#22262B] rounded-[8px] border border-[#E5E7EB] dark:border-[#2A2E34] text-[12px] shadow-2xs max-w-[220px]"
              >
                {isImg ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-6 h-6 rounded object-cover shrink-0"
                  />
                ) : att.type === 'pdf' || att.ext === 'PDF' ? (
                  <FileText className="w-4 h-4 text-red-500 shrink-0" />
                ) : att.type === 'csv' || ['CSV', 'XLS', 'XLSX'].includes(att.ext) ? (
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : att.type === 'archive' ? (
                  <FileArchive className="w-4 h-4 text-amber-500 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-[#059669] shrink-0" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#18181B] dark:text-[#F4F4F5] leading-tight">
                    {att.name}
                  </p>
                  <span className="text-[10px] text-[#71717A] dark:text-[#8E949E]">
                    {formatFileSize(att.size)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1 text-[#71717A] hover:text-red-600 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {isUploadingAttachment && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11.5px] text-[#065F46] dark:text-emerald-300 font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#059669]" />
              <span>Uploading file...</span>
            </div>
          )}
        </div>
      )}

      {/* Main Conversational Composer Container */}
      <div className="flex items-end gap-2 bg-[#F9FAFB] dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] focus-within:border-[#059669] dark:focus-within:border-[#059669] focus-within:ring-1 focus-within:ring-[#059669]/20 rounded-[20px] px-3.5 py-2 transition-all">
        {/* Attachment Icon Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploadingAttachment}
          className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] disabled:opacity-40 rounded-full transition-colors cursor-pointer shrink-0 mb-0.5"
          title="Attach files (images, docs, pdf, etc.)"
          aria-label="Attach file"
        >
          {isUploadingAttachment ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#059669]" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/zip"
        />

        {/* Emoji Button & Picker */}
        <div className="relative mb-0.5" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] rounded-full transition-colors cursor-pointer shrink-0"
            title="Insert emoji"
            aria-label="Insert emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2.5 left-0 p-2 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-xl shadow-2xl z-40 flex gap-1.5 animate-fade-in">
              {['👍', '❤️', '😂', '😮', '😢', '🙏', '👏', '🔥', '🎉', '✅'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleAddEmoji(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-[17px] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] rounded-lg transition-transform hover:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Area */}
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
          className="flex-1 bg-transparent text-[13.5px] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#A1A1AA] dark:placeholder:text-[#71717A] focus:outline-none resize-none max-h-32 py-1 leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={(!text.trim() && pendingAttachments.length === 0) || disabled || isUploadingAttachment}
          className="w-8 h-8 rounded-full bg-[#059669] hover:bg-[#047857] disabled:opacity-40 disabled:hover:bg-[#059669] text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs mb-0.5"
          title="Send Message (Enter)"
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5 -mr-0.5" />
        </button>
      </div>
    </div>
  );
}

export default MessageComposer;
