import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  ArrowRight,
  Tag,
  Calendar,
  Lock,
  Play,
  RotateCcw,
  Eye,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  low: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-500',
    label: 'Low',
  },
  medium: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
    label: 'Medium',
  },
  high: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-600',
    label: 'High',
  },
  urgent: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-600',
    label: 'Urgent',
  },
};

export function PersonalTaskRow({
  task,
  index,
  onView,
  onEdit,
  onDelete,
  onStatusChange,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
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

  const pConfig = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  // Calculate Due Date Status
  const getDueStatus = () => {
    if (!task.due_date) return null;
    if (task.status === 'completed') {
      return {
        label: `Completed ${task.due_date}`,
        isOverdue: false,
        className: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const taskDateStr = task.due_date;

    if (taskDateStr === todayStr) {
      return {
        label: 'Due Today',
        isOverdue: false,
        className: 'text-amber-800 bg-amber-50 border-amber-300 font-bold',
      };
    }

    if (taskDateStr < todayStr) {
      const diffDays = Math.ceil(
        (new Date(todayStr) - new Date(taskDateStr)) / (1000 * 60 * 60 * 24)
      );
      return {
        label: diffDays === 1 ? '1d overdue' : `${diffDays}d overdue`,
        isOverdue: true,
        className: 'text-rose-700 bg-rose-50 border-rose-200 font-bold',
      };
    }

    return {
      label: task.due_date,
      isOverdue: false,
      className: 'text-slate-600 bg-slate-50 border-slate-200',
    };
  };

  const dueStatus = getDueStatus();
  const isCompleted = task.status === 'completed';

  const handleAction = (callback) => {
    setMenuOpen(false);
    callback();
  };

  return (
    <div
      style={{ zIndex: menuOpen ? 50 : 1 }}
      onDoubleClick={() => onView?.(task)}
      className={`group relative bg-white hover:bg-slate-50/80 transition-all border border-slate-200/80 hover:border-slate-300 rounded-2xl p-3.5 sm:p-4 sm:px-5 flex items-center justify-between gap-3 sm:gap-4 shadow-2xs select-none cursor-pointer ${
        menuOpen ? 'z-50 shadow-md ring-1 ring-slate-200' : 'z-1'
      } ${isCompleted ? 'opacity-85 bg-slate-50/40' : ''}`}
      title="Double click to view full details"
    >
      {/* 1. Left Start: Task Number & Status Button */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        {/* Task Sequence No. */}
        <span className="w-8 sm:w-10 text-center font-mono text-xs sm:text-[13px] font-extrabold text-slate-500 bg-slate-100/90 py-1.5 px-1 rounded-xl border border-slate-200/90 select-none">
          #{String(index + 1).padStart(2, '0')}
        </span>

        {/* Quick Check Status Toggle */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onStatusChange?.(task.id, isCompleted ? 'pending' : 'completed');
          }}
          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
            isCompleted
              ? 'bg-emerald-500 border-emerald-600 text-white hover:bg-emerald-600'
              : task.status === 'in_progress'
              ? 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100'
              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'
          }`}
          title={isCompleted ? 'Mark as Pending' : 'Mark as Complete'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          ) : task.status === 'in_progress' ? (
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          ) : (
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-slate-400" />
          )}
        </button>
      </div>

      {/* 2. Middle Details: Single-line Title (with ellipsis) & Short Description Beneath */}
      <div className="flex-1 min-w-0 pr-1">
        {/* Title in single row with ellipsis */}
        <div className="flex items-center gap-2">
          <h3
            className={`text-xs sm:text-sm font-bold truncate text-slate-900 leading-snug cursor-pointer hover:text-emerald-700 transition-colors ${
              isCompleted ? 'line-through text-slate-500' : ''
            }`}
            title={task.title}
            onClick={() => onView?.(task)}
          >
            {task.title}
          </h3>
          <Lock className="w-3 h-3 text-slate-400 flex-shrink-0" title="Private Task" />
        </div>

        {/* Short description beneath it */}
        <p
          className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5 font-medium"
          title={task.description || 'No description'}
          onClick={() => onView?.(task)}
        >
          {task.description ? (
            task.description
          ) : (
            <span className="italic text-slate-400">No additional description</span>
          )}
        </p>

        {/* Inline Mobile Tags (< md screens) */}
        <div className="flex md:hidden flex-wrap items-center gap-1.5 mt-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
            {pConfig.label}
          </span>
          {task.category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
              <Tag className="w-2.5 h-2.5" />
              {task.category}
            </span>
          )}
          {dueStatus && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] border ${dueStatus.className}`}
            >
              <Calendar className="w-2.5 h-2.5" />
              {dueStatus.label}
            </span>
          )}
        </div>
      </div>

      {/* 3. Metadata Badges Column (>= md screens) */}
      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        {/* Priority Badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${pConfig.bg} ${pConfig.text} ${pConfig.border}`}
        >
          <span className={`w-2 h-2 rounded-full ${pConfig.dot}`} />
          {pConfig.label}
        </span>

        {/* Category Tag */}
        {task.category && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Tag className="w-3 h-3 text-slate-500" />
            <span className="max-w-[100px] truncate">{task.category}</span>
          </span>
        )}

        {/* Due Date Indicator */}
        {dueStatus && (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${dueStatus.className}`}
          >
            <Calendar className="w-3 h-3" />
            <span>{dueStatus.label}</span>
          </span>
        )}
      </div>

      {/* 4. Right End: 3-Dots Action Menu Dropdown */}
      <div className="relative flex items-center flex-shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            menuOpen
              ? 'bg-slate-200 text-slate-900'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title="Task Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-fade-in font-['Inter']">
            {/* View Details Option */}
            <button
              type="button"
              onClick={() => handleAction(() => onView?.(task))}
              className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>View Details</span>
            </button>

            {/* Edit Task Option */}
            <button
              type="button"
              onClick={() => handleAction(() => onEdit?.(task))}
              className="w-full px-3.5 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Task</span>
            </button>

            <div className="my-1 border-t border-slate-100" />

            {/* Dynamic Status Options */}
            {task.status !== 'pending' && (
              <button
                type="button"
                onClick={() => handleAction(() => onStatusChange?.(task.id, 'pending'))}
                className="w-full px-3.5 py-2 text-left text-xs font-bold text-amber-800 hover:bg-amber-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Move to Pending</span>
              </button>
            )}

            {task.status !== 'in_progress' && (
              <button
                type="button"
                onClick={() => handleAction(() => onStatusChange?.(task.id, 'in_progress'))}
                className="w-full px-3.5 py-2 text-left text-xs font-bold text-blue-800 hover:bg-blue-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-blue-600" />
                <span>Move to In Progress</span>
              </button>
            )}

            {task.status !== 'completed' && (
              <button
                type="button"
                onClick={() => handleAction(() => onStatusChange?.(task.id, 'completed'))}
                className="w-full px-3.5 py-2 text-left text-xs font-bold text-emerald-800 hover:bg-emerald-50 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mark as Complete</span>
              </button>
            )}

            <div className="my-1 border-t border-slate-100" />

            {/* Delete Task Option */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
                  handleAction(() => onDelete?.(task.id));
                }
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete Task</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

