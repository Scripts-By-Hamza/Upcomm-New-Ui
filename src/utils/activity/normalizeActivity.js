import { format, parseISO } from 'date-fns';

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
 * Format timestamp into local 12-hour time (e.g., 10:42 AM)
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
 * Normalizes, merges, and deduplicates all activity events across activityLogs and task_updates.
 */
export function getNormalizedActivities({
  activityLogs = [],
  tasks = [],
  users = [],
  departments = [],
}) {
  const userMap = new Map();
  (users || []).forEach((u) => {
    if (u?.id) {
      userMap.set(String(u.id), u);
    }
  });

  const taskMap = new Map();
  (tasks || []).forEach((t) => {
    if (t?.id) {
      taskMap.set(String(t.id), t);
    }
    if (t?.task_number) {
      taskMap.set(String(t.task_number), t);
    }
  });

  const deptMap = new Map();
  (departments || []).forEach((d) => {
    if (d?.id) {
      deptMap.set(String(d.id), d);
    }
  });

  const rawEvents = [];
  const processedFingerprints = new Set();

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

    const targetTaskId = log.entity_id || log.metadata?.task_id || log.metadata?.taskId;
    const taskObj = targetTaskId
      ? taskMap.get(String(targetTaskId))
      : log.metadata?.task_number
      ? taskMap.get(String(log.metadata.task_number))
      : null;

    // Resolve Actor
    const isSystemUser = log.user_id === 'system' || log.metadata?.is_system;
    let actor = userMap.get(String(log.user_id));
    if (!actor) {
      if (isSystemUser) {
        actor = { id: 'system', full_name: 'System', is_system: true };
      } else {
        actor = {
          id: log.user_id || 'unknown',
          full_name: log.metadata?.user_name || log.metadata?.actor_name || 'Team Member',
          avatar_url: log.metadata?.user_avatar || null,
        };
      }
    }

    const taskNumber =
      log.metadata?.task_number ||
      taskObj?.task_number ||
      (taskObj ? `TM-${String(taskObj.id).slice(0, 4)}` : null);
    const taskTitle = taskObj?.title || log.metadata?.title || log.metadata?.task_title || '';
    const resolvedTaskId = taskObj?.id || targetTaskId || taskNumber;

    // Resolve Department associated with task or log
    let departmentName = null;
    let departmentId = null;
    if (taskObj?.department_id) {
      departmentId = taskObj.department_id;
      departmentName = deptMap.get(String(taskObj.department_id))?.name || null;
    } else if (log.metadata?.department_id || log.entity_type === 'department') {
      departmentId = log.metadata?.department_id || log.entity_id;
      departmentName = log.metadata?.department_name || deptMap.get(String(departmentId))?.name || null;
    } else if (actor.department_id) {
      departmentId = actor.department_id;
      departmentName = deptMap.get(String(actor.department_id))?.name || null;
    }

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
      verb = 'changed status of';

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
      verb = 'requested completion for';
      secondary = {
        type: 'completion_badge',
        label: 'Completion requested',
      };
      fingerprint = `completion_${resolvedTaskId}_${log.created_at ? log.created_at.slice(0, 16) : ''}`;
    } else if (action === 'COMPLETION_REQUEST_APPROVED') {
      actionType = 'completion_approved';
      category = 'completion';
      verb = 'approved completion of';
      secondary = {
        type: 'completion_badge',
        label: 'Completed',
      };
      fingerprint = `comp_appr_${resolvedTaskId}`;
    } else if (action === 'COMPLETION_REQUEST_REJECTED') {
      actionType = 'completion_rejected';
      category = 'completion';
      verb = 'rejected the completion request for';
      secondary = {
        type: 'completion_badge',
        label: 'Completion rejected',
        reason: log.metadata?.reason || '',
      };
      fingerprint = `comp_rej_${resolvedTaskId}`;
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
    } else if (action === 'DELETE_REQUEST_REJECTED') {
      actionType = 'delete_rejected';
      category = 'deletion';
      verb = 'rejected deletion request for';
      secondary = {
        type: 'deletion_badge',
        label: 'Deletion rejected',
      };
      fingerprint = `delete_rej_${resolvedTaskId}`;
    } else if (action === 'TASK_CREATED') {
      actionType = 'task_created';
      category = 'created';
      verb = 'created';
      if (departmentName) {
        secondary = {
          type: 'department_tag',
          name: departmentName,
        };
      }
      fingerprint = `created_${resolvedTaskId}`;
    } else if (action === 'TASK_ASSIGNED') {
      actionType = 'task_assigned';
      category = 'assignment';
      const assignedUserId = log.metadata?.assigned_to || log.metadata?.assigned_user_id;
      const assignedUser = userMap.get(String(assignedUserId)) || {
        full_name: log.metadata?.assigned_user_name || 'Team Member',
      };

      if (actor.id && String(actor.id) === String(assignedUserId)) {
        verb = 'assigned himself to';
      } else {
        verb = `assigned ${assignedUser.full_name} to`;
      }
      fingerprint = `assigned_${resolvedTaskId}_${assignedUserId || ''}_${log.created_at ? log.created_at.slice(0, 16) : ''}`;
    } else if (action === 'TASK_UPDATE_POSTED') {
      if (log.metadata?.attachments_count > 0 || log.metadata?.attachment_name || log.metadata?.attachments) {
        actionType = 'attachment_added';
        category = 'attachments';
        verb = 'added an attachment to';
        const attName =
          log.metadata?.attachment_name ||
          (Array.isArray(log.metadata?.attachments) && log.metadata.attachments[0]?.name) ||
          log.metadata?.filename ||
          'attachment.png';
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
        secondary = {
          type: 'completion_badge',
          label: 'Completed',
        };
        fingerprint = `completed_${resolvedTaskId}`;
      } else if (log.metadata?.priority) {
        actionType = 'priority_changed';
        verb = 'changed priority of';
        secondary = {
          type: 'priority_transition',
          from: log.metadata?.old_priority ? formatStatusLabel(log.metadata.old_priority) : null,
          to: formatStatusLabel(log.metadata.priority),
        };
        fingerprint = `priority_${resolvedTaskId}_${log.metadata.priority}`;
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
      const dName = log.metadata?.name || departmentName || 'Department';
      verb =
        action === 'DEPARTMENT_CREATED'
          ? `created department ${dName}`
          : action === 'DEPARTMENT_DELETED'
          ? `deleted department ${dName}`
          : `updated department ${dName}`;
    } else if (action.startsWith('USER_')) {
      actionType = 'user_action';
      category = 'user';
      const uName = log.metadata?.name || log.metadata?.full_name || 'User Account';
      verb = action === 'USER_CREATED' ? `created user account for ${uName}` : `updated user ${uName}`;
    } else if (action.startsWith('REPORT_')) {
      actionType = 'report_action';
      category = 'report';
      const rTitle = log.metadata?.title || 'Report';
      verb = action === 'REPORT_SUBMITTED' ? `submitted report "${rTitle}"` : `deleted report`;
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
        departmentId,
        departmentName,
        rawLog: log,
      },
      fingerprint
    );
  });

  // 2. Incorporate task updates and creations directly from tasks (Fallback for tasks without separate activity_logs)
  (tasks || []).forEach((task) => {
    if (!task) return;

    const taskNumber = task.task_number || `TM-${String(task.id).slice(0, 4)}`;
    const taskTitle = task.title || '';
    const resolvedTaskId = task.id;
    const taskDeptName = deptMap.get(String(task.department_id))?.name || null;

    // A. Task Created Event (Fallback if not already logged)
    if (task.created_at) {
      const creator = userMap.get(String(task.created_by)) || {
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
            targetSubject: '',
            actionType: 'task_created',
            category: 'created',
            secondary: taskDeptName ? { type: 'department_tag', name: taskDeptName } : null,
            departmentId: task.department_id,
            departmentName: taskDeptName,
            rawLog: task,
          },
          createdFingerprint
        );
      }
    }

    // B. Completed Task Event if completed
    if (task.status === 'completed' && task.completed_at) {
      const completedFingerprint = `completed_${resolvedTaskId}`;
      if (!processedFingerprints.has(completedFingerprint)) {
        const updater = userMap.get(String(task.assigned_to)) || userMap.get(String(task.created_by)) || {
          id: 'user',
          full_name: 'Team Member',
          avatar_url: null,
        };
        pushEvent(
          {
            id: `task-complete-${task.id}`,
            timestamp: task.completed_at,
            timeFormatted: formatActivityTime(task.completed_at),
            actor: updater,
            task,
            taskNumber,
            taskTitle,
            verb: 'completed',
            targetSubject: '',
            actionType: 'task_completed',
            category: 'status',
            secondary: {
              type: 'completion_badge',
              label: 'Completed',
            },
            departmentId: task.department_id,
            departmentName: taskDeptName,
            rawLog: task,
          },
          completedFingerprint
        );
      }
    }

    // C. Task Updates, Comments, Attachments from task.task_updates
    (task.task_updates || []).forEach((upd, updIdx) => {
      const updTimestamp = upd.created_at || task.created_at || new Date().toISOString();
      const updActor = userMap.get(String(upd.user_id)) || {
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
              departmentId: task.department_id,
              departmentName: taskDeptName,
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
              departmentId: task.department_id,
              departmentName: taskDeptName,
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
              verb: 'changed status of',
              targetSubject: '',
              actionType: 'status_changed',
              category: 'status',
              secondary: {
                type: 'status_transition',
                from: upd.old_status ? formatStatusLabel(upd.old_status) : null,
                to: formatStatusLabel(upd.status),
              },
              departmentId: task.department_id,
              departmentName: taskDeptName,
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
