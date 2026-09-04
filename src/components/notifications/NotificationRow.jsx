import React from 'react';
import Avatar from '../common/Avatar';
import { CalendarDays, AlertCircle, Clock, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

/**
 * Single Notification Row for the Popover List.
 */
export function NotificationRow({
  notification,
  onClick,
}) {
  if (!notification) return null;

  const isUnread = Boolean(notification.isUnread);
  const actor = notification.actor;
  const isSystem = Boolean(notification.systemIcon);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick && onClick(notification);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick && onClick(notification)}
      onKeyDown={handleKeyDown}
      className={`group relative flex items-start gap-3 px-4 py-3 border-b border-[#F4F4F5] transition-colors cursor-pointer select-none focus:outline-none focus:bg-[#F1F3F5] ${
        isUnread ? 'bg-[#F8FAFC]' : 'bg-white hover:bg-[#F7F8FA]'
      }`}
    >
      {/* 1. Left: Avatar or System Icon */}
      <div className="flex-shrink-0 pt-0.5">
        {isSystem ? (
          <div className="w-9 h-9 rounded-full bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center text-[#52525B]">
            {notification.systemIcon === 'calendar' ? (
              <CalendarDays className="w-4 h-4 text-[#71717A]" />
            ) : notification.systemIcon === 'alert' ? (
              <AlertCircle className="w-4 h-4 text-[#DC2626]" />
            ) : (
              <Clock className="w-4 h-4 text-[#71717A]" />
            )}
          </div>
        ) : (
          <Avatar
            user={actor}
            name={actor?.full_name || 'User'}
            src={actor?.avatar_url}
            size="sm"
            className="w-9 h-9 rounded-full text-xs font-semibold border border-white shadow-2xs"
          />
        )}
      </div>

      {/* 2. Middle: Content (Title + Secondary preview) */}
      <div className="flex-1 min-w-0 pr-2">
        {/* Title */}
        <p className="text-[12.5px] leading-tight text-[#18181B] font-medium truncate group-hover:text-[#059669] transition-colors">
          {notification.title}
        </p>

        {/* Secondary Context / Preview */}
        {notification.secondaryText && (
          <p className="text-[11.5px] leading-normal text-[#52525B] mt-0.5 truncate font-normal">
            {notification.secondaryText}
          </p>
        )}
      </div>

      {/* 3. Right: Relative Time + Unread Blue Dot */}
      <div className="flex-shrink-0 flex items-center gap-2 pt-0.5 text-right">
        <span
          className="text-[11px] text-[#8B8B95] tabular-nums font-normal"
          title={notification.timestamp}
        >
          {notification.timeFormatted || 'now'}
        </span>

        {isUnread && (
          <span
            className="w-2 h-2 rounded-full bg-[#2563EB] ring-2 ring-white flex-shrink-0"
            aria-label="Unread notification"
          />
        )}
      </div>
    </div>
  );
}

export default NotificationRow;
