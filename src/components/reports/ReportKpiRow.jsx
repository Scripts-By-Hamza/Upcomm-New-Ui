import React from 'react';
import {
  FilePlus2,
  CheckSquare2,
  Clock,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

export function ReportKpiRow({ kpis }) {
  const {
    tasksCreated = 0,
    tasksCreatedChange = null,
    tasksCompleted = 0,
    tasksCompletedChange = null,
    completionRate = 0,
    overdueRate = 0,
  } = kpis || {};

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 select-none">
      {/* 1. Tasks Created */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3.5 sm:p-5 shadow-none flex flex-col justify-between h-auto min-h-[100px] sm:h-[112px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-[#F4F4F5] text-[#18181B] flex items-center justify-center flex-shrink-0">
            <FilePlus2 className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#52525B]" />
          </div>
          <div className="text-[11px] sm:text-[12px] font-medium text-[#71717A] truncate">
            Tasks Created
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mt-1.5 sm:mt-2 gap-0.5 sm:gap-2">
          <span className="text-[20px] sm:text-[26px] font-semibold text-[#18181B] tracking-tight">
            {tasksCreated}
          </span>
          {tasksCreatedChange && (
            <span className="text-[10px] sm:text-[11.5px] font-medium text-[#16A34A] flex items-center gap-0.5 truncate">
              <TrendingUp className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{tasksCreatedChange} vs prev</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Tasks Completed */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3.5 sm:p-5 shadow-none flex flex-col justify-between h-auto min-h-[100px] sm:h-[112px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-emerald-50 text-[#059669] flex items-center justify-center flex-shrink-0">
            <CheckSquare2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="text-[11px] sm:text-[12px] font-medium text-[#71717A] truncate">
            Tasks Completed
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mt-1.5 sm:mt-2 gap-0.5 sm:gap-2">
          <span className="text-[20px] sm:text-[26px] font-semibold text-[#18181B] tracking-tight">
            {tasksCompleted}
          </span>
          {tasksCompletedChange && (
            <span className="text-[10px] sm:text-[11.5px] font-medium text-[#16A34A] flex items-center gap-0.5 truncate">
              <TrendingUp className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{tasksCompletedChange} vs prev</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. Completion Rate */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3.5 sm:p-5 shadow-none flex flex-col justify-between h-auto min-h-[100px] sm:h-[112px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] bg-blue-50 text-[#2563EB] flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="text-[11px] sm:text-[12px] font-medium text-[#71717A] truncate">
            Completion Rate
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mt-1.5 sm:mt-2 gap-0.5 sm:gap-2">
          <span className="text-[20px] sm:text-[26px] font-semibold text-[#18181B] tracking-tight">
            {completionRate}%
          </span>
          <span className="text-[10px] sm:text-[11.5px] font-medium text-[#52525B] truncate">
            {tasksCompleted}/{tasksCreated || tasksCompleted} done
          </span>
        </div>
      </div>

      {/* 4. Overdue Rate */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3.5 sm:p-5 shadow-none flex flex-col justify-between h-auto min-h-[100px] sm:h-[112px]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] flex items-center justify-center flex-shrink-0 ${
              overdueRate > 0 ? 'bg-red-50 text-[#DC2626]' : 'bg-[#F4F4F5] text-[#71717A]'
            }`}
          >
            <AlertCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </div>
          <div className="text-[11px] sm:text-[12px] font-medium text-[#71717A] truncate">
            Overdue Rate
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between mt-1.5 sm:mt-2 gap-0.5 sm:gap-2">
          <span
            className={`text-[20px] sm:text-[26px] font-semibold tracking-tight ${
              overdueRate > 0 ? 'text-[#DC2626]' : 'text-[#18181B]'
            }`}
          >
            {overdueRate}%
          </span>
          <span className="text-[10px] sm:text-[11.5px] font-medium text-[#71717A] truncate">
            of workload
          </span>
        </div>
      </div>
    </div>
  );
}
