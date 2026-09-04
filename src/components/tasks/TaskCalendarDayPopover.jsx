import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { TaskCalendarChip } from './TaskCalendarChip';
import { X, Calendar } from 'lucide-react';

export function TaskCalendarDayPopover({
  date,
  tasks = [],
  isOpen,
  onClose,
  onOpenTask,
}) {
  const popoverRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedDateTitle = date ? format(date, 'EEEE, MMMM d, yyyy') : 'Tasks';

  return (
    <div
      ref={popoverRef}
      className="absolute top-10 left-1/2 -translate-x-1/2 w-64 bg-white rounded-[10px] border border-[#E5E7EB] shadow-xl p-3 z-50 animate-fade-in space-y-2.5 text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F4F4F5] pb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Calendar className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
          <h4 className="text-[12px] font-semibold text-[#18181B] truncate">
            {formattedDateTitle}
          </h4>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="p-1 text-[#8B8B95] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
        {tasks.map((task) => (
          <TaskCalendarChip
            key={task.id}
            task={task}
            onOpenTask={(id) => {
              onClose();
              onOpenTask?.(id);
            }}
          />
        ))}
      </div>
    </div>
  );
}
