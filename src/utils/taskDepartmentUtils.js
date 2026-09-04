/**
 * Utility functions for resolving departments and assistant departments for tasks.
 */

export function getTaskAssigneeIds(task) {
  if (!task) return [];
  let raw = [];
  if (Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.length > 0) {
    raw = task.assigned_to_ids;
  } else if (Array.isArray(task.assigned_to)) {
    raw = task.assigned_to;
  } else if (task.assigned_to) {
    raw = [task.assigned_to];
  } else if (Array.isArray(task.task_assignees)) {
    raw = task.task_assignees;
  } else if (Array.isArray(task.assignees)) {
    raw = task.assignees;
  } else if (Array.isArray(task.assigned_users)) {
    raw = task.assigned_users;
  }

  const ids = raw.map((item) => {
    if (typeof item === 'object' && item !== null) {
      return item.id || item.user_id;
    }
    return item;
  });

  return Array.from(new Set(ids.filter(Boolean)));
}

export function getTaskAssistantIds(task) {
  if (!task) return [];
  let raw = [];
  if (Array.isArray(task.assisted_by_ids) && task.assisted_by_ids.length > 0) {
    raw = task.assisted_by_ids;
  } else if (Array.isArray(task.assisted_by)) {
    raw = task.assisted_by;
  } else if (task.assisted_by) {
    raw = [task.assisted_by];
  } else if (Array.isArray(task.task_assistants)) {
    raw = task.task_assistants;
  } else if (Array.isArray(task.assistants)) {
    raw = task.assistants;
  } else if (Array.isArray(task.assistant_users)) {
    raw = task.assistant_users;
  }

  const ids = raw.map((item) => {
    if (typeof item === 'object' && item !== null) {
      return item.id || item.user_id;
    }
    return item;
  });

  return Array.from(new Set(ids.filter(Boolean)));
}

/**
 * Returns a list of department objects associated with a task,
 * indicating if a department is primary/assigned or strictly assisting.
 *
 * Each returned item has:
 * {
 *   id: string,
 *   name: string,
 *   color: string,
 *   isAssistant: boolean, // True if this department is involved strictly via assistants
 *   isPrimary: boolean,   // True if this is the primary or direct assigned department
 *   assignees: User[],
 *   assistants: User[]
 * }
 */
export function getTaskDepartmentsInfo(task, users = [], departments = []) {
  if (!task) return [];

  const userMap = {};
  (users || []).forEach((u) => {
    if (u && u.id) userMap[u.id] = u;
  });

  const deptMap = {};
  (departments || []).forEach((d) => {
    if (d && d.id) deptMap[d.id] = d;
  });

  const assigneeIds = getTaskAssigneeIds(task);
  const assistantIds = getTaskAssistantIds(task);

  const assignees = assigneeIds.map((id) => userMap[id]).filter(Boolean);
  const assistants = assistantIds.map((id) => userMap[id]).filter(Boolean);

  const primaryDeptIds = new Set();
  if (task.department_id) {
    primaryDeptIds.add(task.department_id);
  }
  assignees.forEach((a) => {
    if (a.department_id) primaryDeptIds.add(a.department_id);
  });

  const assistantDeptIds = new Set();
  assistants.forEach((ast) => {
    if (ast.department_id) assistantDeptIds.add(ast.department_id);
  });

  const allDeptIds = Array.from(new Set([...primaryDeptIds, ...assistantDeptIds]));

  return allDeptIds
    .map((deptId) => {
      const dept = deptMap[deptId];
      if (!dept) return null;

      const isPrimary = primaryDeptIds.has(deptId);
      const isAssistantOnly = !isPrimary && assistantDeptIds.has(deptId);

      const deptAssignees = assignees.filter((a) => a.department_id === deptId);
      const deptAssistants = assistants.filter((ast) => ast.department_id === deptId);

      return {
        ...dept,
        isAssistant: isAssistantOnly,
        isPrimary,
        hasAssistant: assistantDeptIds.has(deptId),
        assignees: deptAssignees,
        assistants: deptAssistants,
      };
    })
    .filter(Boolean);
}

/**
 * Checks whether a task is associated with a given department ID
 * (either as primary department, assignee department, or assistant department).
 */
export function isTaskInDepartment(task, departmentId, users = []) {
  if (!task || !departmentId || departmentId === 'all') return true;

  if (task.department_id === departmentId) return true;

  const userMap = {};
  (users || []).forEach((u) => {
    if (u && u.id) userMap[u.id] = u;
  });

  const assigneeIds = getTaskAssigneeIds(task);
  for (const id of assigneeIds) {
    const u = userMap[id];
    if (u && u.department_id === departmentId) return true;
  }

  const assistantIds = getTaskAssistantIds(task);
  for (const id of assistantIds) {
    const u = userMap[id];
    if (u && u.department_id === departmentId) return true;
  }

  return false;
}

/**
 * Checks whether a task's connection to a department is strictly as an assistant department.
 */
export function isDepartmentAssistantOnly(task, departmentId, users = []) {
  if (!task || !departmentId || departmentId === 'all') return false;

  const userMap = {};
  (users || []).forEach((u) => {
    if (u && u.id) userMap[u.id] = u;
  });

  if (task.department_id === departmentId) return false;

  const assigneeIds = getTaskAssigneeIds(task);
  for (const id of assigneeIds) {
    const u = userMap[id];
    if (u && u.department_id === departmentId) return false;
  }

  const assistantIds = getTaskAssistantIds(task);
  for (const id of assistantIds) {
    const u = userMap[id];
    if (u && u.department_id === departmentId) return true;
  }

  return false;
}

/**
 * Checks whether a task represents personal work for the given user:
 * - User is direct assignee (assigned_to)
 * - User is in assigned_to_ids
 * - User is assistant (assisted_by)
 * - User is in assisted_by_ids
 * Note: Tasks created by user where user is NOT an assignee or assistant are excluded from My Tasks!
 */
export function isTaskMyWork(task, currentUser) {
  if (!task || !currentUser) return false;
  const userId = currentUser.id;
  if (!userId) return false;

  const assigneeIds = getTaskAssigneeIds(task);
  const isDirectAssignee = task.assigned_to === userId || assigneeIds.includes(userId);

  const assistantIds = getTaskAssistantIds(task);
  const isAssistant = task.assisted_by === userId || assistantIds.includes(userId);

  return isDirectAssignee || isAssistant;
}

