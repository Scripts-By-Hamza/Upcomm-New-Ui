import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  Building2,
  UserRound,
  Download,
  ChevronDown,
  Check,
  Filter,
  X,
  RotateCcw,
  Search,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';

export function ReportToolbar({
  dateRange,
  onDateRangeChange,
  departmentId,
  onDepartmentChange,
  employeeId,
  onEmployeeChange,
  departments = [],
  employees = [],
  onExport,
  isExporting = false,
  totalFilteredCount = 0,
}) {
  const [openDropdown, setOpenDropdown] = useState(null); // 'date' | 'dept' | 'emp'
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [mobileDeptSearch, setMobileDeptSearch] = useState('');
  const [mobileEmpSearch, setMobileEmpSearch] = useState('');
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

  const dateOptions = [
    { id: '7d', label: 'Last 7 Days' },
    { id: '30d', label: 'Last 30 Days' },
    { id: '90d', label: 'Last 90 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
  ];

  const selectedDateOption = dateOptions.find((d) => d.id === dateRange) || dateOptions[1];
  const selectedDept = departments.find((d) => String(d.id) === String(departmentId));
  const selectedDeptLabel = selectedDept ? selectedDept.name : 'All Departments';

  const selectedEmp = employees.find((e) => String(e.id) === String(employeeId));
  const selectedEmpLabel = selectedEmp ? selectedEmp.full_name : 'All Employees';

  const activeFilterCount =
    (departmentId !== 'all' ? 1 : 0) +
    (employeeId !== 'all' ? 1 : 0) +
    (dateRange !== '30d' ? 1 : 0);

  const hasActiveFilters =
    departmentId !== 'all' ||
    employeeId !== 'all' ||
    dateRange !== '30d';

  const handleResetFilters = () => {
    onDateRangeChange('30d');
    onDepartmentChange('all');
    onEmployeeChange('all');
  };

  const filteredDepartments = React.useMemo(() => {
    const q = mobileDeptSearch.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter((d) => d?.name?.toLowerCase().includes(q));
  }, [departments, mobileDeptSearch]);

  const filteredEmployees = React.useMemo(() => {
    const q = mobileEmpSearch.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e?.full_name?.toLowerCase().includes(q) ||
        e?.email?.toLowerCase().includes(q)
    );
  }, [employees, mobileEmpSearch]);

  return (
    <div ref={toolbarRef} className="space-y-3 select-none font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Mobile Toolbar (< sm): Single Row with Filters Button + Export Button */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full">
        {/* Filters Button */}
        <button
          type="button"
          onClick={() => {
            setMobileDeptSearch('');
            setMobileEmpSearch('');
            setShowMobileFilterModal(true);
          }}
          className={`h-9 px-3.5 rounded-[8px] border text-[12.5px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap outline-none focus:outline-none flex-1 justify-center ${
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

        {/* Export Action Button */}
        <button
          type="button"
          onClick={onExport}
          disabled={isExporting || totalFilteredCount === 0}
          className="h-9 px-3.5 bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] disabled:opacity-40 disabled:cursor-not-allowed rounded-[8px] text-[12.5px] font-medium text-[#18181B] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs flex-shrink-0"
          title="Export filtered productivity report as CSV"
        >
          <Download className="w-3.5 h-3.5 text-[#71717A]" />
          <span>Export</span>
        </button>
      </div>

      {/* 2. Desktop Toolbar (hidden sm:flex) */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left Side: Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {/* 1. Date Range Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('date')}
              className="h-[38px] px-3 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] text-[13px] font-medium text-[#18181B] flex items-center gap-2 transition-all cursor-pointer shadow-none"
            >
              <Calendar className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
              <span className="truncate">{selectedDateOption.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
            </button>

            {openDropdown === 'date' && (
              <div className="absolute left-0 top-full mt-1.5 w-48 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left">
                {dateOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onDateRangeChange(opt.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                      dateRange === opt.id
                        ? 'bg-emerald-50 text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {dateRange === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2. Department Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('dept')}
              className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
                departmentId !== 'all'
                  ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                  : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
              <span className="truncate max-w-[150px]">{`Department: ${selectedDept ? selectedDept.name : 'All'}`}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
            </button>

            {openDropdown === 'dept' && (
              <div className="absolute left-0 top-full mt-1.5 w-56 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left max-h-72 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    onDepartmentChange('all');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer border-b border-[#F4F4F5] ${
                    departmentId === 'all'
                      ? 'bg-emerald-50 text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                >
                  <span>Department: All</span>
                  {departmentId === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>

                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => {
                      onDepartmentChange(dept.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                      String(departmentId) === String(dept.id)
                        ? 'bg-emerald-50 text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <span className="truncate">{dept.name}</span>
                    {String(departmentId) === String(dept.id) && (
                      <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Employee Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('emp')}
              className={`h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium flex items-center gap-2 transition-all cursor-pointer shadow-none ${
                employeeId !== 'all'
                  ? 'border-[#059669] text-[#059669] bg-emerald-50/20'
                  : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
              }`}
            >
              <UserRound className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
              <span className="truncate max-w-[150px]">{`Employee: ${selectedEmp ? selectedEmp.full_name : 'All'}`}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95] ml-0.5 flex-shrink-0" />
            </button>

            {openDropdown === 'emp' && (
              <div className="absolute left-0 top-full mt-1.5 w-60 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in text-left max-h-72 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    onEmployeeChange('all');
                    setOpenDropdown(null);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer border-b border-[#F4F4F5] ${
                    employeeId === 'all'
                      ? 'bg-emerald-50 text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                >
                  <span>Employee: All</span>
                  {employeeId === 'all' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>

                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      onEmployeeChange(emp.id);
                      setOpenDropdown(null);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-[12.5px] transition-colors cursor-pointer ${
                      String(employeeId) === String(emp.id)
                        ? 'bg-emerald-50 text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <span className="truncate">{emp.full_name}</span>
                    {String(employeeId) === String(emp.id) && (
                      <Check className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Export Action */}
        <div className="self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={onExport}
            disabled={isExporting || totalFilteredCount === 0}
            className="h-[38px] px-3.5 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] disabled:opacity-40 disabled:cursor-not-allowed rounded-[8px] text-[13px] font-medium text-[#18181B] flex items-center gap-2 transition-all cursor-pointer shadow-none"
            title="Export filtered productivity report as CSV"
          >
            <Download className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* 3. Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-1 animate-fade-in">
          <span className="text-[12px] font-medium text-[#71717A]">Active filters:</span>

          {dateRange !== '30d' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Date: {selectedDateOption.label}</span>
              <button
                type="button"
                onClick={() => onDateRangeChange('30d')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {departmentId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Department: {selectedDeptLabel}</span>
              <button
                type="button"
                onClick={() => onDepartmentChange('all')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {employeeId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#F4F4F5] border border-[#E4E4E7] text-[12px] text-[#18181B]">
              <span>Employee: {selectedEmpLabel}</span>
              <button
                type="button"
                onClick={() => onEmployeeChange('all')}
                className="text-[#8B8B95] hover:text-[#18181B] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
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
                  Report Filters
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
                      handleResetFilters();
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
              {/* 1. Date Range Section */}
              <div>
                <label className="block text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider mb-2">
                  Time Range
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {dateOptions.map((opt) => {
                    const isSelected = dateRange === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onDateRangeChange(opt.id)}
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
                  {departmentId !== 'all' && (
                    <button
                      type="button"
                      onClick={() => onDepartmentChange('all')}
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
                    onClick={() => onDepartmentChange('all')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                      departmentId === 'all'
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                        : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                    }`}
                  >
                    <span>All Departments</span>
                    {departmentId === 'all' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {filteredDepartments.map((d) => {
                    const isSelected = String(departmentId) === String(d.id);
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

              {/* 3. Employee Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                    Employee
                  </label>
                  {employeeId !== 'all' && (
                    <button
                      type="button"
                      onClick={() => onEmployeeChange('all')}
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
                    value={mobileEmpSearch}
                    onChange={(e) => setMobileEmpSearch(e.target.value)}
                    placeholder="Search employees..."
                    className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-[#F8F9FA] dark:bg-[#1F2227] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] focus:outline-none focus:border-[#059669] text-[#18181B] dark:text-[#F4F4F5] placeholder:text-[#8B8B95]"
                  />
                  {mobileEmpSearch && (
                    <button
                      type="button"
                      onClick={() => setMobileEmpSearch('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[8px] p-1 bg-[#FAFAFA] dark:bg-[#1F2227]/50">
                  <button
                    type="button"
                    onClick={() => onEmployeeChange('all')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer ${
                      employeeId === 'all'
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                        : 'text-[#52525B] dark:text-[#C4C7CE] hover:bg-white dark:hover:bg-[#22262B]'
                    }`}
                  >
                    <span>All Employees</span>
                    {employeeId === 'all' && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {filteredEmployees.map((e) => {
                    const isSelected = String(employeeId) === String(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onEmployeeChange(e.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-[6px] cursor-pointer transition-colors text-left select-none ${
                          isSelected
                            ? 'bg-[#ECFDF5] text-[#059669] dark:bg-[#064E3B]/40 dark:text-[#34D399]'
                            : 'hover:bg-white dark:hover:bg-[#22262B] text-[#18181B] dark:text-[#F4F4F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Avatar src={e.avatar_url} name={e.full_name} size="xs" className="flex-shrink-0" />
                          <span className="text-[12px] font-medium truncate">{e.full_name}</span>
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
