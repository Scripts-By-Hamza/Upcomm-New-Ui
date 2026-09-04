import React from 'react';
import { CheckCircle2, Bell } from 'lucide-react';

/**
 * Compact empty state for notifications popover.
 */
export function NotificationEmptyState({ tab = 'all' }) {
  const isUnreadTab = tab === 'unread';

  return (
    <div className="py-10 px-4 text-center select-none">
      <div className="w-10 h-10 rounded-full bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-2.5 text-[#71717A]">
        {isUnreadTab ? (
          <CheckCircle2 className="w-5 h-5 text-[#059669]" />
        ) : (
          <Bell className="w-5 h-5 text-[#71717A]" />
        )}
      </div>
      <p className="text-[13px] font-semibold text-[#18181B] mb-0.5">
        {isUnreadTab ? "You're all caught up" : 'No notifications yet'}
      </p>
      <p className="text-xs text-[#71717A]">
        {isUnreadTab
          ? 'No unread notifications.'
          : 'Updates relevant to you will appear here.'}
      </p>
    </div>
  );
}

export default NotificationEmptyState;
