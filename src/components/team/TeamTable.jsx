import React from 'react';
import { TeamRow } from './TeamRow';
import { Users, FilterX, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';

export function TeamTable({
  users = [],
  departmentsMap = {},
  taskSummaries = {},
  currentUser,
  canManageUsers,
  hasActiveFilters,
  onResetFilters,
  onAddUser,
  onEditUser,
  onManagePermissions,
  onToggleStatus,
  onDeleteUser,
  // Pagination
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
}) {
  if (users.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center text-[#8B8B95] space-y-3 select-none">
        {hasActiveFilters ? (
          <>
            <FilterX className="w-8 h-8 text-[#71717A] mx-auto opacity-50 mb-1" />
            <h4 className="text-[14px] font-semibold text-[#18181B]">
              No employees match your filters
            </h4>
            <p className="text-[12.5px] text-[#52525B] max-w-sm mx-auto">
              Try adjusting your search or clearing active filters to see all team members.
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer"
              >
                <span>Clear filters</span>
              </button>
            )}
          </>
        ) : (
          <>
            <Users className="w-8 h-8 text-[#71717A] mx-auto opacity-50 mb-1" />
            <h4 className="text-[14px] font-semibold text-[#18181B]">
              No team members found
            </h4>
            <p className="text-[12.5px] text-[#52525B] max-w-sm mx-auto">
              Add employees to your company directory to assign deliverables and manage departmental workloads.
            </p>
            {canManageUsers && onAddUser && (
              <button
                type="button"
                onClick={onAddUser}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-[12.5px] font-semibold rounded-[7px] transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add User</span>
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] shadow-none overflow-hidden select-none">
      {/* Desktop Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#FAFAFA] text-[11.5px] font-semibold text-[#71717A] uppercase tracking-wider h-[46px]">
              <th className="px-5 py-3 font-semibold">Employee</th>
              <th className="px-5 py-3 font-semibold">Department</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Active Tasks</th>
              <th className="px-5 py-3 font-semibold">Overdue</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5]">
            {users.map((user) => {
              const department = departmentsMap[user.department_id];
              const workload = taskSummaries[user.id] || {
                activeTasks: 0,
                overdueTasks: 0,
                completedTasks: 0,
              };

              return (
                <TeamRow
                  key={user.id}
                  user={user}
                  department={department}
                  workload={workload}
                  currentUser={currentUser}
                  canManageUsers={canManageUsers}
                  onEditUser={onEditUser}
                  onManagePermissions={onManagePermissions}
                  onToggleStatus={onToggleStatus}
                  onDeleteUser={onDeleteUser}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Total Count + Pagination */}
      <div className="px-5 py-3.5 border-t border-[#E5E7EB] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-[12.5px] text-[#71717A]">
        {/* Left: Total Members Count */}
        <div className="font-medium text-[#52525B]">
          <span className="font-semibold text-[#18181B]">{totalItems}</span>{' '}
          {totalItems === 1 ? 'member' : 'members'}
        </div>

        {/* Right: Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#71717A]">
              Showing <span className="font-medium text-[#18181B]">{startIndex}–{endIndex}</span> of{' '}
              <span className="font-medium text-[#18181B]">{totalItems}</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] hover:bg-[#F5F6F8] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer text-[#18181B]"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 rounded-[6px] border border-[#E5E7EB] hover:bg-[#F5F6F8] disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer text-[#18181B]"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
