import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  Target,
} from 'lucide-react';
import {
  formatMonthYear,
  getAdjacentMonth,
  getAvailableMonthOptions,
} from '../../utils/monthlyTargets/monthlyTargetUtils';

export function MonthlyTargetsHeader({
  selectedYear,
  selectedMonth,
  onMonthChange,
  onOpenAddModal,
}) {
  const currentMonthKey = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const now = new Date();
  const actualCurrentYear = now.getFullYear();
  const actualCurrentMonth = now.getMonth() + 1;
  const isActualCurrentMonth =
    selectedYear === actualCurrentYear && selectedMonth === actualCurrentMonth;

  const monthOptions = getAvailableMonthOptions(actualCurrentYear, actualCurrentMonth, 6);

  const handlePrevMonth = () => {
    const prev = getAdjacentMonth(selectedYear, selectedMonth, -1);
    onMonthChange(prev.year, prev.month);
  };

  const handleNextMonth = () => {
    const next = getAdjacentMonth(selectedYear, selectedMonth, 1);
    onMonthChange(next.year, next.month);
  };

  const handleSelectChange = (e) => {
    const [y, m] = e.target.value.split('-');
    if (y && m) {
      onMonthChange(parseInt(y, 10), parseInt(m, 10));
    }
  };

  const handleGoToCurrentMonth = () => {
    onMonthChange(actualCurrentYear, actualCurrentMonth);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#E5E7EB] select-none">
      {/* Left: Breadcrumbs & Title */}
      <div>
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#71717A] mb-1">
          <span>Performance</span>
          <span>/</span>
          <span className="text-[#18181B] font-semibold">Monthly Targets</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-emerald-50 text-[#059669] flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <h1 className="text-[20px] sm:text-[22px] font-bold text-[#18181B] leading-tight">
              Monthly Targets & KPIs
            </h1>
            <p className="text-[12.5px] text-[#71717A] mt-0.5">
              Plan and track monthly commitments for you and your team.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Month Selector & Add Target Action */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {/* Month Navigation Strip */}
        <div className="flex items-center bg-white border border-[#E5E7EB] rounded-[8px] p-1 shadow-none">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
            title="Previous Month"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Month Dropdown */}
          <div className="relative mx-1">
            <select
              value={currentMonthKey}
              onChange={handleSelectChange}
              className="appearance-none bg-transparent pl-2.5 pr-6 py-1 text-[13px] font-semibold text-[#18181B] hover:bg-[#F4F4F5] rounded-[6px] cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#059669]"
            >
              {monthOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-[#8B8B95] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
            title="Next Month"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {!isActualCurrentMonth && (
          <button
            type="button"
            onClick={handleGoToCurrentMonth}
            className="text-[12px] font-medium text-[#059669] hover:bg-[#ECFDF5] px-2.5 py-1.5 rounded-[7px] border border-emerald-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            Current Month
          </button>
        )}

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="h-[36px] px-3.5 bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] font-medium text-[13px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-none flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Monthly Target</span>
        </button>
      </div>
    </div>
  );
}
