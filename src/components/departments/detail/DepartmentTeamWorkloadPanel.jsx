import React, { useMemo } from 'react';
import { Avatar } from '../../common/Avatar';
import { Users, ArrowRight } from 'lucide-react';
import { getTaskAssigneeIds } from '../../../utils/taskDepartmentUtils';
import { isTaskOverdue } from '../../../utils/dateUtils';

export function DepartmentTeamWorkloadPanel({
  tasks = [],
  members = [],
  onMemberClick,
  onViewTeam,
}) {
  const workloadList = useMemo(() => {
    const nonDeletedTasks = (tasks || []).filter((t) => !t.is_deleted);

    // Calculate active tasks per member
    const results = members.map((member) => {
      const memberTasks = nonDeletedTasks.filter((t) => {
        const ids = getTaskAssigneeIds(t);
        return ids.includes(member.id);
      });

      const activeTasks = memberTasks.filter((t) => t.status !== 'completed');
      const overdueTasks = activeTasks.filter((t) => isTaskOverdue(t.due_date, t.status));
      const activeCount = activeTasks.length;

      return {
        member,
        activeCount,
        overdueCount: overdueTasks.length,
        totalAssigned: memberTasks.length,
      };
    });

    // Find max active count for relative workload bar normalization
    const maxActive = Math.max(...results.map((r) => r.activeCount), 0);

    const scored = results.map((r) => {
      const workloadScore = maxActive > 0 ? Math.round((r.activeCount / maxActive) * 100) : 0;
      return {
        ...r,
        workloadScore,
      };
    });

    // Sort descending by active tasks
    return scored.sort((a, b) => b.activeCount - a.activeCount).slice(0, 5);
  }, [tasks, members]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Team Workload
          </h2>
        </div>

        {workloadList.length === 0 ? (
          <div className="py-8 text-center text-[#8B8B95] space-y-1">
            <Users className="w-6 h-6 text-[#71717A] mx-auto mb-1 opacity-60" />
            <p className="text-[13px] font-medium text-[#18181B]">No department members</p>
            <p className="text-[11.5px] text-[#71717A]">
              No members assigned to this department yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {workloadList.map(({ member, activeCount, overdueCount, workloadScore }) => (
              <div
                key={member.id}
                onClick={() => onMemberClick && onMemberClick(member)}
                className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 hover:bg-[#F7F8FA] px-1 rounded-[6px] transition-colors cursor-pointer group"
              >
                {/* Left: Avatar + Name + Subtitle (X tasks, Y overdue) */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <Avatar
                    src={member.avatar_url}
                    name={member.full_name || 'Member'}
                    size="sm"
                    className="flex-shrink-0 w-8 h-8"
                  />
                  <div className="min-w-0">
                    <span className="text-[13px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate block leading-tight">
                      {member.full_name}
                    </span>
                    <span className="text-[11.5px] text-[#71717A] block mt-0.5">
                      {activeCount} {activeCount === 1 ? 'task' : 'tasks'}
                      {overdueCount > 0 && (
                        <span className="text-[#DC2626] font-medium ml-1">
                          , {overdueCount} overdue
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Right: Workload Bar + Percentage Score */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <div className="w-24 sm:w-32 bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#059669] h-full rounded-full transition-all duration-300"
                      style={{ width: `${workloadScore}%` }}
                      role="progressbar"
                      aria-valuenow={workloadScore}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${member.full_name} relative workload ${workloadScore}%`}
                    />
                  </div>
                  <span className="text-[12px] font-mono font-medium text-[#52525B] w-8 text-right">
                    {workloadScore}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Link: View team */}
      <div className="border-t border-[#F4F4F5] pt-3 mt-3">
        <button
          type="button"
          onClick={onViewTeam}
          className="text-[12.5px] font-medium text-[#059669] hover:text-[#047857] inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View team</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
