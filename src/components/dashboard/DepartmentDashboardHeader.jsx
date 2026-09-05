import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';

export function DepartmentDashboardHeader({
  departmentName = 'Department',
  activePreset = 'all',
  onPresetChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onResetDateFilter,
}) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presetLabels = {
    all: 'All time',
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
    custom: 'Custom Range',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
      {/* Left: Department Name + Badge & Subtitle */}
      <div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#18181B] tracking-tight">
            {departmentName}
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
            Department
          </span>
        </div>
        <p className="text-[13.5px] text-[#71717A] mt-0.5">
          Department overview and team workload.
        </p>
      </div>

      {/* Right: Compact Period Duration Filter */}
      <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] text-[12.5px] font-medium text-[#18181B] transition-colors cursor-pointer shadow-none"
          >
            <Calendar className="w-3.5 h-3.5 text-[#71717A]" />
            <span>{presetLabels[activePreset] || 'All time'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-60 sm:w-56 max-w-[calc(100vw-32px)] bg-white rounded-[10px] border border-[#E5E7EB] shadow-[0_10px_30px_rgba(24,24,27,0.12)] p-2 z-50 animate-fade-in space-y-1">
              <div className="px-2 py-1 text-[11px] font-semibold text-[#8B8B95] uppercase tracking-wider">
                Filter Duration
              </div>

              {['all', 'today', 'week', 'month'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    onPresetChange(preset);
                    setShowFilterDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors cursor-pointer text-left ${
                    activePreset === preset
                      ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                      : 'text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B]'
                  }`}
                >
                  <span>{presetLabels[preset]}</span>
                  {activePreset === preset && <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />}
                </button>
              ))}

              <div className="pt-2 border-t border-[#F4F4F5] space-y-2">
                <div className="text-[11px] font-medium text-[#71717A] px-2">Custom Dates:</div>
                <div className="grid grid-cols-2 gap-1.5 px-1">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => onFromDateChange(e.target.value)}
                    className="w-full text-[11px] px-2 py-1 bg-white border border-[#E5E7EB] rounded-[6px] text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                    title="From date"
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => onToDateChange(e.target.value)}
                    className="w-full text-[11px] px-2 py-1 bg-white border border-[#E5E7EB] rounded-[6px] text-[#18181B] focus:outline-none focus:ring-1 focus:ring-[#059669]"
                    title="To date"
                  />
                </div>

                {activePreset !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      onResetDateFilter();
                      setShowFilterDropdown(false);
                    }}
                    className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-[#DC2626] hover:underline cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    <span>Reset Filter</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
