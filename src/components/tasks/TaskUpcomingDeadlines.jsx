import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { parseTaskDueDateLocal, isTaskOverdue, toLocalDateKey } from '../../utils/dateUtils';
import { getTaskDepartmentsInfo } from '../../utils/taskDepartmentUtils';
import { Clock } from 'lucide-react';

export function TaskUpcomingDeadlines({
  tasks = [],
  users = [],
  departments = [],
  onOpenTask,
}) {
  const navigate = useNavigate();

  // Extract upcoming tasks (due_date >= today, sorted ascending, max 5)
  const upcomingTasks = React.useMemo(() => {
    const todayKey = toLocalDateKey(new Date());

    const scheduled = (tasks || []).filter((task) => {
      if (!task.due_date) return false;
      const taskDateKey = toLocalDateKey(task.due_date);
      return taskDateKey >= todayKey;
    });

    // Sort ascending by due_date
    scheduled.sort((a, b) => {
      const keyA = toLocalDateKey(a.due_date);
      const keyB = toLocalDateKey(b.due_date);
      if (keyA !== keyB) return keyA.localeCompare(keyB);

      // Secondary: priority weight
      const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
      const pA = weight[a.priority?.toLowerCase()] || 0;
      const pB = weight[b.priority?.toLowerCase()] || 0;
      return pB - pA;
    });

    return scheduled.slice(0, 5);
  }, [tasks]);

  const getTaskStatusLabel = (task) => {
    const isOverdue = isTaskOverdue(task.due_date, task.status);
    if (isOverdue) {
      return { dot: 'bg-[#DC2626]', text: 'Overdue', color: 'text-[#DC2626]' };
    }
    if (task.status === 'completed') {
      return { dot: 'bg-[#16A34A]', text: 'Completed', color: 'text-[#16A34A]' };
    }
    if (task.status === 'in_progress') {
      return { dot: 'bg-[#2563EB]', text: 'In Progress', color: 'text-[#2563EB]' };
    }
    if (task.priority?.toLowerCase() === 'urgent') {
      return { dot: 'bg-[#DC2626]', text: 'Urgent', color: 'text-[#DC2626]' };
    }
    return { dot: 'bg-[#71717A]', text: 'Pending', color: 'text-[#71717A]' };
  };

  return (
    <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-4 flex flex-col justify-between space-y-4">
      <div className="space-y-3.5">
        {/* Panel Header */}
        <h3 className="text-[13.5px] font-bold text-[#18181B] tracking-tight">
          Upcoming deadlines
        </h3>

        {/* Task List */}
        {upcomingTasks.length === 0 ? (
          <div className="py-8 text-center text-[#A1A1AA] text-[12px] space-y-1">
            <Clock className="w-5 h-5 mx-auto mb-1 opacity-50" />
            <p>No upcoming deadlines</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingTasks.map((task) => {
              const parsedDate = parseTaskDueDateLocal(task.due_date);
              const monthStr = parsedDate ? format(parsedDate, 'MMM') : '—';
              const dayStr = parsedDate ? format(parsedDate, 'd') : '—';

              const deptInfo = getTaskDepartmentsInfo(task, users, departments);
              const primaryDept = deptInfo.find((d) => d?.isPrimary) || deptInfo[0];
              const statusInfo = getTaskStatusLabel(task);

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    if (onOpenTask) {
                      onOpenTask(task.id);
                    } else {
                      navigate(`/tasks/${task.id}`);
                    }
                  }}
                  className="flex items-start gap-3 p-1.5 -mx-1.5 rounded-[8px] hover:bg-[#F8F9FA] transition-colors cursor-pointer group"
                >
                  {/* Date Badge */}
                  <div className="w-11 h-12 rounded-[8px] border border-[#E5E7EB] bg-[#F8F9FA] flex flex-col items-center justify-center flex-shrink-0 text-center shadow-2xs group-hover:border-[#CBD5E1] transition-colors">
                    <span className="text-[10px] font-bold text-[#71717A] uppercase leading-none">
                      {monthStr}
                    </span>
                    <span className="text-[14.5px] font-bold text-[#18181B] leading-none mt-1">
                      {dayStr}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4 className="text-[13px] font-semibold text-[#18181B] leading-snug line-clamp-2 group-hover:text-[#059669] transition-colors">
                      {task.title}
                    </h4>

                    {primaryDept && (
                      <p className="text-[11px] text-[#71717A] truncate">
                        {primaryDept.name}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusInfo.dot}`} />
                      <span className={`text-[11px] font-medium ${statusInfo.color}`}>
                        {statusInfo.text}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Link */}
      <div className="pt-2 border-t border-[#F4F4F5]">
        <button
          type="button"
          onClick={() => navigate('/tasks?view=list')}
          className="text-[12.5px] font-semibold text-[#059669] hover:underline cursor-pointer"
        >
          View all deadlines
        </button>
      </div>
    </div>
  );
}
