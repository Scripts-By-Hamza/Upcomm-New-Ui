import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { Flag, MoreHorizontal, ArrowRight, CheckCircle } from 'lucide-react';
import { getTaskAssigneeIds } from '../../utils/taskDepartmentUtils';

export function DepartmentDueToday({ tasks = [], users = [] }) {
  const navigate = useNavigate();

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  // Format today in local timezone (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };

  const dueTodayTasks = useMemo(() => {
    const filtered = (tasks || []).filter((t) => {
      if (t.status === 'completed' || t.is_deleted) return false;
      if (!t.due_date) return false;
      const dueDatePart = t.due_date.split('T')[0];
      return dueDatePart === todayStr;
    });

    return filtered.sort((a, b) => {
      const pA = priorityWeights[a.priority?.toLowerCase()] || 0;
      const pB = priorityWeights[b.priority?.toLowerCase()] || 0;
      if (pB !== pA) return pB - pA;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [tasks, todayStr]);

  const displayedTasks = dueTodayTasks.slice(0, 5);

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

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Due Today
          </h2>
          {dueTodayTasks.length > 5 && (
            <button
              type="button"
              onClick={() => navigate('/tasks')}
              className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({dueTodayTasks.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {displayedTasks.length === 0 ? (
          <div className="py-8 text-center text-[#8B8B95] space-y-1">
            <CheckCircle className="w-6 h-6 text-[#059669] mx-auto mb-1 opacity-75" />
            <p className="text-[13px] font-medium text-[#18181B]">No tasks due today</p>
            <p className="text-[11.5px] text-[#71717A]">
              Your department has no deadlines today!
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
                  <th className="pb-2.5 font-medium w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F4F4F5]">
                {displayedTasks.map((task) => {
                  const assigneeIds = getTaskAssigneeIds(task);
                  const assignees = assigneeIds.map((id) => userMap[id]).filter(Boolean);
                  const firstAssignee = assignees[0];
                  const extraAssigneesCount = assignees.length - 1;
                  const priorityInfo = getPriorityInfo(task.priority);

                  return (
                    <tr
                      key={task.id}
                      onClick={() => navigate(`/tasks/${task.id}`)}
                      className="hover:bg-[#F7F8FA] transition-colors cursor-pointer group"
                    >
                      {/* Task Info */}
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] text-[#71717A] flex-shrink-0">
                            {task.task_number || 'TM-0000'}
                          </span>
                          <span className="font-medium text-[#18181B] group-hover:text-[#059669] transition-colors truncate max-w-[170px] sm:max-w-[220px]">
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
                          <span className="text-[12px] text-[#52525B] truncate max-w-[80px]">
                            {firstAssignee?.full_name?.split(' ')[0] || 'Unassigned'}
                          </span>
                          {extraAssigneesCount > 0 && (
                            <span className="text-[10px] text-[#71717A] font-semibold">
                              +{extraAssigneesCount}
                            </span>
                          )}
                        </div>
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

                      {/* Due */}
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
