import React from 'react';
import { formatDistanceToNow, format, isBefore, subDays } from 'date-fns';
import { Avatar } from '../common/Avatar';
import { InboxCategoryIcon } from './InboxCategoryIcon';
import { Loader2, CheckCircle2, XCircle, Trash2, Clock } from 'lucide-react';

export function InboxRequestRow({
  request,
  requester,
  reviewer,
  onViewTask,
  onApprove,
  onReject,
  isProcessing = false,
  isHistory = false,
}) {
  const { type, task, requestedAt, reviewedAt, reason, status } = request;

  // Format timestamp
  const getFormattedTime = (dateStr, prefix = 'Requested') => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';

      if (isBefore(date, subDays(new Date(), 7))) {
        return `${prefix} ${format(date, 'MMM d, yyyy')}`;
      }
      return `${prefix} ${formatDistanceToNow(date, { addSuffix: true })}`;
    } catch (e) {
      return '';
    }
  };

  const requesterName = requester?.full_name || request.requesterName || 'Team member';
  const requesterFirstName = requesterName.split(' ')[0] || 'Member';
  const reviewerName = reviewer?.full_name || request.reviewerName || 'Reviewer';

  const isCompletion = type === 'completion';
  const isDelete = type === 'delete';
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  return (
    <div
      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F9FAFB] transition-colors font-['Inter'] select-none"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Left: Icon + Avatar + Details */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        {/* Category Icon */}
        <InboxCategoryIcon type={type} />

        {/* Requester Avatar */}
        <div className="flex-shrink-0 pt-0.5">
          <Avatar
            src={requester?.avatar_url}
            name={requesterName}
            size="md"
          />
        </div>

        {/* Content Details */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Primary Action Description */}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[13.5px] font-bold text-[#18181B] tracking-tight leading-snug">
              <span className="font-bold">{requesterFirstName}</span>{' '}
              <span className="font-normal text-[#52525B]">
                {isCompletion ? 'requested task completion' : 'requested task deletion'}
              </span>
            </p>

            {/* In history mode, show small inline badge if on mobile */}
            {isHistory && (
              <span className="sm:hidden">
                {isCompletion && status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" /> Awaiting Approval
                  </span>
                )}
                {isCompletion && isApproved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                    <CheckCircle2 className="w-3 h-3" /> Approved
                  </span>
                )}
                {isCompletion && isRejected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                    <XCircle className="w-3 h-3" /> Rejected
                  </span>
                )}
                {isDelete && status === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" /> Awaiting Approval
                  </span>
                )}
                {isDelete && isApproved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                    <Trash2 className="w-3 h-3" /> Deleted
                  </span>
                )}
                {isDelete && isRejected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10.5px] font-semibold bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
                    <XCircle className="w-3 h-3" /> Rejected
                  </span>
                )}
              </span>
            )}
          </div>

          {/* Task Reference */}
          {task ? (
            <p className="text-[13px] text-[#18181B] truncate">
              <span className="font-mono text-[12px] font-medium text-[#71717A] mr-1.5">
                {task.task_number || 'TM-0000'}
              </span>
              <span className="text-[#8B8B95] mr-1.5">—</span>
              <span className="font-semibold text-[#18181B]">{task.title}</span>
            </p>
          ) : (
            <p className="text-[12.5px] text-[#8B8B95] italic">Task unavailable</p>
          )}

          {/* Delete Reason (if applicable) */}
          {isDelete && reason && (
            <p className="text-[12px] text-[#52525B] line-clamp-2 leading-relaxed">
              <span className="font-semibold text-[#18181B]">Reason:</span> {reason}
            </p>
          )}

          {/* Tracking & Timestamps */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] text-[#8B8B95] pt-0.5">
            <span>{getFormattedTime(requestedAt, 'Requested')}</span>

            {isHistory && (reviewedAt || reviewerName) && (
              <>
                <span className="text-[#D4D4D8]">•</span>
                <span className="font-medium text-[#52525B]">
                  {isApproved ? 'Approved' : 'Rejected'} by {reviewerName}{' '}
                  {reviewedAt ? `(${getFormattedTime(reviewedAt, '')})` : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions / Status Badge */}
      <div className="flex items-center gap-2.5 flex-shrink-0 sm:self-center pl-14 sm:pl-0">
        {/* History Mode: Render Status Badges */}
        {isHistory ? (
          <>
            {isCompletion && status === 'pending' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Awaiting Approval</span>
              </span>
            )}
            {isCompletion && isApproved && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Approved</span>
              </span>
            )}
            {isCompletion && isRejected && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                <XCircle className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Rejected</span>
              </span>
            )}
            {isDelete && status === 'pending' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Awaiting Approval</span>
              </span>
            )}
            {isDelete && isApproved && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Deleted</span>
              </span>
            )}
            {isDelete && isRejected && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
                <XCircle className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Rejected</span>
              </span>
            )}

            {/* View Task Button */}
            {task && (
              <button
                type="button"
                onClick={() => onViewTask(task.id)}
                className="px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] text-[12px] font-medium text-[#18181B] transition-colors cursor-pointer"
                aria-label={`View task ${task.task_number || ''}`}
              >
                View Task
              </button>
            )}
          </>
        ) : (
          /* Pending Mode: Render Review Actions */
          <>
            {/* View Task Button */}
            {task && (
              <button
                type="button"
                onClick={() => onViewTask(task.id)}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] text-[12.5px] font-medium text-[#18181B] transition-colors cursor-pointer disabled:opacity-50"
                aria-label={`View task ${task.task_number || ''}`}
              >
                View Task
              </button>
            )}

            {/* Reject Button */}
            <button
              type="button"
              onClick={() => onReject(request)}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-red-200 hover:bg-red-50 text-[12.5px] font-medium text-[#DC2626] transition-colors cursor-pointer disabled:opacity-50"
              aria-label={`Reject ${isCompletion ? 'completion' : 'deletion'} request`}
            >
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reject'}
            </button>

            {/* Approve / Approve Delete Button */}
            {isCompletion ? (
              <button
                type="button"
                onClick={() => onApprove(request)}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-[12.5px] font-medium text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-none"
                aria-label={`Approve completion request for ${task?.task_number || 'task'}`}
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onApprove(request)}
                disabled={isProcessing}
                className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#DC2626] hover:bg-red-50 text-[12.5px] font-medium text-[#DC2626] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                aria-label={`Approve deletion request for ${task?.task_number || 'task'}`}
              >
                {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Approve Delete'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default InboxRequestRow;
