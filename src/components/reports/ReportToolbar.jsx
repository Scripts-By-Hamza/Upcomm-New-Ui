import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Building2,
  UserRound,
  Download,
  ChevronDown,
  Check,
} from 'lucide-react';

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
  const selectedDeptLabel = selectedDept ? `Department: ${selectedDept.name}` : 'Department: All';

  const selectedEmp = employees.find((e) => String(e.id) === String(employeeId));
  const selectedEmpLabel = selectedEmp ? `Employee: ${selectedEmp.full_name}` : 'Employee: All';

  return (
    <div ref={toolbarRef} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none">
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
            <span className="truncate max-w-[150px]">{selectedDeptLabel}</span>
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
            <span className="truncate max-w-[150px]">{selectedEmpLabel}</span>
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
  );
}
