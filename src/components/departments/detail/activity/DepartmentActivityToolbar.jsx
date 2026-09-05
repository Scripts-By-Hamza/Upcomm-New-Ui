import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  User,
  FileText,
  Zap,
  Calendar,
  ChevronDown,
  Check,
  Search,
  RotateCcw,
  Filter,
  X,
} from 'lucide-react';
import { Avatar } from '../../../common/Avatar';

export function DepartmentActivityToolbar({
  filters = {},
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  actors = [],
  tasks = [],
  isAdmin = false,
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'employee' | 'task' | 'action' | 'date'
  const [taskSearch, setTaskSearch] = useState('');
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [mobileActorSearch, setMobileActorSearch] = useState('');
  const [mobileTaskSearch, setMobileTaskSearch] = useState('');

  const toolbarRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  // Action Type Options
  const actionTypeOptions = [
    { id: 'all', label: 'All Actions' },
    { id: 'task_created', label: 'Task Created' },
    { id: 'status_changed', label: 'Status Changed' },
    { id: 'comment_added', label: 'Comment / Chat Added' },
    { id: 'attachment_added', label: 'Attachment Uploaded' },
    { id: 'task_assigned', label: 'Task Assigned' },
    { id: 'completion_requested', label: 'Completion Requested' },
    { id: 'priority_changed', label: 'Priority Changed' },
    { id: 'due_date_changed', label: 'Due Date Changed' },
    { id: 'task_updated', label: 'Task Updated' },
  ];

  // Date Range Options
  const dateRangeOptions = [
    { id: 'all', label: 'All Dates' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'Last 30 Days' },
  ];

  // Filtered Task Options for the Task Dropdown
  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return tasks;
    const q = taskSearch.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        t.task_number?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q)
    );
  }, [tasks, taskSearch]);

  const mobileFilteredActors = useMemo(() => {
    if (!mobileActorSearch.trim()) return actors;
    const q = mobileActorSearch.toLowerCase().trim();
    return actors.filter((a) => (a.full_name || '').toLowerCase().includes(q));
  }, [actors, mobileActorSearch]);

  const mobileFilteredTasks = useMemo(() => {
    if (!mobileTaskSearch.trim()) return tasks;
    const q = mobileTaskSearch.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        t.task_number?.toLowerCase().includes(q) ||
        t.title?.toLowerCase().includes(q)
    );
  }, [tasks, mobileTaskSearch]);

  // Active labels
  const selectedEmployee = actors.find((a) => String(a.id) === String(filters.employeeId));
  const selectedEmployeeLabel = selectedEmployee ? selectedEmployee.full_name : 'Employee';

  const selectedTask = tasks.find((t) => String(t.id) === String(filters.taskId));
  const selectedTaskLabel = selectedTask
    ? `${selectedTask.task_number || 'Task'} — ${selectedTask.title}`
    : 'Task';

  const selectedActionLabel =
    actionTypeOptions.find((o) => o.id === filters.actionType)?.label || 'All Actions';

  const selectedDateLabel =
    dateRangeOptions.find((o) => o.id === filters.dateRange)?.label || 'All Dates';

  const activeFilterCount =
    (filters.employeeId && filters.employeeId !== 'all' ? 1 : 0) +
    (filters.taskId && filters.taskId !== 'all' ? 1 : 0) +
    (filters.actionType && filters.actionType !== 'all' ? 1 : 0) +
    (filters.dateRange && filters.dateRange !== 'all' ? 1 : 0);

  if (!isAdmin) {
    return null;
  }

  return (
    <div ref={toolbarRef} className="space-y-2.5 font-['Inter'] select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Mobile Toolbar (< sm): Filters button */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full">
        <button
          type="button"
          onClick={() => {
            setMobileActorSearch('');
            setMobileTaskSearch('');
            setShowMobileFilterModal(true);
          }}
          className={`h-9 px-3.5 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs w-full outline-none focus:outline-none ${
            activeFilterCount > 0
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
              : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5]'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Desktop Toolbar (hidden sm:flex) */}
      <div className="hidden sm:flex items-center gap-2.5 flex-wrap">
        {/* 1. Employee Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('employee')}
            className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
              filters.employeeId !== 'all'
                ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
            <span className="truncate max-w-[140px]">{selectedEmployeeLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
          </button>

          {openDropdown === 'employee' && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left max-h-72 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onFilterChange('employeeId', 'all');
                  setOpenDropdown(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer border-b border-[#F4F4F5] ${
                  filters.employeeId === 'all'
                    ? 'bg-emerald-50 text-[#059669] font-semibold'
                    : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                }`}
              >
                <span>All Employees</span>
                {filters.employeeId === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
              </button>

              {actors.length === 0 ? (
                <div className="px-3 py-3 text-center text-[12px] text-[#8B8B95]">
                  No department actors found
                </div>
              ) : (
                actors.map((actor) => (
                  <button
                    key={actor.id}
                    type="button"
                    onClick={() => {
                      onFilterChange('employeeId', actor.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                      String(filters.employeeId) === String(actor.id)
                        ? 'bg-emerald-50 text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        src={actor.avatar_url}
                        name={actor.full_name}
                        size="xs"
                        className="flex-shrink-0"
                      />
                      <span className="truncate">{actor.full_name}</span>
                    </div>
                    {String(filters.employeeId) === String(actor.id) && (
                      <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* 2. Task Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('task')}
            className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
              filters.taskId !== 'all'
                ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
            <span className="truncate max-w-[150px]">{selectedTaskLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
          </button>

          {openDropdown === 'task' && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg p-1.5 z-40 animate-fade-in text-left">
              <div className="relative mb-1.5">
                <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Search department tasks..."
                  className="w-full h-[32px] pl-8 pr-2.5 text-[12px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] focus:outline-none focus:ring-1 focus:ring-[#059669] text-[#18181B]"
                />
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-[#F4F4F5]">
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('taskId', 'all');
                    setOpenDropdown(null);
                    setTaskSearch('');
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] rounded-[6px] transition-colors cursor-pointer ${
                    filters.taskId === 'all'
                      ? 'bg-emerald-50 text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                >
                  <span>All Tasks</span>
                  {filters.taskId === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>

                {filteredTasks.length === 0 ? (
                  <div className="px-2.5 py-3 text-center text-[11.5px] text-[#8B8B95]">
                    No matching tasks
                  </div>
                ) : (
                  filteredTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        onFilterChange('taskId', t.id);
                        setOpenDropdown(null);
                        setTaskSearch('');
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 text-[12px] rounded-[6px] transition-colors cursor-pointer ${
                        String(filters.taskId) === String(t.id)
                          ? 'bg-emerald-50 text-[#059669] font-semibold'
                          : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                      }`}
                    >
                      <div className="min-w-0 text-left">
                        <span className="font-mono text-[11px] text-[#71717A] mr-1.5">
                          {t.task_number || 'TM-0000'}
                        </span>
                        <span className="truncate">{t.title}</span>
                      </div>
                      {String(filters.taskId) === String(t.id) && (
                        <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Action Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('action')}
            className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
              filters.actionType !== 'all'
                ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
            <span className="truncate max-w-[140px]">{selectedActionLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
          </button>

          {openDropdown === 'action' && (
            <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left max-h-72 overflow-y-auto">
              {actionTypeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onFilterChange('actionType', opt.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                    filters.actionType === opt.id
                      ? 'bg-emerald-50 text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {filters.actionType === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Date Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('date')}
            className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
              filters.dateRange !== 'all'
                ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
            <span className="truncate max-w-[120px]">{selectedDateLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
          </button>

          {openDropdown === 'date' && (
            <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onFilterChange('dateRange', opt.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                    filters.dateRange === opt.id
                      ? 'bg-emerald-50 text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {filters.dateRange === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear Filters Button (Visible when filters are active) */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="h-[38px] px-3 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#52525B] hover:text-[#18181B] rounded-[8px] text-[12.5px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* 3. MOBILE ALL-IN-ONE FILTERS MODAL DIALOG (Portaled) */}
      {showMobileFilterModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-['Inter']">
          <div
            onClick={() => setShowMobileFilterModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          <div className="relative w-full sm:max-w-lg bg-white dark:bg-[#18181B] rounded-t-[20px] sm:rounded-[16px] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden animate-slide-up">
            <div className="px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                <h3 className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Activity Filters
                </h3>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] text-[11px] font-semibold border border-[#A7F3D0] dark:border-[#059669]/40">
                    {activeFilterCount} active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetFilters();
                      setShowMobileFilterModal(false);
                    }}
                    className="text-[12px] font-medium text-[#059669] dark:text-[#34D399] hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMobileFilterModal(false)}
                  className="p-1 rounded-[6px] text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] cursor-pointer"
                  aria-label="Close filters dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
              {/* Date */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Time Range
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {dateRangeOptions.map((opt) => {
                    const isSelected = filters.dateRange === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onFilterChange('dateRange', opt.id)}
                        className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Action Type
                  </label>
                  {filters.actionType !== 'all' && (
                    <button
                      type="button"
                      onClick={() => onFilterChange('actionType', 'all')}
                      className="text-[11px] text-[#059669] dark:text-[#34D399] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                  {actionTypeOptions.map((act) => {
                    const isSelected = filters.actionType === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => onFilterChange('actionType', act.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors text-left select-none ${
                          isSelected
                            ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                            : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                        }`}
                      >
                        <span>{act.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actor */}
              {actors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Employee
                    </label>
                    {filters.employeeId !== 'all' && (
                      <button
                        type="button"
                        onClick={() => onFilterChange('employeeId', 'all')}
                        className="text-[11px] text-[#059669] dark:text-[#34D399] hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={mobileActorSearch}
                      onChange={(e) => setMobileActorSearch(e.target.value)}
                      placeholder="Search employees..."
                      className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                    />
                    {mobileActorSearch && (
                      <button
                        type="button"
                        onClick={() => setMobileActorSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => onFilterChange('employeeId', 'all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        filters.employeeId === 'all'
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Employees</span>
                      {filters.employeeId === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {mobileFilteredActors.map((actor) => {
                      const isSelected = String(filters.employeeId) === String(actor.id);
                      return (
                        <button
                          key={actor.id}
                          type="button"
                          onClick={() => onFilterChange('employeeId', actor.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                            isSelected
                              ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Avatar src={actor.avatar_url} name={actor.full_name} size="xs" className="flex-shrink-0" />
                            <span className="text-[12px] font-medium truncate">{actor.full_name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Task */}
              {tasks.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Task
                    </label>
                    {filters.taskId !== 'all' && (
                      <button
                        type="button"
                        onClick={() => onFilterChange('taskId', 'all')}
                        className="text-[11px] text-[#059669] dark:text-[#34D399] hover:underline"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={mobileTaskSearch}
                      onChange={(e) => setMobileTaskSearch(e.target.value)}
                      placeholder="Search tasks..."
                      className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                    />
                    {mobileTaskSearch && (
                      <button
                        type="button"
                        onClick={() => setMobileTaskSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => onFilterChange('taskId', 'all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        filters.taskId === 'all'
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Tasks</span>
                      {filters.taskId === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {mobileFilteredTasks.map((t) => {
                      const isSelected = String(filters.taskId) === String(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onFilterChange('taskId', t.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                            isSelected
                              ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="min-w-0 flex-1 text-left">
                            <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA] mr-1.5">
                              {t.task_number || 'TM-0000'}
                            </span>
                            <span className="text-[12px] font-medium truncate">{t.title}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0 ml-1.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3.5 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#F9FAFB] dark:bg-[#18181B] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className="w-full py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold rounded-[10px] transition-colors cursor-pointer shadow-sm text-center outline-none"
              >
                Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default DepartmentActivityToolbar;
