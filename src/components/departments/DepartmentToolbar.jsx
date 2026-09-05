import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ArrowUpDown, Check } from 'lucide-react';
import { SORT_OPTIONS } from './DepartmentHeader';
export { SORT_OPTIONS } from './DepartmentHeader';

export function DepartmentToolbar({
  searchQuery,
  onSearchChange,
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
    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 select-none">
      {/* Search Input */}
      <div className="relative w-full sm:w-[280px]">
        <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search departments"
          className="w-full h-[38px] pl-9 pr-8 text-[13px] bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#D4D4D8] dark:hover:border-[#373C44] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] transition-all placeholder:text-[#8B8B95] text-[#18181B] dark:text-[#F4F4F5]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] p-0.5 rounded-full cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sort Dropdown (Desktop Only, right next to search input) */}
      {onSortChange && (
        <div className="relative hidden sm:block" ref={sortRef}>
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
            <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-52 bg-white dark:bg-[#1D2024] rounded-[10px] border border-[#E5E7EB] dark:border-[#2A2E34] shadow-lg py-1.5 z-40 animate-fade-in">
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
  );
}
