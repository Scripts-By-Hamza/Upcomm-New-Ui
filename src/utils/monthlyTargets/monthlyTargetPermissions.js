/**
 * Authorization and Scope Management for Monthly Targets & KPIs
 */

/**
 * Checks whether a user can view a given monthly target.
 * 
 * Rules:
 * 1. Admin: View all targets across all departments.
 * 2. Target Owner: Always view own target.
 * 3. HOD:
 *    - Can view targets in own department IF the target owner is a team member.
 *    - Can view own HOD self targets.
 *    - CANNOT view other departments' targets.
 *    - CANNOT view peer HOD private/self targets in the same department (if any).
 * 4. Team Member:
 *    - Can ONLY view targets where owner_user_id === currentUser.id.
 *    - ZERO lateral visibility (cannot see peers' targets).
 *    - Cannot see HOD self targets.
 */
export function canViewMonthlyTarget(currentUser, target, users = [], departments = []) {
  if (!currentUser || !target) return false;

  const role = currentUser.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';

  // 1. Admin has global visibility
  if (isAdmin) {
    return true;
  }

  // 2. Direct owner always has access
  if (target.owner_user_id === currentUser.id) {
    return true;
  }

  // 3. Team member has no access to others' targets
  if (role === 'team_member') {
    return false;
  }

  // 4. HOD Access Rules
  if (role === 'hod') {
    const userDeptId = currentUser.department_id;
    if (!userDeptId || target.department_id !== userDeptId) {
      return false; // Cross-department denied
    }

    // Resolve target owner user
    const ownerUser = (users || []).find((u) => u.id === target.owner_user_id);
    const ownerRole = ownerUser?.role || 'team_member';

    // If target belongs to a team member in this HOD's department -> visible!
    if (ownerRole === 'team_member') {
      return true;
    }

    // If target is owned by an HOD/Admin other than current user -> private/hidden!
    return false;
  }

  return false;
}

/**
 * Checks whether a user can edit / update a monthly target.
 */
export function canEditMonthlyTarget(currentUser, target, users = []) {
  if (!currentUser || !target) return false;

  const role = currentUser.role || 'team_member';
  if (role === 'admin' || role === 'it_support_admin') {
    return true;
  }

  // Target owner can edit status, progress, and details
  if (target.owner_user_id === currentUser.id) {
    return true;
  }

  // HOD can edit targets in their own department if owned by a team member
  if (role === 'hod' && target.department_id === currentUser.department_id) {
    const ownerUser = (users || []).find((u) => u.id === target.owner_user_id);
    if (!ownerUser || ownerUser.role === 'team_member') {
      return true;
    }
  }

  return false;
}

/**
 * Checks whether a user can comment on a monthly target.
 * (Anyone who is authorized to view the target can comment on it)
 */
export function canCommentOnMonthlyTarget(currentUser, target, users = [], departments = []) {
  return canViewMonthlyTarget(currentUser, target, users, departments);
}

/**
 * Checks whether a user can delete a monthly target.
 */
export function canDeleteMonthlyTarget(currentUser, target) {
  if (!currentUser || !target) return false;

  const role = currentUser.role || 'team_member';
  if (role === 'admin' || role === 'it_support_admin') {
    return true;
  }

  // Creator can delete target if authorized
  if (target.created_by === currentUser.id) {
    return true;
  }

  // HOD can delete target created for team member in own department
  if (role === 'hod' && target.department_id === currentUser.department_id) {
    if (target.created_by === currentUser.id || target.owner_user_id === currentUser.id) {
      return true;
    }
  }

  return false;
}

/**
 * Returns the list of users that the current user can assign a monthly target to.
 */
export function getEligibleTargetOwners(currentUser, users = [], departments = []) {
  if (!currentUser) return [];

  const role = currentUser.role || 'team_member';

  // Team Member can ONLY select themselves
  if (role === 'team_member') {
    return [
      {
        id: currentUser.id,
        full_name: currentUser.full_name || 'Myself',
        avatar_url: currentUser.avatar_url,
        role: currentUser.role,
        department_id: currentUser.department_id,
        isMyself: true,
      },
    ];
  }

  // HOD can select "Myself" or active team members in their own department
  if (role === 'hod') {
    const userDeptId = currentUser.department_id;
    const myself = {
      id: currentUser.id,
      full_name: `${currentUser.full_name || 'Myself'} (Myself)`,
      avatar_url: currentUser.avatar_url,
      role: currentUser.role,
      department_id: userDeptId,
      isMyself: true,
    };

    const deptMembers = (users || [])
      .filter((u) => {
        if (!u || u.id === currentUser.id) return false;
        if (u.exclude_from_directory || u.is_system_account) return false;
        return u.department_id === userDeptId && u.role === 'team_member';
      })
      .map((u) => ({
        id: u.id,
        full_name: u.full_name || 'Team Member',
        avatar_url: u.avatar_url,
        role: u.role,
        department_id: u.department_id,
        isMyself: false,
      }));

    return [myself, ...deptMembers];
  }

  // Admin can select all active non-system users
  return (users || [])
    .filter((u) => u && !u.exclude_from_directory && !u.is_system_account)
    .map((u) => ({
      id: u.id,
      full_name: u.id === currentUser.id ? `${u.full_name || 'Admin'} (Myself)` : u.full_name,
      avatar_url: u.avatar_url,
      role: u.role,
      department_id: u.department_id,
      isMyself: u.id === currentUser.id,
    }));
}
