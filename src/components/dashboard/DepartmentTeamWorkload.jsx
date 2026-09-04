import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { isTaskOverdue } from '../../utils/dateUtils';
import { getTaskAssigneeIds } from '../../utils/taskDepartmentUtils';
import { Users, ArrowRight } from 'lucide-react';

export function DepartmentTeamWorkload({ tasks = [], users = [], departmentId }) {
  const navigate = useNavigate();

  const workloadList = useMemo(() => {
    if (!departmentId) return [];

    // Filter department members (exclude system, hidden, and IT support accounts)
    const deptMembers = (users || []).filter(
      (u) =>
        u &&
        u.department_id === departmentId &&
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    );

    const nonDeletedTasks = (tasks || []).filter((t) => !t.is_deleted);

    const results = deptMembers.map((member) => {
      const assignedTasks = nonDeletedTasks.filter((t) => {
        const ids = getTaskAssigneeIds(t);
        return ids.includes(member.id);
      });

      const activeTasks = assignedTasks.filter((t) => t.status !== 'completed');
      const overdueTasks = activeTasks.filter((t) => isTaskOverdue(t.due_date, t.status));
      const completedTasks = assignedTasks.filter((t) => t.status === 'completed');

      const total = assignedTasks.length;
      const completionRate = total > 0 ? Math.round((completedTasks.length / total) * 100) : 0;

      return {
        member,
        activeCount: activeTasks.length,
        overdueCount: overdueTasks.length,
        completedCount: completedTasks.length,
        total,
        completionRate,
      };
    });

    // Sort by active workload descending
    return results.sort((a, b) => b.activeCount - a.activeCount).slice(0, 5);
  }, [tasks, users, departmentId]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Team Workload
          </h2>
          <button
            type="button"
            onClick={() => navigate('/directory')}
            className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
          >
            <span>View Team</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {workloadList.length === 0 ? (
          <div className="py-8 text-center text-[#8B8B95] space-y-1">
            <Users className="w-6 h-6 text-[#71717A] mx-auto mb-1 opacity-60" />
            <p className="text-[13px] font-medium text-[#18181B]">No department members</p>
            <p className="text-[11.5px] text-[#71717A]">
              No active workload data available for this department.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {workloadList.map(({ member, activeCount, overdueCount, completionRate }, idx) => {
              const isTop = idx < 2;

              return (
                <div
                  key={member.id}
                  onClick={() => navigate(`/tasks?assignedTo=${member.id}`)}
                  className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-[#F7F8FA] px-1 rounded-[6px] transition-colors cursor-pointer group"
                >
                  {/* Left: Avatar + Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Avatar
                      src={member.avatar_url}
                      name={member.full_name || 'Member'}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[13px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate block">
                        {member.full_name}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Active & Overdue */}
                  <div className="text-[12px] text-[#71717A] whitespace-nowrap text-right min-w-[90px]">
                    <span className="font-medium text-[#52525B]">
                      {activeCount} active
                    </span>
                    {overdueCount > 0 && (
                      <span className="text-[#DC2626] font-medium ml-1">
                        , {overdueCount} overdue
                      </span>
                    )}
                  </div>

                  {/* Right: Completion Progress Bar + Percentage */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-20 sm:w-28 bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isTop ? 'bg-[#059669]' : 'bg-[#2563EB]'
                        }`}
                        style={{ width: `${completionRate}%` }}
                        role="progressbar"
                        aria-valuenow={completionRate}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${member.full_name}'s completion rate`}
                      />
                    </div>
                    <span className="text-[11.5px] font-mono font-medium text-[#71717A] w-7 text-right">
                      {completionRate}%
                    </span>
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
