import React from 'react';

export function DepartmentCardSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 sm:p-6 flex flex-col justify-between min-h-[320px] animate-pulse"
        >
          <div>
            {/* Top Row: Icon + Title & Description Skeleton */}
            <div className="flex items-start gap-3.5">
              <div className="w-14 h-14 rounded-[10px] bg-[#F4F4F5] flex-shrink-0" />
              <div className="flex-1 min-w-0 space-y-2 pt-1">
                <div className="h-4 bg-[#F4F4F5] rounded w-3/4" />
                <div className="h-3 bg-[#F4F4F5] rounded w-full" />
                <div className="h-3 bg-[#F4F4F5] rounded w-2/3" />
              </div>
              <div className="w-6 h-6 rounded bg-[#F4F4F5] flex-shrink-0" />
            </div>

            {/* Member Section Skeleton */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center -space-x-1.5">
                <div className="w-8 h-8 rounded-full bg-[#F4F4F5] ring-2 ring-white" />
                <div className="w-8 h-8 rounded-full bg-[#F4F4F5] ring-2 ring-white" />
                <div className="w-8 h-8 rounded-full bg-[#F4F4F5] ring-2 ring-white" />
              </div>
              <div className="h-3.5 bg-[#F4F4F5] rounded w-20" />
            </div>

            {/* Divider */}
            <div className="border-t border-[#E5E7EB] my-4" />

            {/* Metrics Row Skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-3.5 bg-[#F4F4F5] rounded w-24" />
                <div className="h-3.5 bg-[#F4F4F5] rounded w-16" />
              </div>
              <div className="h-3.5 bg-[#F4F4F5] rounded w-24 self-start" />
            </div>

            {/* Progress bar Skeleton */}
            <div className="w-full bg-[#F4F4F5] h-1.5 rounded-full mt-3.5" />
          </div>

          {/* Footer Skeleton */}
          <div className="border-t border-[#E5E7EB] pt-3.5 mt-4">
            <div className="h-3.5 bg-[#F4F4F5] rounded w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}
