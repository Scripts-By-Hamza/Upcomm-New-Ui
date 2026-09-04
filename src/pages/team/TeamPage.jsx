import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  computeEmployeeWorkload,
  filterAndSortEmployees,
} from '../../utils/employeeWorkloadUtils';
import { canManageUsers as checkCanManageUsers, canManagePermissions } from '../../utils/rbac/permissionManager';
import { TeamToolbar } from '../../components/team/TeamToolbar';
import { TeamTable } from '../../components/team/TeamTable';
import { TeamMobileCard } from '../../components/team/TeamMobileCard';
import { AddUserModal } from '../../components/team/AddUserModal';
import { EditUserModal } from '../../components/team/EditUserModal';
import { UserPermissionDrawer } from '../../components/team/UserPermissionDrawer';
import { ConfirmUserActionDialog } from '../../components/team/ConfirmUserActionDialog';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export function TeamPage() {
  const { users = [], currentUser, updateUser, updateUserPermissions, deleteUser } = useAuth();
  const { departments = [], tasks = [], createNewUser } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();

  // Permissions
  const canManageUsers = checkCanManageUsers(currentUser);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { isOpen, title, message, confirmLabel, variant, action }

  // Read filter state from URL query parameters (or defaults)
  const search = searchParams.get('search') || '';
  const departmentId = searchParams.get('department') || 'all';
  const role = searchParams.get('role') || 'all';
  const status = searchParams.get('status') || 'all';
  const sortBy = searchParams.get('sort') || 'name_asc';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const pageSize = 10;

  const filters = useMemo(
    () => ({
      search,
      departmentId,
      role,
      status,
      sortBy,
    }),
    [search, departmentId, role, status, sortBy]
  );

  const handleFilterChange = (key, value) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        const queryKey = key === 'departmentId' ? 'department' : key === 'sortBy' ? 'sort' : key;
        if (value === 'all' || !value || (key === 'sortBy' && value === 'name_asc')) {
          next.delete(queryKey);
        } else {
          next.set(queryKey, String(value));
        }
        next.delete('page'); // Reset to page 1 on filter change
        return next;
      },
      { replace: true }
    );
  };

  const handleResetFilters = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('search');
        next.delete('department');
        next.delete('role');
        next.delete('status');
        next.delete('sort');
        next.delete('page');
        return next;
      },
      { replace: true }
    );
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

  // 1. Departments Lookup Map
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

  // 2. Memoized Task Summaries per employee (prevents N+1 scans)
  const taskSummaries = useMemo(() => {
    const summaries = {};
    (users || []).forEach((u) => {
      if (u?.id) {
        summaries[u.id] = computeEmployeeWorkload(u, tasks);
      }
    });
    return summaries;
  }, [users, tasks]);

  // 3. Filter and Sort Employees
  const filteredUsers = useMemo(() => {
    return filterAndSortEmployees(users, filters, taskSummaries, departmentsMap);
  }, [users, filters, taskSummaries, departmentsMap]);

  // 4. Paginate
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  const hasActiveFilters =
    departmentId !== 'all' ||
    role !== 'all' ||
    status !== 'all' ||
    Boolean(search.trim());

  // User Actions Handlers
  const handleAddUser = async (userData) => {
    if (createNewUser) {
      await createNewUser(userData);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
  };

  const handleEditUserSubmit = async (userId, updateData) => {
    if (updateUser) {
      await updateUser(userId, updateData);
    }
    setEditingUser(null);
  };

  const handleToggleStatus = (user) => {
    const isActive = user.is_active !== false && user.status !== 'inactive';
    const nextStatus = !isActive;

    setConfirmDialog({
      isOpen: true,
      title: nextStatus ? `Reactivate ${user.full_name}?` : `Deactivate ${user.full_name}?`,
      message: nextStatus
        ? `This will restore ${user.full_name}'s account access and allow assigning deliverables.`
        : `This will prevent ${user.full_name} from logging in. Existing assigned deliverables will remain intact.`,
      confirmLabel: nextStatus ? 'Reactivate' : 'Deactivate',
      variant: nextStatus ? 'primary' : 'danger',
      action: async () => {
        if (updateUser) {
          await updateUser(user.id, {
            is_active: nextStatus,
            status: nextStatus ? 'active' : 'inactive',
          });
        }
        setConfirmDialog(null);
      },
    });
  };

  const handleDeleteUser = (user) => {
    if (String(user.id) === String(currentUser?.id)) {
      alert('You cannot delete your own active administrator account.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: `Delete ${user.full_name}?`,
      message: `Are you sure you want to delete ${user.full_name}'s employee account? This action cannot be undone.`,
      confirmLabel: 'Delete Employee',
      variant: 'danger',
      action: async () => {
        if (deleteUser) {
          await deleteUser(user.id);
        }
        setConfirmDialog(null);
      },
    });
  };

  return (
    <div className="space-y-5 font-['Inter'] pb-12 select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#71717A] dark:text-[#A1A1AA] mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span>Team</span>
            <span>/</span>
            <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">Users</span>
          </div>
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-[#18181B] dark:text-[#F4F4F5] tracking-tight">
            Users
          </h1>
          <p className="text-[13px] text-[#52525B] dark:text-[#A1A1AA] mt-0.5 font-normal">
            Manage UPCOMM employees, roles and department assignments.
          </p>
        </div>

        {/* Top-right Contextual Action: Add User (Permission-checked) */}
        {canManageUsers && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="h-[38px] px-3.5 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold rounded-[8px] flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* 2. Toolbar */}
      <TeamToolbar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        departments={departments}
        totalFilteredCount={totalItems}
      />

      {/* 3. Main Desktop Table Surface */}
      <div className="hidden md:block">
        <TeamTable
          users={paginatedUsers}
          departmentsMap={departmentsMap}
          taskSummaries={taskSummaries}
          currentUser={currentUser}
          canManageUsers={canManageUsers}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
          onAddUser={() => setIsAddModalOpen(true)}
          onEditUser={handleEditUser}
          onManagePermissions={(u) => setSelectedUserForPermissions(u)}
          onToggleStatus={handleToggleStatus}
          onDeleteUser={handleDeleteUser}
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={handlePageChange}
        />
      </div>

      {/* 4. Responsive Mobile Cards (< 768px) */}
      <div className="block md:hidden space-y-3">
        {paginatedUsers.length === 0 ? (
          <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-8 text-center text-[#8B8B95] space-y-2">
            <p className="text-[14px] font-semibold text-[#18181B]">
              {hasActiveFilters ? 'No matching employees' : 'No team members found'}
            </p>
            <p className="text-[12px] text-[#52525B]">
              {hasActiveFilters
                ? 'Try adjusting your search or clearing active filters.'
                : 'Add employees to your company directory.'}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 bg-[#F4F4F5] text-[#18181B] text-[12px] font-medium rounded-[6px]"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          paginatedUsers.map((user) => (
            <TeamMobileCard
              key={user.id}
              user={user}
              department={departmentsMap[user.department_id]}
              workload={taskSummaries[user.id] || { activeTasks: 0, overdueTasks: 0 }}
              currentUser={currentUser}
              canManageUsers={canManageUsers}
              onEditUser={handleEditUser}
              onManagePermissions={(u) => setSelectedUserForPermissions(u)}
              onToggleStatus={handleToggleStatus}
              onDeleteUser={handleDeleteUser}
            />
          ))
        )}

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 bg-white border border-[#E5E7EB] rounded-[10px] text-[12px] text-[#71717A]">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] disabled:opacity-40 flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modals & Dialogs */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddUser}
        departments={departments}
      />

      <EditUserModal
        isOpen={Boolean(editingUser)}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEditUserSubmit}
        departments={departments}
      />

      <UserPermissionDrawer
        isOpen={Boolean(selectedUserForPermissions)}
        user={selectedUserForPermissions}
        department={selectedUserForPermissions ? departmentsMap[selectedUserForPermissions.department_id] : null}
        departments={departments}
        onClose={() => setSelectedUserForPermissions(null)}
        onSave={async (userId, overrides) => {
          if (updateUserPermissions) {
            await updateUserPermissions(userId, overrides);
          }
        }}
      />

      <ConfirmUserActionDialog
        isOpen={Boolean(confirmDialog?.isOpen)}
        title={confirmDialog?.title || ''}
        message={confirmDialog?.message || ''}
        confirmLabel={confirmDialog?.confirmLabel || 'Confirm'}
        confirmVariant={confirmDialog?.variant || 'danger'}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.action}
      />
    </div>
  );
}
