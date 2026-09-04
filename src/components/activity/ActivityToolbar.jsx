import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';

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

  const isFilterActive =
    hasActiveFilters ||
    Boolean(
      activeFilters.searchQuery ||
      (isAdmin && (
        activeFilters.employeeId !== 'all' ||
        activeFilters.departmentId !== 'all' ||
        activeFilters.taskId !== 'all' ||
        activeFilters.actionType !== 'all' ||
        activeFilters.dateRange !== 'all'
      ))
    );

  const [openDropdown, setOpenDropdown] = useState(null); // 'user' | 'dept' | 'task' | 'action' | 'date'
  const [userSearch, setUserSearch] = useState('');
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
    if (name === 'user') setUserSearch('');
    if (name === 'task') setTaskSearch('');
  };

  // Filtered dropdown lists for search
  const filteredActors = userList.filter((a) =>
    (a.full_name || '').toLowerCase().includes(userSearch.toLowerCase().trim())
  );

  const filteredTasks = tasks.filter((t) => {
    const q = taskSearch.toLowerCase().trim();
    const taskNum = (t.task_number || '').toLowerCase();
    const title = (t.title || '').toLowerCase();
    return taskNum.includes(q) || title.includes(q);
  });

  // Selected labels
  const selectedActor = userList.find((a) => String(a.id) === String(activeFilters.employeeId));
  const selectedDept = departments.find((d) => String(d.id) === String(activeFilters.departmentId));
  const selectedTask = tasks.find((t) => String(t.id) === String(activeFilters.taskId));
  const selectedAction = ACTION_OPTIONS.find((a) => a.id === activeFilters.actionType);
  const selectedDate = DATE_OPTIONS.find((d) => d.id === activeFilters.dateRange);

  return (
    <div ref={toolbarRef} className="space-y-2 select-none">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* 1. Search Activity */}
        <div className="relative flex-1 min-w-[200px] sm:min-w-[240px]">
          <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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

        {/* 2-6. Admin-Only Dropdown Filters */}
        {isAdmin && (
          <>
            {/* 2. User (Actor) Filter */}
            <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('user')}
            className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilters.employeeId !== 'all'
                ? 'bg-[#F4F4F5] border-[#D4D4D8] text-[#18181B]'
                : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B] hover:text-[#18181B]'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate max-w-[110px]">
              {selectedActor?.full_name || 'User'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
          </button>

          {openDropdown === 'user' && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in">
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
                    activeFilters.employeeId === 'all' ? 'font-semibold text-[#059669]' : 'text-[#18181B]'
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
                        ? 'font-semibold text-[#059669]'
                        : 'text-[#18181B]'
                    }`}
                  >
                    <span className="truncate">{actor.full_name}</span>
                    {String(activeFilters.employeeId) === String(actor.id) && (
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Department Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('dept')}
            className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilters.departmentId !== 'all'
                ? 'bg-[#F4F4F5] border-[#D4D4D8] text-[#18181B]'
                : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B] hover:text-[#18181B]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate max-w-[120px]">
              {selectedDept?.name || 'Department'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
          </button>

          {openDropdown === 'dept' && (
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  handleFilterChange('departmentId', 'all');
                  setOpenDropdown(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-1.5 text-[12.5px] hover:bg-[#F5F6F8] cursor-pointer text-left ${
                  activeFilters.departmentId === 'all' ? 'font-semibold text-[#059669]' : 'text-[#18181B]'
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
                      ? 'font-semibold text-[#059669]'
                      : 'text-[#18181B]'
                  }`}
                >
                  <span className="truncate">{dept.name}</span>
                  {String(activeFilters.departmentId) === String(dept.id) && (
                    <Check className="w-3.5 h-3.5 text-[#059669]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 4. Task Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('task')}
            className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilters.taskId !== 'all'
                ? 'bg-[#F4F4F5] border-[#D4D4D8] text-[#18181B]'
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
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in">
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
                    activeFilters.taskId === 'all' ? 'font-semibold text-[#059669]' : 'text-[#18181B]'
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
                        ? 'font-semibold text-[#059669]'
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

        {/* 5. Action Category Filter */}
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleDropdown('action')}
            className={`h-[38px] px-3 rounded-[8px] border text-[13px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeFilters.actionType !== 'all'
                ? 'bg-[#F4F4F5] border-[#D4D4D8] text-[#18181B]'
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
            <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in max-h-60 overflow-y-auto">
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
                      ? 'font-semibold text-[#059669]'
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
                ? 'bg-[#F4F4F5] border-[#D4D4D8] text-[#18181B]'
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
            <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-48 bg-white border border-[#E5E7EB] rounded-[10px] shadow-lg py-1.5 z-40 animate-fade-in">
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
                      ? 'font-semibold text-[#059669]'
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
      </>
    )}
  </div>

  {/* Active Filter Chips */}
  {isFilterActive && (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

      {isAdmin && activeFilters.employeeId !== 'all' && selectedActor && (
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

      {isAdmin && activeFilters.departmentId !== 'all' && selectedDept && (
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

      {isAdmin && activeFilters.taskId !== 'all' && selectedTask && (
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

      {isAdmin && activeFilters.actionType !== 'all' && selectedAction && (
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

      {isAdmin && activeFilters.dateRange !== 'all' && selectedDate && (
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
        onClick={onResetFilters}
        className="text-[11.5px] font-medium text-[#2563EB] hover:underline cursor-pointer ml-1"
      >
        Clear all
      </button>
    </div>
  )}
</div>
  );
}

export default ActivityToolbar;
