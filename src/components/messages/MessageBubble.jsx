import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { formatBubbleTime, formatFileSize } from '../../utils/messages/messageSelectors';
import { Avatar } from '../common/Avatar';
import {
  Reply,
  Copy,
  Check,
  Radio,
  ChevronDown,
  Smile,
  Pin,
  PinOff,
  FileText,
  FileSpreadsheet,
  FileArchive,
  ExternalLink,
  Download,
  Link as LinkIcon,
  Trash2,
} from 'lucide-react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export function MessageBubble({
  message,
  conversation,
  senderUser,
  parentMessage,
  parentSenderUser,
  reactions = [],
  isPinned = false,
  isHighlighted = false,
  searchQuery = '',
  onReply,
  onToggleReaction,
  onPinMessage,
  onUnpinMessage,
  onDeleteMessage,
  onJumpToMessage,
  isGroup = false,
  isFirstInGroup = true,
  isLastInGroup = true,
  allUsers = [],
}) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isReactPickerOpen, setIsReactPickerOpen] = useState(false);

  const bubbleContainerRef = useRef(null);
  const menuRef = useRef(null);
  const reactPickerRef = useRef(null);

  const isMe = String(message.sender_id) === String(currentUser?.id);
  const isBroadcast = message.source_type === 'broadcast';

  // Handle URL / Route navigation click
  const handleUrlClick = (e, url) => {
    e.stopPropagation();
    if (!url) return;

    // If url starts with '/', extract what comes after the '/'
    let cleanUrl = url.startsWith('/') ? url.slice(1).trim() : url.trim();

    // 1. If text after '/' starts with http:// or https://
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 2. If text after '/' starts with www. or has a domain/TLD dot (e.g. google.com, drive.google.com, zoom.us/j/123)
    if (cleanUrl.startsWith('www.') || cleanUrl.includes('.')) {
      const fullWebUrl = cleanUrl.startsWith('www.') ? `https://${cleanUrl}` : `https://${cleanUrl}`;
      window.open(fullWebUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // 3. If it's an internal route (e.g. /tasks, /dashboard, /profile)
    if (url.startsWith('/')) {
      e.preventDefault();
      navigate(url);
    } else {
      window.open(`https://${cleanUrl}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
      if (reactPickerRef.current && !reactPickerRef.current.contains(e.target)) {
        setIsReactPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to highlight matching search words
  const highlightSearchWords = (str, query, keyPrefix = 'srch') => {
    if (!query || !query.trim() || !str) return str;
    const trimmed = query.trim();
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const segments = str.split(regex);
    if (segments.length === 1) return str;
    return segments.map((seg, i) =>
      seg.toLowerCase() === trimmed.toLowerCase() ? (
        <mark
          key={`${keyPrefix}-${i}`}
          className="bg-amber-300 dark:bg-amber-500/70 text-[#18181B] dark:text-white px-0.5 rounded font-semibold"
        >
          {seg}
        </mark>
      ) : (
        seg
      )
    );
  };

  // Render text with styled @mentions, full URLs, and '/URL' text & highlighted search words
  const renderMessageBody = (text) => {
    if (!text) return null;
    // Tokenizer regex:
    // Group 1: @mentions
    // Group 2: Web URLs (http/https/www)
    // Group 3: Slash URLs (/google.com, /drive.google.com/..., /tasks, /https://...)
    const tokenRegex = /(@[\w\s.-]+?(?=\s@|\s|[.,!?:;]|$))|(https?:\/\/[^\s,;]+|www\.[^\s,;]+)|((?<=\s|^)\/[a-zA-Z0-9_\-.~%&=?#/:]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const rawText = text.substring(lastIndex, match.index);
        parts.push(highlightSearchWords(rawText, searchQuery, `txt-${lastIndex}`));
      }

      if (match[1]) {
        // @Mention
        parts.push(
          <span
            key={`mention-${match.index}`}
            className={`inline-block font-semibold px-1.5 py-0.5 rounded text-[12.5px] ${
              isMe
                ? 'bg-[#A7F3D0]/60 dark:bg-emerald-900/40 text-[#065F46] dark:text-emerald-300'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
            }`}
          >
            {match[1]}
          </span>
        );
      } else if (match[2]) {
        // Web URL (http://, https://, www.)
        const webUrl = match[2];
        const href = webUrl.startsWith('www.') ? `https://${webUrl}` : webUrl;
        parts.push(
          <a
            key={`exturl-${match.index}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1 font-semibold underline underline-offset-2 cursor-pointer transition-colors ${
              isMe
                ? 'text-[#065F46] dark:text-emerald-300 hover:text-[#047857]'
                : 'text-blue-600 dark:text-blue-400 hover:text-blue-700'
            }`}
            title={`Open ${webUrl}`}
          >
            <ExternalLink className="w-3 h-3 inline-block shrink-0 opacity-80" />
            <span>{highlightSearchWords(webUrl, searchQuery, `ext-${match.index}`)}</span>
          </a>
        );
      } else if (match[3]) {
        // Slash URL (/google.com, /drive.google.com/xyz, /tasks, /https://...)
        const slashUrl = match[3];
        parts.push(
          <span
            key={`slashurl-${match.index}`}
            onClick={(e) => handleUrlClick(e, slashUrl)}
            className={`inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 cursor-pointer transition-colors ${
              isMe
                ? 'text-[#065F46] dark:text-emerald-300 hover:text-[#047857]'
                : 'text-[#059669] dark:text-emerald-400 hover:text-[#047857] dark:hover:text-emerald-300'
            }`}
            title={`Open URL ${slashUrl}`}
          >
            <LinkIcon className="w-3 h-3 inline-block shrink-0 opacity-80" />
            <span>{highlightSearchWords(slashUrl, searchQuery, `slash-${match.index}`)}</span>
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      const rawText = text.substring(lastIndex);
      parts.push(highlightSearchWords(rawText, searchQuery, `tail-${lastIndex}`));
    }

    return parts;
  };

  // Handle Copy Message Text
  const handleCopy = (e) => {
    e?.stopPropagation();
    if (!message.body) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(message.body);
    } else {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = message.body;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setIsMenuOpen(false);
    }, 1200);
  };

  // Handle Emoji Selection
  const handleSelectEmoji = (emoji, e) => {
    e?.stopPropagation();
    if (onToggleReaction) {
      onToggleReaction({
        messageId: message.id,
        emoji,
      });
    }
    setIsReactPickerOpen(false);
    setIsMenuOpen(false);
  };

  // Handle Pin / Unpin
  const handleTogglePin = (e) => {
    e?.stopPropagation();
    if (isPinned) {
      if (onUnpinMessage) {
        onUnpinMessage({
          conversationId: conversation.id,
          messageId: message.id,
        });
      }
    } else {
      if (onPinMessage) {
        onPinMessage({
          conversationId: conversation.id,
          messageId: message.id,
        });
      }
    }
    setIsMenuOpen(false);
  };

  // Group reactions by emoji
  const groupedReactions = useMemo(() => {
    const map = {};
    (reactions || []).forEach((r) => {
      if (!map[r.emoji]) {
        map[r.emoji] = {
          emoji: r.emoji,
          count: 0,
          userIds: [],
          hasMe: false,
        };
      }
      map[r.emoji].count += 1;
      map[r.emoji].userIds.push(r.user_id);
      if (String(r.user_id) === String(currentUser?.id)) {
        map[r.emoji].hasMe = true;
      }
    });
    return Object.values(map);
  }, [reactions, currentUser?.id]);

  // Format sender names for reaction tooltip
  const getReactionUserNames = (userIds = []) => {
    return userIds
      .map((uid) => {
        if (String(uid) === String(currentUser?.id)) return 'You';
        const u = (allUsers || []).find((usr) => String(usr.id) === String(uid));
        return u?.full_name || 'Team Member';
      })
      .join(', ');
  };

  const senderName = isMe
    ? currentUser?.full_name || 'You'
    : senderUser?.full_name || 'Team Member';

  const isDeleted = Boolean(message.deleted_at);
  const deleterId = message.deleted_by || message.sender_id;
  const deleter = (allUsers || []).find((u) => String(u.id) === String(deleterId));
  const isMeDeleter = String(deleterId) === String(currentUser?.id);
  const deleterName =
    deleter?.full_name || (isMeDeleter ? currentUser?.full_name || 'You' : senderUser?.full_name || 'Team Member');

  return (
    <div
      id={`message-${message.id}`}
      ref={bubbleContainerRef}
      className={`group relative flex gap-2.5 px-4 sm:px-6 select-none transition-colors duration-500 ${
        isMe ? 'justify-end' : 'justify-start'
      } ${isFirstInGroup ? 'mt-3' : 'mt-1'} ${
        isHighlighted
          ? 'bg-emerald-500/10 dark:bg-emerald-500/15 py-1.5 rounded-lg -mx-2 px-6'
          : ''
      }`}
    >
      {/* Left Avatar for Incoming Messages */}
      {!isMe && (
        <div className="w-8 shrink-0 flex items-start pt-0.5">
          {isFirstInGroup ? (
            <Avatar
              src={senderUser?.avatar_url}
              name={senderName}
              size="sm"
              className="w-8 h-8 text-[11px] shadow-xs"
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Message Content & Reactions Container */}
      <div
        className={`flex flex-col max-w-[85%] sm:max-w-[65%] min-w-[120px] ${
          isMe ? 'items-end' : 'items-start'
        }`}
      >
        {/* Group Incoming Sender Name */}
        {isGroup && !isMe && isFirstInGroup && (
          <span className="text-[12px] font-semibold text-[#059669] dark:text-emerald-400 mb-0.5 px-1 truncate max-w-full">
            {senderName}
          </span>
        )}

        {/* Message Bubble Box */}
        <div
          className={`relative group/bubble rounded-xl text-[13.5px] leading-relaxed shadow-xs transition-shadow border ${
            isDeleted
              ? `bg-[#F4F4F5]/80 dark:bg-[#1E2125]/80 text-[#71717A] dark:text-[#8E949E] border-[#E5E7EB] dark:border-[#2A2E34] ${
                  isMe ? 'rounded-tr-[3px]' : 'rounded-tl-[3px]'
                }`
              : isMe
              ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/25 text-[#18181B] dark:text-[#F4F4F5] border-[#A7F3D0]/70 dark:border-[#059669]/25 rounded-tr-[3px]'
              : 'bg-white dark:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5] border-[#E5E7EB] dark:border-[#2A2E34] rounded-tl-[3px]'
          }`}
        >
          {/* Quoted Reply Reference Box */}
          {!isDeleted && (parentMessage || message.reply_to_message_id || message.reply_to_id) && (
            <div
              onClick={() => {
                const targetId = message.reply_to_message_id || message.reply_to_id || parentMessage?.id;
                if (targetId && onJumpToMessage) {
                  onJumpToMessage(targetId);
                }
              }}
              className={`m-2 mb-1 p-2 rounded-[7px] border-l-[3px] border-[#059669] text-[12px] cursor-pointer transition-all flex flex-col gap-0.5 ${
                isMe
                  ? 'bg-emerald-100/60 dark:bg-emerald-950/40 hover:bg-emerald-200/50'
                  : 'bg-[#F4F4F5] dark:bg-[#1D2024] hover:bg-[#EAEAEA] dark:hover:bg-[#2A2E34]'
              }`}
              title="Click to view quoted message"
            >
              <div className="flex items-center justify-between gap-1 text-[#059669] dark:text-emerald-400 font-semibold text-[11.5px]">
                <span className="truncate">
                  {parentSenderUser?.full_name || (parentMessage?.sender_id === currentUser?.id ? 'You' : 'Participant')}
                </span>
              </div>
              <p className="text-[#52525B] dark:text-[#C4C7CE] line-clamp-2 text-[11.5px] italic">
                {parentMessage?.deleted_at ? 'This message was deleted' : (parentMessage?.body || 'Original message unavailable')}
              </p>
            </div>
          )}

          {/* Broadcast Announcement Label */}
          {!isDeleted && isBroadcast && (
            <div className="px-3.5 pt-2.5">
              <div
                className={`inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                  isMe
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-[#065F46] dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                }`}
              >
                <Radio className="w-3 h-3" />
                <span>Broadcast</span>
              </div>
            </div>
          )}

          {/* Body and Action Chevron Header Container */}
          <div className={`relative pl-3.5 py-2.5 pb-2 min-h-[38px] ${isDeleted ? 'pr-3.5' : 'pr-8'}`}>
            {/* Deleted Message Tombstone Placeholder */}
            {isDeleted ? (
              <div className="flex items-center gap-2 py-0.5 text-[#71717A] dark:text-[#8E949E] italic text-[12.5px] select-none">
                <Trash2 className="w-3.5 h-3.5 opacity-60 shrink-0 text-[#8B8B95]" />
                <span>This message has been deleted by {deleterName}</span>
              </div>
            ) : (
              <>
                {/* Action Chevron Trigger */}
                <div
                  className={`absolute top-1.5 right-1.5 transition-opacity ${
                    isMenuOpen || isReactPickerOpen
                      ? 'opacity-100'
                      : 'opacity-0 group-hover/bubble:opacity-100 focus-within:opacity-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
                      setIsReactPickerOpen(false);
                    }}
                    className={`p-1 rounded-[5px] transition-colors cursor-pointer ${
                      isMe
                        ? 'text-[#059669] hover:bg-[#A7F3D0]/50'
                        : 'text-[#71717A] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#1D2024]'
                    }`}
                    aria-label="Message actions"
                    title="Message actions"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Message Attachments Rendering */}
                {message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0 && (
                  <div className="mb-2 space-y-1.5">
                    {message.attachments.map((att, idx) => {
                      const isImg =
                        att.type === 'image' ||
                        ['JPG', 'JPEG', 'PNG', 'WEBP', 'GIF', 'SVG'].includes(
                          (att.ext || '').toUpperCase()
                        );
                      const isVid =
                        att.type === 'video' ||
                        ['MP4', 'WEBM', 'MOV', 'MKV'].includes(
                          (att.ext || '').toUpperCase()
                        );
                      const isAud =
                        att.type === 'audio' ||
                        ['MP3', 'WAV', 'OGG', 'M4A', 'AAC'].includes(
                          (att.ext || '').toUpperCase()
                        );

                      if (isImg) {
                        return (
                          <div
                            key={att.id || idx}
                            className="rounded-lg overflow-hidden border border-black/5 dark:border-white/10 max-w-[280px] sm:max-w-[340px]"
                          >
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative group/img cursor-pointer"
                            >
                              <img
                                src={att.url}
                                alt={att.name || 'Image attachment'}
                                className="w-full max-h-64 object-cover hover:scale-[1.02] transition-transform duration-200"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                <ExternalLink className="w-5 h-5 drop-shadow-md" />
                              </div>
                            </a>
                          </div>
                        );
                      }

                      if (isVid) {
                        return (
                          <div
                            key={att.id || idx}
                            className="rounded-lg overflow-hidden border border-black/5 dark:border-white/10 max-w-[280px] sm:max-w-[340px]"
                          >
                            <video
                              src={att.url}
                              controls
                              className="w-full max-h-64 object-cover"
                            />
                          </div>
                        );
                      }

                      if (isAud) {
                        return (
                          <div
                            key={att.id || idx}
                            className="p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 max-w-[280px] sm:max-w-[320px]"
                          >
                            <span className="text-[11.5px] font-medium block truncate mb-1 text-[#18181B] dark:text-[#F4F4F5]">
                              {att.name || 'Audio note'}
                            </span>
                            <audio src={att.url} controls className="w-full h-8" />
                          </div>
                        );
                      }

                      // Documents / PDF / Excel / ZIP / Other Files
                      return (
                        <div
                          key={att.id || idx}
                          className={`flex items-center justify-between gap-2.5 p-2 rounded-[8px] border transition-colors max-w-[280px] sm:max-w-[340px] ${
                            isMe
                              ? 'bg-[#A7F3D0]/30 dark:bg-emerald-950/40 border-[#A7F3D0] dark:border-emerald-800/40 hover:bg-[#A7F3D0]/50'
                              : 'bg-[#F4F4F5] dark:bg-[#1D2024] border-[#E5E7EB] dark:border-[#2A2E34] hover:bg-[#EAEAEA] dark:hover:bg-[#2A2E34]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="w-8 h-8 rounded-[6px] bg-white dark:bg-[#2A2E34] flex items-center justify-center text-[#059669] shrink-0 shadow-2xs">
                              {att.type === 'pdf' || att.ext === 'PDF' ? (
                                <FileText className="w-4 h-4 text-red-500" />
                              ) : att.type === 'csv' || ['CSV', 'XLS', 'XLSX'].includes(att.ext) ? (
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                              ) : att.type === 'archive' ? (
                                <FileArchive className="w-4 h-4 text-amber-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-[#059669]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate leading-tight">
                                {att.name || 'Attachment'}
                              </p>
                              <span className="text-[10.5px] text-[#71717A] dark:text-[#8E949E] block">
                                {formatFileSize(att.size)} • {att.ext || 'FILE'}
                              </span>
                            </div>
                          </div>

                          <a
                            href={att.url}
                            download={att.name || 'download'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-[6px] hover:bg-black/5 dark:hover:bg-white/10 text-[#71717A] hover:text-[#18181B] dark:hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Download / Open file"
                            aria-label="Download attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Message Body Content */}
                {message.body && (
                  <div className="break-words whitespace-pre-wrap select-text pr-1">
                    {renderMessageBody(message.body)}
                  </div>
                )}
              </>
            )}

            {/* Bubble Footer: Timestamp & Pinned Icon */}
            <div className="flex items-center justify-end gap-1 mt-1 text-[10.5px] text-[#71717A] dark:text-[#8E949E] select-none">
              {!isDeleted && isPinned && (
                <span title="Pinned message" className="text-[#059669] dark:text-emerald-400">
                  <Pin className="w-2.5 h-2.5 fill-current" />
                </span>
              )}
              <span>{formatBubbleTime(message.created_at)}</span>
            </div>
          </div>

          {/* Quick Reaction Picker Popover */}
          {!isDeleted && isReactPickerOpen && (
            <div
              ref={reactPickerRef}
              className={`absolute bottom-full mb-1.5 z-40 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-full shadow-xl px-2 py-1.5 flex items-center gap-1.5 animate-fade-in ${
                isMe ? 'right-0' : 'left-0'
              }`}
            >
              {QUICK_REACTIONS.map((emoji) => {
                const userReacted = (reactions || []).some(
                  (r) => r.emoji === emoji && String(r.user_id) === String(currentUser?.id)
                );
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) => handleSelectEmoji(emoji, e)}
                    aria-label={`React with ${emoji}`}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[17px] hover:scale-125 transition-transform cursor-pointer ${
                      userReacted
                        ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/40 ring-1 ring-[#059669]'
                        : 'hover:bg-[#F4F4F5] dark:hover:bg-[#2A2E34]'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          )}

          {/* Vertical Message Action Menu */}
          {!isDeleted && isMenuOpen && (
            <div
              ref={menuRef}
              className={`absolute top-full mt-1.5 w-44 z-40 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[10px] shadow-2xl py-1 animate-fade-in ${
                isMe ? 'right-0' : 'left-0'
              }`}
            >
              {/* 1. Reply */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  if (onReply) onReply(message);
                }}
                className="w-full h-9 flex items-center gap-2.5 px-3.5 text-[13px] text-[#27272A] dark:text-[#E4E4E7] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
              >
                <Reply className="w-4 h-4 text-[#71717A] dark:text-[#8E949E] shrink-0" />
                <span>Reply</span>
              </button>

              {/* 2. React */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                  setIsReactPickerOpen(true);
                }}
                className="w-full h-9 flex items-center gap-2.5 px-3.5 text-[13px] text-[#27272A] dark:text-[#E4E4E7] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
              >
                <Smile className="w-4 h-4 text-[#71717A] dark:text-[#8E949E] shrink-0" />
                <span>React</span>
              </button>

              {/* 3. Copy */}
              {message.body && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full h-9 flex items-center gap-2.5 px-3.5 text-[13px] text-[#27272A] dark:text-[#E4E4E7] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#059669] shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#71717A] dark:text-[#8E949E] shrink-0" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}

              {/* 4. Pin / Unpin */}
              <button
                type="button"
                onClick={handleTogglePin}
                aria-label={isPinned ? 'Unpin message' : 'Pin message'}
                className="w-full h-9 flex items-center gap-2.5 px-3.5 text-[13px] text-[#27272A] dark:text-[#E4E4E7] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
              >
                {isPinned ? (
                  <>
                    <PinOff className="w-4 h-4 text-[#71717A] dark:text-[#8E949E] shrink-0" />
                    <span>Unpin</span>
                  </>
                ) : (
                  <>
                    <Pin className="w-4 h-4 text-[#71717A] dark:text-[#8E949E] shrink-0" />
                    <span>Pin</span>
                  </>
                )}
              </button>

              {/* 5. Delete Message (Only for own messages: message hum bs apny hi delete kar sahkty ha bs) */}
              {isMe && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    if (onDeleteMessage) {
                      onDeleteMessage({
                        messageId: message.id,
                        conversationId: conversation?.id,
                      });
                    }
                  }}
                  className="w-full h-9 flex items-center gap-2.5 px-3.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-left cursor-pointer border-t border-[#F4F4F5] dark:border-[#2A2E34]"
                >
                  <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Reaction Pills Container */}
        {!isDeleted && groupedReactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            {groupedReactions.map((g) => {
              const tooltipNames = getReactionUserNames(g.userIds);
              return (
                <div key={g.emoji} className="relative group/pill">
                  <button
                    type="button"
                    onClick={(e) => handleSelectEmoji(g.emoji, e)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11.5px] transition-all cursor-pointer border ${
                      g.hasMe
                        ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/40 border-[#059669]/60 text-[#065F46] dark:text-emerald-300 font-semibold'
                        : 'bg-white dark:bg-[#22262B] border-[#E5E7EB] dark:border-[#2A2E34] text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#1D2024]'
                    }`}
                  >
                    <span>{g.emoji}</span>
                    <span className="text-[11px] font-medium">{g.count}</span>
                  </button>

                  {/* Reaction Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/pill:flex items-center px-2 py-1 rounded bg-[#18181B] text-white text-[10.5px] whitespace-nowrap shadow-lg pointer-events-none z-50 animate-fade-in">
                    {tooltipNames}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
