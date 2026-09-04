import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  FileText,
  Zap,
  Calendar,
  ChevronDown,
  Check,
  Search,
  RotateCcw,
} from 'lucide-react';
import { Avatar } from '../../../common/Avatar';

export function DepartmentActivityToolbar({
  filters,
  onFilterChange,
  onResetFilters,
  hasActiveFilters,
  actors = [],
  tasks = [],
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'employee' | 'task' | 'action' | 'date'
  const [taskSearch, setTaskSearch] = useState('');
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
  const filteredTasks = tasks.filter((t) => {
    if (!taskSearch.trim()) return true;
    const q = taskSearch.toLowerCase().trim();
    return (
      t.task_number?.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q)
    );
  });

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

  return (
    <div
      ref={toolbarRef}
      className="flex items-center gap-2.5 flex-wrap select-none"
    >
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
            {/* Search within Tasks */}
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
  );
}
