import { format, parseISO, isToday, isYesterday, subDays, startOfDay } from 'date-fns';
import { isTaskInDepartment } from './taskDepartmentUtils';

/**
 * Format status string into clean title case
 */
export function formatStatusLabel(status) {
  if (!status) return 'Pending';
  const clean = String(status).toLowerCase().replace(/_/g, ' ');
  if (clean === 'in progress') return 'In Progress';
  if (clean === 'completed') return 'Completed';
  if (clean === 'pending') return 'Pending';
  return clean.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format timestamp into local 12-hour time (e.g. 10:42 AM)
 */
export function formatActivityTime(dateStr) {
  if (!dateStr) return '';
  try {
    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(parsed, 'h:mm a');
  } catch {
    return '';
  }
}

/**
 * Resolve all department-scoped activity logs, task updates, creation events, comments, and status transitions
 * with robust deduplication so no event appears twice.
 */
export function getDepartmentScopedActivities({
  activityLogs = [],
  tasks = [],
  users = [],
  departmentId,
}) {
  if (!departmentId) return [];

  const userMap = {};
  (users || []).forEach((u) => {
    if (u?.id) {
      userMap[u.id] = u;
      userMap[String(u.id)] = u;
    }
  });

  const taskMap = {};
  (tasks || []).forEach((t) => {
    if (t?.id) {
      taskMap[t.id] = t;
      taskMap[String(t.id)] = t;
    }
    if (t?.task_number) {
      taskMap[t.task_number] = t;
    }
  });

  const rawEvents = [];
  const processedFingerprints = new Set();

  // Helper to safely push event with fingerprint deduplication
  const pushEvent = (evt, fingerprint) => {
    if (!evt) return;
    const fp = fingerprint || evt.id;
    if (fp && processedFingerprints.has(fp)) return;
    if (fp) processedFingerprints.add(fp);
    rawEvents.push(evt);
  };

  // 1. Process explicit activityLogs (Primary Source)
  (activityLogs || []).forEach((log) => {
    if (!log) return;

    // Resolve task if this log is task-related
    const targetTaskId = log.entity_id || log.metadata?.task_id || log.metadata?.taskId;
    const taskObj = targetTaskId ? taskMap[targetTaskId] : (log.metadata?.task_number ? taskMap[log.metadata.task_number] : null);

    // Determine if log belongs to this department
    let belongsToDept = false;
    if (taskObj) {
      belongsToDept = isTaskInDepartment(taskObj, departmentId, users) || taskObj.department_id === departmentId;
    } else if (log.metadata?.department_id === departmentId || log.entity_id === departmentId) {
      belongsToDept = true;
    } else if (userMap[log.user_id]?.department_id === departmentId) {
      belongsToDept = true;
    }

    if (!belongsToDept) return;

    const actor = userMap[log.user_id] || {
      id: log.user_id,
      full_name: log.metadata?.user_name || log.metadata?.actor_name || 'Team Member',
      avatar_url: log.metadata?.user_avatar || null,
    };

    const taskNumber = log.metadata?.task_number || taskObj?.task_number || (taskObj ? `TM-${String(taskObj.id).slice(0, 4)}` : null);
    const taskTitle = taskObj?.title || log.metadata?.title || log.metadata?.task_title || '';
    const resolvedTaskId = taskObj?.id || targetTaskId || taskNumber;

    // Action categorization and sentence formatting
    const action = log.action || '';
    let category = 'tasks';
    let actionType = 'task_updated';
    let verb = 'updated';
    let targetSubject = '';
    let secondary = null;
    let fingerprint = `log_${log.id}`;

    if (action === 'TASK_STATUS_UPDATED') {
      actionType = 'status_changed';
      category = 'status';
      verb = 'changed';
      targetSubject = 'status';

      const oldStatus = log.metadata?.old_status;
      const newStatus = log.metadata?.new_status || taskObj?.status || 'in_progress';

      secondary = {
        type: 'status_transition',
        from: oldStatus ? formatStatusLabel(oldStatus) : null,
        to: formatStatusLabel(newStatus),
      };
      fingerprint = `status_${resolvedTaskId}_${newStatus}_${log.created_at ? log.created_at.slice(0, 16) : ''}`;
    } else if (action === 'COMPLETION_REQUESTED') {
      actionType = 'completion_requested';
      category = 'completion';
      verb = 'requested completion of';
      secondary = {
        type: 'completion_badge',
        label: 'Completion requested',
      };
      fingerprint = `completion_${resolvedTaskId}_${log.created_at ? log.created_at.slice(0, 16) : ''}`;
    } else if (action === 'DELETE_REQUESTED') {
      actionType = 'delete_requested';
      category = 'deletion';
      verb = 'requested deletion of';
      secondary = {
        type: 'deletion_badge',
        label: 'Deletion requested',
        reason: log.metadata?.reason || '',
      };
      fingerprint = `delete_req_${resolvedTaskId}_${log.created_at ? log.created_at.slice(0, 16) : ''}`;
    } else if (action === 'DELETE_REQUEST_APPROVED') {
      actionType = 'delete_approved';
      category = 'deletion';
      verb = 'approved deletion of';
      secondary = {
        type: 'deletion_badge',
        label: 'Task deleted',
      };
      fingerprint = `delete_appr_${resolvedTaskId}`;
    } else if (action === 'TASK_CREATED') {
      actionType = 'task_created';
      category = 'created';
      verb = 'created';
      targetSubject = taskTitle ? `— ${taskTitle}` : '';
      fingerprint = `created_${resolvedTaskId}`;
    } else if (action === 'TASK_ASSIGNED') {
      actionType = 'task_assigned';
      category = 'assignment';
      const assignedUser = userMap[log.metadata?.assigned_to] || {
        full_name: log.metadata?.assigned_user_name || 'a member',
      };
      if (actor.id === log.metadata?.assigned_to) {
        verb = 'was assigned to';
      } else {
        verb = `assigned ${assignedUser.full_name} to`;
      }
      targetSubject = taskTitle ? `${taskTitle}` : '';
      fingerprint = `assigned_${resolvedTaskId}_${log.metadata?.assigned_to || ''}_${log.created_at ? log.created_at.slice(0, 16) : ''}`;
    } else if (action === 'TASK_UPDATE_POSTED') {
      if (log.metadata?.attachments_count > 0 || log.metadata?.attachment_name) {
        actionType = 'attachment_added';
        category = 'attachments';
        verb = 'added an attachment to';
        const attName = log.metadata?.attachment_name || log.metadata?.filename || 'attachment.png';
        secondary = {
          type: 'attachment',
          name: attName,
          url: log.metadata?.attachment_url || null,
        };
        fingerprint = `att_${actor.id}_${resolvedTaskId}_${attName}`;
      } else {
        actionType = 'comment_added';
        category = 'comments';
        verb = 'commented on';
        const commentText = log.metadata?.text || '';
        if (commentText) {
          secondary = {
            type: 'comment',
            text: commentText,
          };
        }
        fingerprint = `comment_${actor.id}_${resolvedTaskId}_${commentText.slice(0, 40)}`;
      }
    } else if (action === 'TASK_UPDATED') {
      actionType = 'task_updated';
      category = 'tasks';
      if (log.metadata?.new_status === 'completed' || taskObj?.status === 'completed') {
        verb = 'completed';
        fingerprint = `completed_${resolvedTaskId}`;
      } else if (log.metadata?.priority) {
        actionType = 'priority_changed';
        verb = 'changed priority of';
        secondary = {
          type: 'priority_transition',
          from: log.metadata?.old_priority || 'Normal',
          to: log.metadata?.priority,
        };
        fingerprint = `priority_${resolvedTaskId}_${log.metadata?.priority}`;
      } else if (log.metadata?.due_date) {
        actionType = 'due_date_changed';
        verb = 'changed due date of';
        secondary = {
          type: 'due_date_transition',
          to: log.metadata.due_date,
        };
        fingerprint = `duedate_${resolvedTaskId}_${log.metadata.due_date}`;
      } else {
        verb = 'updated';
      }
    } else if (action.startsWith('DEPARTMENT_')) {
      actionType = 'department_action';
      category = 'department';
      verb = action === 'DEPARTMENT_CREATED' ? 'created department' : 'updated department';
    }

    pushEvent(
      {
        id: log.id,
        timestamp: log.created_at || new Date().toISOString(),
        timeFormatted: formatActivityTime(log.created_at),
        actor,
        task: taskObj || (targetTaskId ? { id: targetTaskId, task_number: taskNumber, title: taskTitle } : null),
        taskNumber,
        taskTitle,
        verb,
        targetSubject,
        actionType,
        category,
        secondary,
        rawLog: log,
      },
      fingerprint
    );
  });

  // 2. Incorporate task updates and creations directly from tasks (Fallback for tasks without separate activity_logs)
  (tasks || []).forEach((task) => {
    if (!task) return;
    const isDeptTask = isTaskInDepartment(task, departmentId, users) || task.department_id === departmentId;
    if (!isDeptTask) return;

    const taskNumber = task.task_number || `TM-${String(task.id).slice(0, 4)}`;
    const taskTitle = task.title || '';
    const resolvedTaskId = task.id;

    // A. Task Created Event (Fallback if not already logged)
    if (task.created_at) {
      const creator = userMap[task.created_by] || {
        id: task.created_by,
        full_name: 'Team Lead',
        avatar_url: null,
      };
      const createdFingerprint = `created_${resolvedTaskId}`;

      if (!processedFingerprints.has(createdFingerprint)) {
        pushEvent(
          {
            id: `task-create-${task.id}`,
            timestamp: task.created_at,
            timeFormatted: formatActivityTime(task.created_at),
            actor: creator,
            task,
            taskNumber,
            taskTitle,
            verb: 'created',
            targetSubject: taskTitle ? `— ${taskTitle}` : '',
            actionType: 'task_created',
            category: 'created',
            secondary: null,
            rawLog: task,
          },
          createdFingerprint
        );
      }
    }

    // B. Task Updates, Comments, Attachments from task.task_updates (Fallback if not already logged)
    (task.task_updates || []).forEach((upd, updIdx) => {
      const updTimestamp = upd.created_at || task.created_at || new Date().toISOString();
      const updActor = userMap[upd.user_id] || {
        id: upd.user_id,
        full_name: upd.user_name || 'Team Member',
        avatar_url: upd.user_avatar || null,
      };

      const hasAttachments = Array.isArray(upd.attachments) && upd.attachments.length > 0;
      const firstAttachment = hasAttachments ? upd.attachments[0] : null;

      if (hasAttachments) {
        const attName = firstAttachment?.name || 'attachment.png';
        const attFingerprint = `att_${updActor.id}_${resolvedTaskId}_${attName}`;

        if (!processedFingerprints.has(attFingerprint)) {
          pushEvent(
            {
              id: `upd-att-${task.id}-${upd.id || updIdx}`,
              timestamp: updTimestamp,
              timeFormatted: formatActivityTime(updTimestamp),
              actor: updActor,
              task,
              taskNumber,
              taskTitle,
              verb: 'added an attachment to',
              targetSubject: '',
              actionType: 'attachment_added',
              category: 'attachments',
              secondary: {
                type: 'attachment',
                name: attName,
                url: firstAttachment?.url || null,
              },
              rawLog: upd,
            },
            attFingerprint
          );
        }
      }

      if (upd.text || upd.update_text) {
        const commentText = upd.text || upd.update_text;
        const commentFingerprint = `comment_${updActor.id}_${resolvedTaskId}_${commentText.slice(0, 40)}`;

        if (!processedFingerprints.has(commentFingerprint)) {
          pushEvent(
            {
              id: `upd-comment-${task.id}-${upd.id || updIdx}`,
              timestamp: updTimestamp,
              timeFormatted: formatActivityTime(updTimestamp),
              actor: updActor,
              task,
              taskNumber,
              taskTitle,
              verb: 'commented on',
              targetSubject: '',
              actionType: 'comment_added',
              category: 'comments',
              secondary: {
                type: 'comment',
                text: commentText,
              },
              rawLog: upd,
            },
            commentFingerprint
          );
        }
      }

      if (upd.status && upd.status !== 'pending') {
        const statusFingerprint = `status_${resolvedTaskId}_${upd.status}_${updTimestamp ? updTimestamp.slice(0, 16) : ''}`;

        if (!processedFingerprints.has(statusFingerprint)) {
          pushEvent(
            {
              id: `upd-status-${task.id}-${upd.id || updIdx}`,
              timestamp: updTimestamp,
              timeFormatted: formatActivityTime(updTimestamp),
              actor: updActor,
              task,
              taskNumber,
              taskTitle,
              verb: 'changed',
              targetSubject: 'status',
              actionType: 'status_changed',
              category: 'status',
              secondary: {
                type: 'status_transition',
                from: upd.old_status ? formatStatusLabel(upd.old_status) : null,
                to: formatStatusLabel(upd.status),
              },
              rawLog: upd,
            },
            statusFingerprint
          );
        }
      }
    });
  });

  // Sort newest first
  return rawEvents.sort(
    (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
  );
}

/**
 * Filter activities based on the 4 toolbar criteria (Employee, Task, Action, Date)
 */
export function filterDepartmentActivities(activities = [], filters = {}) {
  const {
    employeeId = 'all',
    taskId = 'all',
    actionType = 'all',
    dateRange = 'all', // 'all' | 'today' | 'yesterday' | 'week' | 'month'
  } = filters;

  const now = new Date();
  const todayStart = startOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));
  const weekStart = startOfDay(subDays(now, 7));
  const monthStart = startOfDay(subDays(now, 30));

  return (activities || []).filter((item) => {
    // 1. Employee (Actor) Filter
    if (employeeId !== 'all' && String(item.actor?.id) !== String(employeeId)) {
      return false;
    }

    // 2. Task Filter
    if (taskId !== 'all') {
      const itemTaskId = item.task?.id || item.rawLog?.entity_id || item.rawLog?.metadata?.task_id;
      if (String(itemTaskId) !== String(taskId)) {
        return false;
      }
    }

    // 3. Action Type Filter
    if (actionType !== 'all' && item.actionType !== actionType) {
      return false;
    }

    // 4. Date Filter (local day based)
    if (dateRange !== 'all') {
      const itemDate = new Date(item.timestamp);
      if (isNaN(itemDate.getTime())) return true;

      if (dateRange === 'today') {
        if (!isToday(itemDate)) return false;
      } else if (dateRange === 'yesterday') {
        if (!isYesterday(itemDate)) return false;
      } else if (dateRange === 'week') {
        if (itemDate < weekStart) return false;
      } else if (dateRange === 'month') {
        if (itemDate < monthStart) return false;
      }
    }

    return true;
  });
}

/**
 * Group chronological activities into date sections (TODAY, YESTERDAY, formatted dates)
 */
export function groupActivitiesByDate(activities = []) {
  const groups = [];
  const groupMap = new Map();

  (activities || []).forEach((item) => {
    if (!item.timestamp) return;
    const dateObj = new Date(item.timestamp);
    if (isNaN(dateObj.getTime())) return;

    let key = '';
    let isTodayGroup = false;
    let isYesterdayGroup = false;

    if (isToday(dateObj)) {
      key = 'TODAY';
      isTodayGroup = true;
    } else if (isYesterday(dateObj)) {
      key = 'YESTERDAY';
      isYesterdayGroup = true;
    } else {
      key = format(dateObj, 'MMMM d').toUpperCase();
      if (dateObj.getFullYear() !== new Date().getFullYear()) {
        key = format(dateObj, 'MMMM d, yyyy').toUpperCase();
      }
    }

    if (!groupMap.has(key)) {
      const newGroup = {
        key,
        label: key,
        isToday: isTodayGroup,
        isYesterday: isYesterdayGroup,
        items: [],
      };
      groupMap.set(key, newGroup);
      groups.push(newGroup);
    }

    groupMap.get(key).items.push(item);
  });

  return groups;
}
