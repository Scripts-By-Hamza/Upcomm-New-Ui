import { getTaskAssigneeIds, getTaskAssistantIds } from './taskDepartmentUtils';
import { isTaskOverdue } from './dateUtils';

/**
 * Format system role string to human-readable label
 */
export function getRoleDisplayLabel(role) {
  if (!role) return 'Team Member';
  const r = String(role).toLowerCase();
  if (r === 'admin') return 'Administrator';
  if (r === 'it_support_admin' || r === 'it_support') return 'IT Support Admin';
  if (r === 'hod') return 'Head of Department (HOD)';
  if (r === 'team_member') return 'Team Member';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Compute active tasks, overdue tasks, and completed tasks for an employee
 */
export function computeEmployeeWorkload(user, tasks = []) {
  if (!user?.id) {
    return {
      activeTasks: 0,
      overdueTasks: 0,
      completedTasks: 0,
      totalTasks: 0,
      completionRate: 0,
    };
  }

  const userId = String(user.id);
  const nonDeletedTasks = (tasks || []).filter((t) => !t.is_deleted);

  // Find unique tasks where user is assignee or assistant
  const userTasks = nonDeletedTasks.filter((t) => {
    const assigneeIds = getTaskAssigneeIds(t).map(String);
    const assistantIds = getTaskAssistantIds(t).map(String);
    return assigneeIds.includes(userId) || assistantIds.includes(userId);
  });

  const active = userTasks.filter((t) => t.status !== 'completed');
  const overdue = active.filter((t) => isTaskOverdue(t.due_date, t.status));
  const completed = userTasks.filter((t) => t.status === 'completed');
  const total = userTasks.length;
  const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0;

  return {
    activeTasks: active.length,
    overdueTasks: overdue.length,
    completedTasks: completed.length,
    totalTasks: total,
    completionRate,
  };
}

/**
 * Filter and sort employees
 */
export function filterAndSortEmployees(users = [], filters = {}, taskSummaries = {}, departmentsMap = {}) {
  const {
    search = '',
    departmentId = 'all',
    role = 'all',
    status = 'all',
    sortBy = 'name_asc', // 'name_asc' | 'name_desc' | 'department' | 'role' | 'active_tasks' | 'overdue'
  } = filters;

  // 1. Exclude system and hidden accounts
  const visibleUsers = (users || []).filter((u) => {
    if (!u) return false;
    if (u.exclude_from_directory || u.is_system_account) return false;
    return true;
  });

  // 2. Filter by search, department, role, status
  const filtered = visibleUsers.filter((u) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = (u.full_name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchDesignation = (u.designation || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDesignation) return false;
    }

    // Department filter
    if (departmentId !== 'all') {
      const userDeptId = u.department_id ? String(u.department_id) : '';
      if (userDeptId !== String(departmentId)) return false;
    }

    // Role filter
    if (role !== 'all') {
      const uRole = (u.role || 'team_member').toLowerCase();
      if (role === 'admin' && uRole !== 'admin') return false;
      if (role === 'hod' && uRole !== 'hod') return false;
      if (role === 'team_member' && uRole !== 'team_member') return false;
      if (role === 'it_support' && uRole !== 'it_support' && uRole !== 'it_support_admin') return false;
    }

    // Status filter
    if (status !== 'all') {
      const isActive = u.is_active !== false && u.status !== 'inactive' && u.status !== 'disabled';
      if (status === 'active' && !isActive) return false;
      if (status === 'inactive' && isActive) return false;
    }

    return true;
  });

  // 3. Sort
  return filtered.sort((a, b) => {
    const summaryA = taskSummaries[a.id] || { activeTasks: 0, overdueTasks: 0 };
    const summaryB = taskSummaries[b.id] || { activeTasks: 0, overdueTasks: 0 };

    if (sortBy === 'name_asc') {
      return (a.full_name || '').localeCompare(b.full_name || '');
    }
    if (sortBy === 'name_desc') {
      return (b.full_name || '').localeCompare(a.full_name || '');
    }
    if (sortBy === 'department') {
      const deptA = departmentsMap[a.department_id]?.name || 'zzz';
      const deptB = departmentsMap[b.department_id]?.name || 'zzz';
      return deptA.localeCompare(deptB);
    }
    if (sortBy === 'role') {
      const roleA = getRoleDisplayLabel(a.role);
      const roleB = getRoleDisplayLabel(b.role);
      return roleA.localeCompare(roleB);
    }
    if (sortBy === 'active_tasks') {
      if (summaryB.activeTasks !== summaryA.activeTasks) {
        return summaryB.activeTasks - summaryA.activeTasks;
      }
      return (a.full_name || '').localeCompare(b.full_name || '');
    }
    if (sortBy === 'overdue') {
      if (summaryB.overdueTasks !== summaryA.overdueTasks) {
        return summaryB.overdueTasks - summaryA.overdueTasks;
      }
      return summaryB.activeTasks - summaryA.activeTasks;
    }

    return (a.full_name || '').localeCompare(b.full_name || '');
  });
}
