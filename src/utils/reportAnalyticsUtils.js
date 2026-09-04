import {
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
  eachDayOfInterval,
  isSameDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { isTaskInDepartment, getTaskAssigneeIds, getTaskAssistantIds } from './taskDepartmentUtils';
import { isTaskOverdue } from './dateUtils';
import { computeEmployeeWorkload } from './employeeWorkloadUtils';

/**
 * Resolve start and end date boundaries for a selected range key
 */
export function getDateRangeBounds(rangeKey = '30d') {
  const now = new Date();
  const todayEnd = endOfDay(now);

  switch (rangeKey) {
    case '7d': {
      const start = startOfDay(subDays(now, 6));
      const prevStart = startOfDay(subDays(start, 7));
      const prevEnd = endOfDay(subDays(start, 1));
      return {
        startDate: start,
        endDate: todayEnd,
        previousStartDate: prevStart,
        previousEndDate: prevEnd,
        label: 'Last 7 Days',
      };
    }
    case '90d': {
      const start = startOfDay(subDays(now, 89));
      const prevStart = startOfDay(subDays(start, 90));
      const prevEnd = endOfDay(subDays(start, 1));
      return {
        startDate: start,
        endDate: todayEnd,
        previousStartDate: prevStart,
        previousEndDate: prevEnd,
        label: 'Last 90 Days',
      };
    }
    case 'this_month': {
      const start = startOfMonth(now);
      const prevMonth = subMonths(now, 1);
      const prevStart = startOfMonth(prevMonth);
      const prevEnd = endOfMonth(prevMonth);
      return {
        startDate: start,
        endDate: todayEnd,
        previousStartDate: prevStart,
        previousEndDate: prevEnd,
        label: 'This Month',
      };
    }
    case 'last_month': {
      const lastMonth = subMonths(now, 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      const twoMonthsAgo = subMonths(now, 2);
      const prevStart = startOfMonth(twoMonthsAgo);
      const prevEnd = endOfMonth(twoMonthsAgo);
      return {
        startDate: start,
        endDate: end,
        previousStartDate: prevStart,
        previousEndDate: prevEnd,
        label: 'Last Month',
      };
    }
    case '30d':
    default: {
      const start = startOfDay(subDays(now, 29));
      const prevStart = startOfDay(subDays(start, 30));
      const prevEnd = endOfDay(subDays(start, 1));
      return {
        startDate: start,
        endDate: todayEnd,
        previousStartDate: prevStart,
        previousEndDate: prevEnd,
        label: 'Last 30 Days',
      };
    }
  }
}

/**
 * Filter tasks strictly by authorization, department, and employee scope (excluding personal tasks & soft-deleted)
 */
export function filterTasksForReport(
  tasks = [],
  { currentUser, departmentId = 'all', employeeId = 'all', users = [] }
) {
  const role = (currentUser?.role || 'team_member').toLowerCase();
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHod = role === 'hod';
  const userDeptId = currentUser?.department_id;

  return (tasks || []).filter((task) => {
    if (!task || task.is_deleted) return false;
    // Exclude personal tasks (which have is_personal or lack task_number or belong to personal scope)
    if (task.is_personal || task.is_private) return false;

    // 1. Role Scoping
    if (!isAdmin) {
      if (isHod) {
        // HOD sees tasks in their department
        const inDept = isTaskInDepartment(task, userDeptId, users) || task.department_id === userDeptId;
        if (!inDept) return false;
      } else {
        // Team member sees tasks where they are assigned or in their department
        const assigneeIds = getTaskAssigneeIds(task);
        const assistantIds = getTaskAssistantIds(task);
        const isParticipant =
          assigneeIds.includes(currentUser?.id) ||
          assistantIds.includes(currentUser?.id) ||
          task.created_by === currentUser?.id;
        const inDept = isTaskInDepartment(task, userDeptId, users);
        if (!isParticipant && !inDept) return false;
      }
    }

    // 2. Department Filter
    if (departmentId !== 'all') {
      const matchDept =
        isTaskInDepartment(task, departmentId, users) || String(task.department_id) === String(departmentId);
      if (!matchDept) return false;
    }

    // 3. Employee Filter
    if (employeeId !== 'all') {
      const assigneeIds = getTaskAssigneeIds(task);
      const assistantIds = getTaskAssistantIds(task);
      const matchEmployee =
        assigneeIds.includes(employeeId) ||
        assistantIds.includes(employeeId) ||
        task.created_by === employeeId;
      if (!matchEmployee) return false;
    }

    return true;
  });
}

/**
 * Compute the 4 Report KPIs: Tasks Created, Tasks Completed, Completion Rate, Overdue Rate
 */
export function computeReportKpis(scopedTasks = [], dateBounds) {
  const { startDate, endDate, previousStartDate, previousEndDate } = dateBounds;

  // Tasks created in period
  const createdInPeriod = scopedTasks.filter((t) => {
    if (!t.created_at) return false;
    const d = new Date(t.created_at);
    return isWithinInterval(d, { start: startDate, end: endDate });
  });

  // Tasks created in previous period for comparison
  const createdInPrevPeriod = scopedTasks.filter((t) => {
    if (!t.created_at) return false;
    const d = new Date(t.created_at);
    return isWithinInterval(d, { start: previousStartDate, end: previousEndDate });
  });

  // Tasks completed in period
  const completedInPeriod = scopedTasks.filter((t) => {
    if (t.status !== 'completed') return false;
    const compDate = t.completed_at || t.updated_at || t.created_at;
    if (!compDate) return false;
    const d = new Date(compDate);
    return isWithinInterval(d, { start: startDate, end: endDate });
  });

  // Tasks completed in previous period for comparison
  const completedInPrevPeriod = scopedTasks.filter((t) => {
    if (t.status !== 'completed') return false;
    const compDate = t.completed_at || t.updated_at || t.created_at;
    if (!compDate) return false;
    const d = new Date(compDate);
    return isWithinInterval(d, { start: previousStartDate, end: previousEndDate });
  });

  // Active tasks currently in scope
  const activeTasks = scopedTasks.filter((t) => t.status !== 'completed');
  const overdueActiveTasks = activeTasks.filter((t) => isTaskOverdue(t.due_date, t.status));

  // Completion Rate: (Completed / Created) * 100 in period, or fallback to (Completed In Scope / Total in Scope) if 0 created
  let completionRate = 0;
  if (createdInPeriod.length > 0) {
    completionRate = Math.min(100, Math.round((completedInPeriod.length / createdInPeriod.length) * 100));
  } else if (scopedTasks.length > 0) {
    const totalCompleted = scopedTasks.filter((t) => t.status === 'completed').length;
    completionRate = Math.round((totalCompleted / scopedTasks.length) * 100);
  }

  // Overdue Rate: (Overdue Active / Total Active) * 100
  const overdueRate =
    activeTasks.length > 0 ? Math.round((overdueActiveTasks.length / activeTasks.length) * 100) : 0;

  // Percentage change helpers
  const calcChange = (current, previous) => {
    if (!previous || previous === 0) {
      return current > 0 ? `+${current}` : null;
    }
    const diff = Math.round(((current - previous) / previous) * 100);
    return diff > 0 ? `+${diff}%` : `${diff}%`;
  };

  const createdChange = calcChange(createdInPeriod.length, createdInPrevPeriod.length);
  const completedChange = calcChange(completedInPeriod.length, completedInPrevPeriod.length);

  return {
    tasksCreated: createdInPeriod.length,
    tasksCreatedChange: createdChange,
    tasksCompleted: completedInPeriod.length,
    tasksCompletedChange: completedChange,
    completionRate,
    overdueRate,
    totalScopedTasks: scopedTasks.length,
    activeTasksCount: activeTasks.length,
    overdueTasksCount: overdueActiveTasks.length,
  };
}

/**
 * Build daily trend series for the Task Completion Trend line chart
 */
export function buildDailyTrendSeries(scopedTasks = [], dateBounds) {
  const { startDate, endDate } = dateBounds;
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const createdCount = scopedTasks.filter((t) => {
      if (!t.created_at) return false;
      const d = new Date(t.created_at);
      return isWithinInterval(d, { start: dayStart, end: dayEnd });
    }).length;

    const completedCount = scopedTasks.filter((t) => {
      if (t.status !== 'completed') return false;
      const compDate = t.completed_at || t.updated_at || t.created_at;
      if (!compDate) return false;
      const d = new Date(compDate);
      return isWithinInterval(d, { start: dayStart, end: dayEnd });
    }).length;

    return {
      date: format(day, 'yyyy-MM-dd'),
      label: format(day, 'MMM d'),
      shortLabel: format(day, 'd'),
      createdCount,
      completedCount,
    };
  });
}

/**
 * Compute tasks by status distribution for the donut chart
 */
export function computeStatusDistribution(scopedTasks = []) {
  const total = scopedTasks.length;
  if (total === 0) {
    return {
      total: 0,
      pending: { count: 0, percentage: 0 },
      inProgress: { count: 0, percentage: 0 },
      completed: { count: 0, percentage: 0 },
    };
  }

  const pending = scopedTasks.filter((t) => !t.status || t.status === 'pending').length;
  const inProgress = scopedTasks.filter(
    (t) => t.status === 'in_progress' || t.status === 'review' || t.status === 'blocked'
  ).length;
  const completed = scopedTasks.filter((t) => t.status === 'completed').length;

  const pendingPct = Math.round((pending / total) * 100);
  const inProgressPct = Math.round((inProgress / total) * 100);
  const completedPct = Math.max(0, 100 - pendingPct - inProgressPct);

  return {
    total,
    pending: { count: pending, percentage: pendingPct },
    inProgress: { count: inProgress, percentage: inProgressPct },
    completed: { count: completed, percentage: completedPct },
  };
}

/**
 * Compute Department Performance horizontal bars
 */
export function computeDepartmentPerformance(departments = [], allTasks = [], users = []) {
  const nonDeleted = allTasks.filter((t) => !t.is_deleted && !t.is_personal && !t.is_private);

  return departments.map((dept) => {
    const deptTasks = nonDeleted.filter(
      (t) => isTaskInDepartment(t, dept.id, users) || String(t.department_id) === String(dept.id)
    );
    const total = deptTasks.length;
    const completed = deptTasks.filter((t) => t.status === 'completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: dept.id,
      name: dept.name,
      total,
      completed,
      active: total - completed,
      completionRate,
    };
  }).sort((a, b) => b.completionRate - a.completionRate);
}

/**
 * Compute ranked Team Workload
 */
export function computeTeamWorkloadRanking(users = [], tasks = [], selectedDeptId = 'all') {
  const visibleUsers = (users || []).filter(
    (u) => !u.exclude_from_directory && !u.is_system_account
  );

  const filteredUsers =
    selectedDeptId !== 'all'
      ? visibleUsers.filter((u) => String(u.department_id) === String(selectedDeptId))
      : visibleUsers;

  const userStats = filteredUsers.map((user) => {
    const workload = computeEmployeeWorkload(user, tasks);
    return {
      user,
      activeTasks: workload.activeTasks,
      totalTasks: workload.totalTasks,
      overdueTasks: workload.overdueTasks,
      completionRate: workload.completionRate,
    };
  });

  // Sort by active workload descending
  userStats.sort((a, b) => b.activeTasks - a.activeTasks);

  const maxActive = Math.max(...userStats.map((s) => s.activeTasks), 1);

  return userStats.slice(0, 6).map((stat) => ({
    ...stat,
    relativePercentage: Math.min(100, Math.round((stat.activeTasks / maxActive) * 100)),
  }));
}

/**
 * Compute Overdue Trend over recent weeks (Week 1–4)
 */
export function computeWeeklyOverdueTrend(scopedTasks = [], dateBounds) {
  const { startDate, endDate } = dateBounds;
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = days.length;
  const bucketSize = Math.max(1, Math.floor(totalDays / 4));

  const weeks = [
    { label: 'Week 1', days: days.slice(0, bucketSize) },
    { label: 'Week 2', days: days.slice(bucketSize, bucketSize * 2) },
    { label: 'Week 3', days: days.slice(bucketSize * 2, bucketSize * 3) },
    { label: 'Week 4', days: days.slice(bucketSize * 3) },
  ];

  const activeTasks = scopedTasks.filter((t) => t.status !== 'completed');
  const currentOverdueTasks = activeTasks.filter((t) => isTaskOverdue(t.due_date, t.status));
  const currentOverdueRate =
    activeTasks.length > 0 ? Math.round((currentOverdueTasks.length / activeTasks.length) * 100) : 0;

  const weeklyData = weeks.map((week) => {
    const weekStart = week.days[0] ? startOfDay(week.days[0]) : startDate;
    const weekEnd = week.days[week.days.length - 1] ? endOfDay(week.days[week.days.length - 1]) : endDate;

    // Count tasks that were due during this week and not completed before week end
    const overdueCount = scopedTasks.filter((t) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      if (dueDate > weekEnd) return false;
      if (t.status === 'completed') {
        const compDate = new Date(t.completed_at || t.updated_at || t.created_at);
        return compDate > dueDate; // Was completed after due date
      }
      return true; // Still incomplete and past due
    }).length;

    return {
      label: week.label,
      overdueCount,
    };
  });

  return {
    weeklyData,
    currentOverdueRate,
  };
}

/**
 * Export filtered report to CSV
 */
export function exportReportToCsv(
  scopedTasks = [],
  departmentsMap = {},
  usersMap = {},
  filterSummary = 'all'
) {
  const headers = [
    'Task Number',
    'Title',
    'Department',
    'Assignees',
    'Status',
    'Priority',
    'Created Date',
    'Completed Date',
    'Due Date',
    'Is Overdue',
  ];

  const rows = scopedTasks.map((t) => {
    const dept = departmentsMap[t.department_id]?.name || '—';
    const assigneeIds = getTaskAssigneeIds(t);
    const assigneeNames = assigneeIds
      .map((id) => usersMap[id]?.full_name || id)
      .join('; ') || 'Unassigned';
    const isOverdue = isTaskOverdue(t.due_date, t.status) ? 'Yes' : 'No';

    return [
      `"${t.task_number || t.id}"`,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${dept}"`,
      `"${assigneeNames.replace(/"/g, '""')}"`,
      `"${t.status || 'pending'}"`,
      `"${t.priority || 'medium'}"`,
      `"${t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd HH:mm') : '—'}"`,
      `"${t.completed_at ? format(new Date(t.completed_at), 'yyyy-MM-dd HH:mm') : (t.status === 'completed' && t.updated_at ? format(new Date(t.updated_at), 'yyyy-MM-dd HH:mm') : '—')}"`,
      `"${t.due_date ? format(new Date(t.due_date), 'yyyy-MM-dd') : '—'}"`,
      `"${isOverdue}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  link.setAttribute('href', url);
  link.setAttribute('download', `upcomm-productivity-report-${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
