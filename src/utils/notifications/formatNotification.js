import { 
  format, 
  parseISO, 
  differenceInMinutes, 
  differenceInHours, 
  isToday, 
  isYesterday 
} from 'date-fns';
import { isTaskOverdue, isTaskDueSoon } from '../dateUtils';

/**
 * Format timestamp into compact relative time (5m, 23m, 1h, 2h, Yesterday, Sep 2)
 */
export function formatNotificationRelativeTime(timestamp) {
  if (!timestamp) return '';
  try {
    const dateObj = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    if (isNaN(dateObj.getTime())) return '';

    const now = new Date();
    const diffMinutes = differenceInMinutes(now, dateObj);
    const diffHours = differenceInHours(now, dateObj);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24 && isToday(dateObj)) return `${diffHours}h`;
    if (isYesterday(dateObj)) return 'Yesterday';

    if (dateObj.getFullYear() === now.getFullYear()) {
      return format(dateObj, 'MMM d');
    }
    return format(dateObj, 'MMM d, yyyy');
  } catch {
    return '';
  }
}

/**
 * Normalizes all business events targeted to the logged-in user.
 * Avoids noise, self-notifications, and unauthorized data leakage.
 */
export function getUserTargetedNotifications({
  tasks = [],
  activityLogs = [],
  users = [],
  currentUser,
  readNotificationIds = [],
  completionRequests = [],
  deleteRequests = [],
}) {
  if (!currentUser?.id) return [];

  const userId = currentUser.id;
  const role = currentUser.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHOD = role === 'hod';
  const deptId = currentUser.department_id;

  const userMap = new Map();
  (users || []).forEach((u) => {
    if (u?.id) userMap.set(String(u.id), u);
  });

  const taskMap = new Map();
  (tasks || []).forEach((t) => {
    if (t?.id) taskMap.set(String(t.id), t);
  });

  const notifications = [];
  const processedKeys = new Set();

  const pushNotification = (notif) => {
    if (!notif || !notif.id) return;
    if (processedKeys.has(notif.id)) return;
    processedKeys.add(notif.id);
    notifications.push({
      ...notif,
      isUnread: !readNotificationIds.includes(notif.id),
      timeFormatted: formatNotificationRelativeTime(notif.timestamp),
    });
  };

  // Helper to check if task is user's work or user is participant
  const isUserTaskParticipant = (task) => {
    if (!task) return false;
    const isAssigned =
      task.assigned_to === userId ||
      (Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.includes(userId));
    const isAssisted =
      task.assisted_by === userId ||
      (Array.isArray(task.assisted_by_ids) && task.assisted_by_ids.includes(userId));
    const isCreator = task.created_by === userId;
    return isAssigned || isAssisted || isCreator;
  };

  // 1. Task Comments & Chat Logs (Targeted to task participants)
  (tasks || []).forEach((task) => {
    if (task.task_origin === 'personal' && task.created_by !== userId && !isAdmin) return;

    const isParticipant = isUserTaskParticipant(task);
    const isDeptWork = isHOD && task.department_id === deptId;
    if (!isParticipant && !isDeptWork && !isAdmin) return;

    const taskNumber = task.task_number || `TM-${String(task.id).slice(0, 4)}`;
    const taskTitle = task.title || '';

    (task.task_updates || []).forEach((upd, idx) => {
      // Exclude self-notifications
      if (upd.user_id && String(upd.user_id) === String(userId)) return;

      const actor = userMap.get(String(upd.user_id)) || {
        id: upd.user_id,
        full_name: upd.user_name || 'Team Member',
        avatar_url: upd.user_avatar || null,
      };

      const hasAttachments = Array.isArray(upd.attachments) && upd.attachments.length > 0;
      const commentText = (upd.text || upd.update_text || '').trim();

      if (commentText) {
        const notifId = `notif-comment-${task.id}-${upd.id || upd.created_at || idx}`;
        pushNotification({
          id: notifId,
          type: 'comment',
          title: `${actor.full_name} commented on ${taskNumber}`,
          secondaryText: commentText,
          timestamp: upd.created_at || task.created_at || new Date().toISOString(),
          actor,
          task,
          taskId: task.id,
          taskNumber,
          destination: { type: 'task', taskId: task.id },
        });
      } else if (hasAttachments) {
        const attName = upd.attachments[0]?.name || 'attachment.png';
        const notifId = `notif-att-${task.id}-${upd.id || upd.created_at || idx}`;
        pushNotification({
          id: notifId,
          type: 'attachment',
          title: `${actor.full_name} added an attachment to ${taskNumber}`,
          secondaryText: attName,
          timestamp: upd.created_at || task.created_at || new Date().toISOString(),
          actor,
          task,
          taskId: task.id,
          taskNumber,
          destination: { type: 'task', taskId: task.id },
        });
      }
    });
  });

  // 2. Activity Logs (Task Assignments, Completion Requests/Decisions, Deletions)
  (activityLogs || []).forEach((log) => {
    if (!log) return;

    const targetTaskId = log.entity_id || log.metadata?.task_id;
    const task = targetTaskId ? taskMap.get(String(targetTaskId)) : null;

    if (task && task.task_origin === 'personal' && task.created_by !== userId && !isAdmin) {
      return;
    }

    const taskNumber =
      log.metadata?.task_number ||
      task?.task_number ||
      (task ? `TM-${String(task.id).slice(0, 4)}` : '');
    const taskTitle = task?.title || log.metadata?.title || '';
    const isActorSelf = String(log.user_id) === String(userId);

    let actor = userMap.get(String(log.user_id));
    if (!actor) {
      actor = {
        id: log.user_id || 'unknown',
        full_name: log.metadata?.user_name || log.metadata?.actor_name || 'Team Member',
        avatar_url: log.metadata?.user_avatar || null,
      };
    }

    // A. Task Assigned
    if (log.action === 'TASK_ASSIGNED') {
      const assignedToId = log.metadata?.assigned_to || log.metadata?.assigned_user_id;
      const isTargetedToMe = String(assignedToId) === String(userId);

      if (isTargetedToMe && !isActorSelf) {
        const notifId = `notif-assigned-${task?.id || log.id}-${log.created_at}`;
        pushNotification({
          id: notifId,
          type: 'assignment',
          title: `You were assigned to ${taskNumber}`,
          secondaryText: taskTitle || 'Assigned task',
          timestamp: log.created_at,
          actor,
          task,
          taskId: task?.id || targetTaskId,
          taskNumber,
          destination: { type: 'task', taskId: task?.id || targetTaskId },
        });
      }
    }

    // B. Completion Requested (Targeted to task creator / admin / HOD approvers)
    else if (log.action === 'COMPLETION_REQUESTED') {
      if (!isActorSelf) {
        const isCreator = task && task.created_by === userId;
        const isDeptApprover = isHOD && task && task.department_id === deptId;
        if (isCreator || isDeptApprover || isAdmin) {
          const notifId = `notif-comp-req-${task?.id || log.id}-${log.created_at}`;
          pushNotification({
            id: notifId,
            type: 'completion_request',
            title: `${actor.full_name} requested task completion`,
            secondaryText: `${taskNumber} ${taskTitle}`.trim(),
            timestamp: log.created_at,
            actor,
            task,
            taskId: task?.id || targetTaskId,
            taskNumber,
            destination: { type: 'inbox', subtype: 'completion', taskId: task?.id || targetTaskId },
          });
        }
      }
    }

    // C. Completion Approved / Rejected (Targeted to assignee/requester)
    else if (log.action === 'COMPLETION_REQUEST_APPROVED' || log.action === 'COMPLETION_REQUEST_REJECTED') {
      const isApproved = log.action === 'COMPLETION_REQUEST_APPROVED';
      const isParticipant = isUserTaskParticipant(task);

      if (isParticipant && !isActorSelf) {
        const notifId = `notif-comp-decision-${task?.id || log.id}-${log.created_at}`;
        pushNotification({
          id: notifId,
          type: isApproved ? 'completion_approved' : 'completion_rejected',
          title: isApproved
            ? `${actor.full_name} approved completion of ${taskNumber}`
            : `${actor.full_name} rejected completion for ${taskNumber}`,
          secondaryText: taskTitle,
          timestamp: log.created_at,
          actor,
          task,
          taskId: task?.id || targetTaskId,
          taskNumber,
          destination: { type: 'task', taskId: task?.id || targetTaskId },
        });
      }
    }

    // D. Delete Requested (Targeted to Admin & HOD approvers)
    else if (log.action === 'DELETE_REQUESTED') {
      if (!isActorSelf) {
        const isDeptApprover = isHOD && task && task.department_id === deptId;
        if (isAdmin || isDeptApprover) {
          const notifId = `notif-del-req-${task?.id || log.id}-${log.created_at}`;
          pushNotification({
            id: notifId,
            type: 'delete_request',
            title: `${actor.full_name} requested task deletion`,
            secondaryText: `${taskNumber} ${taskTitle}`.trim(),
            timestamp: log.created_at,
            actor,
            task,
            taskId: task?.id || targetTaskId,
            taskNumber,
            destination: { type: 'inbox', subtype: 'delete', taskId: task?.id || targetTaskId },
          });
        }
      }
    }
  });

  // 3. Due Date Alerts & Overdue Tasks (Targeted to assigned / assisted / creator)
  (tasks || []).forEach((task) => {
    if (task.status === 'completed' || task.is_deleted) return;
    if (task.task_origin === 'personal' && task.created_by !== userId && !isAdmin) return;

    const isParticipant = isUserTaskParticipant(task);
    if (!isParticipant && !isAdmin) return;

    const taskNumber = task.task_number || `TM-${String(task.id).slice(0, 4)}`;
    const taskTitle = task.title || '';

    if (!task.due_date) return;

    const dueDateObj = typeof task.due_date === 'string' ? parseISO(task.due_date) : new Date(task.due_date);
    if (isNaN(dueDateObj.getTime())) return;

    const isDueToday = isToday(dueDateObj);
    const isOverdue = isTaskOverdue(task.due_date, task.status);

    if (isDueToday) {
      const notifId = `notif-due-today-${task.id}-${task.due_date.slice(0, 10)}`;
      pushNotification({
        id: notifId,
        type: 'due_today',
        title: `${taskNumber} is due today`,
        secondaryText: taskTitle,
        timestamp: task.due_date,
        systemIcon: 'calendar',
        task,
        taskId: task.id,
        taskNumber,
        destination: { type: 'task', taskId: task.id },
      });
    } else if (isOverdue) {
      const notifId = `notif-overdue-${task.id}-${task.due_date.slice(0, 10)}`;
      pushNotification({
        id: notifId,
        type: 'overdue',
        title: `${taskNumber} is overdue`,
        secondaryText: taskTitle,
        timestamp: task.due_date,
        systemIcon: 'alert',
        task,
        taskId: task.id,
        taskNumber,
        destination: { type: 'task', taskId: task.id },
      });
    }
  });

  // Sort newest first
  return notifications.sort(
    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );
}
