import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { MessageSquare, ArrowRight } from 'lucide-react';

export function MemberRecentMessages({ accessibleTasks = [], users = [], currentUserId }) {
  const navigate = useNavigate();

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${Math.floor(diffDays / 7)}w`;
  };

  const recentMessages = useMemo(() => {
    const allUpdates = [];

    (accessibleTasks || []).forEach((task) => {
      if (!task || task.is_deleted) return;
      const updates = task.task_updates || [];
      updates.forEach((update) => {
        if (!update || !update.created_at) return;

        // Skip internal/empty updates with no text or attachments
        const hasText = Boolean(update.text && update.text.trim());
        const hasAttachments = Array.isArray(update.attachments) && update.attachments.length > 0;
        if (!hasText && !hasAttachments) return;

        allUpdates.push({
          ...update,
          task,
        });
      });
    });

    // Sort by created_at descending
    allUpdates.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Prefer updates from other users if available, otherwise include user's own
    const othersUpdates = allUpdates.filter((u) => u.user_id !== currentUserId);
    const selected = othersUpdates.length >= 3 ? othersUpdates : allUpdates;

    return selected.slice(0, 4);
  }, [accessibleTasks, currentUserId]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Recent Messages
          </h2>
        </div>

        {recentMessages.length === 0 ? (
          <div className="py-7 text-center text-[#8B8B95] space-y-1">
            <MessageSquare className="w-6 h-6 text-[#71717A] mx-auto mb-1 opacity-60" />
            <p className="text-[13px] font-medium text-[#18181B]">No recent task messages</p>
            <p className="text-[11.5px] text-[#71717A]">
              Comments and updates on your tasks will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {recentMessages.map((msg) => {
              const sender = userMap[msg.user_id];
              const senderName = sender?.full_name || msg.user_name || 'Team Member';
              const excerpt = msg.text
                ? msg.text
                : msg.attachments?.length > 0
                ? 'Sent an attachment'
                : 'Updated task';

              return (
                <div
                  key={msg.id}
                  onClick={() => navigate(`/tasks/${msg.task.id}`)}
                  className="py-3 first:pt-1 last:pb-1 flex items-start justify-between gap-3 hover:bg-[#F7F8FA] px-1 rounded-[6px] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <Avatar
                      src={sender?.avatar_url || msg.user_avatar}
                      name={senderName}
                      size="sm"
                      className="flex-shrink-0 mt-0.5"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
                        {senderName}
                      </div>
                      <p className="text-[12px] text-[#52525B] truncate mt-0.5">
                        {excerpt}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11.5px] font-mono text-[#8B8B95] whitespace-nowrap flex-shrink-0 mt-0.5">
                    {formatTimeAgo(msg.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
