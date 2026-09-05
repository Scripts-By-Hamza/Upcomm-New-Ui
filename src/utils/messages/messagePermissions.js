import { getEffectivePermissions } from '../rbac/permissionManager.js';

/**
 * Checks whether the current user has permission to start direct messages.
 */
export function canStartDirectMessage(user) {
  if (!user) return false;
  const role = (user.role || 'team_member').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  const perms = getEffectivePermissions(user);
  return perms['messages.send_direct'] !== false;
}

/**
 * Checks whether the current user has permission to create group conversations.
 */
export function canCreateGroup(user) {
  if (!user) return false;
  const role = (user.role || 'team_member').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  const perms = getEffectivePermissions(user);
  return perms['messages.create_group'] !== false;
}

/**
 * Checks whether the current user has permission to send broadcast messages.
 */
export function canBroadcast(user) {
  if (!user) return false;
  const role = (user.role || 'team_member').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  const perms = getEffectivePermissions(user);
  return perms['messages.send_broadcast'] !== false;
}

/**
 * Checks whether the user can message across departments.
 */
export function canMessageCrossDepartment(user) {
  if (!user) return false;
  const role = (user.role || 'team_member').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  const perms = getEffectivePermissions(user);
  return perms['messages.cross_department'] !== false;
}

/**
 * Checks whether the user can submit message reports.
 */
export function canReportMessage(user, message) {
  if (!user || !message) return false;
  // User cannot report their own message
  if (String(message.sender_id) === String(user.id)) return false;
  const perms = getEffectivePermissions(user);
  return perms['messages.report'] !== false;
}

/**
 * Checks whether the user has access to review and manage message reports.
 * Strictly Admins or users with explicit message_reports.manage permission.
 */
export function canManageMessageReports(user) {
  if (!user) return false;
  const role = (user.role || 'team_member').toLowerCase();
  if (role === 'admin' || role === 'it_support_admin') return true;
  const perms = getEffectivePermissions(user);
  return Boolean(perms['message_reports.manage']);
}

/**
 * Checks whether a user is an authorized participant of a conversation.
 * CRITICAL PRIVACY RULE: Admins and HODs are NOT automatically participants in other people's private chats.
 */
export function canViewConversation(user, conversation, participants = []) {
  if (!user || !conversation) return false;
  const userId = String(user.id);
  const convId = String(conversation.id);

  // Check in participant records
  const isParticipant = (participants || []).some(
    (p) => p && String(p.conversation_id) === convId && String(p.user_id || p.id) === userId
  );

  return isParticipant;
}

/**
 * Returns the list of eligible recipients for the current user to message.
 * Excludes self, hidden accounts, and deactivated accounts.
 */
export function getEligibleMessageRecipients(currentUser, allUsers = []) {
  if (!currentUser) return [];

  const crossDept = canMessageCrossDepartment(currentUser);
  const userDeptId = currentUser.department_id;
  const currentUid = String(currentUser.id);

  return (allUsers || []).filter((u) => {
    if (!u || String(u.id) === currentUid) return false;
    if (u.is_active === false) return false; // Exclude deactivated accounts
    if (u.exclude_from_directory || u.is_system_account) return false;

    // Cross-department restriction check
    if (!crossDept && userDeptId && u.department_id && u.department_id !== userDeptId) {
      return false;
    }

    return true;
  });
}
