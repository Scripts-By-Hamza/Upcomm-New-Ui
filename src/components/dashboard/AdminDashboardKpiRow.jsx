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
  createdByCount = 0,
  assignedToCount = 0,
  inProgressCreatedCount = 0,
  inProgressAssignedCount = 0,
  overdueCreatedCount = 0,
  overdueAssignedCount = 0,
  completedCreatedCount = 0,
  completedAssignedCount = 0,
}) {
  const navigate = useNavigate();

  const inProgressPercentage =
    activeTasksCount > 0 ? Math.round((inProgressCount / activeTasksCount) * 100) : 0;

  const kpis = [
    {
      id: 'total',
      label: 'Total Tasks',
      value: totalCount,
      subtextNode: (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#059669]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0"></span>
            <span>{activeTasksCount} Active</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#52525B] font-medium">
              Created <span className="font-semibold text-[#18181B]">{createdByCount}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#52525B] font-medium">
              Assigned <span className="font-semibold text-[#18181B]">{assignedToCount}</span>
            </span>
          </div>
        </div>
      ),
      icon: ClipboardList,
      iconColor: 'text-[#18181B]',
      valueColor: 'text-[#18181B]',
      onClick: () => navigate('/tasks'),
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      value: inProgressCount,
      subtextNode: (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#71717A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] flex-shrink-0"></span>
            <span>{inProgressPercentage}% of active work</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#52525B] font-medium">
              Created <span className="font-semibold text-[#18181B]">{inProgressCreatedCount}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#52525B] font-medium">
              Assigned <span className="font-semibold text-[#18181B]">{inProgressAssignedCount}</span>
            </span>
          </div>
        </div>
      ),
      icon: CircleDot,
      iconColor: 'text-[#18181B]',
      valueColor: 'text-[#2563EB]',
      onClick: () => navigate('/tasks?status=in_progress'),
    },
    {
      id: 'overdue',
      label: 'Overdue',
      value: overdueCount,
      subtextNode: (
        <div className="mt-2 space-y-1.5">
          <div className={`flex items-center gap-1.5 text-[12px] font-medium ${overdueCount > 0 ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${overdueCount > 0 ? 'bg-[#DC2626]' : 'bg-[#10B981]'} flex-shrink-0`}></span>
            <span>{overdueCount > 0 ? `${overdueCount} need attention` : 'All on track'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#52525B] font-medium">
              Created <span className="font-semibold text-[#18181B]">{overdueCreatedCount}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#52525B] font-medium">
              Assigned <span className="font-semibold text-[#18181B]">{overdueAssignedCount}</span>
            </span>
          </div>
        </div>
      ),
      icon: AlertCircle,
      iconColor: 'text-[#DC2626]',
      valueColor: 'text-[#DC2626]',
      onClick: () => navigate('/tasks/overdue'),
    },
    {
      id: 'completion_rate',
      label: 'Completion Rate',
      value: `${completionRate}%`,
      subtextNode: (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#059669]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0"></span>
            <span>{completedCount} of {totalCount} completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#71717A]">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#52525B] font-medium">
              Created <span className="font-semibold text-[#18181B]">{completedCreatedCount}</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#F4F4F5] text-[#52525B] font-medium">
              Assigned <span className="font-semibold text-[#18181B]">{completedAssignedCount}</span>
            </span>
          </div>
        </div>
      ),
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
              {kpi.subtextNode ? (
                kpi.subtextNode
              ) : (
                <div className={`text-[12px] font-medium mt-2 leading-tight ${kpi.subtextColor}`}>
                  {kpi.subtext}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
