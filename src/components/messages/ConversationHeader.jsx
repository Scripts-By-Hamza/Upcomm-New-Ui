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
  CheckCircle,
  Copy,
  Trash2,
} from 'lucide-react';

export function ConversationHeader({
  conversation,
  participants = [],
  onBack,
  isDetailsOpen = false,
  onToggleDetails,
  onOpenSearch,
}) {
  const { currentUser, users = [] } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const isGroup = conversation?.type === 'group';
  const otherUser = !isGroup
    ? getDirectOtherUser(currentUser?.id, conversation, participants, users)
    : null;

  const title = getConversationTitle(conversation, currentUser?.id, participants, users);

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

  return (
    <div className="h-16 px-5 border-b border-[#E5E7EB] dark:border-[#2A2E34] bg-white dark:bg-[#17191C] flex items-center justify-between z-10 select-none">
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
            {otherUser?.is_active && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#17191C]" />
            )}
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
              <span>{participants.length} members</span>
            ) : (
              <span className="truncate">
                {otherUser?.designation || otherUser?.role || 'Team Member'}
                {otherUser?.department_id ? ' • Web Development' : ''}
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
        {/* Search conversation */}
        <button
          type="button"
          onClick={onOpenSearch || onToggleDetails}
          className="w-8 h-8 rounded-[7px] border border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors cursor-pointer"
          title="Search in conversation"
          aria-label="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Info / Participants drawer toggle */}
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

        {/* Three-dot menu */}
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
    </div>
  );
}

export default ConversationHeader;
