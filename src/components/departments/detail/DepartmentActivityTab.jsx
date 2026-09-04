import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getDepartmentScopedActivities,
  filterDepartmentActivities,
  groupActivitiesByDate,
} from '../../../utils/departmentActivityUtils';
import { DepartmentActivityToolbar } from './activity/DepartmentActivityToolbar';
import { DepartmentActivityTimeline } from './activity/DepartmentActivityTimeline';

export function DepartmentActivityTab({
  activityLogs = [],
  users = [],
  tasks = [],
  departmentId,
  onTaskClick,
}) {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read filter state from URL query parameters (default to 'all')
  const employeeId = searchParams.get('employee') || 'all';
  const taskId = searchParams.get('task_filter') || 'all';
  const actionType = searchParams.get('action') || 'all';
  const dateRange = searchParams.get('date') || 'all';

  const filters = useMemo(
    () => ({
      employeeId,
      taskId,
      actionType,
      dateRange,
    }),
    [employeeId, taskId, actionType, dateRange]
  );

  const handleFilterChange = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const queryParamKey = key === 'taskId' ? 'task_filter' : key === 'employeeId' ? 'employee' : key === 'actionType' ? 'action' : 'date';
        if (value === 'all' || !value) {
          next.delete(queryParamKey);
        } else {
          next.set(queryParamKey, String(value));
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleResetFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('employee');
        next.delete('task_filter');
        next.delete('action');
        next.delete('date');
        return next;
      },
      { replace: true }
    );
  };

  const hasActiveFilters =
    employeeId !== 'all' ||
    taskId !== 'all' ||
    actionType !== 'all' ||
    dateRange !== 'all';

  // 1. Scoped Department Activities (all authorized events for this department)
  const allDepartmentActivities = useMemo(() => {
    return getDepartmentScopedActivities({
      activityLogs,
      tasks,
      users,
      departmentId,
      currentUser,
    });
  }, [activityLogs, tasks, users, departmentId, currentUser]);

  // 2. Extract unique actors present in this department's activity
  const departmentActors = useMemo(() => {
    const map = new Map();
    allDepartmentActivities.forEach((act) => {
      if (act.actor?.id && !map.has(act.actor.id)) {
        map.set(act.actor.id, act.actor);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.full_name || '').localeCompare(b.full_name || '')
    );
  }, [allDepartmentActivities]);

  // 3. Extract unique tasks present in this department's activity
  const departmentActivityTasks = useMemo(() => {
    const map = new Map();
    allDepartmentActivities.forEach((act) => {
      if (act.task?.id && !map.has(act.task.id)) {
        map.set(act.task.id, act.task);
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      (a.task_number || '').localeCompare(b.task_number || '')
    );
  }, [allDepartmentActivities]);

  // 4. Apply 5 Toolbar Filters
  const filteredActivities = useMemo(() => {
    return filterDepartmentActivities(allDepartmentActivities, filters);
  }, [allDepartmentActivities, filters]);

  // 5. Group by date (TODAY, YESTERDAY, Date string)
  const groupedActivities = useMemo(() => {
    return groupActivitiesByDate(filteredActivities);
  }, [filteredActivities]);

  return (
    <div className="space-y-5 select-none max-w-full">
      {/* 1. Filter Toolbar */}
      <DepartmentActivityToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        actors={departmentActors}
        tasks={departmentActivityTasks}
      />

      {/* 2. Chronological Timeline Surface */}
      <DepartmentActivityTimeline
        groupedActivities={groupedActivities}
        totalCount={filteredActivities.length}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={handleResetFilters}
        onTaskClick={onTaskClick}
      />
    </div>
  );
}
