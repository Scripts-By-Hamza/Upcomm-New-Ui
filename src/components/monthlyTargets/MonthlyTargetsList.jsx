import React, { useState } from 'react';
import { Avatar } from '../common/Avatar';
import {
  formatDueDateDisplay,
  isTargetOverdue,
} from '../../utils/monthlyTargets/monthlyTargetUtils';
import {
  Target,
  BarChart2,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  CircleDot,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';

import { useAppData } from '../../contexts/AppDataContext';

export function MonthlyTargetsList({
  targets = [],
  comments = [],
  users = [],
  departments = [],
  currentUser = null,
  groupBy = 'none',
  onSelectTarget = () => {},
  onEditTarget = () => {},
  onDeleteTarget = () => {},
  onUpdateStatus = () => {},
}) {
  const { readChatIds = [] } = useAppData();
  const [collapsedGroups, setCollapsedGroups] = useState({});

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

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Build groups based on groupBy setting
  const groupedData = React.useMemo(() => {
    if (groupBy === 'none') {
      return [{ key: 'all', title: 'All Targets', items: targets }];
    }

    if (groupBy === 'status') {
      const statuses = [
        { key: 'not_started', title: 'Not Started' },
        { key: 'in_progress', title: 'In Progress' },
        { key: 'completed', title: 'Completed' },
      ];
      return statuses.map((s) => ({
        key: s.key,
        title: s.title,
        items: targets.filter((t) => (t.status || 'not_started') === s.key),
      }));
    }

    if (groupBy === 'owner') {
      const ownerGroups = {};
      targets.forEach((t) => {
        const ownerId = t.owner_user_id || 'unassigned';
        if (!ownerGroups[ownerId]) {
          const ownerUser = userMap[ownerId];
          ownerGroups[ownerId] = {
            key: ownerId,
            title: ownerUser?.full_name || 'Unassigned',
            items: [],
          };
        }
        ownerGroups[ownerId].items.push(t);
      });
      return Object.values(ownerGroups);
    }

    if (groupBy === 'department') {
      const deptGroups = {};
      targets.forEach((t) => {
        const deptId = t.department_id || 'no_dept';
        if (!deptGroups[deptId]) {
          const dept = deptMap[deptId];
          deptGroups[deptId] = {
            key: deptId,
            title: dept?.name || 'General / No Department',
            items: [],
          };
        }
        deptGroups[deptId].items.push(t);
      });
      return Object.values(deptGroups);
    }

    return [{ key: 'all', title: 'All Targets', items: targets }];
  }, [targets, groupBy, userMap, deptMap]);

  const renderStatusBadge = (status) => {
    if (status === 'completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-emerald-50 text-[#059669] border border-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
          <CircleDot className="w-3 h-3" />
          In Progress
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
        <Clock className="w-3 h-3" />
        Not Started
      </span>
    );
  };

  if (targets.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center text-[#8B8B95] space-y-2 select-none">
        <Target className="w-8 h-8 text-[#71717A] mx-auto opacity-50 mb-1" />
        <h3 className="text-[15px] font-semibold text-[#18181B]">No Monthly Targets Found</h3>
        <p className="text-[12.5px] text-[#71717A] max-w-sm mx-auto">
          No monthly targets match the selected filters or month. Click &quot;Add Monthly Target&quot; to create a new goal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 select-none">
      {groupedData.map((group) => {
        if (group.items.length === 0) return null;
        const isCollapsed = collapsedGroups[group.key];

        return (
          <div
            key={group.key}
            className="bg-white border border-[#E5E7EB] rounded-[10px] overflow-hidden shadow-none"
          >
            {/* Group Header (if grouped) */}
            {groupBy !== 'none' && (
              <div
                onClick={() => toggleGroup(group.key)}
                className="bg-[#FAFAFA] border-b border-[#E5E7EB] px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#F4F4F5] transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-[#71717A]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#71717A]" />
                  )}
                  <span className="text-[13px] font-bold text-[#18181B]">{group.title}</span>
                  <span className="text-[11.5px] font-medium text-[#71717A] bg-[#E5E7EB] px-1.5 py-0.2 rounded-full">
                    {group.items.length}
                  </span>
                </div>
              </div>
            )}

            {/* Target Rows Table */}
            {!isCollapsed && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[11.5px] font-semibold text-[#71717A] uppercase tracking-wider">
                      <th className="py-2.5 px-4 min-w-[240px]">Target</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Status</th>
                      <th className="py-2.5 px-3 min-w-[140px]">Owner</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Progress / KPI</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Department</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Due Date</th>
                      <th className="py-2.5 px-3 text-center w-[60px]">
                        <MessageSquare className="w-3.5 h-3.5 mx-auto" />
                      </th>
                      <th className="py-2.5 px-3 text-right w-[60px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F4F4F5] text-[13px]">
                    {group.items.map((target) => {
                      const owner = userMap[target.owner_user_id];
                      const dept = deptMap[target.department_id];
                      const commentsCount = commentsCountMap[target.id] || 0;
                      const unreadCount = unreadCommentsCountMap[target.id] || 0;
                      const overdue = isTargetOverdue(target);
                      const isKpi = target.type === 'kpi';

                      return (
                        <tr
                          key={target.id}
                          className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                          onClick={() => onSelectTarget(target)}
                        >
                          {/* 1. Target Title & Type Badge */}
                          <td className="py-3 px-4">
                            <div className="flex items-start gap-2.5">
                              <div className="pt-0.5 flex-shrink-0">
                                {isKpi ? (
                                  <div className="w-5 h-5 rounded-[4px] bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                                    <BarChart2 className="w-3 h-3" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-[4px] bg-emerald-50 text-[#059669] flex items-center justify-center border border-emerald-100">
                                    <Target className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate max-w-md">
                                  {target.title}
                                </div>
                                {target.description && (
                                  <p className="text-[11.5px] text-[#71717A] truncate max-w-sm mt-0.5">
                                    {target.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Status */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={target.status || 'not_started'}
                              onChange={(e) => onUpdateStatus(target.id, e.target.value)}
                              className="bg-transparent text-[11.5px] font-semibold cursor-pointer border-0 rounded p-1 hover:bg-[#F4F4F5] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>

                          {/* 3. Owner */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar
                                src={owner?.avatar_url}
                                name={owner?.full_name || 'Owner'}
                                size="xs"
                                className="flex-shrink-0"
                              />
                              <span className="text-[12.5px] font-medium text-[#18181B] truncate">
                                {owner?.full_name || 'Unassigned'}
                              </span>
                            </div>
                          </td>

                          {/* 4. Progress / KPI */}
                          <td className="py-3 px-3">
                            {isKpi ? (
                              <div>
                                <div className="text-[12px] font-semibold text-[#18181B]">
                                  {target.kpi_current_value ?? 0} / {target.kpi_target_value ?? 0}{' '}
                                  <span className="text-[11px] font-normal text-[#71717A]">
                                    {target.kpi_unit || ''}
                                  </span>
                                </div>
                                <div className="w-20 bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden mt-1">
                                  <div
                                    className="h-full bg-purple-600 rounded-full transition-all duration-300"
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
                              <div>
                                <div className="text-[12px] font-semibold text-[#18181B]">
                                  {target.progress || 0}%
                                </div>
                                <div className="w-20 bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden mt-1">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      target.status === 'completed'
                                        ? 'bg-[#059669]'
                                        : 'bg-[#2563EB]'
                                    }`}
                                    style={{ width: `${target.progress || 0}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>

                          {/* 5. Department */}
                          <td className="py-3 px-3">
                            <span
                              className="inline-block text-[11.5px] font-medium px-2 py-0.5 rounded-[4px] truncate max-w-[120px]"
                              style={{
                                backgroundColor: dept?.color ? `${dept.color}15` : '#F4F4F5',
                                color: dept?.color || '#52525B',
                              }}
                            >
                              {dept?.name || 'General'}
                            </span>
                          </td>

                          {/* 7. Due Date */}
                          <td className="py-3 px-3">
                            <div
                              className={`text-[12px] font-mono ${
                                overdue
                                  ? 'text-[#DC2626] font-semibold'
                                  : 'text-[#71717A]'
                              }`}
                            >
                              {formatDueDateDisplay(target.due_date)}
                            </div>
                          </td>

                          {/* 8. Comments Count */}
                          <td className="py-3 px-3 text-center">
                            {commentsCount > 0 ? (
                              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-[#71717A] justify-center">
                                <MessageSquare
                                  className={`w-3.5 h-3.5 ${
                                    unreadCount > 0 ? 'text-[#2563EB]' : 'text-[#71717A]'
                                  }`}
                                />
                                <span>{commentsCount}</span>
                                {unreadCount > 0 && (
                                  <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full text-[9.5px] font-bold text-white bg-[#2563EB] shadow-xs">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-[#D4D4D8]">—</span>
                            )}
                          </td>

                          {/* 9. Row Action buttons */}
                          <td
                            className="py-3 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => onEditTarget(target)}
                                className="p-1 rounded text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
                                title="Edit Target"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTarget(target.id)}
                                className="p-1 rounded text-[#71717A] hover:text-[#DC2626] hover:bg-red-50 transition-colors"
                                title="Delete Target"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
