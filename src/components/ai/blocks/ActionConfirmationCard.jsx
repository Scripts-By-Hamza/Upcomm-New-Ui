import React, { useState } from 'react';
import { Sparkles, Calendar, User, Users, Check, X, Clock } from 'lucide-react';
import { formatDate } from '../../../utils/dateUtils';

export function ActionConfirmationCard({
  pendingActionId,
  actionType = 'create_task',
  cardData = {},
  expiresAt,
  onConfirm,
  onCancel,
  isExecuting = false,
  status = 'pending', // 'pending' | 'executed' | 'cancelled' | 'expired'
}) {
  const [localStatus, setLocalStatus] = useState(status);
  const [submitting, setSubmitting] = useState(false);

  const title = cardData.title || 'New Task';
  const departmentName = cardData.department_name || 'General';
  const assignees = cardData.assignees || [];
  const assistants = cardData.assistants || [];
  const priority = cardData.priority || 'medium';
  const taskStatus = cardData.status || 'pending';
  const startDate = cardData.start_date;
  const dueDate = cardData.due_date;

  const getPriorityColor = (p) => {
    switch (p) {
      case 'urgent': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900';
      case 'high': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900';
      case 'low': return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      case 'medium':
      default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900';
    }
  };

  const handleConfirm = async () => {
    if (submitting || isExecuting || localStatus !== 'pending') return;
    setSubmitting(true);
    try {
      await onConfirm(pendingActionId);
      setLocalStatus('executed');
    } catch (e) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (submitting || isExecuting || localStatus !== 'pending') return;
    setSubmitting(true);
    try {
      await onCancel(pendingActionId);
      setLocalStatus('cancelled');
    } catch (e) {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  const isPending = localStatus === 'pending' && status === 'pending';

  return (
    <div className="my-2.5 sm:my-3 w-full max-w-xl bg-white dark:bg-[#18181B] rounded-[10px] sm:rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-xs overflow-hidden font-['Inter']">
      {/* Header Banner */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F7F8FA] dark:bg-[#202024] border-b border-[#E5E7EB] dark:border-[#27272A] gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#ECFDF5] dark:bg-emerald-950/60 text-[#059669] flex items-center justify-center shrink-0">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <span className="text-[12px] sm:text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate">
            Action: Create Task
          </span>
        </div>
        <div className="shrink-0">
          {isPending ? (
            <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-900">
              <Clock className="w-3 h-3" />
              Pending
            </span>
          ) : localStatus === 'executed' || status === 'executed' ? (
            <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900">
              <Check className="w-3 h-3" />
              Executed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10.5px] sm:text-[11px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
              <X className="w-3 h-3" />
              {localStatus === 'cancelled' ? 'Cancelled' : 'Expired'}
            </span>
          )}
        </div>
      </div>

      {/* Task Summary Details */}
      <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
        <div>
          <h4 className="text-[13.5px] sm:text-[14.5px] font-bold text-[#18181B] dark:text-[#F4F4F5] leading-snug">
            {title}
          </h4>
          {cardData.description && (
            <p className="text-[12px] sm:text-[12.5px] text-[#52525B] dark:text-[#A1A1AA] mt-1 line-clamp-2">
              {cardData.description}
            </p>
          )}
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 pt-0.5 text-[11.5px] sm:text-[12px]">
          {/* Department */}
          <div className="flex items-center gap-1.5 text-[#52525B] dark:text-[#A1A1AA]">
            <span className="font-medium text-[#71717A]">Department:</span>
            <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md truncate">
              {departmentName}
            </span>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5 text-[#52525B] dark:text-[#A1A1AA]">
            <span className="font-medium text-[#71717A]">Priority:</span>
            <span className={`capitalize font-semibold px-2 py-0.5 rounded-md border text-[10.5px] sm:text-[11px] ${getPriorityColor(priority)}`}>
              {priority}
            </span>
          </div>

          {/* Assignees */}
          <div className="sm:col-span-2 flex items-start gap-1.5 text-[#52525B] dark:text-[#A1A1AA]">
            <span className="font-medium text-[#71717A] flex items-center gap-1 shrink-0 mt-0.5">
              <User className="w-3.5 h-3.5 text-[#8B8B95]" />
              Assignee(s):
            </span>
            <div className="flex flex-wrap gap-1">
              {assignees.map((name, i) => (
                <span key={i} className="font-semibold text-[#18181B] dark:text-[#F4F4F5] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md text-[11px] sm:text-[12px]">
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Assistants */}
          {assistants.length > 0 && (
            <div className="sm:col-span-2 flex items-start gap-1.5 text-[#52525B] dark:text-[#A1A1AA]">
              <span className="font-medium text-[#71717A] flex items-center gap-1 shrink-0 mt-0.5">
                <Users className="w-3.5 h-3.5 text-[#8B8B95]" />
                Assistant(s):
              </span>
              <div className="flex flex-wrap gap-1">
                {assistants.map((name, i) => (
                  <span key={i} className="font-semibold text-[#18181B] dark:text-[#F4F4F5] bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md text-[11px] sm:text-[12px]">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Start Date & Due Date */}
          <div className="flex items-center gap-1.5 text-[#52525B] dark:text-[#A1A1AA]">
            <span className="font-medium text-[#71717A] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#8B8B95]" />
              Start:
            </span>
            <span className="text-[#18181B] dark:text-[#F4F4F5]">
              {startDate ? formatDate(startDate) : 'Today'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[#52525B] dark:text-[#A1A1AA]">
            <span className="font-medium text-[#71717A]">Due:</span>
            <span className="font-medium text-[#18181B] dark:text-[#F4F4F5]">
              {dueDate && dueDate !== 'No due date set' ? formatDate(dueDate) : 'No due date'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {isPending && (
        <div className="flex items-center justify-end gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F7F8FA] dark:bg-[#202024] border-t border-[#E5E7EB] dark:border-[#27272A]">
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting || isExecuting}
            className="flex-1 sm:flex-initial px-3 py-1.5 rounded-[7px] text-[12px] sm:text-[12.5px] font-semibold text-[#52525B] dark:text-[#A1A1AA] hover:bg-[#E5E7EB] dark:hover:bg-[#2E2E33] transition-colors cursor-pointer disabled:opacity-50 text-center"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting || isExecuting}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-[7px] text-[12px] sm:text-[12.5px] font-semibold bg-[#059669] hover:bg-[#047857] text-white transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {submitting || isExecuting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Create Task</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
