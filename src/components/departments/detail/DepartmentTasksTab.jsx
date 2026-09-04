import React, { useState, useMemo } from 'react';
import { useAppData } from '../../../contexts/AppDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { isTaskInDepartment, getTaskAssigneeIds } from '../../../utils/taskDepartmentUtils';
import { isTaskOverdue, isTaskDueSoon } from '../../../utils/dateUtils';
import { TaskToolbar } from '../../tasks/TaskToolbar';
import { TaskFilterChips } from '../../tasks/TaskFilterChips';
import { TaskListTable } from '../../tasks/TaskListTable';
import { TaskBoard } from '../../tasks/TaskBoard';
import { TaskCalendar } from '../../tasks/TaskCalendar';
import { TaskPagination } from '../../tasks/TaskPagination';
import { RequestDeleteModal } from '../../tasks/RequestDeleteModal';
import { format, addMonths, subMonths } from 'date-fns';

export function DepartmentTasksTab({
  department,
  onOpenTask,
  onEditTask,
}) {
  const {
    tasks = [],
    departments = [],
    completionRequests = [],
    readChatIds = [],
    softDeleteTask,
    updateTask,
    updateTaskStatus,
    requestTaskCompletion,
  } = useAppData();
  const { currentUser, users = [] } = useAuth();

  const role = currentUser?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'it_support_admin';

  // Local filter states
  const [activeView, setActiveView] = useState('list'); // 'list' | 'board' | 'calendar'
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedAssignedTo, setSelectedAssignedTo] = useState('all');
  const [selectedAssignedBy, setSelectedAssignedBy] = useState('all');
  const [selectedDue, setSelectedDue] = useState('all');
  const [unreadFilter, setUnreadFilter] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState('none');
  const [selectedSort, setSelectedSort] = useState('default');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Calendar month state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal State for Request Delete
  const [selectedTaskForDelete, setSelectedTaskForDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    assignee: true,
    assist: true,
    priority: true,
    department: false, // hidden since scope is locked to this department
    due_date: true,
    activity: true,
  });

  const handleToggleColumn = (colKey) => {
    setVisibleColumns((prev) => ({ ...prev, [colKey]: !prev[colKey] }));
  };

  // 1. Filter tasks strictly to this department
  const departmentTasks = useMemo(() => {
    if (!department?.id) return [];
    return (tasks || []).filter(
      (t) => !t.is_deleted && isTaskInDepartment(t, department.id, users)
    );
  }, [tasks, department?.id, users]);

  // 2. Apply toolbar filters
  const filteredTasks = useMemo(() => {
    return departmentTasks.filter((t) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = t.title?.toLowerCase().includes(q);
        const matchNum = t.task_number?.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchNum && !matchDesc) return false;
      }

      // Status
      if (selectedStatus !== 'all' && t.status !== selectedStatus) return false;

      // Hide completed
      if (hideCompleted && t.status === 'completed') return false;

      // Priority
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

      // Assignee
      if (selectedAssignedTo !== 'all') {
        const assigneeIds = getTaskAssigneeIds(t);
        if (!assigneeIds.includes(selectedAssignedTo)) return false;
      }

      // Assigned By
      if (selectedAssignedBy !== 'all' && t.created_by !== selectedAssignedBy && t.assigned_by !== selectedAssignedBy) {
        return false;
      }

      // Due filter
      if (selectedDue !== 'all') {
        const isOverdue = isTaskOverdue(t.due_date, t.status);
        const isDueToday = isTaskDueSoon(t.due_date, t.status, 0);
        const isDueThisWeek = isTaskDueSoon(t.due_date, t.status, 7);

        if (selectedDue === 'overdue' && !isOverdue) return false;
        if (selectedDue === 'today' && !isDueToday) return false;
        if (selectedDue === 'week' && !isDueThisWeek) return false;
      }

      // Unread filter
      if (unreadFilter) {
        const updates = t.task_updates || [];
        const hasUnread = updates.some((u) => !readChatIds.includes(u.id));
        if (!hasUnread) return false;
      }

      return true;
    });
  }, [
    departmentTasks,
    search,
    selectedStatus,
    hideCompleted,
    selectedPriority,
    selectedAssignedTo,
    selectedAssignedBy,
    selectedDue,
    unreadFilter,
    readChatIds,
  ]);

  // 3. Sort tasks
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    if (selectedSort === 'priority_desc') {
      const pWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
      list.sort((a, b) => (pWeights[b.priority] || 0) - (pWeights[a.priority] || 0));
    } else if (selectedSort === 'priority_asc') {
      const pWeights = { urgent: 4, high: 3, medium: 2, low: 1 };
      list.sort((a, b) => (pWeights[a.priority] || 0) - (pWeights[b.priority] || 0));
    } else if (selectedSort === 'due_asc') {
      list.sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'));
    } else if (selectedSort === 'due_desc') {
      list.sort((a, b) => (b.due_date || '').localeCompare(a.due_date || ''));
    } else if (selectedSort === 'created_desc') {
      list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
    }
    return list;
  }, [filteredTasks, selectedSort]);

  // Paginated tasks for list view
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTasks.slice(start, start + pageSize);
  }, [sortedTasks, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedAssignedTo('all');
    setSelectedAssignedBy('all');
    setSelectedDue('all');
    setUnreadFilter(false);
    setHideCompleted(false);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(search) ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all' ||
    selectedAssignedTo !== 'all' ||
    selectedAssignedBy !== 'all' ||
    selectedDue !== 'all' ||
    unreadFilter ||
    hideCompleted;

  const handleRequestDelete = (task) => {
    setSelectedTaskForDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleDirectDelete = async (taskId) => {
    if (softDeleteTask) {
      await softDeleteTask(taskId, currentUser?.id);
    }
  };

  // Department members for assignee filter dropdown
  const departmentMembers = useMemo(() => {
    return (users || []).filter(
      (u) =>
        u &&
        u.department_id === department?.id &&
        !u.exclude_from_directory &&
        !u.is_system_account
    );
  }, [users, department?.id]);

  return (
    <div className="space-y-4 select-none">
      {/* 1. Task Toolbar */}
      <TaskToolbar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        selectedStatus={selectedStatus}
        onStatusChange={(val) => {
          setSelectedStatus(val);
          setCurrentPage(1);
        }}
        selectedDept="all"
        onDeptChange={() => {}}
        selectedPriority={selectedPriority}
        onPriorityChange={(val) => {
          setSelectedPriority(val);
          setCurrentPage(1);
        }}
        selectedAssignedBy={selectedAssignedBy}
        onAssignedByChange={(val) => {
          setSelectedAssignedBy(val);
          setCurrentPage(1);
        }}
        selectedAssignedTo={selectedAssignedTo}
        onAssignedToChange={(val) => {
          setSelectedAssignedTo(val);
          setCurrentPage(1);
        }}
        selectedDue={selectedDue}
        onDueChange={(val) => {
          setSelectedDue(val);
          setCurrentPage(1);
        }}
        unreadFilter={unreadFilter}
        onUnreadFilterChange={(val) => {
          setUnreadFilter(val);
          setCurrentPage(1);
        }}
        hideCompleted={hideCompleted}
        onHideCompletedChange={(val) => {
          setHideCompleted(val);
          setCurrentPage(1);
        }}
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        selectedSort={selectedSort}
        onSortChange={setSelectedSort}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        activeView={activeView}
        onViewChange={setActiveView}
        currentMonth={currentMonth}
        onPrevMonth={() => setCurrentMonth(subMonths(currentMonth, 1))}
        onNextMonth={() => setCurrentMonth(addMonths(currentMonth, 1))}
        onToday={() => setCurrentMonth(new Date())}
        users={departmentMembers.length > 0 ? departmentMembers : users}
        departments={departments}
        isAdmin={isAdmin}
      />

      {/* 2. Filter Chips */}
      {hasActiveFilters && (
        <TaskFilterChips
          search={search}
          onClearSearch={() => setSearch('')}
          selectedStatus={selectedStatus}
          onClearStatus={() => setSelectedStatus('all')}
          selectedDept="all"
          onClearDept={() => {}}
          selectedPriority={selectedPriority}
          onClearPriority={() => setSelectedPriority('all')}
          selectedAssignedTo={selectedAssignedTo}
          onClearAssignedTo={() => setSelectedAssignedTo('all')}
          selectedAssignedBy={selectedAssignedBy}
          onClearAssignedBy={() => setSelectedAssignedBy('all')}
          selectedDue={selectedDue}
          onClearDue={() => setSelectedDue('all')}
          unreadFilter={unreadFilter}
          onClearUnread={() => setUnreadFilter(false)}
          hideCompleted={hideCompleted}
          onClearHideCompleted={() => setHideCompleted(false)}
          onClearAll={handleResetFilters}
          users={users}
          departments={departments}
        />
      )}

      {/* 3. Main Views: List vs Board vs Calendar */}
      {activeView === 'calendar' ? (
        <TaskCalendar
          tasks={sortedTasks}
          currentMonth={currentMonth}
          users={users}
          departments={departments}
          onOpenTask={onOpenTask}
        />
      ) : activeView === 'board' ? (
        <TaskBoard
          tasks={sortedTasks}
          currentUser={currentUser}
          users={users}
          departments={departments}
          completionRequests={completionRequests}
          readChatIds={readChatIds}
          onUpdateStatus={updateTaskStatus}
          onRequestCompletion={requestTaskCompletion}
          onRequestDelete={handleRequestDelete}
          onDirectDelete={handleDirectDelete}
          onOpenTask={onOpenTask}
          onEditTask={onEditTask}
        />
      ) : (
        <div>
          <TaskListTable
            tasks={paginatedTasks}
            currentUser={currentUser}
            users={users}
            departments={departments}
            completionRequests={completionRequests}
            readChatIds={readChatIds}
            onUpdateStatus={updateTaskStatus}
            onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
            onRequestCompletion={requestTaskCompletion}
            onRequestDelete={handleRequestDelete}
            onDirectDelete={handleDirectDelete}
            visibleColumns={visibleColumns}
            selectedGroup={selectedGroup}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={handleResetFilters}
            onOpenTask={onOpenTask}
            onEditTask={onEditTask}
          />

          {sortedTasks.length > pageSize && (
            <TaskPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalTasks={sortedTasks.length}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* Request Delete Modal */}
      <RequestDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedTaskForDelete(null);
        }}
        task={selectedTaskForDelete}
      />
    </div>
  );
}
