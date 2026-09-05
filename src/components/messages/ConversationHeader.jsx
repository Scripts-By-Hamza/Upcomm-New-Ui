import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getConversationTitle, getDirectOtherUser } from '../../utils/messages/messageSelectors';
import { Avatar } from '../common/Avatar';
import {
  ChevronLeft,
  Users,
  Info,
  Search,
  MoreVertical,
  Lock,
  Copy,
  Pin,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';

export function ConversationHeader({
  conversation,
  participants = [],
  pinnedMessages = [],
  messages = [],
  onBack,
  isDetailsOpen = false,
  onToggleDetails,
  onJumpToMessage,
  isSearchOpen = false,
  setIsSearchOpen,
  searchQuery = '',
  setSearchQuery,
  matchingMessageIds = [],
  currentMatchIndex = 0,
  onNextMatch,
  onPrevMatch,
}) {
  const { currentUser, users = [] } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activePinIndex, setActivePinIndex] = useState(0);

  const menuRef = useRef(null);
  const searchInputRef = useRef(null);

  const isGroup = conversation?.type === 'group';
  const otherUser = !isGroup
    ? getDirectOtherUser(currentUser?.id, conversation, participants, users)
    : null;

  const title = getConversationTitle(conversation, currentUser?.id, participants, users);

  // Focus search input when search opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter pinned messages for active conversation
  const convPins = (pinnedMessages || []).filter(
    (p) => String(p.conversation_id) === String(conversation?.id)
  );

  // Ensure activePinIndex is within bounds
  useEffect(() => {
    if (activePinIndex >= convPins.length && convPins.length > 0) {
      setActivePinIndex(0);
    }
  }, [convPins.length, activePinIndex]);

  const currentPin = convPins[activePinIndex] || null;
  const currentPinMsg = currentPin
    ? (messages || []).find((m) => String(m.id) === String(currentPin.message_id))
    : null;

  const pinSender = currentPinMsg
    ? (users || []).find((u) => String(u.id) === String(currentPinMsg.sender_id))
    : null;

  const handleNextPin = (e) => {
    e.stopPropagation();
    if (convPins.length > 1) {
      setActivePinIndex((prev) => (prev + 1) % convPins.length);
    }
  };

  const handlePrevPin = (e) => {
    e.stopPropagation();
    if (convPins.length > 1) {
      setActivePinIndex((prev) => (prev - 1 + convPins.length) % convPins.length);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrevMatch && onPrevMatch();
      } else {
        onNextMatch && onNextMatch();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchOpen && setIsSearchOpen(false);
      setSearchQuery && setSearchQuery('');
    }
  };

  return (
    <div className="flex flex-col border-b border-[#E5E7EB] dark:border-[#2A2E34] bg-white dark:bg-[#17191C] select-none flex-shrink-0 z-10">
      {/* Top Header Row */}
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between gap-3">
        {isSearchOpen ? (
          /* Active In-Conversation Search Header View */
          <div className="flex-1 flex items-center justify-between gap-2.5 animate-fade-in">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search word in this conversation..."
                className="w-full pl-9 pr-24 py-2 text-[13.5px] bg-[#F9FAFB] dark:bg-[#1D2024] border border-[#059669] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#A1A1AA]"
              />

              {/* Match Counter Badge inside input */}
              <div className="absolute right-2.5 flex items-center gap-1.5 text-[11.5px] font-medium text-[#71717A] dark:text-[#8E949E]">
                {searchQuery.trim() && (
                  <span>
                    {matchingMessageIds.length > 0
                      ? `${currentMatchIndex + 1} of ${matchingMessageIds.length}`
                      : 'No matches'}
                  </span>
                )}
              </div>
            </div>

            {/* Match Navigation Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={onPrevMatch}
                disabled={matchingMessageIds.length === 0}
                className="w-8 h-8 rounded-[7px] border border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] disabled:opacity-40 transition-colors cursor-pointer"
                title="Previous match (Shift + Enter)"
                aria-label="Previous match"
              >
                <ChevronUp className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onNextMatch}
                disabled={matchingMessageIds.length === 0}
                className="w-8 h-8 rounded-[7px] border border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] disabled:opacity-40 transition-colors cursor-pointer"
                title="Next match (Enter)"
                aria-label="Next match"
              >
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen && setIsSearchOpen(false);
                  setSearchQuery && setSearchQuery('');
                }}
                className="w-8 h-8 rounded-[7px] border border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors cursor-pointer"
                title="Close search (Esc)"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Default Identity & Header Actions View */
          <>
            {/* Left: Avatar & Identity Info */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Back Button */}
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="md:hidden p-1.5 -ml-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                  aria-label="Back to conversations"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {/* Avatar / Overlapping Group Cluster */}
              {isGroup ? (
                <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                  {participants.length >= 2 ? (
                    <div className="relative w-9 h-9">
                      <div className="absolute top-0 left-0 w-6 h-6 rounded-full overflow-hidden ring-2 ring-white dark:ring-[#17191C] z-20">
                        <Avatar
                          src={participants[0]?.avatar_url}
                          name={participants[0]?.full_name || 'User 1'}
                          size="xs"
                          className="w-full h-full text-[9px]"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full overflow-hidden ring-2 ring-white dark:ring-[#17191C] z-10">
                        <Avatar
                          src={participants[1]?.avatar_url}
                          name={participants[1]?.full_name || 'User 2'}
                          size="xs"
                          className="w-full h-full text-[9px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#A7F3D0] dark:border-[#059669]/30 flex items-center justify-center text-[#059669]">
                      <Users className="w-5 h-5" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative shrink-0">
                  <Avatar
                    src={otherUser?.avatar_url}
                    name={otherUser?.full_name || title}
                    size="md"
                    className="w-10 h-10"
                  />
                </div>
              )}

              {/* Title and Subtitle Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[14.5px] text-[#18181B] dark:text-[#F4F4F5] truncate">
                    {title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-[11.5px] text-[#71717A] dark:text-[#8E949E] truncate">
                  {isGroup ? (
                    <span>{participants.length} participants</span>
                  ) : (
                    <span className="truncate">
                      {otherUser?.designation || otherUser?.role || 'Team Member'}
                      {otherUser?.department_id ? ' • UPCOMM Team' : ''}
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-[11px] text-[#8B8B95] dark:text-[#71717A]">
                    <Lock className="w-3 h-3 text-[#71717A]" />
                    <span>Private</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Search in conversation button */}
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen && setIsSearchOpen(true);
                }}
                className="w-8 h-8 rounded-[7px] border border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors cursor-pointer"
                title="Search in conversation"
                aria-label="Search in conversation"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Info / Details Drawer toggle */}
              <button
                type="button"
                onClick={onToggleDetails}
                className={`w-8 h-8 rounded-[7px] border flex items-center justify-center transition-colors cursor-pointer ${
                  isDetailsOpen
                    ? 'border-[#059669] bg-[#ECFDF5] dark:bg-[#064E3B]/30 text-[#059669]'
                    : 'border-[#E5E7EB] dark:border-[#2A2E34] text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B]'
                }`}
                title="Conversation Information"
                aria-label="Details"
              >
                <Info className="w-4 h-4" />
              </button>

              {/* More 3-dot dropdown menu */}
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="w-8 h-8 rounded-[7px] border border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors cursor-pointer"
                  title="More Options"
                  aria-label="More"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] shadow-lg py-1.5 z-30 animate-fade-in">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsSearchOpen && setIsSearchOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>Search Messages</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onToggleDetails && onToggleDetails();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>View Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>Copy Conversation Link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Pinned Message Bar (Directly below Conversation Header) */}
      {convPins.length > 0 && !isSearchOpen && (
        <div
          onClick={() => {
            if (currentPin?.message_id && onJumpToMessage) {
              onJumpToMessage(currentPin.message_id);
            }
          }}
          className="h-[46px] px-4 sm:px-5 bg-[#F9FAFB] dark:bg-[#1D2024] border-t border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-between gap-3 text-[12.5px] cursor-pointer hover:bg-[#F1F3F5] dark:hover:bg-[#22262B] transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="w-3.5 h-3.5 text-[#059669] shrink-0 fill-current" />
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] shrink-0">
                {pinSender
                  ? pinSender.id === currentUser?.id
                    ? 'You'
                    : pinSender.full_name?.split(' ')[0]
                  : 'Pinned'}
                :
              </span>
              <span className="text-[#52525B] dark:text-[#C4C7CE] truncate">
                {currentPinMsg?.deleted_at ? 'This message was deleted' : (currentPinMsg?.body || 'Pinned message')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[#71717A] dark:text-[#8E949E] text-[11.5px]">
            {convPins.length > 1 && (
              <span className="font-medium">
                {activePinIndex + 1} of {convPins.length}
              </span>
            )}
            {convPins.length > 1 && (
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={handlePrevPin}
                  className="p-1 hover:text-[#18181B] dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Previous pinned message"
                  aria-label="Previous pinned message"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPin}
                  className="p-1 hover:text-[#18181B] dark:hover:text-white rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  title="Next pinned message"
                  aria-label="Next pinned message"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {convPins.length === 1 && <ChevronRight className="w-4 h-4 text-[#A1A1AA]" />}
          </div>
        </div>
      )}
    </div>
  );
}

export default ConversationHeader;
