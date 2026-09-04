import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { ClipboardList, MoreHorizontal, ArrowRight } from 'lucide-react';

export function MemberRecentlyAssigned({ tasks = [], users = [] }) {
  const navigate = useNavigate();

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  const formatDueDate = (dateStr) => {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    return `Due ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'in_progress':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11.5px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11.5px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            Completed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[11.5px] font-medium bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]">
            Pending
          </span>
        );
    }
  };

  const displayedTasks = (tasks || []).slice(0, 3);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Recently Assigned
          </h2>
          {tasks.length > 3 && (
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({tasks.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {displayedTasks.length === 0 ? (
          <div className="py-7 text-center text-[#8B8B95] space-y-1">
            <ClipboardList className="w-6 h-6 text-[#71717A] mx-auto mb-1 opacity-60" />
            <p className="text-[13px] font-medium text-[#18181B]">No recently assigned tasks</p>
            <p className="text-[11.5px] text-[#71717A]">
              New tasks assigned to you will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {displayedTasks.map((task) => {
              const creatorId = task.assigned_by || task.created_by;
              const creator = userMap[creatorId];
              const creatorName = creator?.full_name || 'Admin';

              return (
                <div
                  key={task.id}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-[#F7F8FA] px-1 rounded-[6px] transition-colors cursor-pointer group"
                >
                  {/* Left: Clipboard Icon + Task Info + Assigner */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-[7px] border border-[#E5E7EB] bg-white flex items-center justify-center text-[#71717A] group-hover:text-[#18181B] group-hover:border-[#D4D4D8] transition-colors flex-shrink-0">
                      <ClipboardList className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] text-[#71717A] flex-shrink-0">
                          {task.task_number || 'TM-0000'}
                        </span>
                        <span className="text-[13px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <Avatar
                          src={creator?.avatar_url}
                          name={creatorName}
                          size="xs"
                        />
                        <span className="text-[11.5px] text-[#71717A] truncate">
                          {creatorName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Due Date + Status + Action */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[12px] text-[#71717A] hidden sm:inline-block">
                      {formatDueDate(task.due_date)}
                    </span>

                    <div>{getStatusBadge(task.status)}</div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/tasks/${task.id}`);
                      }}
                      className="p-1 text-[#8B8B95] hover:text-[#18181B] rounded-[4px]"
                      aria-label="View task"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
