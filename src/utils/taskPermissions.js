import { getTaskAssigneeIds, getTaskAssistantIds } from './taskDepartmentUtils';

/**
 * Derives user permissions for a specific task.
 * Matches the exact authorization logic in TaskDetailPage.
 */
export function getTaskPermissions(task, currentUser) {
  if (!task || !currentUser) {
    return {
      isAdmin: false,
      isOwner: false,
      isAssignee: false,
      isAssistant: false,
      isHOD: false,
      canEdit: false,
      canUpdateGlobalTaskStatus: false,
      mustRequestCompletion: true,
      canAddTeam: false,
      canDeleteDirectly: false,
    };
  }

  const role = currentUser.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isOwner = task.created_by === currentUser.id || task.assigned_by === currentUser.id;
  const isHOD = role === 'hod';

  const assigneeIds = getTaskAssigneeIds(task);
  const assistantIds = getTaskAssistantIds(task);

  const isAssignee = assigneeIds.includes(currentUser.id) || task.assigned_to === currentUser.id;
  const isAssistant = assistantIds.includes(currentUser.id) || task.assisted_by === currentUser.id;

  const canEdit = isAdmin || isOwner;
  const canUpdateGlobalTaskStatus = isAdmin || isHOD || isAssignee || isOwner;
  const mustRequestCompletion = !isOwner && !isAdmin;
  const canAddTeam = isAdmin || isHOD;
  const canDeleteDirectly = isAdmin;

  return {
    isAdmin,
    isOwner,
    isAssignee,
    isAssistant,
    isHOD,
    canEdit,
    canUpdateGlobalTaskStatus,
    mustRequestCompletion,
    canAddTeam,
    canDeleteDirectly,
  };
}
