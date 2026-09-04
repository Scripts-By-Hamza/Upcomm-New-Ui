import React, { useState, useRef, useEffect } from 'react';
import { Search, Building2, User, Calendar, ChevronDown, Check, X, RotateCcw } from 'lucide-react';
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

  const deptRef = useRef(null);
  const requesterRef = useRef(null);
  const dateRef = useRef(null);

  // Close menus on click outside
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

  return (
    <div className="space-y-2.5 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Main Toolbar Inputs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
                {[
                  { id: 'all', label: 'All dates' },
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: 'Last 7 days' },
                  { id: '30days', label: 'Last 30 days' },
                ].map((opt) => (
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

      {/* 2. Active Filter Chips */}
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
    </div>
  );
}
