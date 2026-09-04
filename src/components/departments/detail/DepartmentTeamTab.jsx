import React, { useState, useMemo } from 'react';
import { Avatar } from '../../common/Avatar';
import { Mail, Search, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { getTaskAssigneeIds } from '../../../utils/taskDepartmentUtils';
import { isTaskOverdue } from '../../../utils/dateUtils';

export function DepartmentTeamTab({
  department,
  members = [],
  tasks = [],
  onMemberClick,
}) {
  const [search, setSearch] = useState('');

  const nonDeletedTasks = useMemo(() => {
    return (tasks || []).filter((t) => !t.is_deleted);
  }, [tasks]);

  const memberStats = useMemo(() => {
    return members.map((member) => {
      const assigned = nonDeletedTasks.filter((t) => {
        const ids = getTaskAssigneeIds(t);
        return ids.includes(member.id);
      });

      const active = assigned.filter((t) => t.status !== 'completed');
      const overdue = active.filter((t) => isTaskOverdue(t.due_date, t.status));
      const completed = assigned.filter((t) => t.status === 'completed');
      const total = assigned.length;
      const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

      return {
        member,
        totalTasks: total,
        activeTasks: active.length,
        overdueTasks: overdue.length,
        completedTasks: completed.length,
        completionRate,
      };
    });
  }, [members, nonDeletedTasks]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return memberStats;
    const q = search.toLowerCase().trim();
    return memberStats.filter(
      ({ member }) =>
        member.full_name?.toLowerCase().includes(q) ||
        member.email?.toLowerCase().includes(q) ||
        member.designation?.toLowerCase().includes(q)
    );
  }, [memberStats, search]);

  return (
    <div className="space-y-4 select-none">
      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department members..."
            className="w-full h-[38px] pl-9 pr-3 text-[13px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] text-[#18181B]"
          />
        </div>

        <div className="text-[12.5px] text-[#52525B] font-medium">
          Total: <span className="text-[#18181B] font-semibold">{members.length}</span>{' '}
          {members.length === 1 ? 'member' : 'members'}
        </div>
      </div>

      {/* Team Cards Grid */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center text-[#8B8B95] space-y-2">
          <Users className="w-8 h-8 text-[#71717A] mx-auto opacity-50 mb-1" />
          <p className="text-[14px] font-semibold text-[#18181B]">
            {search ? 'No matching department members' : 'No department members yet'}
          </p>
          <p className="text-[12.5px] text-[#52525B]">
            {search
              ? `No members found matching "${search}".`
              : 'Add members to this department in the Users & Roles directory.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map(({ member, activeTasks, overdueTasks, completionRate }) => {
            const isHod = member.role === 'hod' || department?.hod_id === member.id;

            return (
              <div
                key={member.id}
                onClick={() => onMemberClick && onMemberClick(member)}
                className="bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[10px] p-5 flex flex-col justify-between shadow-none transition-all cursor-pointer group"
              >
                <div>
                  {/* Top: Avatar + Name + Role Badge */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <Avatar
                      src={member.avatar_url}
                      name={member.full_name}
                      size="md"
                      showRoleBadge
                      role={member.role}
                      className="flex-shrink-0"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-[14px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
                          {member.full_name}
                        </h4>
                        {isHod && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 text-[#059669] border border-emerald-200">
                            HOD
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#52525B] truncate mt-0.5">
                        {member.designation || 'Team Member Specialist'}
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-1.5 text-[12px] text-[#71717A] py-1.5 border-t border-[#F4F4F5]">
                    <Mail className="w-3.5 h-3.5 text-[#8B8B95] flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                {/* Bottom: Task Metrics & Progress */}
                <div className="pt-3 border-t border-[#F4F4F5] mt-2">
                  <div className="flex items-center justify-between text-[11.5px] font-medium mb-1.5">
                    <span className="text-[#18181B]">
                      {activeTasks} {activeTasks === 1 ? 'active task' : 'active tasks'}
                    </span>
                    {overdueTasks > 0 ? (
                      <span className="text-[#DC2626] font-semibold">
                        {overdueTasks} overdue
                      </span>
                    ) : (
                      <span className="text-[#16A34A]">{completionRate}% completed</span>
                    )}
                  </div>

                  <div className="w-full bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        overdueTasks > 0 ? 'bg-[#DC2626]' : 'bg-[#059669]'
                      }`}
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
