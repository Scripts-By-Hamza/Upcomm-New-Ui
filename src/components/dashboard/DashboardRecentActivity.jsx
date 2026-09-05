import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { Activity, ArrowRight } from 'lucide-react';

export function DashboardRecentActivity({ activityLogs = [], users = [], tasks = [] }) {
  const navigate = useNavigate();

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  const taskMap = useMemo(() => {
    const map = {};
    (tasks || []).forEach((t) => {
      if (t && t.id) map[t.id] = t;
    });
    return map;
  }, [tasks]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Just now';
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

  const formattedEvents = useMemo(() => {
    return (activityLogs || [])
      .slice(0, 4)
      .map((log) => {
        const actor = userMap[log.user_id];
        const actorName = actor?.full_name?.split(' ')[0] || log.metadata?.user_name || 'Someone';
        const taskObj = taskMap[log.entity_id] || taskMap[log.metadata?.task_id];
        const taskNumber = log.metadata?.task_number || taskObj?.task_number || 'task';
        const taskId = taskObj?.id || (log.entity_type === 'task' ? log.entity_id : log.metadata?.task_id);

        let sentence = '';

        if (log.action === 'TASK_STATUS_UPDATED') {
          const rawStatus = log.metadata?.new_status || 'In Progress';
          const cleanStatus = rawStatus.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          sentence = `${actorName} moved ${taskNumber} to ${cleanStatus}`;
        } else if (log.action === 'TASK_CREATED') {
          sentence = `${actorName} created ${taskNumber}`;
        } else if (log.action === 'COMPLETION_REQUESTED') {
          sentence = `${actorName} requested completion of ${taskNumber}`;
        } else if (log.action === 'DELETE_REQUESTED') {
          sentence = `${actorName} requested deletion of ${taskNumber}`;
        } else if (log.action === 'TASK_UPDATE_POSTED') {
          if (log.metadata?.attachments_count > 0) {
            sentence = `${actorName} uploaded an attachment to ${taskNumber}`;
          } else {
            sentence = `${actorName} updated ${taskNumber}`;
          }
        } else if (log.action === 'TASK_UPDATED') {
          sentence = `${actorName} edited details on ${taskNumber}`;
        } else if (log.action === 'REPORT_SUBMITTED') {
          sentence = `${actorName} submitted a report`;
        } else if (log.action === 'DEPARTMENT_CREATED') {
          sentence = `${actorName} created department "${log.metadata?.name || ''}"`;
        } else {
          sentence = `${actorName} updated ${taskNumber}`;
        }

        return {
          id: log.id,
          actor,
          actorName,
          sentence,
          timeAgo: formatTimeAgo(log.created_at),
          taskId,
        };
      });
  }, [activityLogs, userMap, taskMap]);

  return (
    <div className="hidden sm:flex bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Recent Activity
          </h2>
          <button
            type="button"
            onClick={() => navigate('/activity')}
            className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {formattedEvents.length === 0 ? (
          <div className="py-8 text-center text-[#8B8B95] space-y-1">
            <Activity className="w-6 h-6 text-[#71717A] mx-auto mb-1 opacity-60" />
            <p className="text-[13px] font-medium text-[#18181B]">No recent activity</p>
            <p className="text-[11.5px] text-[#71717A]">
              Activity events will show up here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {formattedEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => {
                  if (event.taskId) {
                    navigate(`/tasks/${event.taskId}`);
                  } else {
                    navigate('/activity');
                  }
                }}
                className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-[#F7F8FA] px-1 rounded-[6px] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Avatar
                    src={event.actor?.avatar_url}
                    name={event.actor?.full_name || event.actorName}
                    size="sm"
                    className="flex-shrink-0"
                  />
                  <span className="text-[13px] text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
                    {event.sentence}
                  </span>
                </div>

                <span className="text-[11.5px] text-[#8B8B95] font-mono whitespace-nowrap flex-shrink-0">
                  {event.timeAgo}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
