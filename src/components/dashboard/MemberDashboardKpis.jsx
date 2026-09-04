import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CalendarDays, CheckCircle2 } from 'lucide-react';

export function MemberDashboardKpis({
  dueTodayCount = 0,
  overdueCount = 0,
  upcomingCount = 0,
  completedThisWeekCount = 0,
}) {
  const navigate = useNavigate();

  const kpis = [
    {
      id: 'due_today',
      label: 'Due Today',
      value: dueTodayCount,
      icon: Clock,
      iconColor: 'text-[#D97706]',
      valueColor: 'text-[#D97706]',
      onClick: () => navigate('/tasks'),
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: overdueCount,
      icon: AlertCircle,
      iconColor: overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#71717A]',
      valueColor: overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#18181B]',
      onClick: () => navigate('/tasks?status=overdue'),
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      value: upcomingCount,
      icon: CalendarDays,
      iconColor: 'text-[#18181B]',
      valueColor: 'text-[#18181B]',
      onClick: () => navigate('/tasks'),
    },
    {
      id: 'completed_this_week',
      label: 'Completed This Week',
      value: completedThisWeekCount,
      icon: CheckCircle2,
      iconColor: 'text-[#059669]',
      valueColor: 'text-[#059669]',
      onClick: () => navigate('/tasks/completed'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            onClick={kpi.onClick}
            className="bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[10px] p-4 sm:p-5 transition-all cursor-pointer shadow-none flex items-start gap-4 min-h-[96px] group"
          >
            {/* Left Icon */}
            <div className="pt-0.5 flex-shrink-0">
              <Icon
                className={`w-8 h-8 ${kpi.iconColor} stroke-[1.5] group-hover:scale-105 transition-transform`}
              />
            </div>

            {/* Right Metric Content */}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[#71717A] leading-tight">
                {kpi.label}
              </div>
              <div
                className={`text-[28px] font-bold tracking-tight mt-1.5 leading-none ${kpi.valueColor}`}
              >
                {kpi.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
