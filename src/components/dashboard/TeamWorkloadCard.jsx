import React from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import { Users, CheckCircle, Clock } from 'lucide-react';

export function TeamWorkloadCard({ departmentId = null }) {
  const { tasks } = useAppData();
  const { users } = useAuth();

  // Exclude IT Support and hidden directory accounts
  let memberList = users.filter(
    (u) =>
      !u.exclude_from_directory &&
      !u.is_system_account &&
      u.role !== 'it_support_admin' &&
      u.role !== 'it_support'
  );

  if (departmentId) {
    memberList = memberList.filter((u) => u.department_id === departmentId);
  }

  const workloadData = memberList.map((member) => {
    const memberTasks = tasks.filter((t) =>
      Array.isArray(t.assigned_to) ? t.assigned_to.includes(member.id) : t.assigned_to === member.id
    );
    const completed = memberTasks.filter((t) => t.status === 'completed').length;
    const pending = memberTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
    return {
      member,
      total: memberTasks.length,
      completed,
      pending,
    };
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-4 sm:p-6 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm sm:text-[16px] font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{departmentId ? `My Department Team Members (${memberList.length})` : 'Team Workload & Assignment Distribution'}</span>
          </h3>
          <p className="text-[11px] sm:text-[12px] leading-[16px] font-semibold text-slate-500 mt-0.5">
            Active staff workload breakdown
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {workloadData.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No active team members found for this department.</p>
        ) : (
          workloadData.map(({ member, total, completed, pending }) => (
            <div
              key={member.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors shadow-2xs"
            >
              {/* Member info */}
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={member.avatar_url}
                  name={member.full_name}
                  size="sm"
                  showRoleBadge
                  role={member.role}
                  className="flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {member.full_name}
                    </h4>
                    {member.designation && (
                      <span className="text-[10px] text-emerald-700 font-semibold truncate hidden sm:inline">
                        • {member.designation}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium capitalize truncate">
                    {(member.role || 'team_member').replace('_', ' ')}
                    {member.designation && (
                      <span className="sm:hidden text-emerald-700 font-semibold">
                        {' '}• {member.designation}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Workload Metric Badges */}
              <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 text-xs pt-2.5 sm:pt-0 border-t border-slate-200/60 sm:border-0">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-800 text-[11px] font-bold whitespace-nowrap"
                  title="Active Pending Tasks"
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{pending} Pending</span>
                </div>

                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-[11px] font-bold whitespace-nowrap"
                  title="Completed Tasks"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{completed} Done</span>
                </div>

                <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-slate-800 font-extrabold text-[11px] shadow-2xs whitespace-nowrap">
                  {total} Total
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
