import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { getNormalizedActivities } from '../../utils/activity/normalizeActivity';
import { scopeActivitiesByRole } from '../../utils/activity/activityPermissions';
import { filterActivities } from '../../utils/activity/filterActivity';
import ActivityToolbar from '../../components/activity/ActivityToolbar';
import ActivityTimeline from '../../components/activity/ActivityTimeline';
import ActivityTable from '../../components/activity/ActivityTable';
import ActivityEmptyState from '../../components/activity/ActivityEmptyState';
import { TaskDetailDrawer } from '../../components/tasks/detail/TaskDetailDrawer';
import { EditTaskDrawer } from '../../components/tasks/edit/EditTaskDrawer';
import { Clock, Table2 } from 'lucide-react';

const INITIAL_PAGE_SIZE = 25;
const PAGE_SIZE_STEP = 25;

export function ActivityLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activityLogs = [], tasks = [], departments = [] } = useAppData();
  const { currentUser, users = [] } = useAuth();

  // 1. View Switcher Mode (?view=timeline | ?view=table)
  const rawView = searchParams.get('view');
  const viewMode = rawView === 'table' ? 'table' : 'timeline';

  const setViewMode = (newView) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newView === 'table') {
        next.set('view', 'table');
      } else {
        next.delete('view');
      }
      return next;
    });
  };

  // 2. Filter States (URL params / component state)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [employeeId, setEmployeeId] = useState(searchParams.get('user') || 'all');
  const [departmentId, setDepartmentId] = useState(searchParams.get('dept') || 'all');
  const [taskId, setTaskId] = useState(searchParams.get('task') || 'all');
  const [actionType, setActionType] = useState(searchParams.get('action') || 'all');
  const [dateRange, setDateRange] = useState(searchParams.get('date') || 'all');

  // Pagination limit state
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_PAGE_SIZE);

  // Task Drawer states
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [editTaskId, setEditTaskId] = useState(null);

  // Synchronize state changes with URL query parameters for shareable URLs
  const updateFilterParam = (key, value, setter) => {
    setter(value);
    setVisibleLimit(INITIAL_PAGE_SIZE);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all' && value !== '') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleSearchChange = (val) => updateFilterParam('q', val, setSearchQuery);
  const handleEmployeeChange = (val) => updateFilterParam('user', val, setEmployeeId);
  const handleDepartmentChange = (val) => updateFilterParam('dept', val, setDepartmentId);
  const handleTaskChange = (val) => updateFilterParam('task', val, setTaskId);
  const handleActionChange = (val) => updateFilterParam('action', val, setActionType);
  const handleDateRangeChange = (val) => updateFilterParam('date', val, setDateRange);

  const handleResetFilters = () => {
    setSearchQuery('');
    setEmployeeId('all');
    setDepartmentId('all');
    setTaskId('all');
    setActionType('all');
    setDateRange('all');
    setVisibleLimit(INITIAL_PAGE_SIZE);
    setSearchParams((prev) => {
      const next = new URLSearchParams();
      if (viewMode === 'table') {
        next.set('view', 'table');
      }
      return next;
    });
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    employeeId !== 'all' ||
    departmentId !== 'all' ||
    taskId !== 'all' ||
    actionType !== 'all' ||
    dateRange !== 'all'
  );

  // 3. Core Data Processing Pipeline
  // Step A: Normalize and deduplicate all raw events across activityLogs and tasks
  const normalizedActivities = useMemo(() => {
    return getNormalizedActivities({
      activityLogs,
      tasks,
      users,
      departments,
    });
  }, [activityLogs, tasks, users, departments]);

  // Step B: Scope activities strictly according to the current user's role and authorization
  const scopedActivities = useMemo(() => {
    return scopeActivitiesByRole({
      activities: normalizedActivities,
      currentUser,
      users,
    });
  }, [normalizedActivities, currentUser, users]);

  // Step C: Apply all 6 multi-criteria filters
  const filteredActivities = useMemo(() => {
    return filterActivities(scopedActivities, {
      searchQuery,
      employeeId,
      departmentId,
      taskId,
      actionType,
      dateRange,
      users,
    });
  }, [
    scopedActivities,
    searchQuery,
    employeeId,
    departmentId,
    taskId,
    actionType,
    dateRange,
    users,
  ]);

  // Sliced activities for progressive pagination
  const visibleActivities = useMemo(() => {
    return filteredActivities.slice(0, visibleLimit);
  }, [filteredActivities, visibleLimit]);

  const hasMore = filteredActivities.length > visibleLimit;

  const handleLoadMore = () => {
    setVisibleLimit((prev) => prev + PAGE_SIZE_STEP);
  };

  // Scoped Dropdown Filter Options to prevent data leakage in filters
  const role = (currentUser?.role || 'team_member').toLowerCase();
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHod = role === 'hod';

  const authorizedDepartments = useMemo(() => {
    if (isAdmin) return departments;
    if (isHod && currentUser?.department_id) {
      return departments.filter((d) => String(d.id) === String(currentUser.department_id));
    }
    if (currentUser?.department_id) {
      return departments.filter((d) => String(d.id) === String(currentUser.department_id));
    }
    return [];
  }, [departments, isAdmin, isHod, currentUser]);

  const authorizedUsers = useMemo(() => {
    const visibleUsers = (users || []).filter(
      (u) => !u.exclude_from_directory && !u.is_system_account
    );
    if (isAdmin) return visibleUsers;
    if (isHod && currentUser?.department_id) {
      return visibleUsers.filter((u) => String(u.department_id) === String(currentUser.department_id));
    }
    // For Team Member, derive users from scoped activities
    const actorIds = new Set(scopedActivities.map((a) => a.actor?.id || a.user_id).filter(Boolean));
    actorIds.add(currentUser?.id);
    return visibleUsers.filter((u) => actorIds.has(u.id));
  }, [users, isAdmin, isHod, currentUser, scopedActivities]);

  const authorizedTasks = useMemo(() => {
    const activeTasks = (tasks || []).filter((t) => !t.is_deleted);
    if (isAdmin) return activeTasks;
    const taskIds = new Set(scopedActivities.map((a) => a.task?.id || a.taskId).filter(Boolean));
    return activeTasks.filter((t) => taskIds.has(t.id));
  }, [tasks, isAdmin, scopedActivities]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 font-sans">
      {/* 1. Top Screen Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#18181B] tracking-tight">
            Activity
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1 font-normal">
            Track important changes across UPCOMM.
          </p>
        </div>

        {/* View Switcher: Timeline | Table */}
        <div className="inline-flex items-center p-1 bg-[#F4F4F5] rounded-xl border border-[#E4E4E7] self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-[#18181B] shadow-xs'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-[#18181B] shadow-xs'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
        </div>
      </div>

      {/* 2. Filter & Search Toolbar */}
      <ActivityToolbar
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        employeeId={employeeId}
        onEmployeeChange={handleEmployeeChange}
        departmentId={departmentId}
        onDepartmentChange={handleDepartmentChange}
        taskId={taskId}
        onTaskChange={handleTaskChange}
        actionType={actionType}
        onActionChange={handleActionChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        users={authorizedUsers}
        departments={authorizedDepartments}
        tasks={authorizedTasks}
        onResetFilters={handleResetFilters}
      />

      {/* 3. Main Content View Area */}
      {filteredActivities.length === 0 ? (
        <ActivityEmptyState
          hasFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />
      ) : viewMode === 'timeline' ? (
        <ActivityTimeline
          activities={visibleActivities}
          onTaskClick={(id) => setSelectedTaskId(id)}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      ) : (
        <ActivityTable
          activities={visibleActivities}
          onTaskClick={(id) => setSelectedTaskId(id)}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
        />
      )}

      {/* 4. Task Detail Drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onEditTask={(id) => {
            setSelectedTaskId(null);
            setEditTaskId(id);
          }}
        />
      )}

      {/* 5. Edit Task Drawer */}
      {editTaskId && (
        <EditTaskDrawer
          taskId={editTaskId}
          isOpen={Boolean(editTaskId)}
          onClose={(savedTask) => {
            setEditTaskId(null);
            if (savedTask?.id) {
              setSelectedTaskId(savedTask.id);
            }
          }}
        />
      )}
    </div>
  );
}

export default ActivityLogPage;
