import React from 'react';
import { 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Paperclip, 
  UserCheck, 
  PlusCircle, 
  Clock, 
  MessageSquare,
  Building2
} from 'lucide-react';
import Avatar from '../common/Avatar';

/**
 * Single chronological activity event row for Timeline view.
 */
export default function ActivityEventRow({
  item,
  isFirst = false,
  isLast = false,
  onTaskClick,
}) {
  if (!item) return null;

  const actor = item.actor || { full_name: 'Team Member' };
  const task = item.task;
  const taskNumber = item.taskNumber || (task?.task_number ? task.task_number : null);
  const taskTitle = item.taskTitle || task?.title || '';
  const taskId = task?.id || item.rawLog?.entity_id;

  // Determine dot color based on event type
  const isCompleted = 
    item.actionType === 'task_completed' || 
    item.actionType === 'completion_approved' || 
    item.verb === 'completed';
  const isDeletion = 
    item.actionType === 'delete_requested' || 
    item.actionType === 'delete_approved';
  const isCreated = 
    item.actionType === 'task_created' || 
    item.verb === 'created';

  let dotBg = 'bg-[#A1A1AA]';
  if (isCompleted) {
    dotBg = 'bg-[#16A34A]';
  } else if (isDeletion) {
    dotBg = 'bg-[#DC2626]';
  } else if (isCreated) {
    dotBg = 'bg-[#2563EB]';
  }

  const handleTaskClick = (e) => {
    e.preventDefault();
    if (taskId && onTaskClick) {
      onTaskClick(taskId);
    }
  };

  return (
    <div className="group relative flex items-start px-3.5 sm:px-5 py-3 sm:py-3.5 hover:bg-[#FAFAFA]/80 transition-colors">
      {/* 1. Time Column (Desktop Only: Fixed Width ~72px) */}
      <div className="hidden sm:block w-[72px] flex-shrink-0 pt-0.5 text-right pr-4">
        <span className="text-xs font-medium text-[#71717A] tabular-nums">
          {item.timeFormatted || '12:00 PM'}
        </span>
      </div>

      {/* 2. Timeline Rail & Dot */}
      <div className="relative flex-shrink-0 flex flex-col items-center self-stretch mr-2.5 sm:mr-4">
        {/* Top connector line */}
        <div
          className={`w-[2px] bg-[#E4E4E7] flex-grow -mt-3 sm:-mt-3.5 ${
            isFirst ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ height: '14px' }}
        />

        {/* Center Bullet Dot */}
        <div className="relative z-10 my-0.5">
          <div className={`w-2.5 h-2.5 rounded-full ${dotBg} ring-4 ring-white shadow-xs`} />
        </div>

        {/* Bottom connector line */}
        <div
          className={`w-[2px] bg-[#E4E4E7] flex-grow -mb-3 sm:-mb-3.5 ${
            isLast ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </div>

      {/* 3. Actor Avatar */}
      <div className="flex-shrink-0 mr-2.5 sm:mr-3 pt-0.5">
        <Avatar
          user={actor}
          size="sm"
          className="w-7 h-7 rounded-full text-[11px] font-semibold border border-white shadow-xs"
        />
      </div>

      {/* 4. Event Content & Description */}
      <div className="flex-1 min-w-0 pt-0.5">
        {/* Line 1: Action Sentence with Mobile Time badge */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="text-[12.5px] sm:text-[13px] leading-snug sm:leading-relaxed text-[#18181B] min-w-0 flex-1 break-words">
            <span className="font-semibold text-[#18181B]">
              {actor.full_name || 'Team Member'}
            </span>
            <span className="text-[#52525B]"> {item.verb || 'updated'} </span>

            {taskId ? (
              <button
                type="button"
                onClick={handleTaskClick}
                className="inline font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline focus:outline-none text-left cursor-pointer transition-colors break-words"
              >
                {taskNumber ? `[${taskNumber}] ` : ''}
                {taskTitle || 'Task'}
              </button>
            ) : (
              <span className="font-medium text-[#18181B] break-words">
                {taskNumber ? `[${taskNumber}] ` : ''}
                {taskTitle}
              </span>
            )}
          </div>

          {/* Time on mobile (placed neatly at top right of the event) */}
          <span className="sm:hidden text-[11px] font-medium text-[#71717A] tabular-nums flex-shrink-0 whitespace-nowrap pt-0.5">
            {item.timeFormatted || '12:00 PM'}
          </span>
        </div>

        {/* Line 2: Secondary Content / Badges / Snippets */}
        {item.secondary && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Status Transition */}
            {item.secondary.type === 'status_transition' && (
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#52525B] bg-[#F4F4F5] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-[#E4E4E7]">
                {item.secondary.from && (
                  <>
                    <span className="text-[#71717A]">{item.secondary.from}</span>
                    <ArrowRight className="w-3 h-3 text-[#A1A1AA]" />
                  </>
                )}
                <span className="text-[#18181B] font-semibold">{item.secondary.to}</span>
              </div>
            )}

            {/* Priority Transition */}
            {item.secondary.type === 'priority_transition' && (
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#52525B] bg-[#F4F4F5] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-[#E4E4E7]">
                {item.secondary.from && (
                  <>
                    <span className="text-[#71717A]">{item.secondary.from}</span>
                    <ArrowRight className="w-3 h-3 text-[#A1A1AA]" />
                  </>
                )}
                <span className="text-[#18181B] font-semibold">{item.secondary.to} Priority</span>
              </div>
            )}

            {/* Due Date Transition */}
            {item.secondary.type === 'due_date_transition' && (
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#52525B] bg-[#F4F4F5] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-[#E4E4E7]">
                <Clock className="w-3 h-3 text-[#71717A]" />
                <span>Due Date: {item.secondary.to}</span>
              </div>
            )}

            {/* Attachment Preview */}
            {item.secondary.type === 'attachment' && (
              <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-[#18181B] bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md border border-[#E4E4E7] shadow-2xs hover:border-[#D4D4D8] transition-colors">
                <FileText className="w-3.5 h-3.5 text-[#6B7280] flex-shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[240px]">{item.secondary.name}</span>
              </div>
            )}

            {/* Comment Snippet */}
            {item.secondary.type === 'comment' && (
              <div className="text-[11.5px] sm:text-xs text-[#52525B] bg-[#F9FAFB] border-l-2 border-[#D4D4D8] pl-2 py-1 rounded-r-md max-w-xl italic">
                "{item.secondary.text}"
              </div>
            )}

            {/* Department Tag */}
            {item.secondary.type === 'department_tag' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] sm:text-[11px] font-medium bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]">
                <Building2 className="w-3 h-3 text-[#A1A1AA]" />
                {item.secondary.name}
              </span>
            )}

            {/* Completion Badge */}
            {item.secondary.type === 'completion_badge' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                {item.secondary.label || 'Completed'}
              </span>
            )}

            {/* Deletion Badge */}
            {item.secondary.type === 'deletion_badge' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] sm:text-[11px] font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
                <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
                {item.secondary.label || 'Deletion requested'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* 5. Department Badge on Far Right (Desktop only) */}
      {item.departmentName && item.secondary?.type !== 'department_tag' && (
        <div className="hidden sm:flex flex-shrink-0 ml-4 pt-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7]">
            {item.departmentName}
          </span>
        </div>
      )}
    </div>
  );
}
