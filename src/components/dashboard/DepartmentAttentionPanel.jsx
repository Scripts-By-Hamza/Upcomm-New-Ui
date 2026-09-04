import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export function DepartmentAttentionPanel({
  overdueCount = 0,
  completionRequestsCount = 0,
  dueSoonCount = 0,
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none">
      <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B] mb-3">
        Needs Attention
      </h2>

      <div className="divide-y divide-[#F4F4F5]">
        {/* Row 1: Overdue Department Tasks */}
        <div className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[7px] bg-red-50 text-[#DC2626] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[13.5px] font-medium text-[#18181B] truncate">
              {overdueCount > 0
                ? `${overdueCount} overdue department task${overdueCount === 1 ? '' : 's'}`
                : 'No overdue department tasks'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-3 py-1.5 bg-white hover:bg-[#F5F6F8] border border-[#E5E7EB] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer flex-shrink-0 shadow-none"
          >
            Review
          </button>
        </div>

        {/* Row 2: Pending Completion Requests */}
        <div className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[7px] bg-blue-50 text-[#2563EB] flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[13.5px] font-medium text-[#18181B] truncate">
              {completionRequestsCount > 0
                ? `${completionRequestsCount} pending completion request${completionRequestsCount === 1 ? '' : 's'}`
                : 'No completion requests waiting for you'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/inbox?type=completion')}
            className="px-3 py-1.5 bg-white hover:bg-[#F5F6F8] border border-[#E5E7EB] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer flex-shrink-0 shadow-none"
          >
            Open Requests
          </button>
        </div>

        {/* Row 3: Tasks Due Within 24 Hours */}
        <div className="flex items-center justify-between py-3.5 first:pt-1 last:pb-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-[7px] bg-amber-50 text-[#D97706] flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[13.5px] font-medium text-[#18181B] truncate">
              {dueSoonCount > 0
                ? `${dueSoonCount} task${dueSoonCount === 1 ? '' : 's'} due within 24 hours`
                : 'No tasks due within 24 hours'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="px-3 py-1.5 bg-white hover:bg-[#F5F6F8] border border-[#E5E7EB] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer flex-shrink-0 shadow-none"
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}
