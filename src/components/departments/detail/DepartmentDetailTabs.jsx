import React from 'react';

export const DEPARTMENT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'team', label: 'Team' },
  { id: 'activity', label: 'Activity' },
];

export function DepartmentDetailTabs({ activeTab, onTabChange }) {
  return (
    <div className="border-b border-[#E5E7EB] flex items-center gap-6 sm:gap-8 select-none overflow-x-auto no-scrollbar">
      {DEPARTMENT_TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`pb-3 text-[13.5px] font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              isActive
                ? 'text-[#18181B] font-semibold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            <span>{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#059669] rounded-t-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
