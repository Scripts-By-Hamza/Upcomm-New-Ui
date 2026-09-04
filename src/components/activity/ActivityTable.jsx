import React from 'react';
import Avatar from '../common/Avatar';
import { 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  Loader2, 
  Building2,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

function formatTableDateTime(timestamp) {
  if (!timestamp) return { time: '', date: '' };
  try {
    const d = typeof timestamp === 'string' ? parseISO(timestamp) : new Date(timestamp);
    return {
      time: format(d, 'h:mm a'),
      date: format(d, 'MMM d, yyyy'),
    };
  } catch {
    return { time: '', date: '' };
  }
}

function getActionBadge(item) {
  const type = item.actionType;
  switch (type) {
    case 'task_created':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]">
          Task Created
        </span>
      );
    case 'task_completed':
    case 'completion_approved':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
          <CheckCircle2 className="w-3 h-3" /> Completed
        </span>
      );
    case 'completion_requested':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
          Completion Requested
        </span>
      );
    case 'status_changed':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F4F4F5] text-[#52525B] border border-[#E4E4E7]">
          Status Changed
        </span>
      );
    case 'task_assigned':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F5F3FF] text-[#6D28D9] border border-[#EDE9FE]">
          Assigned
        </span>
      );
    case 'comment_added':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">
          Comment
        </span>
      );
    case 'attachment_added':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7]">
          Attachment
        </span>
      );
    case 'delete_requested':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
          <AlertTriangle className="w-3 h-3" /> Delete Requested
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
          Updated
        </span>
      );
  }
}

export default function ActivityTable({
  activities = [],
  onTaskClick,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) {
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFA] border-b border-[#E5E7EB] text-[11px] font-bold text-[#71717A] uppercase tracking-wider">
                <th className="py-3 px-4 w-[140px]">Time</th>
                <th className="py-3 px-4 w-[180px]">User</th>
                <th className="py-3 px-4 w-[160px]">Action</th>
                <th className="py-3 px-4 min-w-[220px]">Task / Entity</th>
                <th className="py-3 px-4 w-[150px]">Department</th>
                <th className="py-3 px-4 min-w-[240px]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F5] text-[13px] text-[#18181B]">
              {activities.map((item, idx) => {
                const { time, date } = formatTableDateTime(item.timestamp);
                const actor = item.actor || { full_name: 'Team Member' };
                const task = item.task;
                const taskNumber = item.taskNumber || (task?.task_number ? task.task_number : null);
                const taskTitle = item.taskTitle || task?.title || '';
                const taskId = task?.id || item.rawLog?.entity_id;

                return (
                  <tr
                    key={item.id || `table-row-${idx}`}
                    className="hover:bg-[#FAFAFA]/80 transition-colors"
                  >
                    {/* Time */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      <div className="font-medium text-[#18181B] tabular-nums">{time}</div>
                      <div className="text-[11px] text-[#71717A]">{date}</div>
                    </td>

                    {/* User */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      <div className="flex items-center gap-2">
                        <Avatar
                          user={actor}
                          size="xs"
                          className="w-6 h-6 rounded-full text-[10px] font-semibold border border-white flex-shrink-0"
                        />
                        <span className="font-semibold text-[#18181B] truncate max-w-[130px]">
                          {actor.full_name || 'Team Member'}
                        </span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      {getActionBadge(item)}
                    </td>

                    {/* Task / Entity */}
                    <td className="py-3 px-4 align-top">
                      {taskId ? (
                        <button
                          type="button"
                          onClick={() => onTaskClick && onTaskClick(taskId)}
                          className="font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline text-left cursor-pointer transition-colors line-clamp-2"
                        >
                          {taskNumber ? `[${taskNumber}] ` : ''}
                          {taskTitle || 'Task'}
                        </button>
                      ) : (
                        <span className="font-medium text-[#18181B] line-clamp-2">
                          {taskNumber ? `[${taskNumber}] ` : ''}
                          {taskTitle || '—'}
                        </span>
                      )}
                    </td>

                    {/* Department */}
                    <td className="py-3 px-4 whitespace-nowrap align-top">
                      {item.departmentName ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
                          <Building2 className="w-3 h-3 text-[#A1A1AA]" />
                          {item.departmentName}
                        </span>
                      ) : (
                        <span className="text-[#A1A1AA] text-xs">—</span>
                      )}
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 align-top">
                      {item.secondary?.type === 'status_transition' && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-[#52525B]">
                          {item.secondary.from && (
                            <>
                              <span className="text-[#71717A]">{item.secondary.from}</span>
                              <ArrowRight className="w-3 h-3 text-[#A1A1AA]" />
                            </>
                          )}
                          <span className="font-semibold text-[#18181B]">{item.secondary.to}</span>
                        </div>
                      )}

                      {item.secondary?.type === 'priority_transition' && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-[#52525B]">
                          {item.secondary.from && (
                            <>
                              <span className="text-[#71717A]">{item.secondary.from}</span>
                              <ArrowRight className="w-3 h-3 text-[#A1A1AA]" />
                            </>
                          )}
                          <span className="font-semibold text-[#18181B]">{item.secondary.to} Priority</span>
                        </div>
                      )}

                      {item.secondary?.type === 'due_date_transition' && (
                        <div className="inline-flex items-center gap-1 text-xs text-[#52525B]">
                          <Clock className="w-3 h-3 text-[#71717A]" />
                          <span>Due: {item.secondary.to}</span>
                        </div>
                      )}

                      {item.secondary?.type === 'attachment' && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-[#18181B]">
                          <FileText className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />
                          <span className="truncate max-w-[200px]">{item.secondary.name}</span>
                        </div>
                      )}

                      {item.secondary?.type === 'comment' && (
                        <div className="text-xs text-[#52525B] italic line-clamp-2">
                          "{item.secondary.text}"
                        </div>
                      )}

                      {item.secondary?.type === 'completion_badge' && (
                        <span className="text-xs text-[#15803D] font-medium">
                          {item.secondary.label}
                        </span>
                      )}

                      {item.secondary?.type === 'deletion_badge' && (
                        <span className="text-xs text-[#B91C1C] font-medium">
                          {item.secondary.label}
                        </span>
                      )}

                      {!item.secondary && (
                        <span className="text-xs text-[#71717A]">
                          {item.verb}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* "Load earlier activity" Pagination */}
      {hasMore && (
        <div className="pt-2 pb-6 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F9FAFB] active:bg-[#F4F4F5] text-[#52525B] hover:text-[#18181B] text-xs font-semibold rounded-lg border border-[#E5E7EB] shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#71717A]" />
                <span>Loading earlier activity...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Load earlier activity</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
