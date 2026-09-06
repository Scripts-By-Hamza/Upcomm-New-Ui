import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ListTodo, ArrowRight, ExternalLink } from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';

export function TaskListBlock({ data = {} }) {
  const navigate = useNavigate();
  const tasks = data.tasks || [];
  const title = data.title || 'Matching Tasks';

  if (tasks.length === 0) return null;

  const getPriorityBadge = (p) => {
    switch (p) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900';
      case 'low': return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      case 'medium':
      default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900';
      case 'in_progress': return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900';
      case 'pending':
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <div className="my-3 w-full max-w-2xl bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-sm overflow-hidden font-['Inter']">
      <div className="flex items-center justify-between px-4 py-3 bg-[#F7F8FA] dark:bg-[#202024] border-b border-[#E5E7EB] dark:border-[#27272A]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-[#18181B] dark:text-[#F4F4F5] flex items-center justify-center">
            <ListTodo className="w-3.5 h-3.5" />
          </div>
          <span className="text-[13px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
            {title} ({tasks.length})
          </span>
        </div>
      </div>

      <div className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
        {tasks.map((t, idx) => (
          <div
            key={idx}
            onClick={() => navigate(`/tasks/${t.id}`)}
            className="p-2.5 sm:p-3 hover:bg-[#F9FAFB] dark:hover:bg-[#202024] transition-colors flex items-center justify-between gap-2.5 sm:gap-3 cursor-pointer group"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[12px] sm:text-[12.5px] font-bold text-[#059669] shrink-0">
                  {t.task_number}
                </span>
                <span className="text-[12.5px] sm:text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate group-hover:text-[#059669] transition-colors">
                  {t.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 text-[11px] sm:text-[11.5px] text-[#71717A] truncate">
                <span className="truncate">{t.department_name}</span>
                {t.assignees && t.assignees.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="truncate">{t.assignees.map((a) => a.name).join(', ')}</span>
                  </>
                )}
                {t.due_date && (
                  <>
                    <span>•</span>
                    <span className="shrink-0">Due: {formatDate(t.due_date)}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-[10px] sm:text-[10.5px] font-semibold px-1.5 sm:px-2 py-0.5 rounded border capitalize ${getPriorityBadge(t.priority)}`}>
                {t.priority}
              </span>
              <span className={`hidden sm:inline-flex text-[10px] sm:text-[10.5px] font-semibold px-1.5 sm:px-2 py-0.5 rounded border capitalize ${getStatusBadge(t.status)}`}>
                {(t.status || 'pending').replace('_', ' ')}
              </span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8B8B95] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
