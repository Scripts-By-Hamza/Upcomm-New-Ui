import React from 'react';

export function DepartmentDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-full animate-pulse select-none">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[10px] bg-[#F4F4F5] flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-6 bg-[#F4F4F5] rounded w-48" />
            <div className="h-4 bg-[#F4F4F5] rounded w-32" />
          </div>
        </div>
        <div className="w-28 h-9 bg-[#F4F4F5] rounded-[8px]" />
      </div>

      {/* Tabs Skeleton */}
      <div className="border-b border-[#E5E7EB] flex items-center gap-8 pb-3">
        <div className="h-4 bg-[#F4F4F5] rounded w-16" />
        <div className="h-4 bg-[#F4F4F5] rounded w-12" />
        <div className="h-4 bg-[#F4F4F5] rounded w-12" />
        <div className="h-4 bg-[#F4F4F5] rounded w-14" />
      </div>

      {/* KPI 4-Card Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 flex items-center gap-4 min-h-[104px]"
          >
            <div className="w-10 h-10 rounded-[8px] bg-[#F4F4F5] flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 bg-[#F4F4F5] rounded w-20" />
              <div className="h-6 bg-[#F4F4F5] rounded w-12" />
            </div>
          </div>
        ))}
      </div>

      {/* 2x2 Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 h-64" />
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 h-64" />
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 h-56" />
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 h-56" />
      </div>
    </div>
  );
}
