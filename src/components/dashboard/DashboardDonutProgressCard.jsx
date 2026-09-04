import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart, Search, X, Check, Building2, User } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { isTaskOverdue } from '../../utils/dateUtils';
import { isTaskInDepartment, getTaskDepartmentsInfo } from '../../utils/taskDepartmentUtils';

export function DashboardDonutProgressCard({
  tasks = [],
  departments = [],
  users = [],
  isAdmin = false,
  userDept = null,
}) {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null); // { type: 'user' | 'dept', id, name }
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Department map
  const deptMap = useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d && d.id) map[d.id] = d;
    });
    return map;
  }, [departments]);

  // User map
  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  // Filterable users list
  const activeUsers = useMemo(() => {
    return (users || []).filter(
      (u) =>
        u &&
        !u.is_system_account &&
        !u.exclude_from_directory &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    );
  }, [users]);

  const matchingMembers = useMemo(() => {
    if (!filterQuery.trim()) return activeUsers;
    const q = filterQuery.toLowerCase().trim();
    return activeUsers.filter((u) => {
      const matchName = u.full_name?.toLowerCase().includes(q);
      const dept = deptMap[u.department_id];
      const matchDept = dept?.name?.toLowerCase().includes(q);
      return matchName || matchDept;
    });
  }, [activeUsers, filterQuery, deptMap]);

  // Filterable departments list
  const matchingDepartments = useMemo(() => {
    if (!filterQuery.trim()) return departments || [];
    const q = filterQuery.toLowerCase().trim();
    return (departments || []).filter((d) => d.name?.toLowerCase().includes(q));
  }, [departments, filterQuery]);

  // Filter tasks based on selected entity or query
  const filteredTasks = useMemo(() => {
    if (selectedEntity) {
      if (selectedEntity.type === 'dept') {
        return tasks.filter((t) => isTaskInDepartment(t, selectedEntity.id, users));
      }
      if (selectedEntity.type === 'user') {
        return tasks.filter(
          (t) =>
            t.assigned_to === selectedEntity.id ||
            (Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.includes(selectedEntity.id)) ||
            t.assisted_by === selectedEntity.id ||
            (Array.isArray(t.assisted_by_ids) && t.assisted_by_ids.includes(selectedEntity.id)) ||
            t.created_by === selectedEntity.id
        );
      }
    }

    if (!filterQuery.trim()) return tasks;
    const q = filterQuery.toLowerCase().trim();

    return tasks.filter((t) => {
      const taskDepts = getTaskDepartmentsInfo(t, users, departments);
      const matchDept = taskDepts.some((d) => d.name?.toLowerCase().includes(q));

      const assignee = userMap[t.assigned_to];
      const matchAssignee = assignee?.full_name?.toLowerCase().includes(q);

      const matchTitle = t.title?.toLowerCase().includes(q);
      return matchDept || matchAssignee || matchTitle;
    });
  }, [tasks, selectedEntity, filterQuery, deptMap, userMap, users, departments]);

  // Calculate Breakdown
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === 'completed').length;
  const inProgress = filteredTasks.filter(
    (t) => t.status === 'in_progress' && !isTaskOverdue(t.due_date, t.status)
  ).length;
  const pending = filteredTasks.filter(
    (t) => (t.status === 'pending' || !t.status) && !isTaskOverdue(t.due_date, t.status)
  ).length;
  const overdue = filteredTasks.filter((t) => isTaskOverdue(t.due_date, t.status)).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Active display name
  const activeLabel = useMemo(() => {
    if (selectedEntity) {
      return selectedEntity.name;
    }
    if (!isAdmin && userDept) {
      return userDept.name;
    }
    return 'All Departments';
  }, [selectedEntity, isAdmin, userDept]);

  const activeDeptColor = useMemo(() => {
    if (selectedEntity?.type === 'dept') {
      return deptMap[selectedEntity.id]?.color || '#10B981';
    }
    if (userDept) {
      return userDept.color || '#10B981';
    }
    return '#10B981';
  }, [selectedEntity, userDept, deptMap]);

  // SVG Donut Chart Geometry
  const size = 145;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Segment slices
  const segments = useMemo(() => {
    if (total === 0) {
      return [
        {
          color: '#E2E8F0',
          strokeDasharray: `${circumference} 0`,
          strokeDashoffset: 0,
        },
      ];
    }

    const items = [
      { key: 'completed', count: completed, color: '#10B981' }, // Emerald
      { key: 'in_progress', count: inProgress, color: '#3B82F6' }, // Blue
      { key: 'pending', count: pending, color: '#F59E0B' }, // Amber
      { key: 'overdue', count: overdue, color: '#EF4444' }, // Rose
    ];

    let accumulatedAngle = 0;
    return items.map((item) => {
      const percentage = item.count / total;
      const strokeLength = percentage * circumference;
      const offset = -accumulatedAngle;
      accumulatedAngle += strokeLength;

      return {
        ...item,
        strokeDasharray: `${strokeLength} ${circumference - strokeLength}`,
        strokeDashoffset: offset,
      };
    });
  }, [total, completed, inProgress, pending, overdue, circumference]);

  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
    setFilterQuery(entity ? entity.name : '');
    setIsOpen(false);
  };

  const handleClearSelection = (e) => {
    e.stopPropagation();
    setSelectedEntity(null);
    setFilterQuery('');
  };

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between font-['Inter'] h-full min-h-[380px]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
              <PieChart className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Progress & Distribution
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Live delivery breakdown
              </p>
            </div>
          </div>

          <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {completionRate}% Done
          </span>
        </div>

        {/* Admin Search Bar & Dropdown */}
        {isAdmin ? (
          <div className="mt-3.5 space-y-2">
            <div className="relative" ref={containerRef}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={filterQuery}
                  onFocus={() => setIsOpen(true)}
                  onChange={(e) => {
                    setFilterQuery(e.target.value);
                    setSelectedEntity(null);
                    setIsOpen(true);
                  }}
                  placeholder="Search department or member..."
                  className="w-full pl-8 pr-7 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
                />
                {(filterQuery || selectedEntity) && (
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown list of Members & Departments */}
              {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden max-h-56 overflow-y-auto p-1.5 space-y-1 animate-fade-in">
                  {/* Reset / All */}
                  <button
                    type="button"
                    onClick={() => handleSelectEntity(null)}
                    className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-bold hover:bg-slate-100 flex items-center justify-between text-slate-800 cursor-pointer"
                  >
                    <span>All Tasks & Departments</span>
                    {!selectedEntity && !filterQuery && (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>

                  {/* Departments Section */}
                  {matchingDepartments.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5">
                        Departments
                      </p>
                      {matchingDepartments.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() =>
                            handleSelectEntity({ type: 'dept', id: d.id, name: d.name })
                          }
                          className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold hover:bg-slate-100 flex items-center gap-2 text-slate-800 cursor-pointer"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: d.color || '#10B981' }}
                          />
                          <span className="truncate flex-1">{d.name}</span>
                          {selectedEntity?.id === d.id && (
                            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Members Section */}
                  {matchingMembers.length > 0 && (
                    <div className="pt-1 border-t border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-0.5">
                        Team Members
                      </p>
                      {matchingMembers.map((u) => {
                        const dept = deptMap[u.department_id];
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() =>
                              handleSelectEntity({ type: 'user', id: u.id, name: u.full_name })
                            }
                            className="w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold hover:bg-slate-100 flex items-center gap-2 text-slate-800 cursor-pointer"
                          >
                            <Avatar src={u.avatar_url} name={u.full_name} size="xs" />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="font-bold text-slate-900 block truncate">
                                {u.full_name}
                              </span>
                              {dept && (
                                <span className="text-[10px] text-slate-400 block truncate">
                                  {dept.name}
                                </span>
                              )}
                            </div>
                            {selectedEntity?.id === u.id && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Prominent Active Filter / Department Name Badge */}
            <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs font-bold text-emerald-950">
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                {selectedEntity?.type === 'dept' ? (
                  <Building2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                ) : selectedEntity?.type === 'user' ? (
                  <User className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                )}
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-700">
                  {selectedEntity?.type === 'dept'
                    ? 'Department:'
                    : selectedEntity?.type === 'user'
                    ? 'Member:'
                    : 'Viewing:'}
                </span>
                <span className="truncate">{activeLabel}</span>
              </div>

              {selectedEntity && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-[10px] text-emerald-700 hover:text-emerald-950 font-extrabold underline flex-shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-3.5 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: activeDeptColor }}
            />
            <span className="truncate">{activeLabel}</span>
          </div>
        )}

        {/* 3D-styled SVG Donut Chart Area */}
        <div className="mt-2.5 flex items-center justify-center relative py-1">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <svg width={size} height={size} className="transform -rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
              />
              {segments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
              ))}
            </svg>

            {/* Inner Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-2">
              <span className="text-2xl font-black text-slate-900 leading-none">
                {total}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mt-0.5">
                Tasks Total
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Legend Row beneath */}
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs font-semibold">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-slate-600 truncate text-[11px]">Completed:</span>
          <span className="font-black text-slate-900 ml-auto text-[11px]">{completed}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
          <span className="text-slate-600 truncate text-[11px]">In Progress:</span>
          <span className="font-black text-slate-900 ml-auto text-[11px]">{inProgress}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span className="text-slate-600 truncate text-[11px]">Pending:</span>
          <span className="font-black text-slate-900 ml-auto text-[11px]">{pending}</span>
        </div>

        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0" />
          <span className="text-slate-600 truncate text-[11px]">Overdue:</span>
          <span className="font-black text-slate-900 ml-auto text-[11px]">{overdue}</span>
        </div>
      </div>
    </div>
  );
}
