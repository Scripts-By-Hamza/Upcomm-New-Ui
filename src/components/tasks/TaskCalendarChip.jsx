import React from 'react';
import { useNavigate } from 'react-router-dom';
import { isTaskOverdue } from '../../utils/dateUtils';

export function TaskCalendarChip({ task, onClick, onOpenTask }) {
  const navigate = useNavigate();

  const isOverdue = isTaskOverdue(task.due_date, task.status);

  // Determine status accent color
  const getStatusAccent = () => {
    if (isOverdue) {
      return {
        bg: 'bg-[#DC2626]',
        label: 'Overdue',
        textClass: 'text-[#DC2626]',
      };
    }
    switch (task.status) {
      case 'in_progress':
        return {
          bg: 'bg-[#2563EB]',
          label: 'In Progress',
          textClass: 'text-[#2563EB]',
        };
      case 'completed':
        return {
          bg: 'bg-[#16A34A]',
          label: 'Completed',
          textClass: 'text-[#16A34A]',
        };
      case 'pending':
      default:
        return {
          bg: 'bg-[#9CA3AF]',
          label: 'Pending',
          textClass: 'text-[#71717A]',
        };
    }
  };

  const accent = getStatusAccent();

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(task);
    } else if (onOpenTask) {
      onOpenTask(task.id);
    } else {
      navigate(`/tasks/${task.id}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`${task.task_number ? task.task_number + ': ' : ''}${task.title} (${accent.label})`}
      className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] border border-[#E5E7EB] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all cursor-pointer text-left w-full shadow-2xs group min-w-0"
    >
      {/* Left Status Accent Bar */}
      <span className={`w-1 h-3 rounded-full flex-shrink-0 ${accent.bg}`} />

      {/* Task Title */}
      <span className="text-[11.5px] font-medium text-[#18181B] truncate flex-1 leading-tight group-hover:text-[#059669] transition-colors">
        {task.title}
      </span>
    </button>
  );
}
