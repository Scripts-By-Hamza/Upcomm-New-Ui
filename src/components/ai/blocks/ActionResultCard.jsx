import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ExternalLink } from 'lucide-react';

export function ActionResultCard({ result = {} }) {
  const navigate = useNavigate();

  const taskNumber = result.task_number || 'TM-Task';
  const taskId = result.task_id;
  const title = result.title || '';
  const departmentName = result.department_name;
  const priority = result.priority;

  return (
    <div className="my-3 w-full max-w-xl bg-[#ECFDF5] dark:bg-emerald-950/30 rounded-[12px] border border-emerald-200 dark:border-emerald-800 p-4 font-['Inter'] shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-emerald-900 dark:text-emerald-200">
                {taskNumber} Created Successfully
              </span>
              {departmentName && (
                <span className="text-[11px] font-medium bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  {departmentName}
                </span>
              )}
            </div>
            {title && (
              <p className="text-[13.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5] mt-1">
                {title}
              </p>
            )}
            <p className="text-[12px] text-emerald-700 dark:text-emerald-400 mt-1">
              The task has been added to UPCOMM and assignees have been notified.
            </p>
          </div>
        </div>

        {taskId && (
          <button
            type="button"
            onClick={() => navigate(`/tasks/${taskId}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12.5px] font-semibold bg-[#059669] hover:bg-[#047857] text-white transition-colors cursor-pointer shrink-0 shadow-xs"
          >
            <span>View Task</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
