import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  getConversationTitle,
  getDirectOtherUser,
  getConversationUnreadCount,
  formatRelativeMessageTime,
} from '../../utils/messages/messageSelectors';
import { Avatar } from '../common/Avatar';
import {
  Search,
  Plus,
  SlidersHorizontal,
  Users,
  Check,
} from 'lucide-react';

export function ConversationList({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onOpenNewMessage,
}) {
  const { currentUser, users = [] } = useAuth();
  const { conversationParticipants = [], messages = [] } = useAppData();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [filterType, setFilterType] = useState('all'); // 'all' | 'direct' | 'group'
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterRef = useRef(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sort conversations by latest message / update descending
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timeA = new Date(a.updated_at || a.created_at).getTime();
      const timeB = new Date(b.updated_at || b.created_at).getTime();
      return timeB - timeA;
    });
  }, [conversations]);

  // Filter conversations based on search, active tab (all/unread) and filter type (direct/group)
  const filteredConversations = useMemo(() => {
    return sortedConversations.filter((c) => {
      // 1. Direct vs Group filter
      if (filterType !== 'all' && c.type !== filterType) {
        return false;
      }

      const unreadCount = getConversationUnreadCount(
        currentUser?.id,
        c.id,
        conversationParticipants,
        messages
      );

      // 2. Unread Tab filter
      if (activeTab === 'unread' && unreadCount === 0) {
        return false;
      }

      // 3. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const participants = (conversationParticipants || [])
        .filter((p) => p.conversation_id === c.id)
        .map((p) => users.find((u) => String(u.id) === String(p.user_id)))
        .filter(Boolean);

      const title = getConversationTitle(c, currentUser?.id, participants, users).toLowerCase();
      if (title.includes(q)) return true;

      const participantMatch = participants.some((p) =>
        (p.full_name || '').toLowerCase().includes(q)
      );
      if (participantMatch) return true;

      const convMsgs = (messages || []).filter((m) => String(m.conversation_id) === String(c.id));
      const msgMatch = convMsgs.some((m) => (m.body || '').toLowerCase().includes(q));
      return msgMatch;
    });
  }, [
    sortedConversations,
    filterType,
    activeTab,
    searchQuery,
    currentUser?.id,
    conversationParticipants,
    messages,
    users,
  ]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#17191C] w-full select-none">
      {/* Top Header Row */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[17px] font-bold tracking-tight text-[#18181B] dark:text-[#F4F4F5]">
            Conversations
          </h2>

          <button
            type="button"
            onClick={onOpenNewMessage}
            className="w-8 h-8 rounded-[7px] border border-[#E5E7EB] dark:border-[#2A2E34] flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Start new message"
            aria-label="New Message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-[#F9FAFB] dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#A1A1AA]"
          />
        </div>

        {/* Filter Tabs Row */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#2A2E34] mt-2.5">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`py-2 text-[13px] transition-colors relative cursor-pointer ${
                activeTab === 'all'
                  ? 'text-[#18181B] dark:text-[#F4F4F5] font-bold'
                  : 'text-[#71717A] dark:text-[#8E949E] hover:text-[#18181B] font-medium'
              }`}
            >
              All
              {activeTab === 'all' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#059669] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`py-2 text-[13px] transition-colors relative cursor-pointer ${
                activeTab === 'unread'
                  ? 'text-[#18181B] dark:text-[#F4F4F5] font-bold'
                  : 'text-[#71717A] dark:text-[#8E949E] hover:text-[#18181B] font-medium'
              }`}
            >
              Unread
              {activeTab === 'unread' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#059669] rounded-full" />
              )}
            </button>
          </div>

          {/* Direct / Groups Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                filterType !== 'all'
                  ? 'text-[#059669] bg-[#ECFDF5] dark:bg-[#064E3B]/30'
                  : 'text-[#71717A] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B]'
              }`}
              title="Filter by Direct or Groups"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] shadow-lg py-1 z-30 animate-fade-in">
                {[
                  { id: 'all', label: 'All Types' },
                  { id: 'direct', label: 'Direct' },
                  { id: 'group', label: 'Groups' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setFilterType(item.id);
                      setIsFilterOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-[12px] text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
                  >
                    <span>{item.label}</span>
                    {filterType === item.id && <Check className="w-3 h-3 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F4F4F5] dark:divide-[#22262B]">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-[#8B8B95] text-[13px]">
            {searchQuery
              ? 'No conversations match your search.'
              : activeTab === 'unread'
              ? 'No unread conversations.'
              : 'No conversations yet.'}
          </div>
        ) : (
          filteredConversations.map((c) => {
            const isGroup = c.type === 'group';
            const participants = (conversationParticipants || [])
              .filter((p) => String(p.conversation_id) === String(c.id))
              .map((p) => users.find((u) => String(u.id) === String(p.user_id)))
              .filter(Boolean);

            const otherUser = !isGroup
              ? getDirectOtherUser(currentUser?.id, c, participants, users)
              : null;

            const title = getConversationTitle(c, currentUser?.id, participants, users);

            // Latest message & timestamp
            const convMsgs = (messages || [])
              .filter((m) => String(m.conversation_id) === String(c.id))
              .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

            const lastMsg = convMsgs[convMsgs.length - 1];
            const unreadCount = getConversationUnreadCount(
              currentUser?.id,
              c.id,
              conversationParticipants,
              messages
            );

            const isActive = String(c.id) === String(activeConversationId);

            // Format message snippet text
            let snippet = 'No messages yet';
            if (lastMsg) {
              const isMe = String(lastMsg.sender_id) === String(currentUser?.id);
              const senderObj = users.find((u) => String(u.id) === String(lastMsg.sender_id));
              if (isMe) {
                snippet = `You: ${lastMsg.body}`;
              } else if (isGroup && senderObj) {
                const firstName = senderObj.full_name?.split(' ')[0] || 'User';
                snippet = `${firstName}: ${lastMsg.body}`;
              } else {
                snippet = lastMsg.body;
              }
            }

            return (
              <div
                key={c.id}
                onClick={() => onSelectConversation(c.id)}
                className={`flex items-center gap-3 px-4 py-3 min-h-[68px] transition-colors cursor-pointer select-none relative ${
                  isActive
                    ? 'bg-[#F1F3F5] dark:bg-[#22262B] border-l-[3px] border-[#059669]'
                    : unreadCount > 0
                    ? 'bg-[#F7F8FA] dark:bg-[#1D2024] hover:bg-[#F1F3F5] dark:hover:bg-[#22262B]'
                    : 'hover:bg-[#F9FAFB] dark:hover:bg-[#1D2024]'
                }`}
              >
                {/* Left Avatar / Group Avatar Cluster */}
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
                        {participants.length >= 3 && (
                          <div className="absolute top-0 right-0 w-4 h-4 rounded-full overflow-hidden ring-1 ring-white dark:ring-[#17191C] z-0 opacity-80">
                            <Avatar
                              src={participants[2]?.avatar_url}
                              name={participants[2]?.full_name || 'User 3'}
                              size="xs"
                              className="w-full h-full text-[7px]"
                            />
                          </div>
                        )}
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

                {/* Right Text Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h4
                      className={`text-[13.5px] truncate ${
                        unreadCount > 0
                          ? 'font-bold text-[#18181B] dark:text-[#F4F4F5]'
                          : 'font-semibold text-[#18181B] dark:text-[#F4F4F5]'
                      }`}
                    >
                      {title}
                    </h4>

                    {lastMsg && (
                      <span
                        className={`text-[11px] shrink-0 ml-2 ${
                          unreadCount > 0
                            ? 'text-[#2563EB] font-bold'
                            : 'text-[#8B8B95] dark:text-[#71717A]'
                        }`}
                      >
                        {formatRelativeMessageTime(lastMsg.created_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-[12px] truncate ${
                        unreadCount > 0
                          ? 'text-[#18181B] dark:text-[#F4F4F5] font-medium'
                          : 'text-[#71717A] dark:text-[#8E949E]'
                      }`}
                    >
                      {snippet}
                    </p>

                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10.5px] font-bold bg-[#2563EB] text-white rounded-full min-w-[18px] h-[18px] text-center leading-none shrink-0 shadow-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ConversationList;
