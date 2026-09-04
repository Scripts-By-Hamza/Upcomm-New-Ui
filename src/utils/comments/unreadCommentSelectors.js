import { isTaskOverdue } from '../dateUtils';
import { getTaskAssigneeIds } from '../taskDepartmentUtils';

/**
 * Checks if a specific task update is unread for the given user.
 */
export function isUpdateUnreadForUser(update, currentUserId, readChatIds = []) {
  if (!update || !currentUserId) return false;

  // 1. Exclude self-comments
  if (update.user_id && String(update.user_id) === String(currentUserId)) {
    return false;
  }

  // 2. Check if marked read in user_read_states / localStorage
  const updateId = String(update.id || '');
  if (updateId && readChatIds.some((id) => String(id) === updateId)) {
    return false;
  }

  // 3. Check if marked seen in update receipts
  if (
    Array.isArray(update.seen_by) &&
    update.seen_by.some((id) => String(id) === String(currentUserId))
  ) {
    return false;
  }

  // 4. Must be a meaningful comment or attachment
  const hasText = Boolean(
    (update.text && update.text.trim()) ||
    (update.update_text && update.update_text.trim())
  );
  const hasAttachments =
    Array.isArray(update.attachments) && update.attachments.length > 0;

  return hasText || hasAttachments;
}

/**
 * Returns all unread updates for a specific task.
 */
export function getTaskUnreadUpdates(task, currentUserId, readChatIds = []) {
  if (!task || !task.task_updates || !currentUserId) return [];
  return (task.task_updates || []).filter((u) =>
    isUpdateUnreadForUser(u, currentUserId, readChatIds)
  );
}

/**
 * Returns the unread comment count for a single task.
 */
export function getTaskUnreadCount(task, currentUserId, readChatIds = []) {
  return getTaskUnreadUpdates(task, currentUserId, readChatIds).length;
}

/**
 * Builds an O(1) lookup map of task_id -> unreadCount for high-performance rendering.
 */
export function getUnreadCountMap(tasks = [], currentUserId, readChatIds = []) {
  const map = {};
  if (!currentUserId || !Array.isArray(tasks)) return map;

  tasks.forEach((t) => {
    if (t?.id) {
      const count = getTaskUnreadCount(t, currentUserId, readChatIds);
      map[t.id] = count;
      map[String(t.id)] = count;
    }
  });

  return map;
}

/**
 * Calculates unique total unread comments across all authorized tasks.
 * Avoids duplicate counts if a task belongs to multiple categories.
 */
export function getUniqueTotalUnreadCount(tasks = [], currentUserId, readChatIds = []) {
  if (!currentUserId || !Array.isArray(tasks)) return 0;
  const uniqueUpdateIds = new Set();

  tasks.forEach((t) => {
    const unreadUpdates = getTaskUnreadUpdates(t, currentUserId, readChatIds);
    unreadUpdates.forEach((u) => {
      const key = u.id ? String(u.id) : `task-${t.id}-${u.created_at || Math.random()}`;
      uniqueUpdateIds.add(key);
    });
  });

  return uniqueUpdateIds.size;
}

/**
 * Distributes unread comment counts across All Tasks child views.
 */
export function getViewUnreadCounts({
  scopedTasks = [],
  currentUserId,
  readChatIds = [],
  isAdmin = false,
  users = [],
}) {
  if (!currentUserId || !Array.isArray(scopedTasks)) {
    return {
      all: 0,
      pending_in_progress: 0,
      overdue: 0,
      completed: 0,
      assigned_by_admin: 0,
      assigned_to_admin: 0,
      totalUnique: 0,
    };
  }

  const adminUserIds = new Set(
    (users || [])
      .filter((u) => {
        const r = (u.role || '').toLowerCase();
        return r === 'admin' || r === 'it_support_admin';
      })
      .map((u) => String(u.id))
  );

  const totalUniqueSet = new Set();
  const pendingSet = new Set();
  const overdueSet = new Set();
  const completedSet = new Set();
  const assignedByAdminSet = new Set();
  const assignedToAdminSet = new Set();

  scopedTasks.forEach((task) => {
    if (!task) return;
    const unreadUpdates = getTaskUnreadUpdates(task, currentUserId, readChatIds);
    if (unreadUpdates.length === 0) return;

    const creatorId =
      typeof task.created_by === 'object' && task.created_by !== null
        ? String(task.created_by.id)
        : String(task.created_by || '');
    const assignerId =
      typeof task.assigned_by === 'object' && task.assigned_by !== null
        ? String(task.assigned_by.id)
        : String(task.assigned_by || '');
    const isCreatedByCurrentUser =
      creatorId === String(currentUserId) || assignerId === String(currentUserId);

    const taskAssigneeIds = getTaskAssigneeIds(task).map(String);
    const isAssignedToAdmin =
      (task.assigned_to && adminUserIds.has(String(task.assigned_to))) ||
      (task.assigned_to_id && adminUserIds.has(String(task.assigned_to_id))) ||
      taskAssigneeIds.some((id) => adminUserIds.has(id));

    const isPendingOrInProgress =
      task.status === 'pending' || task.status === 'in_progress';
    const isOverdue = isTaskOverdue(task.due_date, task.status);
    const isCompleted = task.status === 'completed';

    unreadUpdates.forEach((u) => {
      const uKey = u.id ? String(u.id) : `task-${task.id}-${u.created_at || Math.random()}`;
      totalUniqueSet.add(uKey);

      if (isPendingOrInProgress) pendingSet.add(uKey);
      if (isOverdue) overdueSet.add(uKey);
      if (isCompleted) completedSet.add(uKey);

      if (isAdmin && isCreatedByCurrentUser) {
        assignedByAdminSet.add(uKey);
      }
      if (!isAdmin && isCreatedByCurrentUser && isAssignedToAdmin) {
        assignedToAdminSet.add(uKey);
      }
    });
  });

  return {
    all: totalUniqueSet.size,
    pending_in_progress: pendingSet.size,
    overdue: overdueSet.size,
    completed: completedSet.size,
    assigned_by_admin: assignedByAdminSet.size,
    assigned_to_admin: assignedToAdminSet.size,
    totalUnique: totalUniqueSet.size,
  };
}
