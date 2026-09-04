import React from 'react';
import { Target, CircleDot, CheckCircle2, AlertCircle } from 'lucide-react';

export function MonthlyTargetsSummaryRow({
  totalCount = 0,
  inProgressCount = 0,
  completedCount = 0,
  overdueCount = 0,
  activeFilter = 'all',
  onFilterChange = () => {},
}) {
  const cards = [
    {
      id: 'all',
      label: 'Total Targets',
      value: totalCount,
      subtext: 'For selected month',
      subtextColor: 'text-[#71717A]',
      icon: Target,
      iconColor: 'text-[#18181B]',
      valueColor: 'text-[#18181B]',
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: inProgressCount,
      subtext: totalCount > 0 ? `${Math.round((inProgressCount / totalCount) * 100)}% of monthly goals` : '0% of goals',
      subtextColor: 'text-[#2563EB]',
      icon: CircleDot,
      iconColor: 'text-[#2563EB]',
      valueColor: 'text-[#2563EB]',
    },
    {
      id: 'completed',
      label: 'Completed',
      value: completedCount,
      subtext: totalCount > 0 ? `${Math.round((completedCount / totalCount) * 100)}% completed` : 'All on track',
      subtextColor: 'text-[#059669]',
      icon: CheckCircle2,
      iconColor: 'text-[#059669]',
      valueColor: 'text-[#059669]',
    },
    {
      id: 'overdue',
      label: 'Overdue / Missed',
      value: overdueCount,
      subtext: overdueCount > 0 ? 'Month ended, incomplete' : 'None missed',
      subtextColor: overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#71717A]',
      icon: AlertCircle,
      iconColor: overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#71717A]',
      valueColor: overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#18181B]',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 select-none">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onFilterChange(card.id === activeFilter ? 'all' : card.id)}
            className={`bg-white border ${
              isSelected ? 'border-[#059669] ring-1 ring-[#059669]' : 'border-[#E5E7EB] hover:border-[#D4D4D8]'
            } rounded-[10px] p-3.5 sm:p-4 transition-all cursor-pointer shadow-none flex items-start gap-3 group`}
          >
            <div className="pt-0.5 flex-shrink-0">
              <Icon className={`w-7 h-7 ${card.iconColor} stroke-[1.5] group-hover:scale-105 transition-transform`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-medium text-[#71717A] leading-tight">
                {card.label}
              </div>
              <div className={`text-[22px] sm:text-[24px] font-bold tracking-tight mt-1 leading-none ${card.valueColor}`}>
                {card.value}
              </div>
              <div className={`text-[11px] font-medium mt-1.5 leading-tight ${card.subtextColor} truncate`}>
                {card.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
