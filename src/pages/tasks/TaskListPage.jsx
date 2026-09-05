import React, { useState, useMemo, useEffect } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { isTaskOverdue, isTaskDueSoon } from '../../utils/dateUtils';
import {
  isTaskInDepartment,
  getTaskAssigneeIds,
  getTaskAssistantIds,
  isTaskMyWork,
} from '../../utils/taskDepartmentUtils';
import { canUserViewTask } from '../../utils/rbac/permissionManager';
import { TaskWorkspaceHeader } from '../../components/tasks/TaskWorkspaceHeader';
import { TaskToolbar } from '../../components/tasks/TaskToolbar';
import { TaskFilterChips } from '../../components/tasks/TaskFilterChips';
import { format, addMonths, subMonths } from 'date-fns';
import { TaskListTable } from '../../components/tasks/TaskListTable';
import { MyTasksPlannerList } from '../../components/tasks/MyTasksPlannerList';
import { TaskBoard } from '../../components/tasks/TaskBoard';
import { TaskCalendar } from '../../components/tasks/TaskCalendar';
import { TaskPagination } from '../../components/tasks/TaskPagination';
import { RequestDeleteModal } from '../../components/tasks/RequestDeleteModal';
import { TaskDetailDrawer } from '../../components/tasks/detail/TaskDetailDrawer';
import { EditTaskDrawer } from '../../components/tasks/edit/EditTaskDrawer';

import {
  getLockedFiltersForPage,
  saveLockedFiltersForPage,
  removeLockedFiltersForPage,
  getPersistentUnreadFilter,
  savePersistentUnreadFilter,
  DEFAULT_TASK_FILTERS,
} from '../../utils/taskFilterStorage';
import { getTaskUnreadCount } from '../../utils/comments/unreadCommentSelectors';

export function TaskListPage({ filterType: propFilterType }) {
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const role = currentUser?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const currentUserId = currentUser?.id;

  // Selected row IDs for bulk / multi-row selection
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);

  // Modal State for Request Delete
  const [selectedTaskForDelete, setSelectedTaskForDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Column visibility settings (persisted in localStorage)
  const storageKey = `upcomm_task_columns_${currentUserId || 'default'}`;
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { status: true, ...JSON.parse(saved) };
    } catch {
      // fallback
    }
    return {
      status: true,
      assignee: true,
      assist: true,
      priority: true,
      department: true,
      due_date: true,
      activity: true,
    };
  });

  const handleToggleColumn = (colKey) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [colKey]: prev[colKey] === false ? true : false };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Helper to determine route filter type
  const activeRouteType = useMemo(() => {
    let type = propFilterType;
    if (!type) {
      if (location.pathname.endsWith('/pending-in-progress')) type = 'pending_in_progress';
      else if (location.pathname.endsWith('/assigned-by-admin')) type = 'assigned_by_admin';
      else if (location.pathname.endsWith('/assigned-to-admin')) type = 'assigned_to_admin';
      else if (location.pathname.endsWith('/assigned-by-others')) type = 'assigned_by_others';
      else if (location.pathname.endsWith('/overdue')) type = 'overdue';
      else if (location.pathname.endsWith('/completed')) type = 'completed';
      else type = 'all';
    }

    // Role-dependent canonical mapping:
    // Non-admins (HOD & Team Members) should always map assigned_by_admin/assigned_to_admin to 'assigned_to_admin'
    if (!isAdmin && (type === 'assigned_by_admin' || type === 'assigned_to_admin')) {
      return 'assigned_to_admin';
    }
    // Admins should always map assigned_to_admin/assigned_by_admin to 'assigned_by_admin'
    if (isAdmin && (type === 'assigned_to_admin' || type === 'assigned_by_admin')) {
      return 'assigned_by_admin';
    }

    return type;
  }, [propFilterType, location.pathname, isAdmin]);

  const activeScope = searchParams.get('scope');
  const isMyTasks = activeScope === 'my';

  // Stable semantic page key for user-isolated persistent storage
  const pageKey = useMemo(() => {
    if (isMyTasks) return 'my_tasks';
    return activeRouteType || 'all';
  }, [isMyTasks, activeRouteType]);

  // Local state to trigger lock state changes instantly
  const [lockToggleVersion, setLockToggleVersion] = useState(0);

  // Read locked filters from storage for the current user and page
  const lockedConfig = useMemo(() => {
    return getLockedFiltersForPage({
      userId: currentUserId,
      pageKey,
      departments,
      users,
      currentUser,
    });
  }, [currentUserId, pageKey, departments, users, currentUser, lockToggleVersion]);

  const isFiltersLocked = Boolean(lockedConfig.isLocked);
  const lockedFilters = lockedConfig.filters || {};

  // Read active filters (synchronously prioritizing explicit URL query params, falling back to locked filters if locked)
  const search = searchParams.has('search')
    ? searchParams.get('search')
    : (isFiltersLocked ? (lockedFilters.search || '') : '');

  const showCompleted = searchParams.get('show_completed') === 'true';

  const selectedDept = searchParams.has('department')
    ? searchParams.get('department')
    : (isFiltersLocked ? (lockedFilters.department || 'all') : 'all');

  const selectedStatus = searchParams.has('status')
    ? searchParams.get('status')
    : (isFiltersLocked ? (lockedFilters.status || 'all') : 'all');

  const selectedPriority = searchParams.has('priority')
    ? searchParams.get('priority')
    : (isFiltersLocked ? (lockedFilters.priority || 'all') : 'all');

  const selectedAssignedBy = searchParams.has('assigned_by')
    ? searchParams.get('assigned_by')
    : (isFiltersLocked ? (lockedFilters.assigned_by || 'all') : 'all');

  const selectedAssignedTo = searchParams.has('assigned_to')
    ? searchParams.get('assigned_to')
    : (isFiltersLocked ? (lockedFilters.assigned_to || 'all') : 'all');

  const selectedDue = searchParams.has('due')
    ? searchParams.get('due')
    : (isFiltersLocked ? (lockedFilters.due || 'all') : 'all');

  const unreadFilter = searchParams.has('unread')
    ? (searchParams.get('unread') === 'true' || searchParams.get('unread') === '1')
    : getPersistentUnreadFilter({ userId: currentUserId, pageKey });

  const hideCompleted = searchParams.has('hide_completed')
    ? searchParams.get('hide_completed') === 'true'
    : (isFiltersLocked ? Boolean(lockedFilters.hide_completed) : false);

  const selectedGroup = searchParams.has('group')
    ? searchParams.get('group')
    : (isFiltersLocked ? (lockedFilters.group || 'none') : 'none');

  const selectedSort = searchParams.has('sort')
    ? searchParams.get('sort')
    : (isFiltersLocked ? (lockedFilters.sort || 'default') : 'default');

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const activeView = searchParams.get('view') || 'list';

  const completedSubFilter = searchParams.has('completed_filter')
    ? searchParams.get('completed_filter')
    : (isFiltersLocked ? (lockedFilters.completed_filter || 'all') : 'all');

  const selectedTaskId = searchParams.get('task');
  const editTaskId = searchParams.get('edit');
  const [editOriginIsDetail, setEditOriginIsDetail] = useState(false);

  const handleOpenTask = (taskId) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      navigate(`/tasks/${taskId}`);
      return;
    }
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('edit');
    nextParams.set('task', taskId);
    setSearchParams(nextParams);
  };

  const handleCloseTask = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    setSearchParams(nextParams);
  };

  // On mobile dimension, redirect directly to task detail page if task query param is present
  useEffect(() => {
    if (selectedTaskId && typeof window !== 'undefined' && window.innerWidth < 768) {
      handleCloseTask();
      navigate(`/tasks/${selectedTaskId}`);
    }
  }, [selectedTaskId]);

  const handleOpenEdit = (taskId, fromDetail = false) => {
    setEditOriginIsDetail(fromDetail);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('task');
    nextParams.set('edit', taskId);
    setSearchParams(nextParams);
  };

  const handleCloseEdit = (savedTask) => {
    const nextParams = new URLSearchParams(searchParams);
    const closedEditId = nextParams.get('edit');
    nextParams.delete('edit');
    if (editOriginIsDetail && closedEditId) {
      nextParams.set('task', closedEditId);
    }
    setEditOriginIsDetail(false);
    setSearchParams(nextParams);
  };

  // Helper to update query params safely and reset page to 1
  const updateQueryParam = (key, value, shouldResetPage = true) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'all' || value === 'none' || value === 'default' || value === '' || value === false || value === null) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
        if (shouldResetPage) {
          next.delete('page');
        }
        return next;
      },
      { replace: true }
    );

    // If page is locked, auto-save the updated filter value immediately
    if (isFiltersLocked && currentUserId) {
      const currentFilters = {
        search: key === 'search' ? value : search,
        department: key === 'department' ? value : selectedDept,
        status: key === 'status' ? value : selectedStatus,
        priority: key === 'priority' ? value : selectedPriority,
        assigned_to: key === 'assigned_to' ? value : selectedAssignedTo,
        assigned_by: key === 'assigned_by' ? value : selectedAssignedBy,
        due: key === 'due' ? value : selectedDue,
        unread: key === 'unread' ? Boolean(value) : unreadFilter,
        hide_completed: key === 'hide_completed' ? Boolean(value) : hideCompleted,
        group: key === 'group' ? value : selectedGroup,
        sort: key === 'sort' ? value : selectedSort,
        completed_filter: key === 'completed_filter' ? value : completedSubFilter,
      };

      saveLockedFiltersForPage({
        userId: currentUserId,
        pageKey,
        filters: currentFilters,
      });
      setLockToggleVersion((v) => v + 1);
    }
  };

  const setSearch = (val) => updateQueryParam('search', val);
  const setSelectedDept = (val) => updateQueryParam('department', val);
  const setSelectedStatus = (val) => updateQueryParam('status', val);
  const setSelectedPriority = (val) => updateQueryParam('priority', val);
  const setSelectedAssignedBy = (val) => updateQueryParam('assigned_by', val);
  const setSelectedAssignedTo = (val) => updateQueryParam('assigned_to', val);
  const setSelectedDue = (val) => updateQueryParam('due', val);
  const setUnreadFilter = (val) => {
    const nextBool = Boolean(val);
    savePersistentUnreadFilter({
      userId: currentUserId,
      pageKey,
      isActive: nextBool,
    });
    updateQueryParam('unread', nextBool ? 'true' : false);
  };
  const setHideCompleted = (val) => updateQueryParam('hide_completed', val);
  const setSelectedGroup = (val) => updateQueryParam('group', val, false);
  const setSelectedSort = (val) => updateQueryParam('sort', val, false);
  const setCurrentPage = (val) => updateQueryParam('page', val, false);
  const setActiveView = (val) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (val === 'list' || !val) {
          next.delete('view');
        } else {
          next.set('view', val);
        }
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  };
  const setCompletedSubFilter = (val) => updateQueryParam('completed_filter', val);

  const handleToggleLockFilters = () => {
    if (isFiltersLocked) {
      // UNLOCK: Remove saved configuration from storage, but keep currently visible filters active in current session
      removeLockedFiltersForPage({
        userId: currentUserId,
        pageKey,
      });

      // Keep current active filters in URL query params so they stay visible in current session
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (search) next.set('search', search);
          if (selectedDept !== 'all') next.set('department', selectedDept);
          if (selectedStatus !== 'all') next.set('status', selectedStatus);
          if (selectedPriority !== 'all') next.set('priority', selectedPriority);
          if (selectedAssignedTo !== 'all') next.set('assigned_to', selectedAssignedTo);
          if (selectedAssignedBy !== 'all') next.set('assigned_by', selectedAssignedBy);
          if (selectedDue !== 'all') next.set('due', selectedDue);
          if (unreadFilter) next.set('unread', 'true');
          if (hideCompleted) next.set('hide_completed', 'true');
          if (selectedGroup !== 'none') next.set('group', selectedGroup);
          if (selectedSort !== 'default') next.set('sort', selectedSort);
          if (completedSubFilter !== 'all') next.set('completed_filter', completedSubFilter);
          return next;
        },
        { replace: true }
      );

      setLockToggleVersion((v) => v + 1);
    } else {
      // LOCK: Persist current filters under this specific page & authenticated user
      const filtersToSave = {
        search,
        department: selectedDept,
        status: selectedStatus,
        priority: selectedPriority,
        assigned_to: selectedAssignedTo,
        assigned_by: selectedAssignedBy,
        due: selectedDue,
        unread: unreadFilter,
        hide_completed: hideCompleted,
        group: selectedGroup,
        sort: selectedSort,
        completed_filter: completedSubFilter,
      };

      saveLockedFiltersForPage({
        userId: currentUserId,
        pageKey,
        filters: filtersToSave,
      });

      setLockToggleVersion((v) => v + 1);
    }
  };

  // Calendar month state synced with URL ?month=YYYY-MM
  const monthParam = searchParams.get('month');
  const currentMonth = useMemo(() => {
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split('-').map(Number);
      if (m >= 1 && m <= 12 && y >= 2000 && y <= 2100) {
        return new Date(y, m - 1, 1);
      }
    }
    return new Date();
  }, [monthParam]);

  const updateMonthParam = (newMonthKey) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const currentMonthKey = format(new Date(), 'yyyy-MM');
        if (newMonthKey === currentMonthKey) {
          next.delete('month');
        } else {
          next.set('month', newMonthKey);
        }
        return next;
      },
      { replace: false }
    );
  };

  const handlePrevMonth = () => {
    const prevDate = subMonths(currentMonth, 1);
    updateMonthParam(format(prevDate, 'yyyy-MM'));
  };

  const handleNextMonth = () => {
    const nextDate = addMonths(currentMonth, 1);
    updateMonthParam(format(nextDate, 'yyyy-MM'));
  };

  const handleToday = () => {
    updateMonthParam(format(new Date(), 'yyyy-MM'));
  };

  // Clear all toolbar filters while keeping route and scope constraints
  const handleResetFilters = () => {
    // Intentionally clear persistent unread filter state for this user/page
    savePersistentUnreadFilter({
      userId: currentUserId,
      pageKey,
      isActive: false,
    });

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        if (prev.get('scope')) next.set('scope', prev.get('scope'));
        if (prev.get('view')) next.set('view', prev.get('view'));
        if (prev.get('month')) next.set('month', prev.get('month'));
        if (prev.get('show_completed')) next.set('show_completed', prev.get('show_completed'));
        if (prev.get('completed_filter')) next.set('completed_filter', prev.get('completed_filter'));
        return next;
      },
      { replace: true }
    );

    // If currently locked, updating filters to cleared state also updates the saved lock config
    if (isFiltersLocked && currentUserId) {
      saveLockedFiltersForPage({
        userId: currentUserId,
        pageKey,
        filters: {
          ...DEFAULT_TASK_FILTERS,
          completed_filter: completedSubFilter,
        },
      });
    }
  };

  // Helper to check user participation
  const isAssignedToCurrentUser = (task) => {
    if (!currentUserId || !task) return false;
    const assigneeIds = getTaskAssigneeIds(task);
    const isDirectAssignee = task.assigned_to === currentUserId || assigneeIds.includes(currentUserId);
    const assistantIds = getTaskAssistantIds(task);
    const isAssistant = task.assisted_by === currentUserId || assistantIds.includes(currentUserId);
    return isDirectAssignee || isAssistant;
  };

  const isAssignedByCurrentUser = (task) => {
    if (!currentUserId || !task) return false;
    const creatorId =
      typeof task.created_by === 'object' && task.created_by !== null
        ? task.created_by.id
        : task.created_by;
    const assignerId =
      typeof task.assigned_by === 'object' && task.assigned_by !== null
        ? task.assigned_by.id
        : task.assigned_by;
    return creatorId === currentUserId || assignerId === currentUserId;
  };

  // 1. Role Scoping Pipeline (Unified RBAC)
  const scopedTasks = useMemo(() => {
    const activeTasks = (tasks || []).filter((t) => !t.is_deleted);
    return activeTasks.filter((t) => canUserViewTask(currentUser, t, users, departments));
  }, [tasks, currentUser, users, departments]);

  // Calculate unread tasks count for the filter badge
  const unreadCount = useMemo(() => {
    return scopedTasks.filter((task) => {
      return getTaskUnreadCount(task, currentUserId, readChatIds) > 0;
    }).length;
  }, [scopedTasks, currentUserId, readChatIds]);

  // 2. Route & Scope Filtering Pipeline
  const routeFilteredTasks = useMemo(() => {
    let list = scopedTasks;

    // Apply Personal Work Scope (scope=my)
    if (isMyTasks) {
      list = list.filter((task) => isTaskMyWork(task, currentUser));
    }

    const adminUserIds = new Set(
      (users || [])
        .filter((u) => {
          const r = (u.role || '').toLowerCase();
          return r === 'admin' || r === 'it_support_admin';
        })
        .map((u) => u.id)
    );

    return list.filter((task) => {
      if (activeRouteType === 'pending_in_progress') {
        if (task.status !== 'pending' && task.status !== 'in_progress') return false;
      } else if (activeRouteType === 'overdue') {
        if (!isTaskOverdue(task.due_date, task.status)) return false;
      } else if (activeRouteType === 'completed') {
        if (task.status !== 'completed') return false;
        if (completedSubFilter === 'assigned_by_admin' && !isAssignedByCurrentUser(task)) return false;
        if (completedSubFilter === 'assigned_to_admin' && !isAssignedToCurrentUser(task)) return false;
        if (completedSubFilter === 'assigned_by_others' && isAssignedByCurrentUser(task)) return false;
      } else if (activeRouteType === 'assigned_by_admin') {
        if (!isAssignedByCurrentUser(task)) return false;
      } else if (activeRouteType === 'assigned_to_admin') {
        // Strictly show tasks created by the user and assigned to an Admin
        if (!isAssignedByCurrentUser(task)) return false;
        const taskAssigneeIds = getTaskAssigneeIds(task);
        const isAssignedToAdmin =
          (task.assigned_to && adminUserIds.has(task.assigned_to)) ||
          (task.assigned_to_id && adminUserIds.has(task.assigned_to_id)) ||
          taskAssigneeIds.some((id) => adminUserIds.has(id));
        if (!isAssignedToAdmin) return false;
      } else if (activeRouteType === 'assigned_by_others') {
        if (isAssignedByCurrentUser(task)) return false;
      }
      return true;
    });
  }, [scopedTasks, isMyTasks, activeRouteType, completedSubFilter, currentUserId, currentUser, users]);

  // 3. Search & Toolbar Filtering Pipeline
  const filteredTasks = useMemo(() => {
    return routeFilteredTasks.filter((task) => {
      // Search query filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const taskNum = (task.task_number || '').toLowerCase();
        const title = (task.title || '').toLowerCase();
        const desc = (task.description || '').toLowerCase();
        const matchesText =
          taskNum.includes(query) || title.includes(query) || desc.includes(query);
        if (!matchesText) return false;
      }

      // Department filter (multi-select supported)
      if (selectedDept !== 'all' && selectedDept) {
        const deptIds = selectedDept.split(',').filter(Boolean);
        if (deptIds.length > 0) {
          const matchDept = deptIds.some((deptId) => isTaskInDepartment(task, deptId, users));
          if (!matchDept) return false;
        }
      }

      // Status filter
      if (selectedStatus !== 'all') {
        if (task.status !== selectedStatus) return false;
      }

      // Priority filter
      if (selectedPriority !== 'all') {
        if ((task.priority || 'medium').toLowerCase() !== selectedPriority.toLowerCase()) {
          return false;
        }
      }

      // Assigned By filter
      if (selectedAssignedBy !== 'all') {
        const createdMatch = task.created_by === selectedAssignedBy;
        const assignedMatch = task.assigned_by === selectedAssignedBy;
        if (!createdMatch && !assignedMatch) return false;
      }

      // Assigned To filter (All Tasks only, multi-select supported)
      if (!isMyTasks && selectedAssignedTo !== 'all' && selectedAssignedTo) {
        const assigneeIds = selectedAssignedTo.split(',').filter(Boolean);
        if (assigneeIds.length > 0) {
          const taskAssignees = getTaskAssigneeIds(task);
          const matchAssignee = assigneeIds.some(
            (uid) => task.assigned_to === uid || taskAssignees.includes(uid)
          );
          if (!matchAssignee) return false;
        }
      }

      // Due Date filter
      if (selectedDue !== 'all') {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

        if (selectedDue === 'today') {
          if (!task.due_date || task.due_date.slice(0, 10) !== todayStr) return false;
        } else if (selectedDue === 'tomorrow') {
          if (!task.due_date || task.due_date.slice(0, 10) !== tomorrowStr) return false;
        } else if (selectedDue === 'overdue') {
          if (!isTaskOverdue(task.due_date, task.status)) return false;
        } else if (selectedDue === 'due_soon') {
          if (!isTaskDueSoon(task.due_date, task.status)) return false;
        } else if (selectedDue === 'no_due') {
          if (task.due_date) return false;
        } else if (selectedDue === 'this_week') {
          if (!task.due_date) return false;
          const due = new Date(task.due_date);
          const now = new Date();
          const diffDays = (due - now) / (1000 * 60 * 60 * 24);
          if (diffDays < 0 || diffDays > 7) return false;
        }
      }

      // Unread Filter (Only show tasks where current user has at least one unread message/comment)
      if (unreadFilter) {
        const hasUnread = getTaskUnreadCount(task, currentUserId, readChatIds) > 0;
        if (!hasUnread) return false;
      }

      // Hide completed filter
      if (hideCompleted && task.status === 'completed') {
        return false;
      }

      return true;
    });
  }, [
    routeFilteredTasks,
    search,
    selectedDept,
    selectedStatus,
    selectedPriority,
    selectedAssignedBy,
    selectedAssignedTo,
    selectedDue,
    unreadFilter,
    hideCompleted,
    isMyTasks,
    users,
    currentUserId,
    readChatIds,
  ]);

  // 4. Sorting Pipeline
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];

    const priorityWeight = { urgent: 4, high: 3, medium: 2, low: 1 };

    switch (selectedSort) {
      case 'newest':
        return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'due_earliest':
        return list.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date) - new Date(b.due_date);
        });
      case 'due_latest':
        return list.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(b.due_date) - new Date(a.due_date);
        });
      case 'priority_high':
        return list.sort(
          (a, b) =>
            (priorityWeight[b.priority?.toLowerCase()] || 0) -
            (priorityWeight[a.priority?.toLowerCase()] || 0)
        );
      case 'priority_low':
        return list.sort(
          (a, b) =>
            (priorityWeight[a.priority?.toLowerCase()] || 0) -
            (priorityWeight[b.priority?.toLowerCase()] || 0)
        );
      case 'name_asc':
        return list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'default':
      default:
        // Smart Sort: Overdue first, then by priority, then by earliest due date
        return list.sort((a, b) => {
          const aOverdue = isTaskOverdue(a.due_date, a.status);
          const bOverdue = isTaskOverdue(b.due_date, b.status);
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;

          const pA = priorityWeight[a.priority?.toLowerCase()] || 0;
          const pB = priorityWeight[b.priority?.toLowerCase()] || 0;
          if (pA !== pB) return pB - pA;

          if (a.due_date && b.due_date) {
            return new Date(a.due_date) - new Date(b.due_date);
          }
          if (a.due_date) return -1;
          if (b.due_date) return 1;

          return new Date(b.created_at) - new Date(a.created_at);
        });
    }
  }, [filteredTasks, selectedSort]);

  // 5. Pagination Pipeline (All Tasks List View only)
  const pageSize = 10;
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedTasks.slice(startIndex, startIndex + pageSize);
  }, [sortedTasks, currentPage, pageSize]);

  // Selection handlers
  const handleToggleSelectTask = (taskId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleToggleSelectAll = (allVisibleIds, isChecked) => {
    if (isChecked) {
      setSelectedTaskIds((prev) => Array.from(new Set([...prev, ...allVisibleIds])));
    } else {
      setSelectedTaskIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)));
    }
  };

  // Row Delete Actions
  const handleRequestDelete = (task) => {
    setSelectedTaskForDelete(task);
    setIsDeleteModalOpen(true);
  };

  const handleDirectDelete = async (task) => {
    if (!task?.id) return;
    if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
      await softDeleteTask(task.id);
    }
  };

  // Dynamic Page Title & Subtitle
  const pageTitle = isMyTasks
    ? 'My Tasks'
    : (() => {
        switch (activeRouteType) {
          case 'pending_in_progress':
          case 'pending-in-progress':
            return 'Pending & in Progress';
          case 'overdue':
            return 'Overdue Tasks';
          case 'completed':
            return 'Completed Tasks';
          case 'assigned-by-admin':
          case 'assigned_by_admin':
            return 'Assigned by Admin';
          case 'assigned-to-admin':
          case 'assigned_to_admin':
            return 'Assigned to Admin';
          case 'assigned-by-others':
          case 'assigned_by_others':
            return 'Assigned By Others';
          default:
            return 'All Tasks';
        }
      })();

  const pageSubtitle = isMyTasks
    ? 'Tasks assigned to you.'
    : activeRouteType === 'assigned_to_admin'
    ? 'Tasks created by you and assigned to Admin.'
    : undefined;

  const hasActiveFilters =
    search ||
    selectedDept !== 'all' ||
    selectedStatus !== 'all' ||
    selectedPriority !== 'all' ||
    selectedAssignedBy !== 'all' ||
    (!isMyTasks && selectedAssignedTo !== 'all') ||
    selectedDue !== 'all' ||
    unreadFilter ||
    hideCompleted;

  return (
    <div className="space-y-4 max-w-full">
      {/* 1. Workspace Header with View Tabs */}
      <TaskWorkspaceHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        userRole={role}
        activeView={activeView}
        onViewChange={setActiveView}
        search={search}
        onSearchChange={setSearch}
        isMyTasks={isMyTasks}
      />

      {/* 2. Completed Sub-filter Tabs (on /tasks/completed - Admin Only) */}
      {!isMyTasks && isAdmin && activeRouteType === 'completed' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
          {[
            { id: 'all', label: 'All Completed' },
            { id: 'assigned_by_admin', label: 'Assigned by You' },
            { id: 'assigned_to_admin', label: 'Assigned to You' },
            { id: 'assigned_by_others', label: 'Assigned by Others' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCompletedSubFilter(tab.id)}
              className={`px-3 py-1.5 rounded-[7px] text-[12.5px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                completedSubFilter === tab.id
                  ? 'bg-[#18181B] text-white font-semibold'
                  : 'bg-white hover:bg-[#F5F6F8] text-[#52525B] border border-[#E5E7EB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. Toolbar Controls */}
      <TaskToolbar
        search={search}
        onSearchChange={setSearch}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedAssignedBy={selectedAssignedBy}
        onAssignedByChange={setSelectedAssignedBy}
        selectedAssignedTo={selectedAssignedTo}
        onAssignedToChange={setSelectedAssignedTo}
        selectedDept={selectedDept}
        onDeptChange={setSelectedDept}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        selectedDue={selectedDue}
        onDueChange={setSelectedDue}
        unreadFilter={unreadFilter}
        onUnreadFilterChange={setUnreadFilter}
        hideCompleted={hideCompleted}
        onHideCompletedChange={setHideCompleted}
        unreadCount={unreadCount}
        selectedGroup={selectedGroup}
        onGroupChange={setSelectedGroup}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        isFiltersLocked={isFiltersLocked}
        onToggleLockFilters={handleToggleLockFilters}
        activeView={activeView}
        isMyTasks={isMyTasks}
        currentMonth={currentMonth}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
        users={users}
        departments={departments}
        isAdmin={isAdmin}
        isStatusLocked={activeRouteType === 'completed' || activeRouteType === 'overdue'}
      />

      {/* 4. Active Filter Chips */}
      <TaskFilterChips
        search={search}
        onClearSearch={() => setSearch('')}
        selectedStatus={selectedStatus}
        onClearStatus={() => setSelectedStatus('all')}
        selectedDept={selectedDept}
        onClearDept={(val) => setSelectedDept(typeof val === 'string' ? val : 'all')}
        selectedPriority={selectedPriority}
        onClearPriority={() => setSelectedPriority('all')}
        selectedAssignedTo={selectedAssignedTo}
        onClearAssignedTo={(val) => setSelectedAssignedTo(typeof val === 'string' ? val : 'all')}
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
        isStatusLocked={activeRouteType === 'completed' || activeRouteType === 'overdue'}
      />

      {/* 5. Main Task Workspace Content (Calendar vs Board vs List vs MyTasksPlanner) */}
      {activeView === 'calendar' ? (
        <TaskCalendar
          tasks={sortedTasks}
          currentMonth={currentMonth}
          users={users}
          departments={departments}
          onOpenTask={handleOpenTask}
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
          onOpenTask={handleOpenTask}
          onEditTask={handleOpenEdit}
          unreadFilter={unreadFilter}
          onClearUnread={() => setUnreadFilter(false)}
        />
      ) : isMyTasks ? (
        <MyTasksPlannerList
          tasks={sortedTasks}
          showCompleted={showCompleted}
          onToggleShowCompleted={() => updateQueryParam('show_completed', !showCompleted, false)}
          currentUser={currentUser}
          users={users}
          departments={departments}
          completionRequests={completionRequests}
          readChatIds={readChatIds}
          selectedTaskIds={selectedTaskIds}
          onToggleSelectTask={handleToggleSelectTask}
          onToggleSelectAll={handleToggleSelectAll}
          onUpdateStatus={updateTaskStatus}
          onUpdatePriority={(taskId, priority) => updateTask(taskId, { priority })}
          onRequestCompletion={requestTaskCompletion}
          onRequestDelete={handleRequestDelete}
          onDirectDelete={handleDirectDelete}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onOpenTask={handleOpenTask}
          onEditTask={handleOpenEdit}
          unreadFilter={unreadFilter}
          onClearUnread={() => setUnreadFilter(false)}
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
            onOpenTask={handleOpenTask}
            onEditTask={handleOpenEdit}
            unreadFilter={unreadFilter}
            onClearUnread={() => setUnreadFilter(false)}
          />

          {/* 6. Pagination Footer (All Tasks List View only) */}
          {sortedTasks.length > 0 && (
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

      {/* 7. Task Detail Drawer (Right-side slide panel) */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          onClose={handleCloseTask}
          onEditTask={(id) => handleOpenEdit(id, true)}
        />
      )}

      {/* 8. Edit Task Drawer (Right-side slide panel) */}
      {editTaskId && (
        <EditTaskDrawer
          taskId={editTaskId}
          isOpen={Boolean(editTaskId)}
          onClose={handleCloseEdit}
        />
      )}
    </div>
  );
}
