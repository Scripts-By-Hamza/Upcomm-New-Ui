import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  MessageSquare,
  Filter,
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
  // Dropdown states for desktop toolbar popovers
  const [openDropdown, setOpenDropdown] = useState(null); // 'dept' | 'due' | 'group' | 'customize' | 'assignee' | 'status' | 'assignedBy'
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, left: 0, width: 200 });
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('');
  const [assignedBySearchQuery, setAssignedBySearchQuery] = useState('');

  // Mobile Filter Dialog Modal State
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [mobileModalSearchQuery, setMobileModalSearchQuery] = useState('');

  const toolbarRef = useRef(null);
  const popoverRef = useRef(null);
  const triggerRefs = useRef({});

  const toggleDropdown = (id, targetEl, preferredWidth = 200) => {
    if (openDropdown === id) {
      setOpenDropdown(null);
      return;
    }
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const screenW = window.innerWidth;
      const actualWidth = Math.min(preferredWidth, screenW - 24);

      let left = rect.left;
      if (left + actualWidth > screenW - 12) {
        left = Math.max(12, screenW - actualWidth - 12);
      }
      if (left < 12) {
        left = 12;
      }

      const top = rect.bottom + 6;
      setDropdownCoords({ top, left, width: actualWidth });
    }
    setOpenDropdown(id);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        !Object.values(triggerRefs.current).some((el) => el && el.contains(e.target))
      ) {
        setOpenDropdown(null);
      }
    }
    function handleScrollOrResize(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { capture: true, passive: true });
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

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
    const q = (showMobileFilterModal ? mobileModalSearchQuery : assigneeSearchQuery).toLowerCase().trim();
    if (!q) return activeUsersList;
    return activeUsersList.filter((u) => {
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const dept = deptMap[u.department_id];
      const matchDept = dept?.name?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      return matchName || matchEmail || matchDept || matchRole;
    });
  }, [activeUsersList, assigneeSearchQuery, mobileModalSearchQuery, showMobileFilterModal, deptMap]);

  // HODs & Admins list for Assigned By filter
  const hodAndAdminUsersList = React.useMemo(() => {
    return (users || [])
      .filter(
        (u) =>
          u &&
          !u.is_system_account &&
          !u.exclude_from_directory &&
          (u.role === 'hod' || u.role === 'admin' || u.role === 'it_support_admin')
      )
      .sort((a, b) => {
        if (a.role === 'hod' && b.role !== 'hod') return -1;
        if (a.role !== 'hod' && b.role === 'hod') return 1;
        return (a.full_name || '').localeCompare(b.full_name || '');
      });
  }, [users]);

  const filteredAssignedByUsers = React.useMemo(() => {
    const q = (showMobileFilterModal ? mobileModalSearchQuery : assignedBySearchQuery).toLowerCase().trim();
    if (!q) return hodAndAdminUsersList;
    const searchPool = (users || []).filter(
      (u) =>
        u &&
        !u.is_system_account &&
        !u.exclude_from_directory &&
        u.role !== 'it_support'
    );
    return searchPool.filter((u) => {
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const dept = deptMap[u.department_id];
      const matchDept = dept?.name?.toLowerCase().includes(q);
      const matchRole = u.role?.toLowerCase().includes(q);
      return matchName || matchEmail || matchDept || matchRole;
    });
  }, [hodAndAdminUsersList, users, assignedBySearchQuery, mobileModalSearchQuery, showMobileFilterModal, deptMap]);

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

  // Active filter count for mobile Filters button badge (excluding unreadFilter as requested)
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (selectedStatus !== 'all') count++;
    if (selectedPriority !== 'all') count++;
    if (selectedDue !== 'all') count++;
    if (isMyTasks) {
      if (selectedAssignedBy !== 'all') count++;
    } else {
      if (selectedAssigneeIds.length > 0) count++;
      if (selectedDeptIds.length > 0) count++;
      if (selectedGroup !== 'none') count++;
    }
    return count;
  }, [
    selectedStatus,
    selectedPriority,
    selectedDue,
    isMyTasks,
    selectedAssignedBy,
    selectedAssigneeIds,
    selectedDeptIds,
    selectedGroup,
  ]);

  const handleClearModalFilters = () => {
    onStatusChange?.('all');
    onPriorityChange?.('all');
    onDueChange?.('all');
    if (isMyTasks) {
      onAssignedByChange?.('all');
    } else {
      onAssignedToChange?.('all');
      onDeptChange?.('all');
      onGroupChange?.('none');
    }
  };

  // Unread Messages Toggle Button (First-Class Attention Mode Filter on the Left)
  const renderUnreadMessagesButton = () => (
    <button
      type="button"
      onClick={() => onUnreadFilterChange?.(!unreadFilter)}
      aria-pressed={unreadFilter ? 'true' : 'false'}
      aria-label="Show tasks with unread messages only"
      title={
        unreadFilter
          ? 'Showing tasks with unread messages. Click to show all.'
          : 'Show tasks with unread messages'
      }
      className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer select-none shadow-2xs flex-shrink-0 whitespace-nowrap outline-none focus:outline-none ${
        unreadFilter
          ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold hover:bg-[#D1FAE5] dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399] dark:hover:bg-[#064E3B]/50'
          : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
      }`}
    >
      <MessageSquare
        className={`w-3.5 h-3.5 ${
          unreadFilter
            ? 'text-[#059669] dark:text-[#34D399]'
            : 'text-[#71717A] dark:text-[#A1A1AA]'
        }`}
      />
      <span>Unread Messages</span>
      {unreadFilter && (
        <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
      )}
    </button>
  );

  // Common Desktop Filter Buttons Group
  const renderFilterButtons = (isCalendarMode = false) => {
    if (isMyTasks) {
      return (
        <>
          {/* Unread Messages Toggle Button (hidden in calendar mode) */}
          {!isCalendarMode && renderUnreadMessagesButton()}

          {/* Status Dropdown */}
          <button
            ref={(el) => (triggerRefs.current['status'] = el)}
            type="button"
            onClick={(e) => toggleDropdown('status', e.currentTarget, 170)}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
              selectedStatus !== 'all'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                : openDropdown === 'status'
                ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
            }`}
          >
            <span className="capitalize">
              {selectedStatus !== 'all'
                ? selectedStatus.replace('_', ' ')
                : 'Status'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {/* Priority Dropdown */}
          <button
            ref={(el) => (triggerRefs.current['priority'] = el)}
            type="button"
            onClick={(e) => toggleDropdown('priority', e.currentTarget, 176)}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
              selectedPriority !== 'all'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                : openDropdown === 'priority'
                ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
            }`}
          >
            <span className="capitalize">
              {selectedPriority !== 'all' ? selectedPriority : 'Priority'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {/* Due Date Dropdown */}
          {!isCalendarMode && (
            <button
              ref={(el) => (triggerRefs.current['due'] = el)}
              type="button"
              onClick={(e) => toggleDropdown('due', e.currentTarget, 192)}
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
                selectedDue !== 'all'
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                : openDropdown === 'due'
                ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
              <span className="truncate max-w-[110px]">
                {dueOptions.find((d) => d.value === selectedDue)?.label || 'Due Date'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>
          )}

          {/* Assigned By Dropdown (Top Search Bar + Department HODs list) */}
          <button
            ref={(el) => (triggerRefs.current['assignedBy'] = el)}
            type="button"
            onClick={(e) => toggleDropdown('assignedBy', e.currentTarget, 288)}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
              selectedAssignedBy !== 'all'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                : openDropdown === 'assignedBy'
                ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
            }`}
          >
            <UserRound className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span className="truncate max-w-[120px]">
              {selectedAssignedByObj
                ? selectedAssignedByObj.full_name?.split(' ')[0]
                : 'Assigned By'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>
        </>
      );
    }

    return (
      <>
        {/* Unread Messages Toggle Button (hidden in calendar mode) */}
        {!isCalendarMode && renderUnreadMessagesButton()}

        {/* Assignee Dropdown (Multi-Select with Search) - Admin Only */}
        {!isMyTasks && isAdmin && (
          <button
            ref={(el) => (triggerRefs.current['assignee'] = el)}
            type="button"
            onClick={(e) => toggleDropdown('assignee', e.currentTarget, 288)}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
              selectedAssigneeIds.length > 0
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                : openDropdown === 'assignee'
                ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
            }`}
          >
            <UserRound className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span className="truncate max-w-[120px]">
              {selectedAssigneeIds.length === 0
                ? 'Assignee'
                : selectedAssigneeIds.length === 1
                ? users.find((u) => u.id === selectedAssigneeIds[0])?.full_name?.split(' ')[0] || '1 Assignee'
                : `${users.find((u) => u.id === selectedAssigneeIds[0])?.full_name?.split(' ')[0] || 'User'} +${selectedAssigneeIds.length - 1}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>
        )}

        {/* Department Dropdown (Multi-Select with Checkboxes) - Admin Only */}
        {!isMyTasks && isAdmin && (
          <button
            ref={(el) => (triggerRefs.current['dept'] = el)}
            type="button"
            onClick={(e) => toggleDropdown('dept', e.currentTarget, 240)}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
              selectedDeptIds.length > 0
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                : openDropdown === 'dept'
                ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span className="truncate max-w-[120px]">
              {selectedDeptIds.length === 0
                ? 'Department'
                : selectedDeptIds.length === 1
                ? departments.find((d) => d.id === selectedDeptIds[0])?.name || '1 Dept'
                : `${departments.find((d) => d.id === selectedDeptIds[0])?.name || 'Dept'} +${selectedDeptIds.length - 1}`}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>
        )}

        {/* Due Date Dropdown (List/Board view only) */}
        {!isCalendarMode && (
          <button
            ref={(el) => (triggerRefs.current['due'] = el)}
            type="button"
            onClick={(e) => toggleDropdown('due', e.currentTarget, 192)}
            className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
              selectedDue !== 'all'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                : openDropdown === 'due'
                ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span className="truncate max-w-[110px]">
              {dueOptions.find((d) => d.value === selectedDue)?.label || 'Due Date'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>
        )}
      </>
    );
  };

  return (
    <div ref={toolbarRef} className="select-none">
      {activeView === 'calendar' ? (
        /* CALENDAR VIEW TOOLBAR */
        <div className="flex flex-col gap-2.5">
          {/* Month Navigation & Filters Row */}
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Left: Prev Month Arrow, Month & Year text, Next Month Arrow */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <button
                type="button"
                onClick={onPrevMonth}
                aria-label="Previous month"
                className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F5F6F8] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer shadow-2xs flex-shrink-0 outline-none focus:outline-none dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-[14.5px] sm:text-[18px] font-bold text-[#18181B] dark:text-[#F4F4F5] tracking-tight px-1 truncate text-center min-w-[125px] sm:min-w-[155px]">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <button
                type="button"
                onClick={onNextMonth}
                aria-label="Next month"
                className="w-9 h-9 flex items-center justify-center rounded-[8px] border border-[#E5E7EB] bg-white hover:bg-[#F5F6F8] text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer shadow-2xs flex-shrink-0 outline-none focus:outline-none dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right on Mobile: Filters Button (sm:hidden) */}
            <div className="sm:hidden flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setMobileModalSearchQuery('');
                  setShowMobileFilterModal(true);
                }}
                className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs flex-shrink-0 whitespace-nowrap outline-none focus:outline-none ${
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

            {/* Right on Desktop: Month Pill (hidden sm:block) */}
            <div className="hidden sm:block relative flex-shrink-0">
              <button
                type="button"
                className="h-9 px-3 rounded-[8px] border border-[#E5E7EB] bg-white text-[12.5px] font-medium text-[#18181B] flex items-center gap-1.5 cursor-pointer shadow-2xs outline-none focus:outline-none dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5]"
              >
                <span>Month</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
              </button>
            </div>
          </div>

          {/* Desktop Calendar Filters (hidden on mobile, visible sm:flex) */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap justify-end">
            {renderFilterButtons(true)}
            {!isMyTasks && isAdmin && (
              <button
                type="button"
                onClick={onToggleLockFilters}
                aria-pressed={isFiltersLocked ? 'true' : 'false'}
                className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs select-none outline-none focus:outline-none ${
                  isFiltersLocked
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold hover:bg-[#D1FAE5] dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                    : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5]'
                }`}
              >
                <Lock className={`w-3.5 h-3.5 ${isFiltersLocked ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#71717A] dark:text-[#A1A1AA]'}`} />
                <span>{isFiltersLocked ? 'Locked' : 'Lock Filter'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* LIST / BOARD VIEW TOOLBAR */
        <div>
          {/* Mobile Toolbar (sm:hidden): Left Unread Messages + Right Filter Dialog Button */}
          <div className="flex sm:hidden items-center justify-between gap-2 w-full">
            <div className="flex-shrink-0">
              {renderUnreadMessagesButton()}
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileModalSearchQuery('');
                setShowMobileFilterModal(true);
              }}
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs flex-shrink-0 whitespace-nowrap outline-none focus:outline-none ${
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

          {/* Desktop Toolbar (hidden sm:flex): Full controls row */}
          <div className="hidden sm:flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
            {/* Left Filters Group */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {renderFilterButtons(false)}
            </div>

            {/* Right Group / Sort / Customize */}
            <div className="flex items-center gap-2 flex-wrap justify-end min-w-0">
              {/* Group Dropdown (All Tasks only) */}
              {!isMyTasks && (
                <button
                  ref={(el) => (triggerRefs.current['group'] = el)}
                  type="button"
                  onClick={(e) => toggleDropdown('group', e.currentTarget, 176)}
                  className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
                    selectedGroup !== 'none'
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                      : openDropdown === 'group'
                      ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                      : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
                  }`}
                >
                  <Layers3 className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span className="capitalize">
                    {selectedGroup !== 'none' ? `Group: ${selectedGroup}` : 'Group'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
                </button>
              )}

              {/* Customize Columns Dropdown (All Tasks List View only) */}
              {!isMyTasks && activeView === 'list' && (
                <button
                  ref={(el) => (triggerRefs.current['customize'] = el)}
                  type="button"
                  onClick={(e) => toggleDropdown('customize', e.currentTarget, 200)}
                  className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer flex-shrink-0 whitespace-nowrap outline-none focus:outline-none shadow-2xs ${
                    openDropdown === 'customize'
                      ? 'bg-white border-[#059669] text-[#18181B] dark:bg-[#18181B] dark:border-[#10B981] dark:text-[#F4F4F5]'
                      : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:hover:bg-[#27272A]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
                  <span>Customize</span>
                </button>
              )}

              {/* Lock Filter Button - Admin Only */}
              {!isMyTasks && isAdmin && (
                <button
                  type="button"
                  onClick={onToggleLockFilters}
                  aria-pressed={isFiltersLocked ? 'true' : 'false'}
                  aria-label={isFiltersLocked ? 'Unlock filters for this page' : 'Lock filters for this page'}
                  className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs select-none flex-shrink-0 whitespace-nowrap outline-none focus:outline-none ${
                    isFiltersLocked
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold hover:bg-[#D1FAE5] dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                      : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5]'
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
          </div>
        </div>
      )}

      {/* Desktop Portaled Dropdowns */}
      {openDropdown && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${dropdownCoords.top}px`,
            left: `${dropdownCoords.left}px`,
            width: dropdownCoords.width ? `${dropdownCoords.width}px` : 'auto',
            maxWidth: 'calc(100vw - 24px)',
            zIndex: 9999,
          }}
          className="bg-white dark:bg-[#18181B] rounded-[10px] border border-[#E5E7EB] dark:border-[#27272A] shadow-[0_10px_30px_rgba(24,24,27,0.15)] p-1.5 animate-fade-in"
        >
          {/* Status Dropdown Content */}
          {openDropdown === 'status' && (
            <div className="space-y-0.5">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onStatusChange(opt.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                    selectedStatus === opt.value
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                      : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedStatus === opt.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Priority Dropdown Content */}
          {openDropdown === 'priority' && (
            <div className="space-y-0.5">
              {priorityOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onPriorityChange(opt.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                    selectedPriority === opt.value
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                      : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedPriority === opt.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Due Date Dropdown Content */}
          {openDropdown === 'due' && (
            <div className="space-y-0.5">
              {dueOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onDueChange(opt.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                    selectedDue === opt.value
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                      : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedDue === opt.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Assigned By Dropdown Content */}
          {openDropdown === 'assignedBy' && (
            <div className="space-y-1.5 p-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={assignedBySearchQuery}
                  onChange={(e) => setAssignedBySearchQuery(e.target.value)}
                  placeholder="Search HODs by name or dept..."
                  className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[6px] focus:outline-none focus:border-[#059669] focus:bg-white dark:focus:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                  autoFocus
                />
                {assignedBySearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAssignedBySearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  onAssignedByChange('all');
                  setOpenDropdown(null);
                  setAssignedBySearchQuery('');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                  selectedAssignedBy === 'all'
                    ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                    : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                }`}
              >
                <span>All (Anyone)</span>
                {selectedAssignedBy === 'all' && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="px-2 pt-1 text-[10px] font-semibold text-[#8B8B95] uppercase tracking-wider">
                Department HODs & Management
              </div>

              <div className="max-h-56 overflow-y-auto space-y-0.5 pt-0.5 border-t border-[#F4F4F5] dark:border-[#27272A]">
                {filteredAssignedByUsers.length === 0 ? (
                  <div className="py-3 text-center text-[11.5px] text-[#8B8B95]">
                    No HODs found
                  </div>
                ) : (
                  filteredAssignedByUsers.map((u) => {
                    const isSelected = selectedAssignedBy === u.id;
                    const uDept = deptMap[u.department_id];
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          onAssignedByChange(u.id);
                          setOpenDropdown(null);
                          setAssignedBySearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                          isSelected
                            ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                            : 'hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar
                            src={u.avatar_url}
                            name={u.full_name}
                            size="xs"
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1 truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-medium truncate block">
                                {u.full_name}
                              </span>
                              <span
                                className={`text-[9.5px] px-1 py-0.2 rounded font-semibold uppercase tracking-wider ${
                                  u.role === 'hod'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                }`}
                              >
                                {u.role === 'hod' ? 'HOD' : 'Admin'}
                              </span>
                            </div>
                            {uDept && (
                              <span className="text-[10.5px] text-[#71717A] dark:text-[#A1A1AA] truncate block">
                                {uDept.name}
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Assignee Dropdown Content */}
          {openDropdown === 'assignee' && (
            <div className="space-y-1.5 p-1">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={assigneeSearchQuery}
                  onChange={(e) => setAssigneeSearchQuery(e.target.value)}
                  placeholder="Search users by name or dept..."
                  className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[6px] focus:outline-none focus:border-[#059669] focus:bg-white dark:focus:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                  autoFocus
                />
                {assigneeSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAssigneeSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => onAssignedToChange('all')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                  selectedAssigneeIds.length === 0
                    ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                    : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                }`}
              >
                <span>All Assignees</span>
                {selectedAssigneeIds.length === 0 && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="max-h-56 overflow-y-auto space-y-0.5 pt-0.5 border-t border-[#F4F4F5] dark:border-[#27272A]">
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
                            ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                            : 'hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
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
                              <span className="text-[10.5px] text-[#71717A] dark:text-[#A1A1AA] truncate block">
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

          {/* Department Dropdown Content */}
          {openDropdown === 'dept' && (
            <div className="space-y-1 p-1">
              <button
                type="button"
                onClick={() => onDeptChange('all')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                  selectedDeptIds.length === 0
                    ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                    : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                }`}
              >
                <span>All Departments</span>
                {selectedDeptIds.length === 0 && <Check className="w-3.5 h-3.5" />}
              </button>

              <div className="max-h-60 overflow-y-auto space-y-0.5 pt-1 border-t border-[#F4F4F5] dark:border-[#27272A]">
                {departments.map((d) => {
                  const isChecked = selectedDeptIds.includes(d.id);
                  return (
                    <div
                      key={d.id}
                      onClick={() => handleToggleDept(d.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                        isChecked
                          ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
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

          {/* Group Dropdown Content */}
          {openDropdown === 'group' && (
            <div className="space-y-0.5">
              {groupOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onGroupChange(opt.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors ${
                    selectedGroup === opt.value
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                      : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selectedGroup === opt.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}

          {/* Customize Columns Dropdown Content */}
          {openDropdown === 'customize' && (
            <div className="space-y-1.5 p-1">
              <div className="px-1 text-[11px] font-semibold text-[#8B8B95] uppercase tracking-wider">
                Toggle Columns
              </div>
              <div className="space-y-1">
                {Object.keys(columnLabels).map((colKey) => (
                  <label
                    key={colKey}
                    className="flex items-center justify-between px-2 py-1 hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] rounded-[6px] cursor-pointer text-[12px] text-[#18181B] dark:text-[#F4F4F5]"
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
        </div>,
        document.body
      )}

      {/* MOBILE ALL-IN-ONE FILTERS MODAL DIALOG */}
      {showMobileFilterModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileFilterModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Dialog Box Modal */}
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-[#18181B] rounded-t-[20px] sm:rounded-[16px] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                <h3 className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Task Filters
                </h3>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] text-[11px] font-semibold border border-[#A7F3D0] dark:border-[#059669]/40">
                    {activeFilterCount} active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearModalFilters}
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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
              {/* 1. Status Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {statusOptions.map((opt) => {
                    const isSelected = selectedStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onStatusChange(opt.value)}
                        className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Priority Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {priorityOptions.map((opt) => {
                    const isSelected = selectedPriority === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onPriorityChange(opt.value)}
                        className={`px-2.5 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-center flex items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Due Date Section */}
              {activeView !== 'calendar' && (
                <div>
                  <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                    Due Date
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {dueOptions.map((opt) => {
                      const isSelected = selectedDue === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => onDueChange(opt.value)}
                          className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                              : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Assigned By Section (My Tasks View) */}
              {isMyTasks && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Assigned By
                    </label>
                    {selectedAssignedBy !== 'all' && (
                      <button
                        type="button"
                        onClick={() => onAssignedByChange('all')}
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
                      value={mobileModalSearchQuery}
                      onChange={(e) => setMobileModalSearchQuery(e.target.value)}
                      placeholder="Search HODs by name or dept..."
                      className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                    />
                    {mobileModalSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMobileModalSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => onAssignedByChange('all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        selectedAssignedBy === 'all'
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All (Anyone)</span>
                      {selectedAssignedBy === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {filteredAssignedByUsers.map((u) => {
                      const isSelected = selectedAssignedBy === u.id;
                      const uDept = deptMap[u.department_id];
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => onAssignedByChange(u.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer text-left ${
                            isSelected
                              ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Avatar src={u.avatar_url} name={u.full_name} size="xs" className="flex-shrink-0" />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="text-[12px] font-medium truncate block">{u.full_name}</span>
                              {uDept && <span className="text-[10.5px] text-[#71717A] dark:text-[#A1A1AA] truncate block">{uDept.name}</span>}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 5. Assignee Section (All Tasks View - Admin only) */}
              {!isMyTasks && isAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Assignee
                    </label>
                    {selectedAssigneeIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onAssignedToChange('all')}
                        className="text-[11px] text-[#059669] dark:text-[#34D399] hover:underline"
                      >
                        Reset ({selectedAssigneeIds.length})
                      </button>
                    )}
                  </div>

                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={mobileModalSearchQuery}
                      onChange={(e) => setMobileModalSearchQuery(e.target.value)}
                      placeholder="Search users by name or dept..."
                      className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                    />
                    {mobileModalSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setMobileModalSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => onAssignedToChange('all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        selectedAssigneeIds.length === 0
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Assignees</span>
                      {selectedAssigneeIds.length === 0 && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {filteredAssigneeUsers.map((u) => {
                      const isChecked = selectedAssigneeIds.includes(u.id);
                      const uDept = deptMap[u.department_id];
                      return (
                        <div
                          key={u.id}
                          onClick={() => handleToggleAssignee(u.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                            isChecked
                              ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer w-3.5 h-3.5 flex-shrink-0"
                            />
                            <Avatar src={u.avatar_url} name={u.full_name} size="xs" className="flex-shrink-0" />
                            <div className="min-w-0 flex-1 truncate">
                              <span className="text-[12px] font-medium truncate block">{u.full_name}</span>
                              {uDept && <span className="text-[10.5px] text-[#71717A] dark:text-[#A1A1AA] truncate block">{uDept.name}</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. Department Section (All Tasks View - Admin only) */}
              {!isMyTasks && isAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Department
                    </label>
                    {selectedDeptIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => onDeptChange('all')}
                        className="text-[11px] text-[#059669] dark:text-[#34D399] hover:underline"
                      >
                        Reset ({selectedDeptIds.length})
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => onDeptChange('all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        selectedDeptIds.length === 0
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Departments</span>
                      {selectedDeptIds.length === 0 && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {departments.map((d) => {
                      const isChecked = selectedDeptIds.includes(d.id);
                      return (
                        <div
                          key={d.id}
                          onClick={() => handleToggleDept(d.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                            isChecked
                              ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer w-3.5 h-3.5 flex-shrink-0"
                            />
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color || '#10B981' }} />
                            <span className="text-[12px] font-medium truncate">{d.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 7. Grouping Section (All Tasks View) */}
              {!isMyTasks && (
                <div>
                  <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                    Group By
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {groupOptions.map((opt) => {
                      const isSelected = selectedGroup === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => onGroupChange(opt.value)}
                          className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                              : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#F9FAFB] dark:bg-[#18181B] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className={`py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold rounded-[10px] transition-colors cursor-pointer shadow-sm text-center outline-none ${
                  !isMyTasks && isAdmin && onToggleLockFilters ? 'w-[70%]' : 'w-full'
                }`}
              >
                Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </button>

              {!isMyTasks && isAdmin && onToggleLockFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleLockFilters?.();
                  }}
                  aria-pressed={isFiltersLocked ? 'true' : 'false'}
                  aria-label={isFiltersLocked ? 'Unlock filters for this page' : 'Lock filters for this page'}
                  className={`w-[30%] py-2.5 rounded-[10px] border text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs select-none outline-none ${
                    isFiltersLocked
                      ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-bold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
                      : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#25282E] dark:border-[#373C44] dark:text-[#F4F4F5]'
                  }`}
                >
                  <Lock
                    className={`w-3.5 h-3.5 ${
                      isFiltersLocked
                        ? 'text-[#059669] dark:text-[#34D399]'
                        : 'text-[#71717A] dark:text-[#A1A1AA]'
                    }`}
                  />
                  <span>{isFiltersLocked ? 'Locked' : 'Lock'}</span>
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
