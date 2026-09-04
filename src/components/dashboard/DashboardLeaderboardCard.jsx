import React, { useMemo } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { Avatar } from '../common/Avatar';

export function DashboardLeaderboardCard({
  tasks = [],
  users = [],
  departments = [],
}) {
  const deptMap = useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d && d.id) map[d.id] = d;
    });
    return map;
  }, [departments]);

  // Compute top 3 performers
  const topPerformers = useMemo(() => {
    const activeMembers = (users || []).filter(
      (u) => u && !u.is_system_account && u.role !== 'it_support_admin'
    );

    const stats = activeMembers.map((member) => {
      const userTasks = (tasks || []).filter((t) =>
        Array.isArray(t.assigned_to)
          ? t.assigned_to.includes(member.id)
          : t.assigned_to === member.id ||
            (Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.includes(member.id))
      );

      const totalAssigned = userTasks.length;
      const completedTasks = userTasks.filter((t) => t.status === 'completed').length;
      const completionRate =
        totalAssigned > 0 ? Math.round((completedTasks / totalAssigned) * 100) : 0;

      // Ranking Score: Higher assigned volume + high completion volume
      const score = completedTasks * 100 + totalAssigned * 5 + completionRate * 0.1;

      return {
        member,
        totalAssigned,
        completedTasks,
        completionRate,
        score,
      };
    });

    return stats
      .sort(
        (a, b) =>
          b.score - a.score ||
          b.completedTasks - a.completedTasks ||
          b.totalAssigned - a.totalAssigned
      )
      .slice(0, 3);
  }, [tasks, users]);

  const medals = [
    {
      badge: '🥇 1st Place',
      rank: 1,
      bg: 'bg-amber-50/70 border-amber-200/80',
      badgeStyle: 'bg-amber-100 text-amber-900 border-amber-300',
    },
    {
      badge: '🥈 2nd Place',
      rank: 2,
      bg: 'bg-slate-50 border-slate-200/80',
      badgeStyle: 'bg-slate-200 text-slate-800 border-slate-300',
    },
    {
      badge: '🥉 3rd Place',
      rank: 3,
      bg: 'bg-orange-50/50 border-orange-200/60',
      badgeStyle: 'bg-orange-100 text-orange-900 border-orange-300',
    },
  ];

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between font-['Inter'] h-full min-h-[350px]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0">
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Top Performing Members
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Ranked by volume & on-time task delivery
              </p>
            </div>
          </div>

          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Top 3
          </span>
        </div>

        {/* Top 3 List */}
        <div className="mt-4 space-y-2.5">
          {topPerformers.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400 font-medium">
              No performance metrics recorded yet.
            </p>
          ) : (
            topPerformers.map((item, index) => {
              const medal = medals[index] || medals[2];
              const dept = deptMap[item.member.department_id];

              return (
                <div
                  key={item.member.id}
                  className={`p-3.5 rounded-2xl border ${medal.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-2xs`}
                >
                  {/* Member Profile */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <Avatar
                        src={item.member.avatar_url}
                        name={item.member.full_name}
                        size="sm"
                        showRoleBadge
                        role={item.member.role}
                      />
                      <span className="absolute -top-1.5 -left-1.5 text-xs">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {item.member.full_name}
                        </h4>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${medal.badgeStyle}`}
                        >
                          {medal.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-semibold truncate flex items-center gap-1 mt-0.5">
                        {dept && (
                          <>
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: dept.color || '#10B981' }}
                            />
                            <span className="text-slate-600">{dept.name}</span>
                            <span>•</span>
                          </>
                        )}
                        <span className="capitalize">
                          {(item.member.role || 'member').replace('_', ' ')}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Task Numbers & Progress Bar */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-slate-200/50 sm:border-0">
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">
                        {item.completedTasks} / {item.totalAssigned}{' '}
                        <span className="text-[10px] font-medium text-slate-500">Done</span>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-700">
                        {item.completionRate}% Success Rate
                      </div>
                    </div>

                    <div className="w-14 bg-slate-200/80 rounded-full h-2 overflow-hidden flex-shrink-0">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-3 text-[10px] text-slate-400 font-medium pt-2.5 border-t border-slate-100 flex items-center gap-1">
        <span>⚡</span>
        <span>Rankings update automatically based on task velocity and completion volume.</span>
      </div>
    </div>
  );
}
