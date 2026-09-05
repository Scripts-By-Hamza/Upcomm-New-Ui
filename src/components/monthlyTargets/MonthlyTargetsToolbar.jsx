import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  LayoutList,
  LayoutGrid,
  X,
  Building2,
  UserRound,
  Layers3,
  Filter,
  Check,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

export function MonthlyTargetsToolbar({
  searchQuery = '',
  onSearchChange = () => {},
  ownerFilter = 'all',
  onOwnerFilterChange = () => {},
  departmentFilter = 'all',
  onDepartmentFilterChange = () => {},
  groupBy = 'department',
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

  const [openDropdown, setOpenDropdown] = useState(null); // 'owner' | 'dept' | 'group'
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [mobileOwnerSearch, setMobileOwnerSearch] = useState('');
  const [mobileDeptSearch, setMobileDeptSearch] = useState('');
  const toolbarRef = useRef(null);

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

  // Filter eligible users for the Owner dropdown
  const availableUsers = useMemo(() => {
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

  const filteredMobileUsers = useMemo(() => {
    const q = mobileOwnerSearch.toLowerCase().trim();
    if (!q) return availableUsers;
    return availableUsers.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }, [availableUsers, mobileOwnerSearch]);

  const filteredMobileDepartments = useMemo(() => {
    const q = mobileDeptSearch.toLowerCase().trim();
    if (!q) return departments;
    return (departments || []).filter((d) => d?.name?.toLowerCase().includes(q));
  }, [departments, mobileDeptSearch]);

  const selectedOwner = availableUsers.find((u) => String(u.id) === String(ownerFilter));
  const selectedDept = (departments || []).find((d) => String(d.id) === String(departmentFilter));

  const activeFilterCount =
    (ownerFilter !== 'all' ? 1 : 0) +
    (departmentFilter !== 'all' ? 1 : 0);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    ownerFilter !== 'all' ||
    departmentFilter !== 'all';

  const groupOptions = [
    { value: 'department', label: 'Department' },
    { value: 'none', label: 'None' },
    { value: 'status', label: 'Status' },
    ...((isAdmin || isHOD) ? [{ value: 'owner', label: 'Owner' }] : []),
  ];

  return (
    <div
      ref={toolbarRef}
      className="space-y-2.5 font-['Inter'] select-none"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. Mobile Toolbar (< sm): Search Bar + Filters Modal Button + View Switcher */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search targets & KPIs..."
            className="h-9 w-full pl-8 pr-8 bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] dark:text-[#F4F4F5] placeholder-[#8B8B95] transition-colors outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filters Button (Modal trigger) */}
        {(isAdmin || isHOD) && (
          <button
            type="button"
            onClick={() => {
              setMobileOwnerSearch('');
              setMobileDeptSearch('');
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
        )}

        {/* View Switcher (List / Board) */}
        <div className="flex items-center bg-[#F4F4F5] dark:bg-[#22262B] p-0.5 rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] flex-shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('list')}
            aria-label="List view"
            className={`flex items-center justify-center p-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] shadow-xs'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B]'
            }`}
          >
            <LayoutList className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('board')}
            aria-label="Board view"
            className={`flex items-center justify-center p-1.5 rounded-[6px] transition-colors cursor-pointer ${
              viewMode === 'board'
                ? 'bg-white dark:bg-[#18181B] text-[#18181B] dark:text-[#F4F4F5] shadow-xs'
                : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Desktop Toolbar (hidden sm:flex) */}
      <div className="hidden sm:flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: Search & Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px] max-w-[320px] flex-1">
            <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search targets & KPIs..."
              className="h-9 w-full pl-8 pr-8 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] placeholder-[#8B8B95] transition-colors outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Owner Filter Dropdown */}
          {(isAdmin || isHOD) && (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('owner')}
                className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-none ${
                  ownerFilter !== 'all'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                    : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
                }`}
              >
                <UserRound className="w-3.5 h-3.5 text-[#71717A]" />
                <span className="truncate max-w-[130px]">
                  {selectedOwner ? selectedOwner.full_name : 'Owner: All'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
              </button>

              {openDropdown === 'owner' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1 z-40 animate-fade-in text-left max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onOwnerFilterChange('all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[#F5F6F8] cursor-pointer ${
                      ownerFilter === 'all' ? 'bg-[#ECFDF5] text-[#059669] font-semibold' : 'text-[#18181B]'
                    }`}
                  >
                    <span>All Owners</span>
                    {ownerFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                  {availableUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onOwnerFilterChange(u.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-[#F5F6F8] cursor-pointer ${
                        String(ownerFilter) === String(u.id)
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                          : 'text-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar src={u.avatar_url} name={u.full_name} size="xs" />
                        <span className="truncate">
                          {u.id === currentUser?.id ? `${u.full_name || 'User'} (Myself)` : u.full_name}
                        </span>
                      </div>
                      {String(ownerFilter) === String(u.id) && (
                        <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Department Filter Dropdown */}
          {isAdmin && (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('dept')}
                className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-none ${
                  departmentFilter !== 'all'
                    ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                    : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
                <span className="truncate max-w-[140px]">
                  {selectedDept ? selectedDept.name : 'Department: All'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
              </button>

              {openDropdown === 'dept' && (
                <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1 z-40 animate-fade-in text-left max-h-64 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      onDepartmentFilterChange('all');
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[#F5F6F8] cursor-pointer ${
                      departmentFilter === 'all'
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                        : 'text-[#18181B]'
                    }`}
                  >
                    <span>All Departments</span>
                    {departmentFilter === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                  {(departments || []).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        onDepartmentFilterChange(d.id);
                        setOpenDropdown(null);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-[#F5F6F8] cursor-pointer ${
                        String(departmentFilter) === String(d.id)
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                          : 'text-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: d.color || '#10B981' }}
                        />
                        <span className="truncate">{d.name}</span>
                      </div>
                      {String(departmentFilter) === String(d.id) && (
                        <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Group By & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {/* Group By Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('group')}
              className={`h-9 px-3 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-none ${
                groupBy !== 'none'
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669] font-semibold'
                  : 'bg-white hover:bg-[#F5F6F8] border-[#E5E7EB] text-[#18181B]'
              }`}
            >
              <Layers3 className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="capitalize">
                {groupBy !== 'none' ? `Group: ${groupBy}` : 'Group: None'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {openDropdown === 'group' && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1 z-40 animate-fade-in text-left">
                {groupOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onGroupByChange(opt.value);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-[12px] hover:bg-[#F5F6F8] cursor-pointer ${
                      groupBy === opt.value
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                        : 'text-[#18181B]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {groupBy === opt.value && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
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
              <span>List</span>
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
              <span>Board</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5 animate-fade-in">
          <span className="text-[12px] font-medium text-[#71717A]">Active filters:</span>

          {searchQuery.trim() !== '' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Search: "{searchQuery}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {ownerFilter !== 'all' && selectedOwner && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Owner: {selectedOwner.full_name}</span>
              <button
                type="button"
                onClick={() => onOwnerFilterChange('all')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {departmentFilter !== 'all' && selectedDept && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Department: {selectedDept.name}</span>
              <button
                type="button"
                onClick={() => onDepartmentFilterChange('all')}
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
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-['Inter']">
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
                  Target Filters
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
              {/* 1. Group By Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Group By
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {groupOptions.map((opt) => {
                    const isSelected = groupBy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onGroupByChange(opt.value)}
                        className={`px-3 py-2 rounded-[8px] border text-[12px] font-medium transition-colors text-left flex items-center justify-between cursor-pointer ${
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

              {/* 2. Department Section (Admin only) */}
              {isAdmin && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Department
                    </label>
                    {departmentFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => onDepartmentFilterChange('all')}
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
                      value={mobileDeptSearch}
                      onChange={(e) => setMobileDeptSearch(e.target.value)}
                      placeholder="Search departments..."
                      className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                    />
                    {mobileDeptSearch && (
                      <button
                        type="button"
                        onClick={() => setMobileDeptSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => onDepartmentFilterChange('all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        departmentFilter === 'all'
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Departments</span>
                      {departmentFilter === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {filteredMobileDepartments.map((d) => {
                      const isSelected = String(departmentFilter) === String(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => onDepartmentFilterChange(d.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                            isSelected
                              ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: d.color || '#10B981' }}
                            />
                            <span className="text-[12px] font-medium truncate">{d.name}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Owner Section (Admin & HOD) */}
              {(isAdmin || isHOD) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                      Owner
                    </label>
                    {ownerFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => onOwnerFilterChange('all')}
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
                      value={mobileOwnerSearch}
                      onChange={(e) => setMobileOwnerSearch(e.target.value)}
                      placeholder="Search owners..."
                      className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                    />
                    {mobileOwnerSearch && (
                      <button
                        type="button"
                        onClick={() => setMobileOwnerSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                    <button
                      type="button"
                      onClick={() => onOwnerFilterChange('all')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                        ownerFilter === 'all'
                          ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                          : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                      }`}
                    >
                      <span>All Owners</span>
                      {ownerFilter === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    {filteredMobileUsers.map((u) => {
                      const isSelected = String(ownerFilter) === String(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => onOwnerFilterChange(u.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                            isSelected
                              ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                              : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Avatar src={u.avatar_url} name={u.full_name} size="xs" className="flex-shrink-0" />
                            <span className="text-[12px] font-medium truncate">
                              {u.id === currentUser?.id ? `${u.full_name || 'User'} (Myself)` : u.full_name}
                            </span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

export default MonthlyTargetsToolbar;
