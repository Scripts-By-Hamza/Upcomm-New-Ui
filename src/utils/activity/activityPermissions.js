import { canUserViewActivity } from '../rbac/permissionManager';

/**
 * Scopes normalized activities by current user's role and effective permissions.
 * Ensures zero data leakage of unauthorized tasks, cross-department activity, or private personal tasks.
 */
export function scopeActivitiesByRole({
  activities = [],
  currentUser,
  users = [],
}) {
  if (!currentUser) return [];

  return (activities || []).filter((item) => {
    return canUserViewActivity(currentUser, item, users);
  });
}
