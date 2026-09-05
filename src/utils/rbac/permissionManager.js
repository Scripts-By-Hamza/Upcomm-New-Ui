import { isTaskInDepartment, getTaskAssigneeIds, getTaskAssistantIds } from '../taskDepartmentUtils.js';

/**
 * UPCOMM SOLUTIONS ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
 * 
 * Three Primary Roles:
 * 1. 'admin' (and 'it_support_admin'): Unrestricted company-level authority. Full access.
 * 2. 'hod': Department-scoped authority.
 * 3. 'team_member': Own-work scoped authority.
 */

export const ROLE_DEFINITIONS = {
  admin: {
    id: 'admin',
    label: 'Admin',
    description: 'Full unrestricted company-wide access and system administration.',
    color: '#059669',
  },
  it_support_admin: {
    id: 'it_support_admin',
    label: 'IT Support Admin',
    description: 'System-level infrastructure and administration account.',
    color: '#6366F1',
  },
  hod: {
    id: 'hod',
    label: 'HOD',
    description: 'Department Head with department-scoped management and review authority.',
    color: '#3B82F6',
  },
  team_member: {
    id: 'team_member',
    label: 'Team Member',
    description: 'Individual contributor with access strictly to assigned and personal work.',
    color: '#71717A',
  },
};

/**
 * Standard Role Defaults Matrix
 */
export const ROLE_DEFAULTS = {
  admin: {
    // Dashboard
    'dashboard.type': 'admin',

    // Tasks Visibility & Scopes ('company' | 'department' | 'own' | 'none')
    'tasks.view_scope': 'company',
    'tasks.create': true,
    'tasks.edit_scope': 'all',
    'tasks.delete_scope': 'all',

    // Requests & Inbox
    'requests.completion_view_scope': 'all',
    'requests.completion_review_scope': 'all',
    'requests.delete_request': true,
    'requests.delete_review': true, // Strictly Admin Only

    // Activity Log
    'activity.view_scope': 'company',

    // Departments
    'departments.view_scope': 'all',
    'departments.manage': true,

    // Team & User Management
    'users.view': true,
    'users.manage': true,
    'permissions.manage': true,

    // Reports & Analytics
    'reports.view_scope': 'company',

    // Settings
    'settings.manage': true,

    // Messaging
    'messages.send_direct': true,
    'messages.create_group': true,
    'messages.send_broadcast': true,
    'messages.cross_department': true,
  },

  it_support_admin: {
    'dashboard.type': 'admin',
    'tasks.view_scope': 'company',
    'tasks.create': true,
    'tasks.edit_scope': 'all',
    'tasks.delete_scope': 'all',
    'requests.completion_view_scope': 'all',
    'requests.completion_review_scope': 'all',
    'requests.delete_request': true,
    'requests.delete_review': true,
    'activity.view_scope': 'company',
    'departments.view_scope': 'all',
    'departments.manage': true,
    'users.view': true,
    'users.manage': true,
    'permissions.manage': true,
    'reports.view_scope': 'company',
    'settings.manage': true,
    'messages.send_direct': true,
    'messages.create_group': true,
    'messages.send_broadcast': true,
    'messages.cross_department': true,
  },

  hod: {
    'dashboard.type': 'hod',
    'tasks.view_scope': 'department', // Authorized Department tasks
    'tasks.create': true,
    'tasks.edit_scope': 'department_and_own',
    'tasks.delete_scope': 'none', // Cannot delete directly, can only submit request
    'requests.completion_view_scope': 'department', // Department + created + submitted
    'requests.completion_review_scope': 'department', // Department tasks + created tasks
    'requests.delete_request': true,
    'requests.delete_review': false, // NO delete review
    'activity.view_scope': 'department', // Department events only
    'departments.view_scope': 'own',
    'departments.manage': false,
    'users.view': false,
    'users.manage': false,
    'permissions.manage': false,
    'reports.view_scope': 'none', // Admin can override to 'department'
    'settings.manage': false,
    'messages.send_direct': true,
    'messages.create_group': true,
    'messages.send_broadcast': true,
    'messages.cross_department': true,
  },

  team_member: {
    'dashboard.type': 'member',
    'tasks.view_scope': 'own', // Own assigned / assisted / created
    'tasks.create': true,
    'tasks.edit_scope': 'own',
    'tasks.delete_scope': 'none',
    'requests.completion_view_scope': 'own', // Own submitted + own created tasks
    'requests.completion_review_scope': 'own', // Only tasks created by this user
    'requests.delete_request': true,
    'requests.delete_review': false, // NO delete review
    'activity.view_scope': 'own', // Own accessible tasks only
    'departments.view_scope': 'none',
    'departments.manage': false,
    'users.view': false,
    'users.manage': false,
    'permissions.manage': false,
    'reports.view_scope': 'none',
    'settings.manage': false,
    'messages.send_direct': true,
    'messages.create_group': true,
    'messages.send_broadcast': true,
    'messages.cross_department': true,
  },
};

/**
 * Computes the effective permission set for a user.
 * Combines role defaults + per-user overrides.
 * Admin users are permanently granted Full Access to prevent lockout.
 */
export function getEffectivePermissions(user) {
  if (!user) return ROLE_DEFAULTS.team_member;

  const role = (user.role || 'team_member').toLowerCase();
  const isAdmin = role === 'admin' || role === 'it_support_admin';

  // Admin always has full unrestricted access
  if (isAdmin) {
    return { ...ROLE_DEFAULTS.admin };
  }

  const baseDefaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.team_member;
  const overrides = user.permission_overrides || {};

  // Clean overrides: Delete review is ALWAYS Admin only
  const safeOverrides = { ...overrides };
  delete safeOverrides['requests.delete_review'];

  return {
    ...baseDefaults,
    ...safeOverrides,
  };
}

/**
 * Checks whether a user has a specific boolean permission or capability.
 */
export function hasPermission(user, permissionKey) {
  if (!user) return false;
  const effective = getEffectivePermissions(user);
  return Boolean(effective[permissionKey]);
}

/**
 * Gets the effective scope for a capability ('company' | 'department' | 'own' | 'none').
 */
export function getPermissionScope(user, capabilityCategory) {
  if (!user) return 'none';
  const effective = getEffectivePermissions(user);
  return effective[`${capabilityCategory}.view_scope`] || 'none';
}

/**
 * Determines access level label for display in table / badges.
 */
export function getUserAccessLevel(user) {
  if (!user) return { label: 'No Access', badge: 'bg-zinc-100 text-zinc-600' };

  const role = (user.role || 'team_member').toLowerCase();
  const overrides = user.permission_overrides || {};
  const overrideCount = Object.keys(overrides).length;

  if (role === 'admin' || role === 'it_support_admin') {
    return { label: 'Full Access', badge: 'bg-emerald-50 text-[#059669] border border-emerald-200' };
  }

  if (overrideCount > 0) {
    return { label: 'Custom', badge: 'bg-purple-50 text-purple-700 border border-purple-200' };
  }

  if (role === 'hod') {
    return { label: 'HOD Default', badge: 'bg-blue-50 text-blue-700 border border-blue-200' };
  }

  return { label: 'Team Member Default', badge: 'bg-zinc-100 text-zinc-700 border border-zinc-200' };
}

/**
 * Returns number of active custom overrides for a user.
 */
export function getOverrideCount(user) {
  if (!user || user.role === 'admin' || user.role === 'it_support_admin') return 0;
  return Object.keys(user.permission_overrides || {}).length;
}

// ==========================================
// CANONICAL RESOURCE-LEVEL ACCESS HELPERS
// ==========================================

/**
 * Evaluates whether a user can view a specific task.
 */
export function canUserViewTask(user, task, users = [], departments = []) {
  if (!user || !task) return false;

  const role = (user.role || 'team_member').toLowerCase();
  const userId = user.id;

  // 1. Private Personal Tasks: strictly creator-only
  if (task.task_origin === 'personal' || task.parent_task_id === 'personal_task') {
    return task.created_by === userId;
  }

  // 2. Admin: all company tasks
  if (role === 'admin' || role === 'it_support_admin') return true;

  const effective = getEffectivePermissions(user);
  const taskScope = effective['tasks.view_scope'] || 'own';

  if (taskScope === 'company') return true;

  const assigneeIds = getTaskAssigneeIds(task);
  const assistantIds = getTaskAssistantIds(task);
  const isDirectWorker =
    task.assigned_to === userId ||
    assigneeIds.includes(userId) ||
    task.assisted_by === userId ||
    assistantIds.includes(userId);
  const isCreator = task.created_by === userId || task.assigned_by === userId;

  if (isDirectWorker || isCreator) return true;

  // 3. Department Scope: if user has department task scope
  if (taskScope === 'department') {
    const userDeptId = user.department_id;
    if (userDeptId && isTaskInDepartment(task, userDeptId, users)) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates whether a user can edit a specific task.
 */
export function canUserEditTask(user, task, users = []) {
  if (!user || !task) return false;

  const role = (user.role || 'team_member').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;

  const userId = user.id;
  const isOwner = task.created_by === userId || task.assigned_by === userId;
  if (isOwner) return true;

  const effective = getEffectivePermissions(user);
  const editScope = effective['tasks.edit_scope'];

  if (editScope === 'all') return true;
  if (editScope === 'department_and_own' && user.department_id) {
    return isTaskInDepartment(task, user.department_id, users);
  }

  return false;
}

/**
 * Checks if a user can delete a task directly (Admin only).
 */
export function canUserDeleteTaskDirectly(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role === 'admin' || role === 'it_support_admin';
}

/**
 * Evaluates whether a user can view a completion request record.
 */
export function canUserViewCompletionRequest(user, request, task, users = []) {
  if (!user || !request) return false;

  const role = (user.role || 'team_member').toLowerCase();
  const userId = user.id;

  // Admin sees all
  if (role === 'admin' || role === 'it_support_admin') return true;

  // User submitted the request themselves
  if (request.requested_by === userId) return true;

  // User created the task
  if (task && (task.created_by === userId || task.assigned_by === userId)) return true;

  // User is assignee or assistant on the task
  if (task) {
    const assigneeIds = getTaskAssigneeIds(task);
    const assistantIds = getTaskAssistantIds(task);
    if (
      task.assigned_to === userId ||
      assigneeIds.includes(userId) ||
      task.assisted_by === userId ||
      assistantIds.includes(userId)
    ) {
      return true;
    }
  }

  // Check department-wide review permission for HODs
  const effective = getEffectivePermissions(user);
  const compScope = effective['requests.completion_view_scope'];
  if (compScope === 'department' && user.department_id && task) {
    return isTaskInDepartment(task, user.department_id, users);
  }

  return false;
}

/**
 * Evaluates whether a user can review (approve/reject) a completion request.
 * RULE: Strictly ONLY the owner/creator of the task can approve or reject a completion request.
 */
export function canReviewCompletionRequest(user, request, task, users = []) {
  if (!user || !request) return false;
  const userId = user.id;

  // Task owner (creator or assigner) is the ONLY person authorized to approve/reject completion
  if (task) {
    return task.created_by === userId || task.assigned_by === userId;
  }

  // Fallback if task creator metadata is attached to request
  if (
    request.task_creator_id === userId ||
    request.task?.created_by === userId ||
    request.task?.assigned_by === userId
  ) {
    return true;
  }

  return false;
}

/**
 * Evaluates whether a user can review (approve/reject) a delete request.
 * DELETE APPROVAL IS STRICTLY ADMIN ONLY.
 */
export function canReviewDeleteRequest(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role === 'admin' || role === 'it_support_admin';
}

/**
 * Evaluates whether a user can view an activity log entry.
 */
export function canUserViewActivity(user, activityItem, users = []) {
  if (!user || !activityItem) return false;

  const role = (user.role || 'team_member').toLowerCase();
  const userId = user.id;

  // Admin sees all
  if (role === 'admin' || role === 'it_support_admin') return true;

  const task = activityItem.task;

  // Exclude private personal tasks unless creator
  if (task?.task_origin === 'personal' && task.created_by !== userId) {
    return false;
  }

  const effective = getEffectivePermissions(user);
  const actScope = effective['activity.view_scope'] || 'own';

  if (actScope === 'company') return true;

  // Direct task worker / creator check
  if (task) {
    const assigneeIds = getTaskAssigneeIds(task);
    const assistantIds = getTaskAssistantIds(task);
    const isDirectWorker =
      task.assigned_to === userId ||
      assigneeIds.includes(userId) ||
      task.assisted_by === userId ||
      assistantIds.includes(userId);
    const isCreator = task.created_by === userId || task.assigned_by === userId;

    if (isDirectWorker || isCreator) return true;
  }

  // Department scope check (HOD)
  if (actScope === 'department' && user.department_id) {
    if (task && isTaskInDepartment(task, user.department_id, users)) {
      return true;
    }
    if (activityItem.departmentId === user.department_id) {
      return true;
    }
  }

  return false;
}

/**
 * User & Permissions management authorization helpers
 */
export function canManageUsers(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  return hasPermission(user, 'users.manage');
}

export function canViewUsers(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  return hasPermission(user, 'users.view');
}

export function canManagePermissions(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  return hasPermission(user, 'permissions.manage');
}

export function canViewReports(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  const scope = getPermissionScope(user, 'reports');
  return scope === 'company' || scope === 'department';
}

export function canViewDepartments(user) {
  if (!user) return false;
  const role = (user.role || '').toLowerCase();
  return role === 'admin' || role === 'it_support_admin';
}
