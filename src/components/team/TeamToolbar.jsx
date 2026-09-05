import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Filter,
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
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
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

  const activeFilterCount =
    (filters.departmentId !== 'all' ? 1 : 0) +
    (filters.role !== 'all' ? 1 : 0) +
    (filters.status !== 'all' ? 1 : 0) +
    (filters.search && filters.search.trim() ? 1 : 0);

  const hasActiveFilters =
    filters.departmentId !== 'all' ||
    filters.role !== 'all' ||
    filters.status !== 'all' ||
    Boolean(filters.search.trim());

  const filteredDepartments = React.useMemo(() => {
    const q = deptSearchQuery.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter((d) => d?.name?.toLowerCase().includes(q));
  }, [departments, deptSearchQuery]);

  return (
    <div ref={toolbarRef} className="space-y-3 select-none">
      {/* 1. Mobile Toolbar (sm:hidden): Search Input + Right Filters Dialog Button */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full">
        {/* Search employees */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search employees..."
            className="w-full h-9 pl-9 pr-8 text-[12.5px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Button */}
        <button
          type="button"
          onClick={() => {
            setDeptSearchQuery('');
            setShowMobileFilterModal(true);
          }}
          className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs flex-shrink-0 whitespace-nowrap outline-none focus:outline-none ${
            activeFilterCount > 0
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]'
              : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B] dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5]'
          }`}
        >
          <Filter className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#059669] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Desktop Toolbar Controls Row (hidden sm:flex) */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left Side: Search + Dropdown Filters */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {/* Search employees */}
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

          {/* Department Dropdown */}
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

          {/* Role Dropdown */}
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

          {/* Status Dropdown */}
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

      {/* 3. Active Filter Chips Bar */}
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

      {/* 4. MOBILE ALL-IN-ONE FILTERS MODAL DIALOG (Portaled) */}
      {showMobileFilterModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <div
            onClick={() => setShowMobileFilterModal(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Dialog Box Modal */}
          <div className="relative w-full sm:max-w-lg bg-white dark:bg-[#18181B] rounded-t-[20px] sm:rounded-[16px] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden animate-slide-up">
            {/* Modal Header */}
            <div className="px-4 py-3.5 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#059669] dark:text-[#34D399]" />
                <h3 className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  User Filters
                </h3>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] text-[11px] font-semibold border border-[#A7F3D0] dark:border-[#059669]/40">
                    {activeFilterCount} active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetFilters();
                      setShowMobileFilterModal(false);
                    }}
                    className="text-[12px] font-medium text-[#059669] dark:text-[#34D399] hover:underline cursor-pointer"
                  >
                    Reset all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowMobileFilterModal(false)}
                  className="p-1 rounded-[6px] text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] cursor-pointer"
                  aria-label="Close filters dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
              {/* 1. Status Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Status
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {statusOptions.map((opt) => {
                    const isSelected = filters.status === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onFilterChange('status', opt.id)}
                        className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Role Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {roleOptions.map((opt) => {
                    const isSelected = filters.role === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onFilterChange('role', opt.id)}
                        className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Department Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Department
                  </label>
                  {filters.departmentId !== 'all' && (
                    <button
                      type="button"
                      onClick={() => onFilterChange('departmentId', 'all')}
                      className="text-[11px] text-[#059669] dark:text-[#34D399] hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={deptSearchQuery}
                    onChange={(e) => setDeptSearchQuery(e.target.value)}
                    placeholder="Search departments..."
                    className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                  />
                  {deptSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setDeptSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                  <button
                    type="button"
                    onClick={() => onFilterChange('departmentId', 'all')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                      filters.departmentId === 'all'
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                        : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                    }`}
                  >
                    <span>All Departments</span>
                    {filters.departmentId === 'all' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {filteredDepartments.map((d) => {
                    const isSelected = String(filters.departmentId) === String(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onFilterChange('departmentId', d.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                          isSelected
                            ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                            : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color || '#10B981' }} />
                          <span className="text-[12px] font-medium truncate">{d.name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Sort By Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Sort By
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {sortOptions.map((opt) => {
                    const isSelected = filters.sortBy === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onFilterChange('sortBy', opt.id)}
                        className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:border-[#059669]/50 dark:text-[#34D399]'
                            : 'bg-[#F9FAFB] dark:bg-[#1F2227] border-[#E5E7EB] dark:border-[#2A2E34] text-[#18181B] dark:text-[#F4F4F5] hover:bg-[#F5F6F8]'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#F9FAFB] dark:bg-[#18181B] flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                className="w-full py-2.5 bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold rounded-[10px] transition-colors cursor-pointer shadow-sm text-center outline-none"
              >
                Apply Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

