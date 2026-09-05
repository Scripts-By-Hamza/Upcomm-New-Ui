import React, { useState, useRef, useEffect } from 'react';
import { Plus, ArrowUpDown, Check } from 'lucide-react';

export const SORT_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'name_asc', label: 'Name A–Z' },
  { id: 'name_desc', label: 'Name Z–A' },
  { id: 'members_desc', label: 'Most Members' },
  { id: 'active_desc', label: 'Most Active Tasks' },
  { id: 'overdue_desc', label: 'Most Overdue' },
  { id: 'completion_desc', label: 'Highest Completion' },
  { id: 'completion_asc', label: 'Lowest Completion' },
];

export function DepartmentHeader({
  canCreateDepartment,
  onNewDepartment,
  sortOption = 'default',
  onSortChange,
}) {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef(null);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeSortLabel = SORT_OPTIONS.find((s) => s.id === sortOption)?.label || 'Sort';

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#18181B] dark:text-[#F4F4F5] tracking-tight">
          Departments
        </h1>
        <p className="text-[13.5px] text-[#52525B] dark:text-[#8E949E] mt-1">
          Organize teams and work across UPCOMM.
        </p>
      </div>

      {/* Action Buttons: New Department on Left, Sort on Right */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        {canCreateDepartment && (
          <button
            type="button"
            onClick={onNewDepartment}
            className="inline-flex items-center justify-center gap-1.5 h-[38px] px-3.5 bg-white dark:bg-[#18181B] border border-[#059669] text-[#059669] dark:text-[#34D399] hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]/30 rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer shadow-none flex-shrink-0"
          >
            <Plus className="w-4 h-4 text-[#059669] dark:text-[#34D399] stroke-[2.2]" />
            <span>New Department</span>
          </button>
        )}

        {/* Sort Filter Button on Mobile Only (sm:hidden) */}
        {onSortChange && (
          <div className="relative sm:hidden" ref={sortRef}>
            <button
              type="button"
              onClick={() => setIsSortOpen(!isSortOpen)}
              className={`inline-flex items-center gap-1.5 h-[38px] px-3 bg-white dark:bg-[#18181B] border rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer shadow-none flex-shrink-0 ${
                isSortOpen || (sortOption && sortOption !== 'default')
                  ? 'border-[#059669] text-[#059669] dark:text-[#34D399] bg-[#ECFDF5]/30 dark:bg-[#064E3B]/30'
                  : 'border-[#E5E7EB] dark:border-[#27272A] hover:border-[#D4D4D8] dark:hover:border-[#373C44] text-[#18181B] dark:text-[#F4F4F5]'
              }`}
              aria-haspopup="true"
              aria-expanded={isSortOpen}
              aria-label="Sort departments"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-current flex-shrink-0" />
              <span>{sortOption === 'default' || !sortOption ? 'Sort' : activeSortLabel}</span>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 mt-1.5 w-52 bg-white dark:bg-[#1D2024] rounded-[10px] border border-[#E5E7EB] dark:border-[#2A2E34] shadow-lg py-1.5 z-40 animate-fade-in">
                <div className="px-3 py-1.5 border-b border-[#F4F4F5] dark:border-[#2A2E34] text-[11px] font-semibold text-[#8B8B95] dark:text-[#71717A] uppercase tracking-wider">
                  Sort By
                </div>
                <div className="py-1">
                  {SORT_OPTIONS.map((opt) => {
                    const isSelected = (sortOption || 'default') === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onSortChange(opt.id);
                          setIsSortOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-[12.5px] transition-colors cursor-pointer text-left ${
                          isSelected
                            ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#059669] dark:text-[#34D399] font-semibold'
                            : 'text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#22262B]'
                        }`}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
