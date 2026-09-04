import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { MessageSquare, ArrowRight } from 'lucide-react';

export function DashboardRecentComments({ tasks = [], users = [] }) {
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

  const recentComments = useMemo(() => {
    const list = [];
    const nonDeletedTasks = (tasks || []).filter((t) => !t.is_deleted);

    nonDeletedTasks.forEach((task) => {
      const updates = task.task_updates || [];
      updates.forEach((update) => {
        if (!update || !update.created_at) return;

        const hasText = Boolean(update.text && update.text.trim());
        const hasAttachments = Array.isArray(update.attachments) && update.attachments.length > 0;
        if (!hasText && !hasAttachments) return;

        list.push({
          ...update,
          task_id: task.id,
          task_title: task.title,
          task_number: task.task_number,
        });
      });
    });

    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    return list.slice(0, 4);
  }, [tasks]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Recent Comments
          </h2>
          <button
            type="button"
            onClick={() => navigate('/activity?tab=chats')}
            className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentComments.length === 0 ? (
          <div className="py-8 text-center text-[#8B8B95] space-y-1">
            <MessageSquare className="w-6 h-6 text-[#71717A] mx-auto mb-1 opacity-60" />
            <p className="text-[13px] font-medium text-[#18181B]">No recent comments</p>
            <p className="text-[11.5px] text-[#71717A]">
              Comments and updates posted on tasks will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {recentComments.map((comment) => {
              const author = userMap[comment.user_id];
              const authorName = author?.full_name || comment.user_name || 'Team Member';
              const commentKey = comment.id || `${comment.task_id}_${comment.created_at}`;
              const commentText = comment.text
                ? comment.text
                : comment.attachments?.length > 0
                ? 'Uploaded an attachment'
                : 'Updated task';

              return (
                <div
                  key={commentKey}
                  onClick={() => navigate(`/tasks/${comment.task_id}`)}
                  className="py-2.5 first:pt-1 last:pb-1 flex items-start justify-between gap-3 hover:bg-[#F7F8FA] px-1 rounded-[6px] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <Avatar
                      src={author?.avatar_url || comment.user_avatar}
                      name={authorName}
                      size="sm"
                      className="flex-shrink-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[13px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
                          {authorName}
                        </span>
                        <span className="text-[11px] text-[#A1A1AA] truncate">
                          on <span className="font-medium text-[#71717A]">{comment.task_title}</span>
                        </span>
                      </div>
                      <p className="text-[12px] text-[#52525B] line-clamp-1 mt-0.5">
                        {commentText}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11.5px] text-[#8B8B95] font-mono whitespace-nowrap flex-shrink-0 mt-0.5">
                    {formatTimeAgo(comment.created_at)}
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
