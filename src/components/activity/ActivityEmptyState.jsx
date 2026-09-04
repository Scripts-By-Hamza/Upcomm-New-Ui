import React from 'react';
import { Activity, RotateCcw } from 'lucide-react';

/**
 * Empty state component when no activities match current role or filter criteria.
 */
export default function ActivityEmptyState({
  hasFilters = false,
  onResetFilters,
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center shadow-2xs">
      <div className="w-12 h-12 rounded-full bg-[#F4F4F5] text-[#71717A] flex items-center justify-center mx-auto mb-4 border border-[#E4E4E7]">
        <Activity className="w-6 h-6 text-[#71717A]" />
      </div>
      <h3 className="text-base font-semibold text-[#18181B] mb-1">
        No activity found
      </h3>
      <p className="text-xs text-[#71717A] max-w-md mx-auto mb-6">
        {hasFilters
          ? 'No business activity matches your current search keywords or filter criteria. Try adjusting or clearing your active filters.'
          : 'There is no recorded activity in this timeline yet.'}
      </p>

      {hasFilters && onResetFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F9FAFB] active:bg-[#F4F4F5] text-xs font-semibold text-[#18181B] border border-[#E5E7EB] rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#71717A]" />
          <span>Reset all filters</span>
        </button>
      )}
    </div>
  );
}
