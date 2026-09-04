import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Building2,
  UserRound,
  CircleDot,
  ArrowUpDown,
  ChevronDown,
  Check,
  X,
  RotateCcw,
} from 'lucide-react';
import { getRoleDisplayLabel } from '../../utils/employeeWorkloadUtils';

export function TeamToolbar({
  filters,
  onFilterChange,
  onResetFilters,
  departments = [],
  totalFilteredCount = 0,
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'dept' | 'role' | 'status' | 'sort'
  const toolbarRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  const roleOptions = [
    { id: 'all', label: 'All Roles' },
    { id: 'admin', label: 'Administrator' },
    { id: 'hod', label: 'Head of Department (HOD)' },
    { id: 'team_member', label: 'Team Member' },
    { id: 'it_support', label: 'IT Support Admin' },
  ];

  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'active', label: 'Active' },
    { id: 'inactive', label: 'Inactive' },
  ];

  const sortOptions = [
    { id: 'name_asc', label: 'Name (A–Z)' },
    { id: 'name_desc', label: 'Name (Z–A)' },
    { id: 'department', label: 'Department' },
    { id: 'role', label: 'Role' },
    { id: 'active_tasks', label: 'Most Active Tasks' },
    { id: 'overdue', label: 'Most Overdue' },
  ];

  const selectedDept = departments.find((d) => String(d.id) === String(filters.departmentId));
  const selectedDeptLabel = selectedDept ? selectedDept.name : 'Department';

  const selectedRole = roleOptions.find((r) => r.id === filters.role);
  const selectedRoleLabel = selectedRole && selectedRole.id !== 'all' ? selectedRole.label : 'Role';

  const selectedStatus = statusOptions.find((s) => s.id === filters.status);
  const selectedStatusLabel = selectedStatus && selectedStatus.id !== 'all' ? selectedStatus.label : 'Status';

  const selectedSort = sortOptions.find((s) => s.id === filters.sortBy);
  const selectedSortLabel = selectedSort ? selectedSort.label : 'Sort';

  const hasActiveFilters =
    filters.departmentId !== 'all' ||
    filters.role !== 'all' ||
    filters.status !== 'all' ||
    Boolean(filters.search.trim());

  return (
    <div ref={toolbarRef} className="space-y-3 select-none">
      {/* Main Toolbar Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left Side: Search + Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {/* 1. Search employees */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Search employees..."
              className="w-full h-[38px] pl-9 pr-8 text-[13px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] text-[#18181B] placeholder:text-[#8B8B95]"
            />
            {filters.search && (
              <button
                type="button"
                onClick={() => onFilterChange('search', '')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 2. Department Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('dept')}
              className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
                filters.departmentId !== 'all'
                  ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                  : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
              <span className="truncate max-w-[130px]">{selectedDeptLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
            </button>

            {openDropdown === 'dept' && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left max-h-72 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    onFilterChange('departmentId', 'all');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer border-b border-[#F4F4F5] ${
                    filters.departmentId === 'all'
                      ? 'bg-emerald-50 text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                >
                  <span>All Departments</span>
                  {filters.departmentId === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>

                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onFilterChange('departmentId', dept.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                      String(filters.departmentId) === String(dept.id)
                        ? 'bg-emerald-50 text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <span className="truncate">{dept.name}</span>
                    {String(filters.departmentId) === String(dept.id) && (
                      <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Role Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('role')}
              className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
                filters.role !== 'all'
                  ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                  : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
              }`}
            >
              <UserRound className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
              <span className="truncate max-w-[130px]">{selectedRoleLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
            </button>

            {openDropdown === 'role' && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onFilterChange('role', opt.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                      filters.role === opt.id
                        ? 'bg-emerald-50 text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {filters.role === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 4. Status Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('status')}
              className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
                filters.status !== 'all'
                  ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                  : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
              }`}
            >
              <CircleDot className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
              <span className="truncate max-w-[120px]">{selectedStatusLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
            </button>

            {openDropdown === 'status' && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onFilterChange('status', opt.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                      filters.status === opt.id
                        ? 'bg-emerald-50 text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {filters.status === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sort Control */}
        <div className="relative self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => toggleDropdown('sort')}
            className="h-[38px] px-3 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] text-[13px] font-medium text-[#18181B] flex items-center gap-2 transition-all cursor-pointer shadow-none"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#71717A]" />
            <span className="truncate">{selectedSortLabel}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5" />
          </button>

          {openDropdown === 'sort' && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left">
              {sortOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onFilterChange('sortBy', opt.id);
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                    filters.sortBy === opt.id
                      ? 'bg-emerald-50 text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {filters.sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[12px] font-medium text-[#71717A]">Active filters:</span>

          {filters.search.trim() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Search: "{filters.search}"</span>
              <button
                type="button"
                onClick={() => onFilterChange('search', '')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.departmentId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Department: {selectedDeptLabel}</span>
              <button
                type="button"
                onClick={() => onFilterChange('departmentId', 'all')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.role !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Role: {selectedRoleLabel}</span>
              <button
                type="button"
                onClick={() => onFilterChange('role', 'all')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Status: {selectedStatusLabel}</span>
              <button
                type="button"
                onClick={() => onFilterChange('status', 'all')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="text-[12px] font-medium text-[#059669] hover:text-[#047857] hover:underline flex items-center gap-1 transition-colors cursor-pointer ml-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear all</span>
          </button>
        </div>
      )}
    </div>
  );
}
