import React, { useState } from 'react';
import { Plus, MessageSquare, Trash2, Search, Sparkles, X } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export function ConversationHistoryDrawer({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onArchiveConversation,
  isOpen = false,
  onClose,
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    (c.title || 'New Chat').toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-[#18181B] border-r border-[#E5E7EB] dark:border-[#27272A] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out font-['Inter'] ${
          isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Header & New Chat Button */}
        <div className="p-4 border-b border-[#E5E7EB] dark:border-[#27272A] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-[14px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                Chat History
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F4F4F5] dark:hover:bg-[#202024] cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8B95]" />
            <input
              type="text"
              placeholder="Search previous chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-2 rounded-[7px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A] text-[12.5px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#8B8B95] focus:outline-none focus:border-[#059669]"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-[13px] text-[#8B8B95]">
              {searchQuery ? 'No matching conversations' : 'No previous conversations'}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeConversationId;
              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConversation(c.id);
                    onClose();
                  }}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-[8px] text-[13px] transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#ECFDF5] dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-300 font-semibold'
                      : 'text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#F5F6F8] dark:hover:bg-[#202024]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className="w-4 h-4 shrink-0 text-[#8B8B95] group-hover:text-[#059669]" />
                    <span className="truncate">{c.title || 'Untitled Conversation'}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[11px] text-[#8B8B95]">
                      {formatDate(c.updated_at, 'MMM d')}
                    </span>
                    <button
                      type="button"
                      title="Archive chat"
                      onClick={(e) => {
                        e.stopPropagation();
                        onArchiveConversation(c.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#8B8B95] hover:text-red-600 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
