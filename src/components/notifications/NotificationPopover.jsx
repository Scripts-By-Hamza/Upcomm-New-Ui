import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationTabs from './NotificationTabs';
import NotificationRow from './NotificationRow';
import NotificationEmptyState from './NotificationEmptyState';

const POPOVER_ITEM_LIMIT = 6;

/**
 * Floating Global Notifications Popover.
 */
export function NotificationPopover({
  isOpen = false,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkAllAsRead,
  onNotificationClick,
  popoverRef,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const navigate = useNavigate();

  // Filter list based on active tab
  const tabFilteredNotifications =
    activeTab === 'unread'
      ? notifications.filter((n) => n.isUnread)
      : notifications;

  const displayList = tabFilteredNotifications.slice(0, POPOVER_ITEM_LIMIT);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMarkAllClick = (e) => {
    e.stopPropagation();
    if (onMarkAllAsRead && unreadCount > 0) {
      const unreadIds = notifications.filter((n) => n.isUnread).map((n) => n.id);
      onMarkAllAsRead(unreadIds);
    }
  };

  const handleViewAllClick = (e) => {
    e.stopPropagation();
    onClose && onClose();
    navigate('/activity');
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="false"
      aria-label="Notifications"
      className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-full mt-2 w-auto sm:w-[380px] max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-[0_12px_36px_rgba(24,24,27,0.14)] border border-[#E5E7EB] z-50 overflow-hidden animate-fade-in mx-auto sm:mx-0 select-none font-sans"
    >
      {/* 1. Header (48px) */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-[#F4F4F5] bg-white">
        <div className="flex items-center gap-2">
          <h3 className="text-[15px] font-semibold text-[#18181B] tracking-tight">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]">
              {unreadCount} unread
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllClick}
            className="text-[12px] font-medium text-[#059669] hover:text-[#047857] hover:underline cursor-pointer transition-colors focus:outline-none"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* 2. Tabs: All | Unread */}
      <NotificationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unreadCount={unreadCount}
      />

      {/* 3. Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-[#F4F4F5]">
        {displayList.length === 0 ? (
          <NotificationEmptyState tab={activeTab} />
        ) : (
          displayList.map((notif) => (
            <NotificationRow
              key={notif.id}
              notification={notif}
              onClick={onNotificationClick}
            />
          ))
        )}
      </div>

      {/* 4. Footer */}
      <div className="p-2.5 border-t border-[#E5E7EB] text-center bg-white">
        <button
          type="button"
          onClick={handleViewAllClick}
          className="text-[12.5px] font-medium text-[#059669] hover:text-[#047857] hover:underline cursor-pointer inline-flex items-center justify-center transition-colors focus:outline-none"
        >
          View all notifications
        </button>
      </div>
    </div>
  );
}

export default NotificationPopover;
