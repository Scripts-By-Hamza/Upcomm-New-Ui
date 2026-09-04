import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../../components/common/Avatar';
import { UserPermissionDrawer } from '../../components/team/UserPermissionDrawer';
import {
  Shield,
  ShieldCheck,
  Search,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Building2,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  getUserAccessLevel,
  getOverrideCount,
  ROLE_DEFINITIONS,
} from '../../utils/rbac/permissionManager';

export function UserPermissionsPage() {
  const { users = [], currentUser, updateUserPermissions } = useAuth();
  const { departments = [] } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Selected user for Permission Drawer
  const [selectedUserForDrawer, setSelectedUserForDrawer] = useState(null);

  // Filters from URL
  const search = searchParams.get('search') || '';
  const roleFilter = searchParams.get('role') || 'all';
  const deptFilter = searchParams.get('department') || 'all';
  const accessFilter = searchParams.get('access') || 'all';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = 10;

  const updateParam = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'all' || !value) {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
        next.delete('page');
        return next;
      },
      { replace: true }
    );
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const handlePageChange = (newPage) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newPage <= 1) {
          next.delete('page');
        } else {
          next.set('page', String(newPage));
        }
        return next;
      },
      { replace: true }
    );
  };

  // Departments Lookup Map
  const departmentsMap = useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d?.id) {
        map[d.id] = d;
        map[String(d.id)] = d;
      }
    });
    return map;
  }, [departments]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return (users || []).filter((user) => {
      if (!user || user.exclude_from_directory || user.is_system_account) return false;

      // 1. Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const name = (user.full_name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const designation = (user.designation || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !designation.includes(q)) {
          return false;
        }
      }

      // 2. Role filter
      if (roleFilter !== 'all') {
        const userRole = (user.role || 'team_member').toLowerCase();
        if (roleFilter === 'admin' && userRole !== 'admin' && userRole !== 'it_support_admin') {
          return false;
        }
        if (roleFilter !== 'admin' && userRole !== roleFilter) {
          return false;
        }
      }

      // 3. Department filter
      if (deptFilter !== 'all') {
        if (String(user.department_id) !== String(deptFilter)) {
          return false;
        }
      }

      // 4. Access Level filter
      if (accessFilter !== 'all') {
        const access = getUserAccessLevel(user);
        if (accessFilter === 'full' && access.label !== 'Full Access') return false;
        if (accessFilter === 'custom' && access.label !== 'Custom') return false;
        if (accessFilter === 'hod' && access.label !== 'HOD Default') return false;
        if (accessFilter === 'member' && access.label !== 'Team Member Default') return false;
      }

      return true;
    });
  }, [users, search, roleFilter, deptFilter, accessFilter]);

  // Pagination
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const hasActiveFilters = Boolean(
    search.trim() || roleFilter !== 'all' || deptFilter !== 'all' || accessFilter !== 'all'
  );

  const handleSaveUserPermissions = async (userId, overrides) => {
    if (updateUserPermissions) {
      await updateUserPermissions(userId, overrides);
    }
  };

  return (
    <div className="space-y-5 font-['Inter'] pb-12 select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Page Header */}
      <div>
        <div className="flex items-center gap-1.5 text-[12px] text-[#71717A] dark:text-[#A1A1AA] mb-1">
          <span>Workspace</span>
          <span>/</span>
          <span>Team</span>
          <span>/</span>
          <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">User Permissions</span>
        </div>
        <h1 className="text-[22px] sm:text-[24px] font-semibold text-[#18181B] dark:text-[#F4F4F5] tracking-tight">
          User Permissions
        </h1>
        <p className="text-[13px] text-[#52525B] dark:text-[#A1A1AA] mt-0.5 font-normal">
          Manage role-based access and individual user permissions across UPCOMM.
        </p>
      </div>

      {/* 2. Toolbar */}
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-3 sm:p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder="Search user by name, email..."
              className="w-full h-9 pl-9 pr-3 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#121214] text-[13px] text-[#18181B] dark:text-white placeholder-[#8B8B95] focus:bg-white focus:border-[#059669] focus:outline-none transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => updateParam('role', e.target.value)}
              className="h-9 px-2.5 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12.5px] text-[#18181B] dark:text-white font-medium focus:border-[#059669] focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hod">HOD</option>
              <option value="team_member">Team Member</option>
            </select>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => updateParam('department', e.target.value)}
              className="h-9 px-2.5 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12.5px] text-[#18181B] dark:text-white font-medium focus:border-[#059669] focus:outline-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Access Level Filter */}
            <select
              value={accessFilter}
              onChange={(e) => updateParam('access', e.target.value)}
              className="h-9 px-2.5 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12.5px] text-[#18181B] dark:text-white font-medium focus:border-[#059669] focus:outline-none cursor-pointer"
            >
              <option value="all">All Access Levels</option>
              <option value="full">Full Access</option>
              <option value="custom">Custom Overrides</option>
              <option value="hod">HOD Default</option>
              <option value="member">Team Member Default</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-9 px-2.5 rounded-[7px] text-[12px] font-medium text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        <div className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] pt-1">
          Showing <span className="font-semibold text-[#18181B] dark:text-white">{filteredUsers.length}</span> user accounts
        </div>
      </div>

      {/* 3. Main Permissions Table (Desktop) */}
      <div className="hidden md:block bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#27272A] bg-[#FAFBFB] dark:bg-[#121214] text-[12px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                <th className="px-5 py-3 whitespace-nowrap">Employee</th>
                <th className="px-5 py-3 whitespace-nowrap">Role</th>
                <th className="px-5 py-3 whitespace-nowrap">Department</th>
                <th className="px-5 py-3 whitespace-nowrap">Access Level</th>
                <th className="px-5 py-3 whitespace-nowrap">Custom Permissions</th>
                <th className="px-5 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F5] dark:divide-[#27272A]">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-[#71717A] dark:text-[#A1A1AA]">
                    <Shield className="w-8 h-8 text-[#A1A1AA] mx-auto mb-2 opacity-50" />
                    <p className="text-[14px] font-semibold text-[#18181B] dark:text-white">
                      No matching users found
                    </p>
                    <p className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
                      Try clearing filters or changing your search criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const userDept = departmentsMap[user.department_id];
                  const access = getUserAccessLevel(user);
                  const overrideCount = getOverrideCount(user);
                  const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.team_member;
                  const isAdminUser = user.role === 'admin' || user.role === 'it_support_admin';

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-[#F9FAFB] dark:hover:bg-[#202023] transition-colors group cursor-pointer"
                      onClick={() => setSelectedUserForDrawer(user)}
                    >
                      {/* Employee */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={user.avatar_url}
                            name={user.full_name}
                            size="md"
                            className="w-9 h-9 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-[#18181B] dark:text-white truncate">
                              {user.full_name}
                            </div>
                            <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA] truncate">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5 text-[12.5px] whitespace-nowrap">
                        <span
                          className="px-2 py-0.5 font-semibold rounded-full border text-[11px] whitespace-nowrap inline-block"
                          style={{
                            backgroundColor: `${roleDef.color}15`,
                            color: roleDef.color,
                            borderColor: `${roleDef.color}30`,
                          }}
                        >
                          {roleDef.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="px-5 py-3.5 text-[13px] text-[#18181B] dark:text-[#F4F4F5] whitespace-nowrap">
                        {userDept ? (
                          <span className="font-medium text-[#18181B] dark:text-[#F4F4F5] whitespace-nowrap">
                            {userDept.name}
                          </span>
                        ) : (
                          <span className="text-[#8B8B95]">—</span>
                        )}
                      </td>

                      {/* Access Level */}
                      <td className="px-5 py-3.5 text-[12.5px] whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full whitespace-nowrap ${access.badge}`}>
                          {access.label}
                        </span>
                      </td>

                      {/* Custom Permissions badge */}
                      <td className="px-5 py-3.5 text-[12.5px] whitespace-nowrap">
                        {isAdminUser ? (
                          <span className="inline-flex items-center gap-1 text-[11.5px] text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap">
                            <Lock className="w-3 h-3" />
                            <span>Full Access</span>
                          </span>
                        ) : overrideCount > 0 ? (
                          <span className="px-2 py-0.5 text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800 whitespace-nowrap inline-block">
                            {overrideCount} override{overrideCount === 1 ? '' : 's'}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] whitespace-nowrap">
                            Default
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserForDrawer(user);
                          }}
                          className="px-3 py-1.5 rounded-[6px] border border-[#E5E7EB] dark:border-[#3F3F46] hover:bg-[#F1F3F5] dark:hover:bg-[#27272A] text-[#18181B] dark:text-white text-[12px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap"
                        >
                          <Shield className="w-3.5 h-3.5 text-[#059669]" />
                          <span>Manage Permissions</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3.5 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#121214] text-[12px] text-[#71717A] dark:text-[#A1A1AA]">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3F3F46] disabled:opacity-40 flex items-center justify-center cursor-pointer bg-white dark:bg-[#18181B]"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] dark:border-[#3F3F46] disabled:opacity-40 flex items-center justify-center cursor-pointer bg-white dark:bg-[#18181B]"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Responsive Mobile Cards (< 768px) */}
      <div className="block md:hidden space-y-3">
        {paginatedUsers.length === 0 ? (
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-6 text-center text-[#71717A]">
            No matching users found
          </div>
        ) : (
          paginatedUsers.map((user) => {
            const userDept = departmentsMap[user.department_id];
            const access = getUserAccessLevel(user);
            const overrideCount = getOverrideCount(user);
            const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.team_member;

            return (
              <div
                key={user.id}
                className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      src={user.avatar_url}
                      name={user.full_name}
                      size="md"
                      className="w-10 h-10 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold text-[#18181B] dark:text-white truncate">
                        {user.full_name}
                      </div>
                      <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA] truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <span
                    className="px-2 py-0.5 text-[10.5px] font-semibold rounded-full border whitespace-nowrap"
                    style={{
                      backgroundColor: `${roleDef.color}15`,
                      color: roleDef.color,
                      borderColor: `${roleDef.color}30`,
                    }}
                  >
                    {roleDef.label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px] pt-2 border-t border-[#F4F4F5] dark:border-[#27272A] gap-2">
                  <div className="text-[#52525B] dark:text-[#A1A1AA] truncate">
                    {userDept ? userDept.name : 'No department'}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 text-[10.5px] font-semibold rounded-full whitespace-nowrap flex-shrink-0 ${access.badge}`}>
                    {access.label}
                  </span>
                </div>

                <div className="pt-2 border-t border-[#F4F4F5] dark:border-[#27272A]">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForDrawer(user)}
                    className="w-full py-2 bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-[#E5E7EB] dark:hover:bg-[#323238] text-[#18181B] dark:text-white rounded-[7px] text-[12.5px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Manage Permissions</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Slide-out Permission Drawer */}
      <UserPermissionDrawer
        isOpen={Boolean(selectedUserForDrawer)}
        user={selectedUserForDrawer}
        department={selectedUserForDrawer ? departmentsMap[selectedUserForDrawer.department_id] : null}
        departments={departments}
        onClose={() => setSelectedUserForDrawer(null)}
        onSave={handleSaveUserPermissions}
      />
    </div>
  );
}

export default UserPermissionsPage;
