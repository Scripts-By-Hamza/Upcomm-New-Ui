import React, { useState, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { isTaskOverdue, isTaskDueSoon } from '../../utils/dateUtils';
import {
  isTaskInDepartment,
  getTaskAssigneeIds,
  getTaskAssistantIds,
} from '../../utils/taskDepartmentUtils';
import { DepartmentDashboardHeader } from './DepartmentDashboardHeader';
import { AdminDashboardKpiRow } from './AdminDashboardKpiRow';
import { DepartmentAttentionPanel } from './DepartmentAttentionPanel';
import { DepartmentDueToday } from './DepartmentDueToday';
import { DepartmentTeamWorkload } from './DepartmentTeamWorkload';
import { DashboardRecentComments } from './DashboardRecentComments';
import { DepartmentRecentActivity } from './DepartmentRecentActivity';
import { Building2 } from 'lucide-react';

export function HODDashboardView() {
  const {
    tasks = [],
    departments = [],
    completionRequests = [],
    activityLogs = [],
  } = useAppData();
  const { currentUser, users = [] } = useAuth();

  const departmentId = currentUser?.department_id;
  const userDept = useMemo(() => {
    return (departments || []).find((d) => d.id === departmentId);
  }, [departments, departmentId]);

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

  // Derive department tasks using isTaskInDepartment
  const departmentTasks = useMemo(() => {
    if (!departmentId) return [];
    return (tasks || []).filter(
      (t) => !t.is_deleted && isTaskInDepartment(t, departmentId, users)
    );
  }, [tasks, departmentId, users]);

  // Filter department tasks based on active date range
  const filteredDepartmentTasks = useMemo(() => {
    if (!fromDate && !toDate) return departmentTasks;

    return departmentTasks.filter((t) => {
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
  }, [departmentTasks, fromDate, toDate]);

  // Derived KPI calculations
  const totalCount = filteredDepartmentTasks.length;
  const completedCount = filteredDepartmentTasks.filter((t) => t.status === 'completed').length;
  const activeTasksCount = filteredDepartmentTasks.filter((t) => t.status !== 'completed').length;
  const inProgressCount = filteredDepartmentTasks.filter((t) => t.status === 'in_progress').length;
  const overdueCount = filteredDepartmentTasks.filter((t) => isTaskOverdue(t.due_date, t.status)).length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Tasks created by this HOD
  const createdByCurrentUserCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredDepartmentTasks.filter(
      (t) => t.created_by === currentUser.id || t.assigned_by === currentUser.id
    ).length;
  }, [filteredDepartmentTasks, currentUser]);

  // Tasks assigned to this HOD
  const assignedToCurrentUserCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredDepartmentTasks.filter((t) => {
      const assigneeIds = getTaskAssigneeIds(t);
      const assistantIds = getTaskAssistantIds(t);
      return (
        t.assigned_to === currentUser.id ||
        assigneeIds.includes(currentUser.id) ||
        assistantIds.includes(currentUser.id)
      );
    }).length;
  }, [filteredDepartmentTasks, currentUser]);

  // In-progress breakdowns for this HOD
  const inProgressCreatedCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredDepartmentTasks.filter(
      (t) =>
        t.status === 'in_progress' &&
        (t.created_by === currentUser.id || t.assigned_by === currentUser.id)
    ).length;
  }, [filteredDepartmentTasks, currentUser]);

  const inProgressAssignedCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredDepartmentTasks.filter((t) => {
      if (t.status !== 'in_progress') return false;
      const assigneeIds = getTaskAssigneeIds(t);
      const assistantIds = getTaskAssistantIds(t);
      return (
        t.assigned_to === currentUser.id ||
        assigneeIds.includes(currentUser.id) ||
        assistantIds.includes(currentUser.id)
      );
    }).length;
  }, [filteredDepartmentTasks, currentUser]);

  // Overdue breakdowns for this HOD
  const overdueCreatedCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredDepartmentTasks.filter(
      (t) =>
        isTaskOverdue(t.due_date, t.status) &&
        (t.created_by === currentUser.id || t.assigned_by === currentUser.id)
    ).length;
  }, [filteredDepartmentTasks, currentUser]);

  const overdueAssignedCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredDepartmentTasks.filter((t) => {
      if (!isTaskOverdue(t.due_date, t.status)) return false;
      const assigneeIds = getTaskAssigneeIds(t);
      const assistantIds = getTaskAssistantIds(t);
      return (
        t.assigned_to === currentUser.id ||
        assigneeIds.includes(currentUser.id) ||
        assistantIds.includes(currentUser.id)
      );
    }).length;
  }, [filteredDepartmentTasks, currentUser]);

  // Completed breakdowns for this HOD
  const completedCreatedCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredDepartmentTasks.filter(
      (t) =>
        t.status === 'completed' &&
        (t.created_by === currentUser.id || t.assigned_by === currentUser.id)
    ).length;
  }, [filteredDepartmentTasks, currentUser]);

  const completedAssignedCount = useMemo(() => {
    if (!currentUser?.id) return 0;
    return filteredDepartmentTasks.filter((t) => {
      if (t.status !== 'completed') return false;
      const assigneeIds = getTaskAssigneeIds(t);
      const assistantIds = getTaskAssistantIds(t);
      return (
        t.assigned_to === currentUser.id ||
        assigneeIds.includes(currentUser.id) ||
        assistantIds.includes(currentUser.id)
      );
    }).length;
  }, [filteredDepartmentTasks, currentUser]);

  // Department tasks created in the past 7 days for truthful trend
  const createdThisWeekCount = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return departmentTasks.filter((t) => {
      if (!t.created_at) return false;
      return new Date(t.created_at) >= oneWeekAgo;
    }).length;
  }, [departmentTasks]);

  // Strictly reviewable completion requests for this HOD
  // (pending, task in department, AND task created or assigned by this HOD)
  const reviewableCompletionRequests = useMemo(() => {
    if (!completionRequests || !currentUser?.id || !departmentId) return [];

    return completionRequests.filter((req) => {
      if (req.status !== 'pending') return false;
      const task = (tasks || []).find((t) => t.id === req.task_id);
      if (!task) return false;
      const inDept = isTaskInDepartment(task, departmentId, users);
      const isCreator = task.created_by === currentUser.id || task.assigned_by === currentUser.id;
      return inDept && isCreator;
    });
  }, [completionRequests, tasks, currentUser, departmentId, users]);

  // Department tasks due within 24 hours (not completed and not overdue)
  const dueSoonCount = useMemo(() => {
    return departmentTasks.filter((t) => {
      if (t.status === 'completed') return false;
      if (isTaskOverdue(t.due_date, t.status)) return false;
      return isTaskDueSoon(t.due_date, t.status, 2);
    }).length;
  }, [departmentTasks]);

  // If no department is assigned to this HOD account, render a graceful empty state
  if (!departmentId || !userDept) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center text-[#8B8B95] space-y-3 max-w-xl mx-auto my-8">
        <Building2 className="w-10 h-10 text-[#71717A] mx-auto opacity-50" />
        <h2 className="text-lg font-bold text-[#18181B]">No Department Assigned</h2>
        <p className="text-[13px] text-[#71717A] leading-relaxed">
          No department is currently assigned to your HOD account. Please contact an Administrator to assign your department to view department metrics and tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full">
      {/* 1. Department Header with Badge & Duration Filter */}
      <DepartmentDashboardHeader
        departmentName={userDept.name}
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

      {/* 2. Four KPI Cards */}
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
        inProgressCreatedCount={inProgressCreatedCount}
        inProgressAssignedCount={inProgressAssignedCount}
        overdueCreatedCount={overdueCreatedCount}
        overdueAssignedCount={overdueAssignedCount}
        completedCreatedCount={completedCreatedCount}
        completedAssignedCount={completedAssignedCount}
      />

      {/* 3. Main Two-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Needs Attention & Due Today */}
        <div className="space-y-5">
          <DepartmentAttentionPanel
            overdueCount={overdueCount}
            completionRequestsCount={reviewableCompletionRequests.length}
            dueSoonCount={dueSoonCount}
          />
          <DepartmentDueToday tasks={departmentTasks} users={users} />
        </div>

        {/* Right Column: Recent Comments & Team Workload */}
        <div className="space-y-5">
          <DashboardRecentComments tasks={departmentTasks} users={users} />
          <DepartmentTeamWorkload
            tasks={departmentTasks}
            users={users}
            departmentId={departmentId}
          />
        </div>
      </div>

      {/* 4. Full-Width Bottom Section: Recent Department Activity */}
      <DepartmentRecentActivity
        activityLogs={activityLogs}
        users={users}
        tasks={tasks}
        departmentId={departmentId}
      />
    </div>
  );
}
