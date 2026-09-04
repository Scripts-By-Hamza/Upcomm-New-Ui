import React from 'react';
import {
  Search,
  LayoutList,
  LayoutGrid,
  X,
} from 'lucide-react';

export function MonthlyTargetsToolbar({
  searchQuery = '',
  onSearchChange = () => {},
  ownerFilter = 'all',
  onOwnerFilterChange = () => {},
  departmentFilter = 'all',
  onDepartmentFilterChange = () => {},
  groupBy = 'none',
  onGroupByChange = () => {},
  viewMode = 'list',
  onViewModeChange = () => {},
  users = [],
  departments = [],
  currentUser = null,
  onResetFilters = () => {},
}) {
  const role = currentUser?.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHOD = role === 'hod';

  // Filter eligible users for the Owner dropdown
  const availableUsers = React.useMemo(() => {
    if (isAdmin) {
      return (users || []).filter((u) => u && !u.exclude_from_directory && !u.is_system_account);
    }
    if (isHOD) {
      return (users || []).filter(
        (u) =>
          u &&
          !u.exclude_from_directory &&
          !u.is_system_account &&
          (u.department_id === currentUser?.department_id || u.id === currentUser?.id)
      );
    }
    return [];
  }, [users, isAdmin, isHOD, currentUser]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    ownerFilter !== 'all' ||
    departmentFilter !== 'all';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-2.5 sm:p-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 select-none">
      {/* Left side: Search & Dropdown Filters */}
      <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
        {/* Search Bar */}
        <div className="relative min-w-[200px] sm:min-w-[240px] max-w-[320px] flex-1">
          <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search targets & KPIs..."
            className="w-full bg-[#F4F4F5] hover:bg-[#EBEBEF] focus:bg-white text-[13px] text-[#18181B] placeholder-[#8B8B95] pl-8 pr-3 py-1.5 rounded-[7px] border border-transparent focus:border-[#059669] focus:outline-none transition-colors"
          />
        </div>

        {/* Owner Filter (for Admin & HOD) */}
        {(isAdmin || isHOD) && (
          <select
            value={ownerFilter}
            onChange={(e) => onOwnerFilterChange(e.target.value)}
            className="bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[12.5px] font-medium text-[#18181B] px-2.5 py-1.5 rounded-[7px] cursor-pointer focus:outline-none focus:border-[#059669] max-w-[150px] truncate"
          >
            <option value="all">All Owners</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.id === currentUser?.id ? `${u.full_name || 'User'} (Myself)` : u.full_name}
              </option>
            ))}
          </select>
        )}

        {/* Department Filter (Admin only) */}
        {isAdmin && (
          <select
            value={departmentFilter}
            onChange={(e) => onDepartmentFilterChange(e.target.value)}
            className="bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[12.5px] font-medium text-[#18181B] px-2.5 py-1.5 rounded-[7px] cursor-pointer focus:outline-none focus:border-[#059669] max-w-[160px] truncate"
          >
            <option value="all">All Departments</option>
            {(departments || []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[12px] text-[#71717A] hover:text-[#DC2626] flex items-center gap-1 px-2 py-1 rounded-[6px] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Right side: Group By & View Tabs */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
        {/* Group By */}
        <div className="flex items-center gap-1.5 text-[12px] text-[#71717A]">
          <span className="font-medium hidden sm:inline">Group:</span>
          <select
            value={groupBy}
            onChange={(e) => onGroupByChange(e.target.value)}
            className="bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[12.5px] font-medium text-[#18181B] px-2 py-1.5 rounded-[7px] cursor-pointer focus:outline-none focus:border-[#059669]"
          >
            <option value="department">Department</option>
            <option value="none">None</option>
            <option value="status">Status</option>
            {(isAdmin || isHOD) && <option value="owner">Owner</option>}
          </select>
        </div>

        {/* View Switcher (List / Board) */}
        <div className="flex items-center bg-[#F4F4F5] p-0.5 rounded-[8px] border border-[#E5E7EB]">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-[#18181B] shadow-xs font-semibold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">List</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('board')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[12px] font-medium transition-colors cursor-pointer ${
              viewMode === 'board'
                ? 'bg-white text-[#18181B] shadow-xs font-semibold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Board</span>
          </button>
        </div>
      </div>
    </div>
  );
}
