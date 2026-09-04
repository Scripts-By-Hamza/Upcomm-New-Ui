import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { isTaskOverdue } from '../../utils/dateUtils';
import { Users, ArrowRight } from 'lucide-react';

export function DashboardTeamWorkload({ tasks = [], users = [] }) {
  const navigate = useNavigate();

  const workloadList = useMemo(() => {
    // Exclude system accounts, hidden directory accounts, and IT support accounts
    const eligibleMembers = (users || []).filter(
      (u) =>
        u &&
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    );

    const nonDeletedTasks = (tasks || []).filter((t) => !t.is_deleted);

    const results = eligibleMembers.map((member) => {
      // Find active tasks assigned to this member (supporting both assigned_to and assigned_to_ids)
      const assignedTasks = nonDeletedTasks.filter((t) => {
        const ids = Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.length > 0
          ? t.assigned_to_ids
          : [t.assigned_to].filter(Boolean);
        return ids.includes(member.id);
      });

      const activeTasks = assignedTasks.filter((t) => t.status !== 'completed');
      const overdueTasks = activeTasks.filter((t) => isTaskOverdue(t.due_date, t.status));

      return {
        member,
        activeCount: activeTasks.length,
        overdueCount: overdueTasks.length,
        totalAssigned: assignedTasks.length,
      };
    });

    // Sort by active task count descending
    return results.sort((a, b) => b.activeCount - a.activeCount).slice(0, 5);
  }, [tasks, users]);

  const maxActive = useMemo(() => {
    const max = Math.max(...workloadList.map((w) => w.activeCount), 0);
    return max > 0 ? max : 1;
  }, [workloadList]);

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
            <p className="text-[13px] font-medium text-[#18181B]">No team members</p>
            <p className="text-[11.5px] text-[#71717A]">
              No active workload data available.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {workloadList.map(({ member, activeCount, overdueCount }, idx) => {
              const percentage = Math.min(Math.round((activeCount / maxActive) * 100), 100);
              const isTop = idx === 0;

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

                  {/* Middle: Active & Overdue counts */}
                  <div className="text-[12px] text-[#71717A] whitespace-nowrap text-right min-w-[100px]">
                    <span className="font-medium text-[#52525B]">
                      {activeCount} active
                    </span>
                    {overdueCount > 0 && (
                      <span className="text-[#DC2626] font-medium ml-1">
                        , {overdueCount} overdue
                      </span>
                    )}
                  </div>

                  {/* Right: Proportional Workload Bar */}
                  <div className="w-24 sm:w-32 bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden flex-shrink-0">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isTop ? 'bg-[#059669]' : 'bg-[#2563EB]'
                      }`}
                      style={{ width: `${percentage}%` }}
                      role="progressbar"
                      aria-valuenow={activeCount}
                      aria-valuemin={0}
                      aria-valuemax={maxActive}
                      aria-label={`${member.full_name}'s workload`}
                    />
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
