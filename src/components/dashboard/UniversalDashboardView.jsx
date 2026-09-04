import React, { useState, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardOverdueAlertBanner } from './DashboardOverdueAlertBanner';
import { DashboardWelcomeBar } from './DashboardWelcomeBar';
import { DashboardKpiRow } from './DashboardKpiRow';
import { DashboardOverdueCard } from './DashboardOverdueCard';
import { DashboardDonutProgressCard } from './DashboardDonutProgressCard';
import { DashboardLiveUpdatesCard } from './DashboardLiveUpdatesCard';
import { DashboardReportsCard } from './DashboardReportsCard';
import { DashboardDepartmentOverviewTable } from './DashboardDepartmentOverviewTable';
import { isTaskOverdue } from '../../utils/dateUtils';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';

export function UniversalDashboardView({ forcedRole = null }) {
  const { tasks, departments, reports } = useAppData();
  const { currentUser, users } = useAuth();

  const role = forcedRole || currentUser?.role?.toLowerCase() || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const userDept = departments.find((d) => d.id === currentUser?.department_id);

  // Date duration filter states
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [activePreset, setActivePreset] = useState('all');

  // Preset filter logic
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

  // Role scoping logic (Admin = all tasks, HOD = department tasks including assistant assignments, Member = assigned tasks)
  const roleScopedTasks = useMemo(() => {
    if (isAdmin) {
      return tasks;
    }
    if (role === 'hod') {
      return tasks.filter(
        (t) =>
          isTaskInDepartment(t, currentUser?.department_id, users) ||
          t.assigned_to === currentUser?.id ||
          (Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.includes(currentUser?.id)) ||
          t.assisted_by === currentUser?.id ||
          (Array.isArray(t.assisted_by_ids) && t.assisted_by_ids.includes(currentUser?.id)) ||
          t.created_by === currentUser?.id
      );
    }
    // Team member
    return tasks.filter(
      (t) =>
        t.assigned_to === currentUser?.id ||
        (Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.includes(currentUser?.id)) ||
        t.assisted_by === currentUser?.id ||
        (Array.isArray(t.assisted_by_ids) && t.assisted_by_ids.includes(currentUser?.id)) ||
        t.created_by === currentUser?.id
    );
  }, [tasks, role, isAdmin, currentUser]);

  // Apply Date Range filter to scoped tasks
  const filteredTasks = useMemo(() => {
    return roleScopedTasks.filter((t) => {
      if (!fromDate && !toDate) return true;

      const taskDate = t.due_date ? new Date(t.due_date) : t.created_at ? new Date(t.created_at) : null;
      if (!taskDate) return true;

      const taskDateStr = taskDate.toISOString().split('T')[0];

      if (fromDate && taskDateStr < fromDate) return false;
      if (toDate && taskDateStr > toDate) return false;

      return true;
    });
  }, [roleScopedTasks, fromDate, toDate]);

  // Metrics
  const total = filteredTasks.length;
  const completed = filteredTasks.filter((t) => t.status === 'completed').length;
  const pending = filteredTasks.filter((t) => t.status !== 'completed').length;
  const overdueTasks = filteredTasks.filter((t) => isTaskOverdue(t.due_date, t.status));
  const allRoleOverdueTasks = useMemo(() => {
    return roleScopedTasks.filter((t) => isTaskOverdue(t.due_date, t.status));
  }, [roleScopedTasks]);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3 sm:space-y-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Overdue Deliverable Alert Banner */}
      <DashboardOverdueAlertBanner overdueTasks={allRoleOverdueTasks} />

      {/* 1. Top Welcome Bar */}
      <DashboardWelcomeBar
        currentUser={currentUser}
        userDept={userDept}
        role={role}
      />

      {/* 2. Row 1: KPI Stats + Task Duration Period Filter */}
      <DashboardKpiRow
        total={total}
        pending={pending}
        completed={completed}
        completionRate={completionRate}
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
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
      />

      {/* 4. Row 2: Three Cards (Overdue Tasks, Live Updates, Donut Chart) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Left: Overdue Tasks Card */}
        <DashboardOverdueCard
          overdueTasks={overdueTasks}
          departments={departments}
        />

        {/* Middle: Live Status Updates */}
        <DashboardLiveUpdatesCard
          tasks={tasks}
          users={users}
          currentUser={currentUser}
          role={role}
        />

        {/* Right: Performance Progress & Distribution Donut Chart */}
        <DashboardDonutProgressCard
          tasks={filteredTasks}
          departments={departments}
          users={users}
          isAdmin={isAdmin}
          userDept={userDept}
        />
      </div>

      {/* 4. Row 3: Recent Department Reports (Full Width) */}
      <div className="w-full">
        <DashboardReportsCard
          reports={reports}
          departments={departments}
        />
      </div>

      {/* 5. Row 4: Department Overview & Performance Matrix Table (Admin Only) */}
      {isAdmin && (
        <div className="w-full">
          <DashboardDepartmentOverviewTable
            departments={departments}
            tasks={tasks}
            users={users}
          />
        </div>
      )}
    </div>
  );
}
