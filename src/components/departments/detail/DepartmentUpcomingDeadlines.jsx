import React, { useMemo } from 'react';
import { Avatar } from '../../common/Avatar';
import { Flag, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getTaskAssigneeIds } from '../../../utils/taskDepartmentUtils';
import { format, parseISO, isToday } from 'date-fns';

export function DepartmentUpcomingDeadlines({
  tasks = [],
  users = [],
  onTaskClick,
  onViewAllTasks,
}) {
  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  // Today local ISO string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };

  const upcomingTasks = useMemo(() => {
    const filtered = (tasks || []).filter((t) => {
      if (t.status === 'completed' || t.is_deleted) return false;
      if (!t.due_date) return false;
      const dueDatePart = t.due_date.split('T')[0];
      return dueDatePart >= todayStr;
    });

    return filtered
      .sort((a, b) => {
        const dateA = a.due_date.split('T')[0];
        const dateB = b.due_date.split('T')[0];
        if (dateA !== dateB) return dateA.localeCompare(dateB);

        const pA = priorityWeights[a.priority?.toLowerCase()] || 0;
        const pB = priorityWeights[b.priority?.toLowerCase()] || 0;
        if (pB !== pA) return pB - pA;

        return (a.title || '').localeCompare(b.title || '');
      })
      .slice(0, 5);
  }, [tasks, todayStr]);

  const getPriorityBadge = (priority) => {
    const p = (priority || 'medium').toLowerCase();
    if (p === 'urgent') {
      return { label: 'Urgent', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' };
    }
    if (p === 'high') {
      return { label: 'High', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' };
    }
    if (p === 'medium') {
      return { label: 'Medium', color: 'text-[#D97706]', iconColor: 'text-[#D97706]' };
    }
    return { label: 'Low', color: 'text-[#71717A]', iconColor: 'text-[#71717A]' };
  };

  const formatDueDisplay = (dueDateStr) => {
    if (!dueDateStr) return '—';
    try {
      const datePart = dueDateStr.split('T')[0];
      if (datePart === todayStr) {
        return <span className="text-[#059669] font-medium">Today</span>;
      }
      const parsed = parseISO(datePart);
      return <span className="text-[#52525B] font-medium">{format(parsed, 'MMM d')}</span>;
    } catch {
      return <span className="text-[#52525B]">{dueDateStr}</span>;
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Upcoming Deadlines
          </h2>
        </div>

        {upcomingTasks.length === 0 ? (
          <div className="py-8 text-center text-[#8B8B95] space-y-1">
            <CheckCircle2 className="w-6 h-6 text-[#059669] mx-auto mb-1 opacity-70" />
            <p className="text-[13px] font-medium text-[#18181B]">No upcoming deadlines</p>
            <p className="text-[11.5px] text-[#71717A]">
              There are no pending tasks due today or in the future.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-[#F4F4F5] text-[11px] font-semibold text-[#8B8B95]">
                  <th className="pb-2.5 font-medium">Task</th>
                  <th className="pb-2.5 font-medium hidden sm:table-cell">Assignee</th>
                  <th className="pb-2.5 font-medium">Priority</th>
                  <th className="pb-2.5 font-medium">Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {upcomingTasks.map((task) => {
                  const assigneeIds = getTaskAssigneeIds(task);
                  const assignees = assigneeIds.map((id) => userMap[id]).filter(Boolean);
                  const firstAssignee = assignees[0];
                  const extraCount = assignees.length - 1;
                  const priority = getPriorityBadge(task.priority);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => onTaskClick && onTaskClick(task)}
                      className="hover:bg-[#F7F8FA] transition-colors cursor-pointer group"
                    >
                      {/* Task */}
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

                      {/* Assignee */}
                      <td className="py-2.5 pr-3 hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Avatar
                            src={firstAssignee?.avatar_url}
                            name={firstAssignee?.full_name || 'Unassigned'}
                            size="xs"
                          />
                          <span className="text-[12px] text-[#52525B] truncate max-w-[90px]">
                            {firstAssignee?.full_name || 'Unassigned'}
                          </span>
                          {extraCount > 0 && (
                            <span className="text-[10.5px] text-[#71717A] font-semibold">
                              +{extraCount}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1">
                          <Flag className={`w-3 h-3 ${priority.iconColor}`} />
                          <span className={`text-[11.5px] font-medium ${priority.color}`}>
                            {priority.label}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 whitespace-nowrap">
                        {formatDueDisplay(task.due_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Link: View all tasks */}
      <div className="border-t border-[#F4F4F5] pt-3 mt-3">
        <button
          type="button"
          onClick={onViewAllTasks}
          className="text-[12.5px] font-medium text-[#059669] hover:text-[#047857] inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View all tasks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
