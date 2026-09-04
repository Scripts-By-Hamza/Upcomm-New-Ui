import React from 'react';

export function TaskWorkspaceHeader({
  title = 'All Tasks',
  subtitle,
  userRole = 'team_member',
  activeView = 'list',
  onViewChange,
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

      {/* View Tabs */}
      <div className="flex items-center gap-6 border-b border-[#E5E7EB] pt-1">
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
    </div>
  );
}
