const STORAGE_PREFIX = 'upcomm_command_recent_';
const MAX_STORED_RECENTS = 12;

/**
 * Retrieves raw recent items stored in localStorage for a specific user.
 */
export function getStoredRecentItems(userId) {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Could not read recent command items:', err);
    return [];
  }
}

/**
 * Adds an entity ({ type: 'task' | 'department' | 'user', id: string }) to recent history.
 * Ensures deduplication, moves the item to the top, and bounds to max items.
 */
export function addRecentItem(item, userId) {
  if (!userId || !item || !item.type || !item.id) return;
  try {
    const current = getStoredRecentItems(userId);
    const filtered = current.filter(
      (r) => !(r.type === item.type && String(r.id) === String(item.id))
    );
    const updated = [
      { type: item.type, id: String(item.id), timestamp: Date.now() },
      ...filtered,
    ].slice(0, MAX_STORED_RECENTS);

    localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save recent command item:', err);
  }
}

/**
 * Clears stored recent items for a user.
 */
export function clearStoredRecentItems(userId) {
  if (!userId) return;
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${userId}`);
  } catch (err) {
    console.warn('Could not clear recent command items:', err);
  }
}

/**
 * Resolves raw recent items against live entity data and user authorization.
 * If an item is deleted, invalid, or no longer accessible to the user, it is discarded.
 * Returns up to maxDisplay (default 5) resolved items.
 */
export function resolveRecentItems(
  storedRecents = [],
  { scopedTasks = [], accessibleDepartments = [], accessibleUsers = [] },
  maxDisplay = 5
) {
  if (!Array.isArray(storedRecents) || storedRecents.length === 0) {
    return [];
  }

  const taskMap = new Map();
  (scopedTasks || []).forEach((t) => {
    if (t && t.id && !t.is_deleted) {
      taskMap.set(String(t.id), t);
    }
  });

  const deptMap = new Map();
  (accessibleDepartments || []).forEach((d) => {
    if (d && d.id) {
      deptMap.set(String(d.id), d);
    }
  });

  const userMap = new Map();
  (accessibleUsers || []).forEach((u) => {
    if (u && u.id && !u.exclude_from_directory && !u.is_system_account && u.is_active !== false) {
      userMap.set(String(u.id), u);
    }
  });

  const resolved = [];

  for (const item of storedRecents) {
    if (!item || !item.type || !item.id) continue;
    const strId = String(item.id);

    if (item.type === 'task') {
      const task = taskMap.get(strId);
      if (task) {
        resolved.push({
          id: `recent-task-${task.id}`,
          type: 'task',
          rawEntity: task,
          title: `${task.task_number ? `${task.task_number} ` : ''}${task.title}`,
          secondary: [
            'Task',
            task.department_id ? deptMap.get(String(task.department_id))?.name || 'Department' : null,
            task.status ? task.status.replace('_', ' ') : null,
          ].filter(Boolean).join(' • '),
        });
      }
    } else if (item.type === 'department') {
      const dept = deptMap.get(strId);
      if (dept) {
        resolved.push({
          id: `recent-dept-${dept.id}`,
          type: 'department',
          rawEntity: dept,
          title: dept.name,
          secondary: 'Department',
        });
      }
    } else if (item.type === 'user') {
      const user = userMap.get(strId);
      if (user) {
        const deptName = user.department_id ? deptMap.get(String(user.department_id))?.name : null;
        resolved.push({
          id: `recent-user-${user.id}`,
          type: 'user',
          rawEntity: user,
          title: user.full_name,
          secondary: [user.designation || 'Team Member', deptName].filter(Boolean).join(' • '),
        });
      }
    }

    if (resolved.length >= maxDisplay) {
      break;
    }
  }

  return resolved;
}
