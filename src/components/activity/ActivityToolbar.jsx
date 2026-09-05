import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  User,
  Building2,
  ListTodo,
  Zap,
  Calendar,
  ChevronDown,
  X,
  Check,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

const ACTION_OPTIONS = [
  { id: 'all', label: 'All Actions' },
  { id: 'status_changed', label: 'Status Changed' },
  { id: 'task_created', label: 'Task Created' },
  { id: 'task_assigned', label: 'Task Assigned' },
  { id: 'attachment_added', label: 'Attachment Added' },
  { id: 'comment_added', label: 'Comment Added' },
  { id: 'completion_requested', label: 'Completion Requested' },
  { id: 'task_completed', label: 'Task Completed' },
  { id: 'delete_requested', label: 'Deletion Requested' },
  { id: 'department_action', label: 'Department Changes' },
  { id: 'user_action', label: 'User Updates' },
];

const DATE_OPTIONS = [
  { id: 'all', label: 'All Time' },
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: '7d', label: 'Last 7 Days' },
  { id: '30d', label: 'Last 30 Days' },
  { id: 'this_month', label: 'This Month' },
];

export function ActivityToolbar({
  filters = {},
  onFilterChange,
  onResetFilters,
  hasActiveFilters = false,
  actors = [],
  users = [],
  departments = [],
  tasks = [],
  isAdmin = false,
  // Flat prop fallbacks
  searchQuery,
  onSearchChange,
  employeeId,
  onEmployeeChange,
  departmentId,
  onDepartmentChange,
  taskId,
  onTaskChange,
  actionType,
  onActionChange,
  dateRange,
  onDateRangeChange,
}) {
  // Normalize filters object
  const activeFilters = {
    searchQuery: filters.searchQuery !== undefined ? filters.searchQuery : (searchQuery || ''),
    employeeId: filters.employeeId !== undefined ? filters.employeeId : (employeeId || 'all'),
    departmentId: filters.departmentId !== undefined ? filters.departmentId : (departmentId || 'all'),
    taskId: filters.taskId !== undefined ? filters.taskId : (taskId || 'all'),
    actionType: filters.actionType !== undefined ? filters.actionType : (actionType || 'all'),
    dateRange: filters.dateRange !== undefined ? filters.dateRange : (dateRange || 'all'),
  };

  const handleFilterChange = (key, value) => {
    if (onFilterChange) {
      onFilterChange(key, value);
      return;
    }
    if (key === 'searchQuery' && onSearchChange) onSearchChange(value);
    if (key === 'employeeId' && onEmployeeChange) onEmployeeChange(value);
    if (key === 'departmentId' && onDepartmentChange) onDepartmentChange(value);
    if (key === 'taskId' && onTaskChange) onTaskChange(value);
    if (key === 'actionType' && onActionChange) onActionChange(value);
    if (key === 'dateRange' && onDateRangeChange) onDateRangeChange(value);
  };

  const userList = actors.length > 0 ? actors : users;

  const [openDropdown, setOpenDropdown] = useState(null); // 'user' | 'dept' | 'task' | 'action' | 'date'
  const [userSearch, setUserSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');

  // Mobile Filter Dialog State
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [mobileUserSearch, setMobileUserSearch] = useState('');
  const [mobileDeptSearch, setMobileDeptSearch] = useState('');
  const [mobileTaskSearch, setMobileTaskSearch] = useState('');

  const toolbarRef = useRef(null);

  // Close desktop dropdown on click outside
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
    if (name === 'user') setUserSearch('');
    if (name === 'task') setTaskSearch('');
  };

  // Filtered dropdown lists for search
  const filteredActors = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return userList;
    return userList.filter((a) => (a.full_name || '').toLowerCase().includes(q));
  }, [userList, userSearch]);

  const filteredTasks = useMemo(() => {
    const q = taskSearch.toLowerCase().trim();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const taskNum = (t.task_number || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      return taskNum.includes(q) || title.includes(q);
    });
  }, [tasks, taskSearch]);

  // Mobile filter searches
  const mobileFilteredActors = useMemo(() => {
    const q = mobileUserSearch.toLowerCase().trim();
    if (!q) return userList;
    return userList.filter(
      (a) =>
        (a.full_name || '').toLowerCase().includes(q) ||
        (a.email || '').toLowerCase().includes(q)
    );
  }, [userList, mobileUserSearch]);

  const mobileFilteredDepartments = useMemo(() => {
    const q = mobileDeptSearch.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter((d) => (d.name || '').toLowerCase().includes(q));
  }, [departments, mobileDeptSearch]);

  const mobileFilteredTasks = useMemo(() => {
    const q = mobileTaskSearch.toLowerCase().trim();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const taskNum = (t.task_number || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      return taskNum.includes(q) || title.includes(q);
    });
  }, [tasks, mobileTaskSearch]);

  // Selected labels
  const selectedActor = userList.find((a) => String(a.id) === String(activeFilters.employeeId));
  const selectedDept = departments.find((d) => String(d.id) === String(activeFilters.departmentId));
  const selectedTask = tasks.find((t) => String(t.id) === String(activeFilters.taskId));
  const selectedAction = ACTION_OPTIONS.find((a) => a.id === activeFilters.actionType);
  const selectedDate = DATE_OPTIONS.find((d) => d.id === activeFilters.dateRange);

  const activeFilterCount =
    (activeFilters.employeeId !== 'all' ? 1 : 0) +
    (activeFilters.departmentId !== 'all' ? 1 : 0) +
    (activeFilters.taskId !== 'all' ? 1 : 0) +
    (activeFilters.actionType !== 'all' ? 1 : 0) +
    (activeFilters.dateRange !== 'all' ? 1 : 0);

  const isFilterActive =
    hasActiveFilters ||
    Boolean(
      activeFilters.searchQuery ||
      activeFilters.employeeId !== 'all' ||
      activeFilters.departmentId !== 'all' ||
      activeFilters.taskId !== 'all' ||
      activeFilters.actionType !== 'all' ||
      activeFilters.dateRange !== 'all'
    );

  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      handleFilterChange('searchQuery', '');
      handleFilterChange('employeeId', 'all');
      handleFilterChange('departmentId', 'all');
      handleFilterChange('taskId', 'all');
      handleFilterChange('actionType', 'all');
      handleFilterChange('dateRange', 'all');
    }
  };

  return (
    <div
      ref={toolbarRef}
      className="space-y-2.5 font-['Inter'] select-none"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. Mobile Toolbar (< sm): Search Input + Right Filters Dialog Button */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full">
        {/* Search Activity Input */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={activeFilters.searchQuery || ''}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            placeholder="Search activity..."
            className="h-9 w-full pl-8 pr-8 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] placeholder-[#8B8B95] transition-colors outline-none"
          />
          {activeFilters.searchQuery && (
            <button
              type="button"
              onClick={() => handleFilterChange('searchQuery', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters Button */}
        <button
          type="button"
          onClick={() => {
            setMobileUserSearch('');
            setMobileDeptSearch('');
            setMobileTaskSearch('');
            setShowMobileFilterModal(true);
          }}
          className={`h-9 px-3.5 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs flex-shrink-0 whitespace-nowrap outline-none focus:outline-none ${
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
      <div className="hidden sm:flex flex-wrap items-center gap-2.5">
        {/* 1. Search Activity */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={activeFilters.searchQuery || ''}
            onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
            placeholder="Search activity..."
            className="w-full h-[38px] pl-9 pr-8 text-[13px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] transition-all placeholder:text-[#8B8B95] text-[#18181B]"
          />
          {activeFilters.searchQuery ? (
            <button
              type="button"
              onClick={() => handleFilterChange('searchQuery', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>

        {/* 2. User (Actor) Filter */}
        {(isAdmin || userList.length > 0) && (
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('user')}
              className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFilters.employeeId !== 'all'
                  ? 'bg-emerald-50/20 border-[#059669] text-[#059669]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B] hover:text-[#18181B]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="truncate max-w-[110px]">
                {selectedActor?.full_name ? `User: ${selectedActor.full_name}` : 'User'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
            </button>

            {openDropdown === 'user' && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in text-left">
                <div className="px-2.5 pb-1.5 border-b border-[#F4F4F5]">
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search user..."
                    className="w-full px-2 py-1 text-[12px] bg-[#F4F4F5] border-none rounded-[6px] focus:outline-none placeholder:text-[#8B8B95]"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange('employeeId', 'all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                      activeFilters.employeeId === 'all' ? 'font-semibold text-[#059669] bg-emerald-50' : 'text-[#18181B]'
                    }`}
                  >
                    <span>All Users</span>
                    {activeFilters.employeeId === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                  {filteredActors.map((actor) => (
                    <button
                      key={actor.id}
                      type="button"
                      onClick={() => {
                        handleFilterChange('employeeId', actor.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                        String(activeFilters.employeeId) === String(actor.id)
                          ? 'font-semibold text-[#059669] bg-emerald-50'
                          : 'text-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar src={actor.avatar_url} name={actor.full_name} size="xs" />
                        <span className="truncate">{actor.full_name}</span>
                      </div>
                      {String(activeFilters.employeeId) === String(actor.id) && (
                        <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Department Filter */}
        {(isAdmin || departments.length > 0) && (
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('dept')}
              className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFilters.departmentId !== 'all'
                  ? 'bg-emerald-50/20 border-[#059669] text-[#059669]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B] hover:text-[#18181B]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="truncate max-w-[120px]">
                {selectedDept?.name ? `Dept: ${selectedDept.name}` : 'Department'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
            </button>

            {openDropdown === 'dept' && (
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in max-h-60 overflow-y-auto text-left">
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange('departmentId', 'all');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                    activeFilters.departmentId === 'all' ? 'font-semibold text-[#059669] bg-emerald-50' : 'text-[#18181B]'
                  }`}
                >
                  <span>All Departments</span>
                  {activeFilters.departmentId === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      handleFilterChange('departmentId', dept.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                      String(activeFilters.departmentId) === String(dept.id)
                        ? 'font-semibold text-[#059669] bg-emerald-50'
                        : 'text-[#18181B]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dept.color || '#10B981' }}
                      />
                      <span className="truncate">{dept.name}</span>
                    </div>
                    {String(activeFilters.departmentId) === String(dept.id) && (
                      <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Task Filter */}
        {(isAdmin || tasks.length > 0) && (
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('task')}
              className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeFilters.taskId !== 'all'
                  ? 'bg-emerald-50/20 border-[#059669] text-[#059669]'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B] hover:text-[#18181B]'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="truncate max-w-[120px]">
                {selectedTask ? `${selectedTask.task_number || 'Task'}` : 'Task'}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
            </button>

            {openDropdown === 'task' && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in text-left">
                <div className="px-2.5 pb-1.5 border-b border-[#F4F4F5]">
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Search task number or title..."
                    className="w-full px-2 py-1 text-[12px] bg-[#F4F4F5] border-none rounded-[6px] focus:outline-none placeholder:text-[#8B8B95]"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange('taskId', 'all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                      activeFilters.taskId === 'all' ? 'font-semibold text-[#059669] bg-emerald-50' : 'text-[#18181B]'
                    }`}
                  >
                    <span>All Tasks</span>
                    {activeFilters.taskId === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                  {filteredTasks.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        handleFilterChange('taskId', t.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                        String(activeFilters.taskId) === String(t.id)
                          ? 'font-semibold text-[#059669] bg-emerald-50'
                          : 'text-[#18181B]'
                      }`}
                    >
                      <span className="truncate">
                        <strong className="font-semibold text-[#18181B]">{t.task_number}</strong> — {t.title}
                      </span>
                      {String(activeFilters.taskId) === String(t.id) && (
                        <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0 ml-1.5" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. Action Category Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('action')}
            className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilters.actionType !== 'all'
                ? 'bg-emerald-50/20 border-[#059669] text-[#059669]'
                : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B] hover:text-[#18181B]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate max-w-[110px]">
              {selectedAction?.label || 'Action'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
          </button>

          {openDropdown === 'action' && (
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in max-h-60 overflow-y-auto text-left">
              {ACTION_OPTIONS.map((act) => (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => {
                    handleFilterChange('actionType', act.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                    activeFilters.actionType === act.id
                      ? 'font-semibold text-[#059669] bg-emerald-50'
                      : 'text-[#18181B]'
                  }`}
                >
                  <span>{act.label}</span>
                  {activeFilters.actionType === act.id && (
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 6. Date Range Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('date')}
            className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilters.dateRange !== 'all'
                ? 'bg-emerald-50/20 border-[#059669] text-[#059669]'
                : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B] hover:text-[#18181B]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate max-w-[110px]">
              {selectedDate?.label || 'Date Range'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
          </button>

          {openDropdown === 'date' && (
            <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-48 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in text-left">
              {DATE_OPTIONS.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => {
                    handleFilterChange('dateRange', d.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                    activeFilters.dateRange === d.id
                      ? 'font-semibold text-[#059669] bg-emerald-50'
                      : 'text-[#18181B]'
                  }`}
                >
                  <span>{d.label}</span>
                  {activeFilters.dateRange === d.id && (
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Active Filter Chips Bar */}
      {isFilterActive && (
        <div className="flex flex-wrap items-center gap-2 pt-1 animate-fade-in">
          <span className="text-[12px] font-medium text-[#71717A]">Active filters:</span>

          {activeFilters.searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] text-[11.5px] font-medium text-[#18181B] border border-[#E4E4E7]">
              <span>Search: &ldquo;{activeFilters.searchQuery}&rdquo;</span>
              <button
                type="button"
                onClick={() => handleFilterChange('searchQuery', '')}
                className="text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilters.employeeId !== 'all' && selectedActor && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] text-[11.5px] font-medium text-[#18181B] border border-[#E4E4E7]">
              <span>User: {selectedActor.full_name}</span>
              <button
                type="button"
                onClick={() => handleFilterChange('employeeId', 'all')}
                className="text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilters.departmentId !== 'all' && selectedDept && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] text-[11.5px] font-medium text-[#18181B] border border-[#E4E4E7]">
              <span>Department: {selectedDept.name}</span>
              <button
                type="button"
                onClick={() => handleFilterChange('departmentId', 'all')}
                className="text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilters.taskId !== 'all' && selectedTask && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] text-[11.5px] font-medium text-[#18181B] border border-[#E4E4E7]">
              <span>Task: {selectedTask.task_number}</span>
              <button
                type="button"
                onClick={() => handleFilterChange('taskId', 'all')}
                className="text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilters.actionType !== 'all' && selectedAction && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] text-[11.5px] font-medium text-[#18181B] border border-[#E4E4E7]">
              <span>Action: {selectedAction.label}</span>
              <button
                type="button"
                onClick={() => handleFilterChange('actionType', 'all')}
                className="text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {activeFilters.dateRange !== 'all' && selectedDate && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] text-[11.5px] font-medium text-[#18181B] border border-[#E4E4E7]">
              <span>Date: {selectedDate.label}</span>
              <button
                type="button"
                onClick={() => handleFilterChange('dateRange', 'all')}
                className="text-[#71717A] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleReset}
            className="text-[12px] font-medium text-[#059669] hover:text-[#047857] hover:underline flex items-center gap-1 transition-colors cursor-pointer ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* 4. MOBILE ALL-IN-ONE FILTERS MODAL DIALOG (Portaled) */}
      {showMobileFilterModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-['Inter']">
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
                  Activity Filters
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
                    onClick={() => {
                      handleReset();
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

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
              {/* 1. Date Range Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Time Range
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {DATE_OPTIONS.map((opt) => {
                    const isSelected = activeFilters.dateRange === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleFilterChange('dateRange', opt.id)}
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

              {/* 2. Action Category Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Action Type
                  </label>
                  {activeFilters.actionType !== 'all' && (
                    <button
                      type="button"
                      onClick={() => handleFilterChange('actionType', 'all')}
                      className="text-[11px] text-[#059669] dark:text-[#34D399] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                  {ACTION_OPTIONS.map((act) => {
                    const isSelected = activeFilters.actionType === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleFilterChange('actionType', act.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer transition-colors text-left select-none ${
                          isSelected
                            ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                            : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                        }`}
                      >
                        <span>{act.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Department Section */}
              {(isAdmin || departments.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Department
                    </label>
                    {activeFilters.departmentId !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleFilterChange('departmentId', 'all')}
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
                      value={mobileDeptSearch}
                      onChange={(e) => setMobileDeptSearch(e.target.value)}
                      placeholder="Search departments..."
                      className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                    />
                    {mobileDeptSearch && (
                      <button
                        type="button"
                        onClick={() => setMobileDeptSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => handleFilterChange('departmentId', 'all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        activeFilters.departmentId === 'all'
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Departments</span>
                      {activeFilters.departmentId === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {mobileFilteredDepartments.map((d) => {
                      const isSelected = String(activeFilters.departmentId) === String(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleFilterChange('departmentId', d.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                            isSelected
                              ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: d.color || '#10B981' }}
                            />
                            <span className="text-[12px] font-medium truncate">{d.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. User (Actor) Section */}
              {(isAdmin || userList.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      User
                    </label>
                    {activeFilters.employeeId !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleFilterChange('employeeId', 'all')}
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
                      value={mobileUserSearch}
                      onChange={(e) => setMobileUserSearch(e.target.value)}
                      placeholder="Search users..."
                      className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                    />
                    {mobileUserSearch && (
                      <button
                        type="button"
                        onClick={() => setMobileUserSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => handleFilterChange('employeeId', 'all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        activeFilters.employeeId === 'all'
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Users</span>
                      {activeFilters.employeeId === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {mobileFilteredActors.map((actor) => {
                      const isSelected = String(activeFilters.employeeId) === String(actor.id);
                      return (
                        <button
                          key={actor.id}
                          type="button"
                          onClick={() => handleFilterChange('employeeId', actor.id)}
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

              {/* 5. Task Section */}
              {(isAdmin || tasks.length > 0) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Task
                    </label>
                    {activeFilters.taskId !== 'all' && (
                      <button
                        type="button"
                        onClick={() => handleFilterChange('taskId', 'all')}
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
                      onClick={() => handleFilterChange('taskId', 'all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        activeFilters.taskId === 'all'
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Tasks</span>
                      {activeFilters.taskId === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {mobileFilteredTasks.map((t) => {
                      const isSelected = String(activeFilters.taskId) === String(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleFilterChange('taskId', t.id)}
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

            {/* Modal Footer */}
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

export default ActivityToolbar;
