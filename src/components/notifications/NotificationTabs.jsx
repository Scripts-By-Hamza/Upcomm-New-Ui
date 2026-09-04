import React from 'react';

/**
 * Compact All / Unread Text Tabs with active green underline.
 */
export function NotificationTabs({
  activeTab = 'all',
  onTabChange,
  unreadCount = 0,
}) {
  return (
    <div className="flex items-center gap-6 px-4 border-b border-[#E5E7EB] bg-white">
      <button
        type="button"
        onClick={() => onTabChange('all')}
        className={`pb-2.5 pt-1.5 text-[13px] font-medium transition-colors cursor-pointer relative ${
          activeTab === 'all'
            ? 'text-[#18181B] font-semibold'
            : 'text-[#71717A] hover:text-[#18181B]'
        }`}
      >
        <span>All</span>
        {activeTab === 'all' && (
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#059669] rounded-t-sm" />
        )}
      </button>

      <button
        type="button"
        onClick={() => onTabChange('unread')}
        className={`pb-2.5 pt-1.5 text-[13px] font-medium transition-colors cursor-pointer relative flex items-center gap-1.5 ${
          activeTab === 'unread'
            ? 'text-[#18181B] font-semibold'
            : 'text-[#71717A] hover:text-[#18181B]'
        }`}
      >
        <span>Unread</span>
        {unreadCount > 0 && (
          <span className="text-[11px] font-normal text-[#71717A]">
            ({unreadCount})
          </span>
        )}
        {activeTab === 'unread' && (
          <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#059669] rounded-t-sm" />
        )}
      </button>
    </div>
  );
}

export default NotificationTabs;
