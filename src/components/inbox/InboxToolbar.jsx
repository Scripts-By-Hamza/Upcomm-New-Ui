import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Building2,
  User,
  Calendar,
  ChevronDown,
  Check,
  X,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

export function InboxToolbar({
  searchQuery,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  departments = [],
  requesterFilter,
  onRequesterChange,
  requesters = [],
  dateFilter,
  onDateChange,
  onClearFilters,
  hasActiveFilters,
}) {
  const [deptOpen, setDeptOpen] = useState(false);
  const [requesterOpen, setRequesterOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);

  // Mobile Filter Dialog State
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [mobileDeptSearch, setMobileDeptSearch] = useState('');
  const [mobileRequesterSearch, setMobileRequesterSearch] = useState('');

  const deptRef = useRef(null);
  const requesterRef = useRef(null);
  const dateRef = useRef(null);
  const toolbarRef = useRef(null);

  // Close desktop menus on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (deptRef.current && !deptRef.current.contains(e.target)) setDeptOpen(false);
      if (requesterRef.current && !requesterRef.current.contains(e.target)) setRequesterOpen(false);
      if (dateRef.current && !dateRef.current.contains(e.target)) setDateOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedDept = departments.find((d) => d.id === departmentFilter);
  const selectedRequester = requesters.find((r) => r.id === requesterFilter);

  const dateOptions = [
    { id: 'all', label: 'All dates' },
    { id: 'today', label: 'Today' },
    { id: '7days', label: 'Last 7 days' },
    { id: '30days', label: 'Last 30 days' },
  ];

  const getDateLabel = (val) => {
    switch (val) {
      case 'today':
        return 'Today';
      case '7days':
        return 'Last 7 days';
      case '30days':
        return 'Last 30 days';
      default:
        return 'Date';
    }
  };

  const activeFilterCount =
    (departmentFilter ? 1 : 0) +
    (requesterFilter ? 1 : 0) +
    (dateFilter && dateFilter !== 'all' ? 1 : 0) +
    (searchQuery && searchQuery.trim() ? 1 : 0);

  const filteredDepartments = React.useMemo(() => {
    const q = mobileDeptSearch.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter((d) => d?.name?.toLowerCase().includes(q));
  }, [departments, mobileDeptSearch]);

  const filteredRequesters = React.useMemo(() => {
    const q = mobileRequesterSearch.toLowerCase().trim();
    if (!q) return requesters;
    return requesters.filter(
      (r) =>
        r?.full_name?.toLowerCase().includes(q) ||
        r?.email?.toLowerCase().includes(q)
    );
  }, [requesters, mobileRequesterSearch]);

  return (
    <div
      ref={toolbarRef}
      className="space-y-2.5 font-['Inter'] select-none"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. Mobile Toolbar (< sm): Search Input + Right Filters Dialog Button */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full">
        {/* Search requests */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search requests"
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

        {/* Filters Button */}
        <button
          type="button"
          onClick={() => {
            setMobileDeptSearch('');
            setMobileRequesterSearch('');
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

      {/* 2. Desktop Toolbar (hidden sm:flex) */}
      <div className="hidden sm:flex flex-wrap items-center justify-between gap-3">
        {/* Left Inputs */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search requests"
              className="h-9 w-52 sm:w-60 pl-8 pr-3 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] placeholder-[#8B8B95] transition-colors outline-none"
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

          {/* Department Dropdown */}
          <div className="relative" ref={deptRef}>
            <button
              type="button"
              onClick={() => setDeptOpen((prev) => !prev)}
              className={`h-9 px-3 rounded-[8px] border transition-colors flex items-center gap-2 text-[12.5px] cursor-pointer ${
                departmentFilter
                  ? 'bg-[#F4F4F5] border-[#D4D4D8] text-[#18181B] font-semibold'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="max-w-[110px] truncate">{selectedDept?.name || 'Department'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {deptOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in max-h-56 overflow-y-auto space-y-0.5 text-left text-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    onDepartmentChange('');
                    setDeptOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[#F5F6F8] cursor-pointer ${
                    !departmentFilter ? 'bg-[#F4F4F5] font-semibold text-[#18181B]' : 'text-[#52525B]'
                  }`}
                >
                  <span>All Departments</span>
                  {!departmentFilter && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onDepartmentChange(dept.id);
                      setDeptOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[#F5F6F8] cursor-pointer ${
                      departmentFilter === dept.id ? 'bg-[#F4F4F5] font-semibold text-[#18181B]' : 'text-[#52525B]'
                    }`}
                  >
                    <span className="truncate">{dept.name}</span>
                    {departmentFilter === dept.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Requester Dropdown */}
          <div className="relative" ref={requesterRef}>
            <button
              type="button"
              onClick={() => setRequesterOpen((prev) => !prev)}
              className={`h-9 px-3 rounded-[8px] border transition-colors flex items-center gap-2 text-[12.5px] cursor-pointer ${
                requesterFilter
                  ? 'bg-[#F4F4F5] border-[#D4D4D8] text-[#18181B] font-semibold'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B]'
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#71717A]" />
              <span className="max-w-[110px] truncate">{selectedRequester?.full_name || 'Requester'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {requesterOpen && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in max-h-56 overflow-y-auto space-y-0.5 text-left text-[12px]">
                <button
                  type="button"
                  onClick={() => {
                    onRequesterChange('');
                    setRequesterOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[#F5F6F8] cursor-pointer ${
                    !requesterFilter ? 'bg-[#F4F4F5] font-semibold text-[#18181B]' : 'text-[#52525B]'
                  }`}
                >
                  <span>All Requesters</span>
                  {!requesterFilter && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>
                {requesters.map((reqUser) => (
                  <button
                    key={reqUser.id}
                    type="button"
                    onClick={() => {
                      onRequesterChange(reqUser.id);
                      setRequesterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[#F5F6F8] cursor-pointer ${
                      requesterFilter === reqUser.id ? 'bg-[#F4F4F5] font-semibold text-[#18181B]' : 'text-[#52525B]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Avatar src={reqUser.avatar_url} name={reqUser.full_name} size="xs" />
                      <span className="truncate">{reqUser.full_name}</span>
                    </div>
                    {requesterFilter === reqUser.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Dropdown */}
          <div className="relative" ref={dateRef}>
            <button
              type="button"
              onClick={() => setDateOpen((prev) => !prev)}
              className={`h-9 px-3 rounded-[8px] border transition-colors flex items-center gap-2 text-[12.5px] cursor-pointer ${
                dateFilter !== 'all'
                  ? 'bg-[#F4F4F5] border-[#D4D4D8] text-[#18181B] font-semibold'
                  : 'bg-white border-[#E5E7EB] hover:border-[#D4D4D8] text-[#52525B]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
              <span>{getDateLabel(dateFilter)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {dateOpen && (
              <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5 text-left text-[12px]">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onDateChange(opt.id);
                      setDateOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] hover:bg-[#F5F6F8] cursor-pointer ${
                      dateFilter === opt.id ? 'bg-[#F4F4F5] font-semibold text-[#18181B]' : 'text-[#52525B]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {dateFilter === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1 animate-fade-in">
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E5E7EB] text-[11.5px] font-medium text-[#18181B]">
              <span className="text-[#71717A]">Search:</span>
              <span>"{searchQuery}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-[#71717A] hover:text-[#DC2626] p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {departmentFilter && selectedDept && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E5E7EB] text-[11.5px] font-medium text-[#18181B]">
              <span className="text-[#71717A]">Department:</span>
              <span>{selectedDept.name}</span>
              <button
                type="button"
                onClick={() => onDepartmentChange('')}
                className="text-[#71717A] hover:text-[#DC2626] p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {requesterFilter && selectedRequester && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E5E7EB] text-[11.5px] font-medium text-[#18181B]">
              <span className="text-[#71717A]">Requester:</span>
              <span>{selectedRequester.full_name}</span>
              <button
                type="button"
                onClick={() => onRequesterChange('')}
                className="text-[#71717A] hover:text-[#DC2626] p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {dateFilter !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E5E7EB] text-[11.5px] font-medium text-[#18181B]">
              <span className="text-[#71717A]">Date:</span>
              <span>{getDateLabel(dateFilter)}</span>
              <button
                type="button"
                onClick={() => onDateChange('all')}
                className="text-[#71717A] hover:text-[#DC2626] p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#059669] hover:underline ml-1 cursor-pointer"
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
                  Request Filters
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
                      onClearFilters();
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
              {/* 1. Date Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Date
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {dateOptions.map((opt) => {
                    const isSelected = (dateFilter || 'all') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onDateChange(opt.id)}
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

              {/* 2. Department Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Department
                  </label>
                  {departmentFilter && (
                    <button
                      type="button"
                      onClick={() => onDepartmentChange('')}
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
                    onClick={() => onDepartmentChange('')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                      !departmentFilter
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                        : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                    }`}
                  >
                    <span>All Departments</span>
                    {!departmentFilter && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {filteredDepartments.map((d) => {
                    const isSelected = departmentFilter === d.id;
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => onDepartmentChange(d.id)}
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

              {/* 3. Requester Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Requester
                  </label>
                  {requesterFilter && (
                    <button
                      type="button"
                      onClick={() => onRequesterChange('')}
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
                    value={mobileRequesterSearch}
                    onChange={(e) => setMobileRequesterSearch(e.target.value)}
                    placeholder="Search requesters..."
                    className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                  />
                  {mobileRequesterSearch && (
                    <button
                      type="button"
                      onClick={() => setMobileRequesterSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                  <button
                    type="button"
                    onClick={() => onRequesterChange('')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                      !requesterFilter
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                        : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                    }`}
                  >
                    <span>All Requesters</span>
                    {!requesterFilter && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {filteredRequesters.map((r) => {
                    const isSelected = requesterFilter === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => onRequesterChange(r.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                          isSelected
                            ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                            : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar src={r.avatar_url} name={r.full_name} size="xs" className="flex-shrink-0" />
                          <span className="text-[12px] font-medium truncate">{r.full_name}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399] flex-shrink-0" />}
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
