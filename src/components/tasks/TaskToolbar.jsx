import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Building2,
  CalendarDays,
  Layers3,
  SlidersHorizontal,
  Check,
  Lock,
  Unlock,
} from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../common/Avatar';
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
  visibleColumns = {},
  onToggleColumn,
  isFiltersLocked = false,
  onToggleLockFilters,
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
  const [openDropdown, setOpenDropdown] = useState(null); // 'dept' | 'due' | 'group' | 'customize' | 'assignee' | 'status' | 'assignedBy'
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
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
    status: 'Status',
    assignee: 'Assignee',
    assist: 'Assist',
    priority: 'Priority',
    department: 'Department',
    due_date: 'Due Date',
    activity: 'Activity',
  };

  const deptMap = React.useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d && d.id) map[d.id] = d;
    });
    return map;
  }, [departments]);

  const activeUsersList = React.useMemo(() => {
    return (users || [])
      .filter(
        (u) =>
          u &&
          !u.is_system_account &&
          !u.exclude_from_directory &&
          u.role !== 'it_support_admin' &&
          u.role !== 'it_support'
      )
      .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
  }, [users]);

  const filteredAssigneeUsers = React.useMemo(() => {
    if (!assigneeSearchQuery.trim()) return activeUsersList;
    const q = assigneeSearchQuery.toLowerCase().trim();
    return activeUsersList.filter((u) => {
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const dept = deptMap[u.department_id];
      const matchDept = dept?.name?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      return matchName || matchEmail || matchDept || matchRole;
    });
  }, [activeUsersList, assigneeSearchQuery, deptMap]);

  const selectedAssigneeIds = React.useMemo(() => {
    if (!selectedAssignedTo || selectedAssignedTo === 'all') return [];
    return selectedAssignedTo.split(',').filter(Boolean);
  }, [selectedAssignedTo]);

  const handleToggleAssignee = (userId) => {
    let next;
    if (selectedAssigneeIds.includes(userId)) {
      next = selectedAssigneeIds.filter((id) => id !== userId);
    } else {
      next = [...selectedAssigneeIds, userId];
    }
    onAssignedToChange(next.length === 0 ? 'all' : next.join(','));
  };

  const selectedDeptIds = React.useMemo(() => {
    if (!selectedDept || selectedDept === 'all') return [];
    return selectedDept.split(',').filter(Boolean);
  }, [selectedDept]);

  const handleToggleDept = (deptId) => {
    let next;
    if (selectedDeptIds.includes(deptId)) {
      next = selectedDeptIds.filter((id) => id !== deptId);
    } else {
      next = [...selectedDeptIds, deptId];
    }
    onDeptChange(next.length === 0 ? 'all' : next.join(','));
  };

  const selectedAssignedByObj = users.find((u) => u.id === selectedAssignedBy);

  // Common Filter Buttons Group (Filter, Assignee, Department, Due Date)
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
        {/* Assignee Dropdown (Multi-Select with Search) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('assignee')}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedAssigneeIds.length > 0
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                : openDropdown === 'assignee'
                ? 'bg-white border-[#059669] text-[#18181B]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
            }`}
          >
            <UserRound className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate max-w-[120px]">
              {selectedAssigneeIds.length === 0
                ? 'Assignee'
                : selectedAssigneeIds.length === 1
                ? users.find((u) => u.id === selectedAssigneeIds[0])?.full_name?.split(' ')[0] || '1 Assignee'
                : `${users.find((u) => u.id === selectedAssigneeIds[0])?.full_name?.split(' ')[0] || 'User'} +${selectedAssigneeIds.length - 1}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {openDropdown === 'assignee' && (
            <div className="absolute right-0 lg:left-0 top-full mt-1.5 w-72 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-2 z-50 animate-fade-in space-y-1.5">
              {/* Top Search Input Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={assigneeSearchQuery}
                  onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                  placeholder="Search users by name or dept..."
                  className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] border border-[#E5E7EB] rounded-[6px] focus:outline-none focus:border-[#059669] focus:bg-white text-[#18181B] placeholder:text-[#8B8B95]"
                  autoFocus
                />
                {assigneeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAssigneeSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* All Assignees (Reset) Button */}
              <button
                type="button"
                onClick={() => onAssignedToChange('all')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                  selectedAssigneeIds.length === 0
                    ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                    : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                }`}
              >
                <span>All Assignees</span>
                {selectedAssigneeIds.length === 0 && <Check className="w-3.5 h-3.5" />}
              </button>

              {/* User List with Checkboxes */}
              <div className="max-h-56 overflow-y-auto space-y-0.5 pt-0.5 border-t border-[#F4F4F5]">
                {filteredAssigneeUsers.length === 0 ? (
                  <div className="py-3 text-center text-[11.5px] text-[#8B8B95]">
                    No users found
                  </div>
                ) : (
                  filteredAssigneeUsers.map((u) => {
                    const isChecked = selectedAssigneeIds.includes(u.id);
                    const uDept = deptMap[u.department_id];
                    return (
                      <div
                        key={u.id}
                        onClick={() => handleToggleAssignee(u.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                          isChecked
                            ? 'bg-[#ECFDF5] text-[#059669]'
                            : 'hover:bg-[#F5F6F8] text-[#18181B]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div click
                            className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer w-3.5 h-3.5 flex-shrink-0"
                          />
                          <Avatar
                            src={u.avatar_url}
                            name={u.full_name}
                            size="xs"
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1 truncate">
                            <span className="text-[12px] font-medium truncate block">
                              {u.full_name}
                            </span>
                            {uDept && (
                              <span className="text-[10.5px] text-[#71717A] truncate block">
                                {uDept.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Department Dropdown (Multi-Select with Checkboxes) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('dept')}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
              selectedDeptIds.length > 0
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                : openDropdown === 'dept'
                ? 'bg-white border-[#059669] text-[#18181B]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate max-w-[120px]">
              {selectedDeptIds.length === 0
                ? 'Department'
                : selectedDeptIds.length === 1
                ? departments.find((d) => d.id === selectedDeptIds[0])?.name || '1 Dept'
                : `${departments.find((d) => d.id === selectedDeptIds[0])?.name || 'Dept'} +${selectedDeptIds.length - 1}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {openDropdown === 'dept' && (
            <div className="absolute right-0 lg:left-0 top-full mt-1.5 w-60 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-2 z-50 animate-fade-in space-y-1">
              <button
                type="button"
                onClick={() => onDeptChange('all')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                  selectedDeptIds.length === 0
                    ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                    : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                }`}
              >
                <span>All Departments</span>
                {selectedDeptIds.length === 0 && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="max-h-60 overflow-y-auto space-y-0.5 pt-1 border-t border-[#F4F4F5]">
                {departments.map((d) => {
                  const isChecked = selectedDeptIds.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      onClick={() => handleToggleDept(d.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                        isChecked
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : 'hover:bg-[#F5F6F8] text-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div click
                          className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer w-3.5 h-3.5 flex-shrink-0"
                        />
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: d.color || '#10B981' }}
                        />
                        <span className="text-[12px] font-medium truncate">
                          {d.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
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
            {/* Lock Filter Button (Calendar View) */}
            {!isMyTasks && (
              <button
                type="button"
                onClick={onToggleLockFilters}
                aria-pressed={isFiltersLocked ? 'true' : 'false'}
                aria-label={isFiltersLocked ? 'Unlock filters for this page' : 'Lock filters for this page'}
                title={
                  isFiltersLocked
                    ? 'These filters are saved for this page. Click to unlock.'
                    : 'Keep these filters when you return to this page'
                }
                className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs select-none ${
                  isFiltersLocked
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold hover:bg-[#D1FAE5] dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399] dark:hover:bg-[#064E3B]/50'
                    : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
                }`}
              >
                <Lock
                  className={`w-3.5 h-3.5 ${
                    isFiltersLocked
                      ? 'text-[#059669] dark:text-[#34D399]'
                      : 'text-[#71717A] dark:text-[#A1A1AA]'
                  }`}
                />
                <span>{isFiltersLocked ? 'Locked' : 'Lock Filter'}</span>
              </button>
            )}
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
                className="w-full pl-8 pr-7 h-9 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] placeholder:text-[#8B8B95] transition-all outline-none dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:placeholder:text-[#71717A]"
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

            {/* Lock Filter Button */}
            {!isMyTasks && (
              <button
                type="button"
                onClick={onToggleLockFilters}
                aria-pressed={isFiltersLocked ? 'true' : 'false'}
                aria-label={isFiltersLocked ? 'Unlock filters for this page' : 'Lock filters for this page'}
                title={
                  isFiltersLocked
                    ? 'These filters are saved for this page. Click to unlock.'
                    : 'Keep these filters when you return to this page'
                }
                className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs select-none ${
                  isFiltersLocked
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold hover:bg-[#D1FAE5] dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399] dark:hover:bg-[#064E3B]/50'
                    : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
                }`}
              >
                <Lock
                  className={`w-3.5 h-3.5 ${
                    isFiltersLocked
                      ? 'text-[#059669] dark:text-[#34D399]'
                      : 'text-[#71717A] dark:text-[#A1A1AA]'
                  }`}
                />
                <span>{isFiltersLocked ? 'Locked' : 'Lock Filter'}</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
