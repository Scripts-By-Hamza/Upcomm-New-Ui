import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, User, ExternalLink } from 'lucide-react';

export function ReportCard({ data = {} }) {
  const navigate = useNavigate();

  const isEmployeeReport = data.report_type === 'employee_workload';

  if (isEmployeeReport) {
    const emp = data.employee || {};
    const workload = data.workload || {};
    const activeTasks = data.active_task_list || [];

    return (
      <div className="my-3 w-full max-w-2xl bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm overflow-hidden font-['Inter']">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F7F8FA] dark:bg-[#202024] border-b border-[#E5E7EB] dark:border-[#27272A]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                {emp.full_name || 'Employee'}
              </span>
              <span className="text-[11.5px] text-[#71717A] ml-2">
                {emp.designation} • {emp.department_name}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-full">
            Workload Report
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#18181B]">
          <div className="p-3 rounded-[8px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A]">
            <span className="text-[11px] font-medium text-[#71717A]">Active Work</span>
            <div className="text-[20px] font-bold text-[#18181B] dark:text-[#F4F4F5] mt-0.5">
              {workload.active_tasks || 0}
            </div>
          </div>
          <div className="p-3 rounded-[8px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A]">
            <span className="text-[11px] font-medium text-[#71717A]">Overdue</span>
            <div className="text-[20px] font-bold text-red-600 dark:text-red-400 mt-0.5">
              {workload.overdue_tasks || 0}
            </div>
          </div>
          <div className="p-3 rounded-[8px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A]">
            <span className="text-[11px] font-medium text-[#71717A]">Completed</span>
            <div className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {workload.completed_tasks || 0}
            </div>
          </div>
          <div className="p-3 rounded-[8px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A]">
            <span className="text-[11px] font-medium text-[#71717A]">Completion Rate</span>
            <div className="text-[20px] font-bold text-[#059669] mt-0.5">
              {workload.completion_rate_percentage || 0}%
            </div>
          </div>
        </div>

        {/* Active Tasks list */}
        {activeTasks.length > 0 && (
          <div className="px-4 pb-4 border-t border-[#E5E7EB] dark:border-[#27272A] pt-3">
            <h5 className="text-[12px] font-bold text-[#71717A] uppercase tracking-wider mb-2">
              Active Task Highlights
            </h5>
            <div className="space-y-1.5">
              {activeTasks.map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-[6px] bg-[#F7F8FA] dark:bg-[#202024] text-[12.5px]"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-[#059669] shrink-0">{t.task_number}</span>
                    <span className="font-medium text-[#18181B] dark:text-[#F4F4F5] truncate">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {t.is_overdue && (
                      <span className="text-[10.5px] font-semibold text-red-600 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900">
                        Overdue
                      </span>
                    )}
                    <span className="text-[11px] text-[#71717A]">{t.due_date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Department Report
  const deptName = data.department || 'All Departments';
  const period = data.period || {};
  const metrics = data.metrics || {};
  const teamWorkload = data.team_workload || [];
  const overdueRefs = data.overdue_task_refs || [];

  return (
    <div className="my-3 w-full max-w-2xl bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm overflow-hidden font-['Inter']">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F7F8FA] dark:bg-[#202024] border-b border-[#E5E7EB] dark:border-[#27272A]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[13.5px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
              {deptName}
            </span>
          </div>
        </div>
        <span className="text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full capitalize">
          {period.key ? period.key.replace('_', ' ') : 'This Month'}
        </span>
      </div>

      {/* KPI Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-[#18181B]">
        <div className="p-3 rounded-[8px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A]">
          <span className="text-[11px] font-medium text-[#71717A]">Created in Period</span>
          <div className="text-[20px] font-bold text-[#18181B] dark:text-[#F4F4F5] mt-0.5">
            {metrics.tasks_created_in_period || 0}
          </div>
        </div>
        <div className="p-3 rounded-[8px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A]">
          <span className="text-[11px] font-medium text-[#71717A]">Completed</span>
          <div className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {metrics.tasks_completed_in_period || 0}
          </div>
        </div>
        <div className="p-3 rounded-[8px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A]">
          <span className="text-[11px] font-medium text-[#71717A]">Overdue</span>
          <div className="text-[20px] font-bold text-red-600 dark:text-red-400 mt-0.5">
            {metrics.overdue_tasks || 0}
          </div>
        </div>
        <div className="p-3 rounded-[8px] bg-[#F7F8FA] dark:bg-[#202024] border border-[#E5E7EB] dark:border-[#27272A]">
          <span className="text-[11px] font-medium text-[#71717A]">Completion Rate</span>
          <div className="text-[20px] font-bold text-[#059669] mt-0.5">
            {metrics.completion_rate_percentage || 0}%
          </div>
        </div>
      </div>

      {/* Team Workload Mini Bars */}
      {teamWorkload.length > 0 && (
        <div className="px-4 pb-3 border-t border-[#E5E7EB] dark:border-[#27272A] pt-3">
          <h5 className="text-[12px] font-bold text-[#71717A] uppercase tracking-wider mb-2">
            Team Workload Distribution
          </h5>
          <div className="space-y-2">
            {teamWorkload.slice(0, 5).map((w, idx) => {
              const maxActive = Math.max(...teamWorkload.map((i) => i.active_tasks), 1);
              const pct = Math.round((w.active_tasks / maxActive) * 100);

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                      {w.employee_name}
                    </span>
                    <span className="text-[#71717A]">
                      {w.active_tasks} active • {w.overdue_tasks} overdue
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${w.overdue_tasks > 0 ? 'bg-amber-500' : 'bg-[#059669]'}`}
                      style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overdue Task Highlights */}
      {overdueRefs.length > 0 && (
        <div className="px-4 pb-4 border-t border-[#E5E7EB] dark:border-[#27272A] pt-3 bg-red-50/40 dark:bg-red-950/10">
          <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400 mb-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <h5 className="text-[12px] font-bold uppercase tracking-wider">
              Attention Required ({overdueRefs.length} Overdue)
            </h5>
          </div>
          <div className="space-y-1.5">
            {overdueRefs.slice(0, 4).map((t, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-[6px] bg-white dark:bg-[#18181B] border border-red-200 dark:border-red-900/50 text-[12px]"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-red-600 shrink-0">{t.task_number}</span>
                  <span className="font-medium text-[#18181B] dark:text-[#F4F4F5] truncate">{t.title}</span>
                </div>
                <div className="text-[11px] text-[#71717A] shrink-0 ml-2">
                  Due {t.due_date} ({t.assignees})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
