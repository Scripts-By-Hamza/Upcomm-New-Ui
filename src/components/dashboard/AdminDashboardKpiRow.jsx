import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CircleDot, AlertCircle, TrendingUp } from 'lucide-react';

export function AdminDashboardKpiRow({
  activeTasksCount = 0,
  inProgressCount = 0,
  overdueCount = 0,
  completionRate = 0,
  completedCount = 0,
  totalCount = 0,
  createdThisWeekCount = 0,
}) {
  const navigate = useNavigate();

  const inProgressPercentage =
    activeTasksCount > 0 ? Math.round((inProgressCount / activeTasksCount) * 100) : 0;

  const kpis = [
    {
      id: 'active',
      label: 'Active Tasks',
      value: activeTasksCount,
      subtext:
        createdThisWeekCount > 0
          ? `+${createdThisWeekCount} this week`
          : `${activeTasksCount} currently open`,
      subtextColor: 'text-[#059669]',
      icon: ClipboardList,
      iconColor: 'text-[#18181B]',
      valueColor: 'text-[#18181B]',
      onClick: () => navigate('/tasks'),
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: inProgressCount,
      subtext: `${inProgressPercentage}% of active work`,
      subtextColor: 'text-[#71717A]',
      icon: CircleDot,
      iconColor: 'text-[#18181B]',
      valueColor: 'text-[#2563EB]',
      onClick: () => navigate('/tasks?status=in_progress'),
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: overdueCount,
      subtext: overdueCount > 0 ? 'Needs attention' : 'All on track',
      subtextColor: overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#059669]',
      icon: AlertCircle,
      iconColor: 'text-[#DC2626]',
      valueColor: 'text-[#DC2626]',
      onClick: () => navigate('/tasks/overdue'),
    },
    {
      id: 'completion_rate',
      label: 'Completion Rate',
      value: `${completionRate}%`,
      subtext: `${completedCount} of ${totalCount} completed`,
      subtextColor: 'text-[#059669]',
      icon: TrendingUp,
      iconColor: 'text-[#18181B]',
      valueColor: 'text-[#18181B]',
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
            className="bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[10px] p-4 sm:p-5 transition-all cursor-pointer shadow-none flex items-start gap-4 min-h-[110px] group"
          >
            {/* Left Icon (matching screenshot placement) */}
            <div className="pt-0.5 flex-shrink-0">
              <Icon className={`w-8 h-8 ${kpi.iconColor} stroke-[1.5] group-hover:scale-105 transition-transform`} />
            </div>

            {/* Right Metric Content (Label, Value, Subtext) */}
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[#71717A] leading-tight">
                {kpi.label}
              </div>
              <div className={`text-[28px] font-bold tracking-tight mt-1.5 leading-none ${kpi.valueColor}`}>
                {kpi.value}
              </div>
              <div className={`text-[12px] font-medium mt-2 leading-tight ${kpi.subtextColor}`}>
                {kpi.subtext}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
