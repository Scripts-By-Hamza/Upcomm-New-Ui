import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Building2,
  Flag,
  CalendarDays,
  Layers3,
  ArrowUpDown,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { TaskFilterPopover } from './TaskFilterPopover';
import { MemberSearchFilter } from './MemberSearchFilter';

export function TaskToolbar({
  search = '',
  onSearchChange,
  selectedStatus = 'all',
  onStatusChange,
  selectedAssignedBy = 'all',
  onAssignedByChange,
  selectedAssignedTo = 'all',
  onAssignedToChange,
  selectedDept = 'all',
  onDeptChange,
  selectedPriority = 'all',
  onPriorityChange,
  selectedDue = 'all',
  onDueChange,
  unreadFilter = false,
  onUnreadFilterChange,
  hideCompleted = false,
  onHideCompletedChange,
  unreadCount = 0,
  selectedGroup = 'none',
  onGroupChange,
  selectedSort = 'default',
  onSortChange,
  visibleColumns = {},
  onToggleColumn,
  activeView = 'list',
  isMyTasks = false,
  currentMonth = new Date(),
  onPrevMonth,
  onNextMonth,
  onToday,
  users = [],
  departments = [],
  isAdmin = false,
  isStatusLocked = false,
}) {
  // Dropdown states for each toolbar popover
  const [openDropdown, setOpenDropdown] = useState(null); // 'dept' | 'priority' | 'due' | 'group' | 'sort' | 'customize' | 'assignee' | 'status' | 'assignedBy'
  const toolbarRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: 'Urgent' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const dueOptions = [
    { value: 'all', label: 'All Dates' },
    { value: 'today', label: 'Due Today' },
    { value: 'tomorrow', label: 'Due Tomorrow' },
    { value: 'this_week', label: 'Due This Week' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'due_soon', label: 'Due Soon (48h)' },
    { value: 'no_due', label: 'No Due Date' },
  ];

  const groupOptions = [
    { value: 'none', label: 'None' },
    { value: 'status', label: 'Status' },
    { value: 'department', label: 'Department' },
    { value: 'priority', label: 'Priority' },
  ];

  const sortOptions = [
    { value: 'default', label: 'Default / Smart' },
    { value: 'due_earliest', label: 'Due Date — Earliest' },
    { value: 'due_latest', label: 'Due Date — Latest' },
    { value: 'priority_high', label: 'Priority — Highest' },
    { value: 'priority_low', label: 'Priority — Lowest' },
    { value: 'newest', label: 'Newest Assigned' },
    { value: 'name_asc', label: 'Task Name A–Z' },
  ];

  const columnLabels = {
    assignee: 'Assignee',
    assist: 'Assist',
    priority: 'Priority',
    department: 'Department',
    due_date: 'Due Date',
    activity: 'Activity',
  };

  const selectedDeptObj = departments.find((d) => d.id === selectedDept);
  const selectedAssigneeObj = users.find((u) => u.id === selectedAssignedTo);
  const selectedAssignedByObj = users.find((u) => u.id === selectedAssignedBy);

  // Common Filter Buttons Group (Filter, Assignee, Department, Priority, Due Date)
  const renderFilterButtons = (isCalendarMode = false) => {
    if (isMyTasks) {
      return (
        <>
          {/* Status Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('status')}
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedStatus !== 'all'
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                  : openDropdown === 'status'
                  ? 'bg-white border-[#059669] text-[#18181B]'
                  : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
              }`}
            >
              <span className="capitalize">
                {selectedStatus !== 'all'
                  ? selectedStatus.replace('_', ' ')
                  : 'Status'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {openDropdown === 'status' && (
              <div className="absolute left-0 top-full mt-1.5 w-40 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onStatusChange(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                      selectedStatus === opt.value
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedStatus === opt.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Priority Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('priority')}
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedPriority !== 'all'
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                  : openDropdown === 'priority'
                  ? 'bg-white border-[#059669] text-[#18181B]'
                  : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
              }`}
            >
              <Flag className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="capitalize">
                {selectedPriority !== 'all' ? selectedPriority : 'Priority'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {openDropdown === 'priority' && (
              <div className="absolute left-0 top-full mt-1.5 w-44 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onPriorityChange(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                      selectedPriority === opt.value
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedPriority === opt.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due Date Dropdown */}
          {!isCalendarMode && (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('due')}
                className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedDue !== 'all'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                    : openDropdown === 'due'
                    ? 'bg-white border-[#059669] text-[#18181B]'
                    : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#71717A]" />
                <span className="truncate max-w-[110px]">
                  {dueOptions.find((d) => d.value === selectedDue)?.label || 'Due Date'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
              </button>

              {openDropdown === 'due' && (
                <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
                  {dueOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onDueChange(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        selectedDue === opt.value
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                          : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedDue === opt.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assigned By Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('assignedBy')}
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedAssignedBy !== 'all'
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                  : openDropdown === 'assignedBy'
                  ? 'bg-white border-[#059669] text-[#18181B]'
                  : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
              }`}
            >
              <UserRound className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="truncate max-w-[110px]">
                {selectedAssignedByObj
                  ? selectedAssignedByObj.full_name?.split(' ')[0]
                  : 'Assigned By'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {openDropdown === 'assignedBy' && (
              <div className="absolute right-0 lg:left-0 top-full mt-1.5 w-64 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-2 z-50 animate-fade-in">
                <MemberSearchFilter
                  label="Assigned By"
                  value={selectedAssignedBy}
                  onChange={(val) => {
                    onAssignedByChange(val);
                    setOpenDropdown(null);
                  }}
                  users={users}
                  departments={departments}
                />
              </div>
            )}
          </div>
        </>
      );
    }

    return (
      <>
        {/* Filter Button (Popover) */}
        <TaskFilterPopover
          selectedStatus={selectedStatus}
          onStatusChange={onStatusChange}
          selectedAssignedBy={selectedAssignedBy}
          onAssignedByChange={onAssignedByChange}
          unreadFilter={unreadFilter}
          onUnreadFilterChange={onUnreadFilterChange}
          hideCompleted={hideCompleted}
          onHideCompletedChange={onHideCompletedChange}
          unreadCount={unreadCount}
          users={users}
          departments={departments}
          isAdmin={isAdmin}
          isStatusLocked={isStatusLocked}
        />

        {/* Assignee Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('assignee')}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedAssignedTo !== 'all'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                : openDropdown === 'assignee'
                ? 'bg-white border-[#059669] text-[#18181B]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
            }`}
          >
            <UserRound className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate max-w-[110px]">
              {selectedAssigneeObj
                ? selectedAssigneeObj.full_name?.split(' ')[0]
                : 'Assignee'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {openDropdown === 'assignee' && (
            <div className="absolute right-0 lg:left-0 top-full mt-1.5 w-64 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-2 z-50 animate-fade-in">
              <MemberSearchFilter
                label="Assignee"
                value={selectedAssignedTo}
                onChange={(val) => {
                  onAssignedToChange(val);
                  setOpenDropdown(null);
                }}
                users={users}
                departments={departments}
              />
            </div>
          )}
        </div>

        {/* Department Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('dept')}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedDept !== 'all'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                : openDropdown === 'dept'
                ? 'bg-white border-[#059669] text-[#18181B]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate max-w-[110px]">
              {selectedDeptObj ? selectedDeptObj.name : 'Department'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {openDropdown === 'dept' && (
            <div className="absolute right-0 lg:left-0 top-full mt-1.5 w-52 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in max-h-60 overflow-y-auto space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  onDeptChange('all');
                  setOpenDropdown(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                  selectedDept === 'all'
                    ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                    : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                }`}
              >
                <span>All Departments</span>
                {selectedDept === 'all' && <Check className="w-3.5 h-3.5" />}
              </button>
              {departments.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    onDeptChange(d.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                    selectedDept === d.id
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                  }`}
                >
                  <span className="truncate">{d.name}</span>
                  {selectedDept === d.id && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('priority')}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedPriority !== 'all'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                : openDropdown === 'priority'
                ? 'bg-white border-[#059669] text-[#18181B]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="capitalize">
              {selectedPriority !== 'all' ? selectedPriority : 'Priority'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {openDropdown === 'priority' && (
            <div className="absolute right-0 lg:left-0 top-full mt-1.5 w-44 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onPriorityChange(opt.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                    selectedPriority === opt.value
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedPriority === opt.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Due Date Dropdown (List/Board view only) */}
        {!isCalendarMode && (
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('due')}
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                selectedDue !== 'all'
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                  : openDropdown === 'due'
                  ? 'bg-white border-[#059669] text-[#18181B]'
                  : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="truncate max-w-[110px]">
                {dueOptions.find((d) => d.value === selectedDue)?.label || 'Due Date'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {openDropdown === 'due' && (
              <div className="absolute right-0 lg:left-0 top-full mt-1.5 w-48 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
                {dueOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onDueChange(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                      selectedDue === opt.value
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {selectedDue === opt.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <div
      ref={toolbarRef}
      className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 select-none"
    >
      {activeView === 'calendar' ? (
        /* CALENDAR VIEW TOOLBAR: Month Navigation Left + Filters Right */
        <>
          {/* Left: Today, Prev, Next, Month Heading, Month Mode */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <button
              type="button"
              onClick={onToday}
              className="h-9 px-3.5 rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F5F6F8] text-[12.5px] font-semibold text-[#18181B] transition-colors cursor-pointer shadow-2xs"
            >
              Today
            </button>

            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Previous month"
              className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F5F6F8] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Next month"
              className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F5F6F8] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <h2 className="text-[17px] sm:text-[19px] font-bold text-[#18181B] tracking-tight px-1">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>

            <div className="relative">
              <button
                type="button"
                className="h-9 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[12.5px] font-medium text-[#18181B] flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <span>Month</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
              </button>
            </div>
          </div>

          {/* Right: Filters on Calendar View */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {renderFilterButtons(true)}
          </div>
        </>
      ) : (
        /* LIST / BOARD VIEW TOOLBAR */
        <>
          {/* Left Filters Group */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {/* Search Tasks input */}
            <div className="relative min-w-[200px] sm:w-60">
              <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={isMyTasks ? 'Search my tasks' : 'Search tasks...'}
                className="w-full pl-8 pr-7 h-9 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] placeholder:text-[#8B8B95] transition-all outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {renderFilterButtons(false)}
          </div>

          {/* Right Group / Sort / Customize */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Group Dropdown (All Tasks only) */}
            {!isMyTasks && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('group')}
                  className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedGroup !== 'none'
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                      : openDropdown === 'group'
                      ? 'bg-white border-[#059669] text-[#18181B]'
                      : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
                  }`}
                >
                  <Layers3 className="w-3.5 h-3.5 text-[#71717A]" />
                  <span className="capitalize">
                    {selectedGroup !== 'none' ? `Group: ${selectedGroup}` : 'Group'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
                </button>

                {openDropdown === 'group' && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
                    {groupOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          onGroupChange(opt.value);
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                          selectedGroup === opt.value
                            ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                            : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {selectedGroup === opt.value && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('sort')}
                className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedSort !== 'default'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                    : openDropdown === 'sort'
                    ? 'bg-white border-[#059669] text-[#18181B]'
                    : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Sort</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
              </button>

              {openDropdown === 'sort' && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-0.5">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onSortChange(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        selectedSort === opt.value
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                          : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedSort === opt.value && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Customize Columns Dropdown (All Tasks List View only) */}
            {!isMyTasks && activeView === 'list' && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('customize')}
                  className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    openDropdown === 'customize'
                      ? 'bg-white border-[#059669] text-[#18181B]'
                      : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>Customize</span>
                </button>

                {openDropdown === 'customize' && (
                  <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-2 z-50 animate-fade-in space-y-1.5">
                    <div className="px-1 text-[11px] font-semibold text-[#8B8B95] uppercase tracking-wider">
                      Toggle Columns
                    </div>
                    <div className="space-y-1">
                      {Object.keys(columnLabels).map((colKey) => (
                        <label
                          key={colKey}
                          className="flex items-center justify-between px-2 py-1 hover:bg-[#F5F6F8] rounded-[6px] cursor-pointer text-[12px] text-[#18181B]"
                        >
                          <span>{columnLabels[colKey]}</span>
                          <input
                            type="checkbox"
                            checked={visibleColumns[colKey] !== false}
                            onChange={() => onToggleColumn(colKey)}
                            className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
