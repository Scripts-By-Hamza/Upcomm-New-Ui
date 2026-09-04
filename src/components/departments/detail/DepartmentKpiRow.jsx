import React from 'react';
import { ClipboardList, Clock3, CircleAlert, TrendingUp } from 'lucide-react';

export function DepartmentKpiRow({
  activeCount = 0,
  inProgressCount = 0,
  overdueCount = 0,
  completionRate = 0,
}) {
  const cards = [
    {
      id: 'active',
      label: 'Active Tasks',
      value: activeCount,
      valueColor: 'text-[#18181B]',
      icon: ClipboardList,
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: inProgressCount,
      valueColor: 'text-[#2563EB]',
      icon: Clock3,
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: overdueCount,
      valueColor: overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]',
      icon: CircleAlert,
    },
    {
      id: 'completion',
      label: 'Completion Rate',
      value: `${completionRate}%`,
      valueColor: 'text-[#16A34A]',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 flex items-center gap-4 min-h-[104px] shadow-none"
          >
            <div className="w-10 h-10 rounded-[8px] bg-[#F4F4F5] flex items-center justify-center flex-shrink-0 text-[#71717A]">
              <Icon className="w-5 h-5 text-[#71717A]" />
            </div>

            <div className="min-w-0">
              <span className="text-[12.5px] font-medium text-[#52525B] block truncate">
                {card.label}
              </span>
              <span
                className={`text-[26px] sm:text-[28px] font-semibold tracking-tight mt-0.5 block leading-tight ${card.valueColor}`}
              >
                {card.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
