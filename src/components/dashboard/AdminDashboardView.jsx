import React, { useState, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { isTaskOverdue } from '../../utils/dateUtils';
import { getTaskAssigneeIds, getTaskAssistantIds } from '../../utils/taskDepartmentUtils';
import { AdminDashboardHeader } from './AdminDashboardHeader';
import { AdminDashboardKpiRow } from './AdminDashboardKpiRow';
import { DashboardAttentionPanel } from './DashboardAttentionPanel';
import { DashboardTodayTasks } from './DashboardTodayTasks';
import { DashboardRecentComments } from './DashboardRecentComments';
import { DashboardTeamWorkload } from './DashboardTeamWorkload';
import { DashboardRecentActivity } from './DashboardRecentActivity';
import { DashboardDepartmentOverview } from './DashboardDepartmentOverview';

export function AdminDashboardView() {
  const {
    tasks = [],
    departments = [],
    deleteRequests = [],
    completionRequests = [],
    activityLogs = [],
  } = useAppData();
  const { currentUser, users = [] } = useAuth();

  // Date duration filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activePreset, setActivePreset] = useState('all');

  const handlePresetChange = (presetId) => {
    setActivePreset(presetId);
    const now = new Date();

    if (presetId === 'all') {
      setFromDate('');
      setToDate('');
    } else if (presetId === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (presetId === 'week') {
      const firstDayOfWeek = new Date(now);
      firstDayOfWeek.setDate(now.getDate() - now.getDay());
      const lastDayOfWeek = new Date(firstDayOfWeek);
      lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);

      setFromDate(firstDayOfWeek.toISOString().split('T')[0]);
      setToDate(lastDayOfWeek.toISOString().split('T')[0]);
    } else if (presetId === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setFromDate(firstDay.toISOString().split('T')[0]);
      setToDate(lastDay.toISOString().split('T')[0]);
    }
  };

  const handleResetDateFilter = () => {
    setActivePreset('all');
    setFromDate('');
    setToDate('');
  };

  // Filter tasks based on selected duration filter
  const filteredTasks = useMemo(() => {
    const nonDeleted = (tasks || []).filter((t) => !t.is_deleted);
    if (!fromDate && !toDate) return nonDeleted;

    return nonDeleted.filter((t) => {
      const taskDate = t.due_date
        ? new Date(t.due_date)
        : t.created_at
        ? new Date(t.created_at)
        : null;
      if (!taskDate) return true;

      const taskDateStr = taskDate.toISOString().split('T')[0];
      if (fromDate && taskDateStr < fromDate) return false;
      if (toDate && taskDateStr > toDate) return false;

      return true;
    });
  }, [tasks, fromDate, toDate]);

  // Derived KPI calculations
  const totalCount = filteredTasks.length;
  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;
  const activeTasksCount = filteredTasks.filter((t) => t.status !== 'completed').length;
  const inProgressCount = filteredTasks.filter((t) => t.status === 'in_progress').length;
  const overdueCount = filteredTasks.filter((t) => isTaskOverdue(t.due_date, t.status)).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Tasks created by the logged-in user
  const createdByCurrentUserCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredTasks.filter(
      (t) => t.created_by === currentUser.id || t.assigned_by === currentUser.id
    ).length;
  }, [filteredTasks, currentUser]);

  // Tasks assigned to the logged-in user
  const assignedToCurrentUserCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredTasks.filter((t) => {
      const assigneeIds = getTaskAssigneeIds(t);
      const assistantIds = getTaskAssistantIds(t);
      return (
        t.assigned_to === currentUser.id ||
        assigneeIds.includes(currentUser.id) ||
        assistantIds.includes(currentUser.id)
      );
    }).length;
  }, [filteredTasks, currentUser]);

  // Calculate tasks created in the past 7 days for truthful trend
  const createdThisWeekCount = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return (tasks || []).filter((t) => {
      if (t.is_deleted) return false;
      if (!t.created_at) return false;
      return new Date(t.created_at) >= oneWeekAgo;
    }).length;
  }, [tasks]);

  // Count pending completion requests relevant to this user
  const relevantCompletionCount = useMemo(() => {
    if (!completionRequests || !currentUser?.id) return 0;
    return completionRequests.filter((req) => {
      if (req.status !== 'pending') return false;
      const task = tasks.find((t) => t.id === req.task_id);
      return task && (task.created_by === currentUser.id || task.assigned_by === currentUser.id);
    }).length;
  }, [completionRequests, tasks, currentUser]);

  // Count pending delete requests
  const pendingDeleteCount = useMemo(() => {
    return (deleteRequests || []).filter((r) => r.status === 'pending').length;
  }, [deleteRequests]);

  return (
    <div className="space-y-6 max-w-full">
      {/* 1. Header with Greeting & Date / Filter */}
      <AdminDashboardHeader
        currentUser={currentUser}
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(val) => {
          setFromDate(val);
          setActivePreset('custom');
        }}
        onToDateChange={(val) => {
          setToDate(val);
          setActivePreset('custom');
        }}
        onResetDateFilter={handleResetDateFilter}
      />

      {/* 2. KPI 4-Card Row */}
      <AdminDashboardKpiRow
        activeTasksCount={activeTasksCount}
        inProgressCount={inProgressCount}
        overdueCount={overdueCount}
        completionRate={completionRate}
        completedCount={completedCount}
        totalCount={totalCount}
        createdThisWeekCount={createdThisWeekCount}
        createdByCount={createdByCurrentUserCount}
        assignedToCount={assignedToCurrentUserCount}
      />

      {/* 3. Main Two-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Needs Attention & Today */}
        <div className="space-y-5">
          <DashboardAttentionPanel
            overdueCount={overdueCount}
            completionRequestsCount={relevantCompletionCount}
            deleteRequestsCount={pendingDeleteCount}
          />
          <DashboardTodayTasks tasks={tasks} users={users} />
        </div>

        {/* Right Column: Recent Comments, Team Workload & Recent Activity */}
        <div className="space-y-5">
          <DashboardRecentComments tasks={tasks} users={users} />
          <DashboardTeamWorkload tasks={tasks} users={users} />
          <DashboardRecentActivity
            activityLogs={activityLogs}
            users={users}
            tasks={tasks}
          />
        </div>
      </div>

      {/* 4. Full-Width Bottom Section: Department Overview */}
      <DashboardDepartmentOverview
        departments={departments}
        tasks={tasks}
        users={users}
      />
    </div>
  );
}
