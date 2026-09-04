import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function TaskPagination({
  currentPage = 1,
  pageSize = 10,
  totalTasks = 0,
  onPageChange,
}) {
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize));

  if (totalTasks === 0) return null;

  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalTasks);

  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-[#E5E7EB] rounded-b-[10px] select-none text-[12.5px]">
      {/* Left: Total tasks count */}
      <div className="text-[#71717A] font-medium">
        <span className="font-semibold text-[#18181B]">{totalTasks}</span> tasks
      </div>

      {/* Right: Pagination Controls */}
      <div className="flex items-center gap-3">
        <span className="text-[#71717A] hidden sm:inline-block">
          {startRange}–{endRange} of {totalTasks}
        </span>

        <div className="flex items-center gap-1">
          {/* Previous Button */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-2.5 py-1 rounded-[6px] border border-[#E5E7EB] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1 text-[12px] font-medium"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Page Numbers (Desktop) */}
          <div className="hidden sm:flex items-center gap-1">
            {pages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 text-[#8B8B95]">
                    ...
                  </span>
                );
              }

              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-[28px] h-7 px-1.5 rounded-[6px] border text-[12px] font-medium transition-colors cursor-pointer flex items-center justify-center ${
                    isActive
                      ? 'border-[#059669] bg-[#ECFDF5] text-[#059669] font-bold'
                      : 'border-[#E5E7EB] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Mobile Current Page Indicator */}
          <span className="sm:hidden px-2 text-[#71717A] text-[12px] font-medium">
            Page {currentPage} of {totalPages}
          </span>

          {/* Next Button */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-2.5 py-1 rounded-[6px] border border-[#E5E7EB] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer flex items-center gap-1 text-[12px] font-medium"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
