import {
  Home,
  CheckSquare,
  User,
  ListTodo,
  Building2,
  Users,
  Shield,
  Inbox,
  BarChart3,
  Activity,
  UserCheck,
} from 'lucide-react';
import {
  canViewUsers,
  canManagePermissions,
  canViewDepartments,
  canViewReports,
} from '../utils/rbac/permissionManager';

export const NAVIGATION_ITEMS = [
  // GROUP: MY WORK
  {
    id: 'nav-home',
    label: 'Home',
    to: '/dashboard',
    icon: Home,
    section: 'My Work',
    end: true,
    keywords: ['home', 'dashboard', 'overview', 'main', 'start'],
    isAllowed: () => true,
  },
  {
    id: 'nav-my-tasks',
    label: 'My Tasks',
    to: '/tasks',
    icon: CheckSquare,
    section: 'My Work',
    keywords: ['my tasks', 'tasks', 'assigned to me', 'work', 'todos'],
    isAllowed: () => true,
  },
  {
    id: 'nav-personal-tasks',
    label: 'Personal Tasks',
    to: '/personal-tasks',
    icon: User,
    section: 'My Work',
    keywords: ['personal', 'private', 'notes', 'private tasks', 'my own'],
    isAllowed: () => true,
  },

  // GROUP: WORKSPACE
  {
    id: 'nav-all-tasks',
    label: 'All Tasks',
    to: '/tasks/all',
    icon: ListTodo,
    section: 'Workspace',
    keywords: ['all tasks', 'all', 'workspace tasks', 'company tasks'],
    isAllowed: () => true,
  },
  {
    id: 'nav-departments',
    label: 'Departments',
    to: '/departments',
    icon: Building2,
    section: 'Workspace',
    keywords: ['departments', 'teams', 'depts', 'organization', 'units'],
    isAllowed: (user) => canViewDepartments(user),
  },
  {
    id: 'nav-users',
    label: 'Users',
    to: '/team/users',
    icon: Users,
    section: 'Workspace',
    keywords: ['users', 'team', 'directory', 'people', 'members', 'employees', 'staff'],
    isAllowed: (user) => canViewUsers(user),
  },
  {
    id: 'nav-user-permissions',
    label: 'User Permissions',
    to: '/team/permissions',
    icon: Shield,
    section: 'Workspace',
    keywords: ['permissions', 'user permissions', 'rbac', 'access', 'roles', 'security'],
    isAllowed: (user) => canManagePermissions(user),
  },

  // GROUP: MANAGEMENT
  {
    id: 'nav-inbox',
    label: 'Requests',
    to: '/inbox',
    icon: Inbox,
    section: 'Management',
    keywords: ['inbox', 'requests', 'delete requests', 'completion requests', 'approvals', 'actions'],
    isAllowed: () => true,
  },
  {
    id: 'nav-reports',
    label: 'Reports',
    to: '/reports',
    icon: BarChart3,
    section: 'Management',
    keywords: ['reports', 'analytics', 'statistics', 'charts', 'kpi', 'performance'],
    isAllowed: (user) => canViewReports(user),
  },
  {
    id: 'nav-activity',
    label: 'Activity',
    to: '/activity',
    icon: Activity,
    section: 'Management',
    keywords: ['activity', 'logs', 'audit', 'history', 'events'],
    isAllowed: () => true,
  },

  // GROUP: ACCOUNT
  {
    id: 'nav-profile',
    label: 'Profile',
    to: '/profile',
    icon: UserCheck,
    section: 'Account',
    keywords: ['profile', 'account', 'password', 'avatar', 'my profile', 'me'],
    isAllowed: () => true,
  },
];

/**
 * Returns navigation items filtered by user role/permissions.
 */
export function getAuthorizedNavigationItems(currentUser) {
  return NAVIGATION_ITEMS.filter((item) => {
    if (typeof item.isAllowed === 'function') {
      return item.isAllowed(currentUser);
    }
    return true;
  });
}
