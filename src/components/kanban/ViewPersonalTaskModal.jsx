import React from 'react';
import { Modal } from '../common/Modal';
import {
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Edit2,
  Trash2,
  Play,
  FileText,
} from 'lucide-react';
import { formatDateTime, formatDate } from '../../utils/dateUtils';

const PRIORITY_CONFIG = {
  low: {
    bg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    dot: 'bg-zinc-500',
    label: 'Low Priority',
  },
  medium: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-600',
    label: 'Medium Priority',
  },
  high: {
    bg: 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    dot: 'bg-orange-600',
    label: 'High Priority',
  },
  urgent: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    dot: 'bg-rose-600',
    label: 'Urgent Priority',
  },
};

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    badgeClass: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700',
    icon: Clock,
  },
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    icon: Play,
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
};

export function ViewPersonalTaskModal({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  if (!task) return null;

  const pConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const sConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const StatusIcon = sConfig.icon;

  // Calculate Due Date Status
  const getDueStatus = () => {
    if (!task.due_date) return null;
    if (task.status === 'completed') {
      return {
        label: `Completed on schedule`,
        className: 'text-[#059669] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const taskDateStr = task.due_date;

    if (taskDateStr === todayStr) {
      return {
        label: 'Due Today',
        className: 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 font-semibold',
      };
    }

    if (taskDateStr < todayStr) {
      const diffDays = Math.ceil(
        (new Date(todayStr) - new Date(taskDateStr)) / (1000 * 60 * 60 * 24)
      );
      return {
        label: diffDays === 1 ? '1 day overdue' : `${diffDays} days overdue`,
        className: 'text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 font-semibold',
      };
    }

    return {
      label: `Due ${formatDate(task.due_date)}`,
      className: 'text-[#71717A] dark:text-[#A1A1AA] bg-[#FAFAFA] dark:bg-[#121214] border-[#E5E7EB] dark:border-[#27272A]',
    };
  };

  const dueStatus = getDueStatus();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Personal Task Details"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
        {/* Header Metadata Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Private Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold bg-[#FAFAFA] dark:bg-[#202023] text-[#71717A] dark:text-[#A1A1AA] border border-[#E5E7EB] dark:border-[#27272A]">
            <Lock className="w-3.5 h-3.5 text-[#8B8B95]" />
            <span>Private Task</span>
          </span>

          {/* Status Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold border ${sConfig.badgeClass}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{sConfig.label}</span>
          </span>

          {/* Priority Badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold border ${pConfig.bg}`}
          >
            <span className={`w-2 h-2 rounded-full ${pConfig.dot}`} />
            <span>{pConfig.label}</span>
          </span>

          {/* Category Tag */}
          {task.category && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11.5px] font-semibold bg-[#FAFAFA] dark:bg-[#202023] text-[#71717A] dark:text-[#A1A1AA] border border-[#E5E7EB] dark:border-[#27272A]">
              <Tag className="w-3 h-3 text-[#8B8B95]" />
              <span>{task.category}</span>
            </span>
          )}
        </div>

        {/* Task Title */}
        <div>
          <h2 className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] dark:text-white leading-snug break-words tracking-tight">
            {task.title}
          </h2>
        </div>

        {/* Status Switcher Quick Bar */}
        <div className="p-2.5 bg-[#FAFAFA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#27272A] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
            Quick Status:
          </span>
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {['pending', 'in_progress', 'completed'].map((st) => {
              const isSelected = task.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusChange?.(task.id, st)}
                  className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer text-center capitalize ${
                    isSelected
                      ? st === 'pending'
                        ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 shadow-2xs'
                        : st === 'in_progress'
                        ? 'bg-[#2563EB] text-white shadow-2xs'
                        : 'bg-[#059669] text-white shadow-2xs'
                      : 'bg-white dark:bg-[#18181B] text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white border border-[#E5E7EB] dark:border-[#3F3F46]'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description Box */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Description</span>
          </h4>
          <div className="bg-[#FAFAFA] dark:bg-[#121214] p-3.5 rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] text-[12.5px] text-[#18181B] dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words min-h-[60px]">
            {task.description || (
              <span className="italic text-[#8B8B95]">No detailed description provided.</span>
            )}
          </div>
        </div>

        {/* Schedule & Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Due Date Details */}
          <div className="p-3 bg-[#FAFAFA] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] space-y-1">
            <span className="text-[10.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Target Schedule</span>
            </span>
            <p className="text-[12.5px] font-semibold text-[#18181B] dark:text-white">
              {task.due_date ? formatDate(task.due_date) : 'No due date set'}
              {task.due_time ? ` at ${task.due_time}` : ''}
            </p>
            {dueStatus && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] border mt-1 ${dueStatus.className}`}
              >
                {dueStatus.label}
              </span>
            )}
          </div>

          {/* Creation Timestamp */}
          <div className="p-3 bg-[#FAFAFA] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] space-y-1">
            <span className="text-[10.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Created On</span>
            </span>
            <p className="text-[12.5px] font-medium text-[#18181B] dark:text-white">
              {task.created_at ? formatDateTime(task.created_at) : 'Recently created'}
            </p>
          </div>
        </div>

        {/* Bottom Actions Footer */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-[#E5E7EB] dark:border-[#27272A]">
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
                onDelete?.(task.id);
                onClose();
              }
            }}
            className="px-3.5 py-2 rounded-[7px] border border-rose-200 dark:border-rose-900 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[12px] font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Task</span>
          </button>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12px] font-medium text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit?.(task);
              }}
              className="px-4 py-2 rounded-[7px] bg-[#059669] hover:bg-[#047857] text-white text-[12px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Task</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ViewPersonalTaskModal;
