import React from 'react';

export function InboxTabs({ activeTab, onTabChange, counts = {}, showDeleteTab = true }) {
  const tabs = [
    { id: 'all', label: 'All', count: counts.all || 0 },
    { id: 'completion', label: 'Completion', count: counts.completion || 0 },
  ];

  if (showDeleteTab) {
    tabs.push({ id: 'delete', label: 'Delete', count: counts.delete || 0 });
  }

  return (
    <div className="flex items-center gap-6 border-b border-[#E5E7EB] select-none font-['Inter']">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`pb-2.5 text-[13px] transition-colors relative flex items-center gap-2 cursor-pointer ${
              isActive
                ? 'text-[#18181B] font-semibold'
                : 'text-[#71717A] hover:text-[#18181B] font-medium'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold transition-colors ${
                isActive
                  ? 'bg-[#F4F4F5] text-[#18181B]'
                  : 'bg-[#F4F4F5] text-[#71717A]'
              }`}
            >
              {tab.count}
            </span>

            {/* Active Indicator Underline */}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#059669] rounded-t-full animate-fade-in" />
            )}
          </button>
        );
      })}
    </div>
  );
}
