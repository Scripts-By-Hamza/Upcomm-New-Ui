import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, MoreHorizontal, ArrowRight, CheckCircle2 } from 'lucide-react';

export function MemberTodayTasks({ tasks = [] }) {
  const navigate = useNavigate();

  const getPriorityInfo = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return { label: priority?.toLowerCase() === 'urgent' ? 'Urgent' : 'High', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' };
      case 'medium':
        return { label: 'Medium', color: 'text-[#D97706]', iconColor: 'text-[#D97706]' };
      case 'low':
      default:
        return { label: 'Low', color: 'text-[#71717A]', iconColor: 'text-[#71717A]' };
    }
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

  const displayedTasks = (tasks || []).slice(0, 5);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Today’s Tasks
          </h2>
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
          >
            <span>View all</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {displayedTasks.length === 0 ? (
          <div className="py-7 text-center text-[#8B8B95] space-y-1">
            <CheckCircle2 className="w-6 h-6 text-[#059669] mx-auto mb-1 opacity-75" />
            <p className="text-[13px] font-medium text-[#18181B]">No tasks due today</p>
            <p className="text-[11.5px] text-[#71717A]">
              You have no active deadlines scheduled for today.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[#F4F4F5] text-[11px] font-semibold text-[#8B8B95]">
                  <th className="pb-2.5 font-medium pl-1 w-6">
                    <input
                      type="checkbox"
                      disabled
                      className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-default opacity-60"
                      aria-label="Select task"
                    />
                  </th>
                  <th className="pb-2.5 font-medium">Task</th>
                  <th className="pb-2.5 font-medium">Status</th>
                  <th className="pb-2.5 font-medium">Priority</th>
                  <th className="pb-2.5 font-medium">Due date</th>
                  <th className="pb-2.5 font-medium w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {displayedTasks.map((task) => {
                  const priorityInfo = getPriorityInfo(task.priority);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="hover:bg-[#F7F8FA] transition-colors cursor-pointer group"
                    >
                      {/* Selection Checkbox */}
                      <td className="py-2.5 pl-1 pr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer"
                          aria-label={`Select ${task.title}`}
                          onChange={() => {}}
                        />
                      </td>

                      {/* Task Info */}
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-[#71717A] flex-shrink-0">
                            {task.task_number || 'TM-0000'}
                          </span>
                          <span className="font-medium text-[#18181B] group-hover:text-[#059669] transition-colors truncate max-w-[160px] sm:max-w-[200px]">
                            {task.title}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 pr-3">
                        {getStatusBadge(task.status)}
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1">
                          <Flag className={`w-3 h-3 ${priorityInfo.iconColor}`} />
                          <span className={`text-[11.5px] font-medium ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 pr-2">
                        <span className="text-[12px] font-medium text-[#059669]">
                          Today
                        </span>
                      </td>

                      {/* Action trigger */}
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tasks/${task.id}`);
                          }}
                          className="p-1 text-[#8B8B95] hover:text-[#18181B] rounded-[4px]"
                          aria-label="View task details"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
