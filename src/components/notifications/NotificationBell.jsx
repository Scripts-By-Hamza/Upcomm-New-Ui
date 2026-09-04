import React from 'react';
import { Bell } from 'lucide-react';

/**
 * Topbar Notification Bell Button with real unread count badge.
 */
export function NotificationBell({
  unreadCount = 0,
  isOpen = false,
  onClick,
  bellRef,
}) {
  const accessibleLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : 'Notifications';

  return (
    <button
      ref={bellRef}
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-label={accessibleLabel}
      className={`relative p-2 rounded-[8px] transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#059669]/30 ${
        isOpen
          ? 'bg-[#F5F6F8] text-[#18181B]'
          : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F5F6F8]'
      }`}
      title={accessibleLabel}
    >
      <Bell className="w-5 h-5 text-[#52525B]" />

      {unreadCount > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 bg-[#DC2626] text-white font-bold text-[9.5px] min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center leading-none ring-2 ring-white shadow-xs"
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
