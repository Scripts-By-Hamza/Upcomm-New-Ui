/**
 * UPCOMM SOLUTIONS - TASK FILTER PERSISTENCE SYSTEM
 * 
 * Provides robust, page-scoped, user-scoped persistent storage for task filters.
 * Ensures filters survive page refresh, browser restart, and workspace navigation.
 * Validates restored data against active departments, users, and RBAC permissions.
 */

import { canUserViewTask } from './rbac/permissionManager';

export const FILTER_STORAGE_KEY_PREFIX = 'upcomm:task-filters:';
export const UNREAD_FILTER_STORAGE_PREFIX = 'upcomm:task-unread-filter:';
export const FILTER_STORAGE_VERSION = 1;

/**
 * Returns the scoped localStorage key for a user's unread filter state on a specific page.
 */
export function getUnreadFilterStorageKey(userId, pageKey) {
  return `${UNREAD_FILTER_STORAGE_PREFIX}${userId || 'anonymous'}:${pageKey || 'all'}`;
}

/**
 * Safely loads the persistent unread filter setting for a specific user and page.
 */
export function getPersistentUnreadFilter({ userId, pageKey }) {
  if (!userId || !pageKey || typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const key = getUnreadFilterStorageKey(userId, pageKey);
    const val = localStorage.getItem(key);
    return val === 'true';
  } catch (err) {
    console.warn('[taskFilterStorage] Failed to read unread filter preference:', err);
    return false;
  }
}

/**
 * Safely saves the persistent unread filter setting for a specific user and page.
 */
export function savePersistentUnreadFilter({ userId, pageKey, isActive }) {
  if (!userId || !pageKey || typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const key = getUnreadFilterStorageKey(userId, pageKey);
    if (isActive) {
      localStorage.setItem(key, 'true');
    } else {
      localStorage.setItem(key, 'false');
    }
  } catch (err) {
    console.warn('[taskFilterStorage] Failed to save unread filter preference:', err);
  }
}

/**
 * Safely removes the persistent unread filter setting for a specific user and page.
 */
export function removePersistentUnreadFilter({ userId, pageKey }) {
  if (!userId || !pageKey || typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const key = getUnreadFilterStorageKey(userId, pageKey);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[taskFilterStorage] Failed to remove unread filter preference:', err);
  }
}

/**
 * Returns the scoped localStorage key for a specific authenticated user.
 */
export function getUserStorageKey(userId) {
  return `${FILTER_STORAGE_KEY_PREFIX}${userId || 'anonymous'}`;
}

/**
 * Default empty filter structure for task workspaces.
 */
export const DEFAULT_TASK_FILTERS = {
  search: '',
  department: 'all',
  status: 'all',
  priority: 'all',
  assigned_to: 'all',
  assigned_by: 'all',
  due: 'all',
  unread: false,
  hide_completed: false,
  group: 'none',
  sort: 'default',
  completed_filter: 'all',
};

/**
 * Safely loads the entire filter store for a user from localStorage.
 */
export function loadUserFilterStore(userId) {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { version: FILTER_STORAGE_VERSION, pages: {} };
  }

  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { version: FILTER_STORAGE_VERSION, pages: {} };
    }

    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.pages && typeof parsed.pages === 'object') {
      return {
        version: parsed.version || FILTER_STORAGE_VERSION,
        pages: parsed.pages,
      };
    }
  } catch (err) {
    console.warn('[taskFilterStorage] Failed to parse stored filter JSON:', err);
  }

  return { version: FILTER_STORAGE_VERSION, pages: {} };
}

/**
 * Safely saves the user filter store to localStorage.
 */
export function saveUserFilterStore(userId, storeData) {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const key = getUserStorageKey(userId);
    const payload = {
      version: FILTER_STORAGE_VERSION,
      pages: storeData.pages || {},
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    console.warn('[taskFilterStorage] Failed to save filter store:', err);
  }
}

/**
 * Validates and sanitizes restored filter values against active users, departments, and user permissions.
 */
export function sanitizeAndValidateFilters(rawFilters, { departments = [], users = [], currentUser = {} } = {}) {
  if (!rawFilters || typeof rawFilters !== 'object') {
    return { ...DEFAULT_TASK_FILTERS };
  }

  const role = (currentUser?.role || '').toLowerCase();
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHOD = role === 'hod';
  const userDeptId = currentUser?.department_id;

  const validDeptIds = new Set(departments.map((d) => d?.id).filter(Boolean));
  const validUserIds = new Set(
    users
      .filter((u) => u && !u.is_system_account && !u.exclude_from_directory)
      .map((u) => u.id)
      .filter(Boolean)
  );

  const sanitized = { ...DEFAULT_TASK_FILTERS };

  // 1. Search Query (string)
  if (typeof rawFilters.search === 'string') {
    sanitized.search = rawFilters.search.slice(0, 200);
  }

  // 2. Department Filter (comma-separated IDs or 'all')
  if (typeof rawFilters.department === 'string' && rawFilters.department !== 'all') {
    const ids = rawFilters.department.split(',').map((id) => id.trim()).filter(Boolean);
    const filteredIds = (departments && departments.length > 0)
      ? ids.filter((id) => {
          if (!validDeptIds.has(id)) return false;
          // If HOD has restricted view scope to their department, do not allow filtering other depts
          if (isHOD && userDeptId && id !== userDeptId && !isAdmin) {
            return false;
          }
          return true;
        })
      : ids;

    sanitized.department = filteredIds.length > 0 ? filteredIds.join(',') : 'all';
  }

  // 3. Status Filter
  const allowedStatuses = ['all', 'pending', 'in_progress', 'completed'];
  if (typeof rawFilters.status === 'string' && allowedStatuses.includes(rawFilters.status)) {
    sanitized.status = rawFilters.status;
  }

  // 4. Priority Filter
  const allowedPriorities = ['all', 'urgent', 'high', 'medium', 'low'];
  if (typeof rawFilters.priority === 'string' && allowedPriorities.includes(rawFilters.priority.toLowerCase())) {
    sanitized.priority = rawFilters.priority.toLowerCase();
  }

  // 5. Assigned To Filter (comma-separated IDs or 'all')
  if (typeof rawFilters.assigned_to === 'string' && rawFilters.assigned_to !== 'all') {
    const ids = rawFilters.assigned_to.split(',').map((id) => id.trim()).filter(Boolean);
    const filteredIds = (users && users.length > 0)
      ? ids.filter((id) => validUserIds.has(id))
      : ids;
    sanitized.assigned_to = filteredIds.length > 0 ? filteredIds.join(',') : 'all';
  }

  // 6. Assigned By Filter (single ID or 'all')
  if (typeof rawFilters.assigned_by === 'string' && rawFilters.assigned_by !== 'all') {
    if (!users || users.length === 0 || validUserIds.has(rawFilters.assigned_by)) {
      sanitized.assigned_by = rawFilters.assigned_by;
    } else {
      sanitized.assigned_by = 'all';
    }
  }

  // 7. Due Date Filter
  const allowedDue = ['all', 'today', 'tomorrow', 'this_week', 'overdue', 'due_soon', 'no_due'];
  if (typeof rawFilters.due === 'string' && allowedDue.includes(rawFilters.due)) {
    sanitized.due = rawFilters.due;
  }

  // 8. Unread Filter (boolean)
  sanitized.unread = Boolean(rawFilters.unread);

  // 9. Hide Completed Filter (boolean)
  sanitized.hide_completed = Boolean(rawFilters.hide_completed);

  // 10. Group By Filter
  const allowedGroups = ['none', 'status', 'department', 'priority'];
  if (typeof rawFilters.group === 'string' && allowedGroups.includes(rawFilters.group)) {
    sanitized.group = rawFilters.group;
  }

  // 11. Sort Filter
  const allowedSorts = [
    'default',
    'newest',
    'oldest',
    'due_earliest',
    'due_latest',
    'priority_high',
    'priority_low',
    'name_asc',
  ];
  if (typeof rawFilters.sort === 'string' && allowedSorts.includes(rawFilters.sort)) {
    sanitized.sort = rawFilters.sort;
  }

  // 12. Completed Sub-Filter
  const allowedCompletedSubs = ['all', 'assigned_by_admin', 'assigned_to_admin', 'assigned_by_others'];
  if (typeof rawFilters.completed_filter === 'string' && allowedCompletedSubs.includes(rawFilters.completed_filter)) {
    sanitized.completed_filter = rawFilters.completed_filter;
  }

  return sanitized;
}

/**
 * Loads and sanitizes the locked filter configuration for a specific page.
 */
export function getLockedFiltersForPage({
  userId,
  pageKey,
  departments = [],
  users = [],
  currentUser = {},
}) {
  if (!pageKey) return { isLocked: false, filters: null };

  const store = loadUserFilterStore(userId);
  const pageEntry = store.pages?.[pageKey];

  if (!pageEntry || pageEntry.locked !== true || !pageEntry.filters) {
    return { isLocked: false, filters: null };
  }

  const validatedFilters = sanitizeAndValidateFilters(pageEntry.filters, {
    departments,
    users,
    currentUser,
  });

  return {
    isLocked: true,
    filters: validatedFilters,
  };
}

/**
 * Saves a locked filter configuration for a specific page.
 */
export function saveLockedFiltersForPage({ userId, pageKey, filters }) {
  if (!pageKey) return;

  const store = loadUserFilterStore(userId);
  if (!store.pages) store.pages = {};

  // Extract only serializable primitive values
  const serializableFilters = {
    search: filters.search || '',
    department: filters.department || 'all',
    status: filters.status || 'all',
    priority: filters.priority || 'all',
    assigned_to: filters.assigned_to || 'all',
    assigned_by: filters.assigned_by || 'all',
    due: filters.due || 'all',
    unread: Boolean(filters.unread),
    hide_completed: Boolean(filters.hide_completed),
    group: filters.group || 'none',
    sort: filters.sort || 'default',
    completed_filter: filters.completed_filter || 'all',
  };

  store.pages[pageKey] = {
    locked: true,
    filters: serializableFilters,
    savedAt: new Date().toISOString(),
  };

  saveUserFilterStore(userId, store);
}

/**
 * Unlocks and removes the stored locked filter configuration for a specific page.
 */
export function removeLockedFiltersForPage({ userId, pageKey }) {
  if (!pageKey) return;

  const store = loadUserFilterStore(userId);
  if (store.pages && store.pages[pageKey]) {
    delete store.pages[pageKey];
    saveUserFilterStore(userId, store);
  }
}
