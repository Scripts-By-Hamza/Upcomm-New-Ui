import React from 'react';
import { Avatar } from '../common/Avatar';
import {
  formatDueDateDisplay,
  isTargetOverdue,
} from '../../utils/monthlyTargets/monthlyTargetUtils';
import {
  Target,
  BarChart2,
  MessageSquare,
  Clock,
  CircleDot,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';

export function MonthlyTargetsBoard({
  targets = [],
  comments = [],
  users = [],
  departments = [],
  onSelectTarget = () => {},
  onUpdateStatus = () => {},
}) {
  const { currentUser } = useAuth();
  const { readChatIds = [] } = useAppData();

  const userMap = React.useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  const deptMap = React.useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d && d.id) map[d.id] = d;
    });
    return map;
  }, [departments]);

  const commentsCountMap = React.useMemo(() => {
    const map = {};
    (comments || []).forEach((c) => {
      if (c && c.target_id) {
        map[c.target_id] = (map[c.target_id] || 0) + 1;
      }
    });
    return map;
  }, [comments]);

  const unreadCommentsCountMap = React.useMemo(() => {
    const map = {};
    if (!currentUser?.id) return map;
    (comments || []).forEach((c) => {
      if (
        c &&
        c.target_id &&
        c.user_id !== currentUser.id &&
        !readChatIds.some((id) => String(id) === String(c.id))
      ) {
        map[c.target_id] = (map[c.target_id] || 0) + 1;
      }
    });
    return map;
  }, [comments, currentUser?.id, readChatIds]);

  const columns = [
    {
      id: 'not_started',
      title: 'Not Started',
      icon: Clock,
      color: 'text-[#71717A]',
      badgeBg: 'bg-[#F4F4F5] text-[#71717A]',
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      icon: CircleDot,
      color: 'text-[#2563EB]',
      badgeBg: 'bg-blue-50 text-[#2563EB]',
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: CheckCircle2,
      color: 'text-[#059669]',
      badgeBg: 'bg-emerald-50 text-[#059669]',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 select-none items-start">
      {columns.map((col) => {
        const Icon = col.icon;
        const colTargets = targets.filter(
          (t) => (t.status || 'not_started') === col.id
        );

        return (
          <div
            key={col.id}
            className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-[10px] p-3 flex flex-col min-h-[450px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E7EB]">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${col.color}`} />
                <span className="text-[13.5px] font-bold text-[#18181B]">
                  {col.title}
                </span>
              </div>
              <span className={`text-[11.5px] font-bold px-2 py-0.5 rounded-full ${col.badgeBg}`}>
                {colTargets.length}
              </span>
            </div>

            {/* Cards Column */}
            <div className="space-y-2.5 flex-1">
              {colTargets.length === 0 ? (
                <div className="py-12 text-center text-[#8B8B95] text-[12px] border border-dashed border-[#E5E7EB] rounded-[8px]">
                  No targets in this column
                </div>
              ) : (
                colTargets.map((target) => {
                  const owner = userMap[target.owner_user_id];
                  const dept = deptMap[target.department_id];
                  const commentsCount = commentsCountMap[target.id] || 0;
                  const unreadCount = unreadCommentsCountMap[target.id] || 0;
                  const overdue = isTargetOverdue(target);
                  const isKpi = target.type === 'kpi';

                  return (
                    <div
                      key={target.id}
                      onClick={() => onSelectTarget(target)}
                      className="bg-white border border-[#E5E7EB] hover:border-[#059669] rounded-[8px] p-3.5 transition-all shadow-none hover:shadow-xs cursor-pointer group space-y-2.5"
                    >
                      {/* Top: Type Badge & Department */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {isKpi ? (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                              <BarChart2 className="w-2.5 h-2.5" />
                              KPI
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-[#059669] border border-emerald-100 uppercase">
                              <Target className="w-2.5 h-2.5" />
                              Target
                            </span>
                          )}

                          {dept && (
                            <span
                              className="text-[10.5px] font-medium px-1.5 py-0.5 rounded truncate max-w-[110px]"
                              style={{
                                backgroundColor: dept?.color ? `${dept.color}15` : '#F4F4F5',
                                color: dept?.color || '#52525B',
                              }}
                            >
                              {dept.name}
                            </span>
                          )}
                        </div>

                        {/* Due Date Indicator */}
                        <div
                          className={`flex items-center gap-1 text-[11px] font-mono ${
                            overdue
                              ? 'text-[#DC2626] font-bold'
                              : 'text-[#8B8B95]'
                          }`}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>{formatDueDateDisplay(target.due_date)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h4 className="text-[13px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors line-clamp-2 leading-snug">
                        {target.title}
                      </h4>

                      {/* Progress / KPI values */}
                      {isKpi ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11.5px] text-[#52525B]">
                            <span>Progress</span>
                            <span className="font-semibold text-[#18181B]">
                              {target.kpi_current_value ?? 0} / {target.kpi_target_value ?? 0}{' '}
                              {target.kpi_unit || ''}
                            </span>
                          </div>
                          <div className="w-full bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-600 rounded-full transition-all"
                              style={{
                                width: `${
                                  target.kpi_target_value > 0
                                    ? Math.min(
                                        Math.round(
                                          ((target.kpi_current_value || 0) /
                                            target.kpi_target_value) *
                                            100
                                        ),
                                        100
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11.5px] text-[#52525B]">
                            <span>Progress</span>
                            <span className="font-semibold text-[#18181B]">
                              {target.progress || 0}%
                            </span>
                          </div>
                          <div className="w-full bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                target.status === 'completed'
                                  ? 'bg-[#059669]'
                                  : 'bg-[#2563EB]'
                              }`}
                              style={{ width: `${target.progress || 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Bottom Footer: Owner Avatar & Comments */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#F4F4F5]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Avatar
                            src={owner?.avatar_url}
                            name={owner?.full_name || 'Owner'}
                            size="xs"
                            className="flex-shrink-0"
                          />
                          <span className="text-[11.5px] font-medium text-[#52525B] truncate max-w-[120px]">
                            {owner?.full_name || 'Unassigned'}
                          </span>
                        </div>

                        {commentsCount > 0 && (
                          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#71717A]">
                            <MessageSquare
                              className={`w-3 h-3 ${
                                unreadCount > 0 ? 'text-[#2563EB]' : 'text-[#71717A]'
                              }`}
                            />
                            <span>{commentsCount}</span>
                            {unreadCount > 0 && (
                              <span className="inline-flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded-full text-[9px] font-bold text-white bg-[#2563EB] shadow-xs">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
