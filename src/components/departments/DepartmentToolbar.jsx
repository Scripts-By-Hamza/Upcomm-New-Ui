import React, { useState, useRef, useEffect } from 'react';
import { Search, ArrowUpDown, Check, X } from 'lucide-react';

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

export function DepartmentToolbar({
  searchQuery,
  onSearchChange,
  sortOption,
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
      {/* Search Input (~260-280px) */}
      <div className="relative w-full sm:w-[270px]">
        <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search departments"
          className="w-full h-[38px] pl-9 pr-8 text-[13px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] transition-all placeholder:text-[#8B8B95] text-[#18181B]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5 rounded-full"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="relative" ref={sortRef}>
        <button
          type="button"
          onClick={() => setIsSortOpen(!isSortOpen)}
          className={`inline-flex items-center gap-1.5 h-[38px] px-3 bg-white border rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer shadow-none ${
            isSortOpen || sortOption !== 'default'
              ? 'border-[#059669] text-[#059669] bg-[#ECFDF5]/30'
              : 'border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B]'
          }`}
          aria-haspopup="true"
          aria-expanded={isSortOpen}
          aria-label="Sort departments"
        >
          <ArrowUpDown className="w-3.5 h-3.5 text-current flex-shrink-0" />
          <span>{sortOption === 'default' ? 'Sort' : activeSortLabel}</span>
        </button>

        {isSortOpen && (
          <div className="absolute left-0 sm:left-auto sm:right-0 mt-1.5 w-52 bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-40 animate-fade-in">
            <div className="px-3 py-1.5 border-b border-[#F4F4F5] text-[11px] font-semibold text-[#8B8B95] uppercase tracking-wider">
              Sort By
            </div>
            <div className="py-1">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = sortOption === opt.id;
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
                        ? 'bg-[#ECFDF5] text-[#059669] font-semibold'
                        : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
