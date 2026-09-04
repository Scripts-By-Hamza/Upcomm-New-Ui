import React from 'react';
import { Search, X } from 'lucide-react';

export function TaskWorkspaceHeader({
  title = 'All Tasks',
  subtitle,
  userRole = 'team_member',
  activeView = 'list',
  onViewChange,
  search = '',
  onSearchChange,
  isMyTasks = false,
}) {
  const defaultSubtitle = (() => {
    if (subtitle) return subtitle;
    const r = (userRole || '').toLowerCase();
    if (r === 'admin' || r === 'it_support_admin') {
      return 'Manage and track work across UPCOMM.';
    }
    if (r === 'hod') {
      return 'Manage tasks available to you and your department.';
    }
    return 'Manage tasks assigned to you or created by you.';
  })();

  const tabs = [
    { id: 'list', label: 'List' },
    { id: 'board', label: 'Board' },
    { id: 'calendar', label: 'Calendar' },
  ];

  return (
    <div className="space-y-4 select-none">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#18181B] tracking-tight">
          {title}
        </h1>
        <p className="text-[13.5px] text-[#71717A] mt-0.5">
          {defaultSubtitle}
        </p>
      </div>

      {/* Row 1: View Tabs (Left) + Search (Right) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E5E7EB] pt-1">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-6">
          {tabs.map((tab) => {
            const isActive = activeView === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (onViewChange) {
                    onViewChange(tab.id);
                  }
                }}
                className={`pb-2.5 text-[13.5px] font-medium transition-colors relative cursor-pointer ${
                  isActive
                    ? 'text-[#18181B] font-semibold'
                    : 'text-[#71717A] hover:text-[#18181B]'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#059669] rounded-t-sm" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Search tasks... */}
        {onSearchChange && (
          <div className="mb-2 w-full sm:w-[260px]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder={isMyTasks ? 'Search my tasks...' : 'Search tasks...'}
                className="w-full pl-8 pr-7 h-9 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] placeholder:text-[#8B8B95] transition-all outline-none shadow-2xs dark:bg-[#18181B] dark:border-[#27272A] dark:text-[#F4F4F5] dark:placeholder:text-[#71717A]"
                aria-label={isMyTasks ? 'Search my tasks' : 'Search tasks'}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  aria-label="Clear search input"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] hover:text-[#18181B] p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
