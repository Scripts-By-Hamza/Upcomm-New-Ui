import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MoreHorizontal,
  Flag,
  CalendarDays,
  CheckCircle2,
  Edit2,
  Trash2,
  ArrowRight,
  GripVertical,
  FileText,
  Eye,
} from 'lucide-react';
import { parseTaskDueDateLocal, isTaskOverdue } from '../../utils/dateUtils';
import { format } from 'date-fns';

const PRIORITY_CONFIG = {
  urgent: { label: 'Urgent', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' },
  high: { label: 'High', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' },
  medium: { label: 'Medium', color: 'text-[#D97706]', iconColor: 'text-[#D97706]' },
  low: { label: 'Low', color: 'text-[#71717A]', iconColor: 'text-[#71717A]' },
};

// Pure presentation component for the task card UI
export function TaskCardView({
  task,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
  isOverlay = false,
  dragHandleProps = null,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuOpenUpward, setMenuOpenUpward] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const isCompleted = task.status === 'completed';
  const pConfig = PRIORITY_CONFIG[task.priority?.toLowerCase()] || PRIORITY_CONFIG.medium;
  const isOverdue = isTaskOverdue(task.due_date, task.status);

  // Formatted Date logic
  const dateDisplay = (() => {
    if (isCompleted) {
      if (task.completed_at) {
        try {
          const compDate = new Date(task.completed_at);
          return `Completed ${format(compDate, 'MMM d')}`;
        } catch {
          // fallback
        }
      }
      return 'Completed';
    }

    if (!task.due_date) return null;
    const parsed = parseTaskDueDateLocal(task.due_date);
    if (!parsed) return null;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const taskDateStr = format(parsed, 'yyyy-MM-dd');

    if (taskDateStr === todayStr) return 'Today';
    return format(parsed, 'MMM d');
  })();

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!menuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuOpenUpward(window.innerHeight - rect.bottom < 180);
    }
    setMenuOpen((prev) => !prev);
  };

  return (
    <div
      onClick={() => onView?.(task)}
      className={`w-full bg-white rounded-[10px] border transition-all p-3.5 font-['Inter'] shadow-2xs select-none cursor-pointer group ${
        isOverlay
          ? 'shadow-xl border-[#059669] ring-2 ring-[#059669]/20'
          : 'border-[#E5E7EB] hover:border-[#D4D4D8] hover:shadow-sm'
      }`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Top Row: Completed Icon + Title + Drag Handle + 3-Dot Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0 mt-0.5" />
          )}
          <h4
            className={`text-[13px] sm:text-[13.5px] font-semibold leading-snug line-clamp-2 ${
              isCompleted
                ? 'text-[#71717A] group-hover:text-[#18181B]'
                : 'text-[#18181B] group-hover:text-[#059669]'
            } transition-colors`}
          >
            {task.title}
          </h4>
        </div>

        {/* Top Right Controls: Drag Handle + 3-Dot Menu */}
        <div
          className="flex items-center gap-0.5 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div
            {...(dragHandleProps || {})}
            className="cursor-grab active:cursor-grabbing text-[#D4D4D8] hover:text-[#71717A] p-1 rounded-[4px] transition-colors"
            title="Drag to move task"
            aria-label={`Drag task: ${task.title}`}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          {/* 3-Dot Action Menu */}
          {!isOverlay && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={handleToggleMenu}
                className={`p-1 rounded-[6px] transition-colors cursor-pointer outline-none focus:outline-none ${
                  menuOpen
                    ? 'bg-[#F4F4F5] text-[#18181B]'
                    : 'text-[#8B8B95] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                }`}
                title="Task options"
                aria-label="More task options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  className={`absolute right-0 ${
                    menuOpenUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                  } w-44 bg-white border border-[#E5E7EB] rounded-[8px] shadow-xl z-50 py-1 text-[12px] font-medium text-[#52525B] divide-y divide-[#F4F4F5] animate-fade-in text-left`}
                >
                  <div className="py-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onView?.(task);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F5F6F8] hover:text-[#18181B] transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>View Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        onEdit?.(task);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F5F6F8] hover:text-[#18181B] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>Edit Details</span>
                    </button>
                  </div>

                  <div className="py-0.5">
                    {task.status !== 'pending' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onStatusChange?.(task.id, 'pending');
                        }}
                        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[#F5F6F8] text-[#52525B] hover:text-[#18181B] transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-[#71717A]" />
                        <span>Move to To Do</span>
                      </button>
                    )}

                    {task.status !== 'in_progress' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onStatusChange?.(task.id, 'in_progress');
                        }}
                        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-blue-50 text-[#2563EB] transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>Move to In Progress</span>
                      </button>
                    )}

                    {task.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(false);
                          onStatusChange?.(task.id, 'completed');
                        }}
                        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-emerald-50 text-[#059669] transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                        <span>Mark Done</span>
                      </button>
                    )}
                  </div>

                  <div className="py-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        if (window.confirm('Delete this personal task?')) {
                          onDelete?.(task.id);
                        }
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-red-50 text-[#DC2626] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>Delete Task</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Metadata: Priority + Due Date / Completed Date + Optional Notes Icon */}
      <div className="flex items-center justify-between gap-2 pt-2.5 mt-1 border-t border-[#F4F4F5] text-[11.5px]">
        {/* Left: Priority */}
        <div className="flex items-center gap-1">
          <Flag className={`w-3 h-3 ${pConfig.iconColor}`} />
          <span className={`font-medium ${pConfig.color}`}>
            {pConfig.label}
          </span>
        </div>

        {/* Right Group: Due Date + Optional Notes Indicator */}
        <div className="flex items-center gap-2.5">
          {dateDisplay && (
            <div
              className={`flex items-center gap-1 ${
                isCompleted
                  ? 'text-[#71717A]'
                  : isOverdue
                  ? 'text-[#DC2626] font-semibold'
                  : dateDisplay === 'Today'
                  ? 'text-[#059669] font-semibold'
                  : 'text-[#52525B]'
              }`}
            >
              <CalendarDays className="w-3 h-3 flex-shrink-0 opacity-80" />
              <span>{dateDisplay}</span>
            </div>
          )}

          {/* Optional notes indicator if description exists */}
          {task.description && task.description.trim() && (
            <span
              className="text-[#8B8B95] hover:text-[#52525B]"
              title="Has private notes"
            >
              <FileText className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Sortable wrapper used inside Kanban columns
export function PersonalTaskCard({
  task,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="w-full h-20 rounded-[10px] border-2 border-dashed border-[#059669]/60 bg-[#ECFDF5]/40 opacity-70 transition-all"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <TaskCardView
        task={task}
        onView={onView}
        onEdit={onEdit}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
        dragHandleProps={listeners}
      />
    </div>
  );
}
