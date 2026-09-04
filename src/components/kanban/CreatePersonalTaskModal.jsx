import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Lock,
  Flag,
  Calendar,
  Check,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { parseTaskDueDateLocal } from '../../utils/dateUtils';
import { format } from 'date-fns';

const STATUS_OPTIONS = [
  { id: 'pending', label: 'To Do', dotColor: 'bg-[#71717A]' },
  { id: 'in_progress', label: 'In Progress', dotColor: 'bg-[#2563EB]' },
  { id: 'completed', label: 'Done', dotColor: 'bg-[#059669]' },
];

const PRIORITY_OPTIONS = [
  { id: 'high', label: 'High', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' },
  { id: 'medium', label: 'Medium', color: 'text-[#D97706]', iconColor: 'text-[#D97706]' },
  { id: 'low', label: 'Low', color: 'text-[#71717A]', iconColor: 'text-[#71717A]' },
];

export function CreatePersonalTaskModal({
  isOpen,
  onClose,
  initialStatus = 'pending',
  editingTask = null,
  onCreate,
  onUpdate,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('pending');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdown popover open states
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);

  const statusRef = useRef(null);
  const priorityRef = useRef(null);
  const titleInputRef = useRef(null);
  const dateInputRef = useRef(null);

  // Initialize and autofocus when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingTask) {
        setTitle(editingTask.title || '');
        setDescription(editingTask.description || '');
        setStatus(editingTask.status || 'pending');
        setPriority(editingTask.priority || 'medium');
        setDueDate(editingTask.due_date ? editingTask.due_date.split('T')[0] : '');
      } else {
        setTitle('');
        setDescription('');
        setStatus(initialStatus || 'pending');
        setPriority('medium');
        setDueDate('');
      }
      setError('');
      setIsSubmitting(false);
      setIsStatusOpen(false);
      setIsPriorityOpen(false);

      // Instant auto-focus on Task Title
      const timer = setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, editingTask, initialStatus]);

  // Click outside listener for dropdown popovers
  useEffect(() => {
    function handleClickOutside(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setIsStatusOpen(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target)) {
        setIsPriorityOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const currentStatusObj =
    STATUS_OPTIONS.find((s) => s.id === status) || STATUS_OPTIONS[0];
  const currentPriorityObj =
    PRIORITY_OPTIONS.find((p) => p.id === priority) || PRIORITY_OPTIONS[1];

  // Timezone-safe formatted date display
  const formattedDueDateDisplay = (() => {
    if (!dueDate) return 'Select due date';
    const parsed = parseTaskDueDateLocal(dueDate);
    if (!parsed) return dueDate;
    return format(parsed, 'MMM d, yyyy');
  })();

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required.');
      if (titleInputRef.current) titleInputRef.current.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        title: trimmedTitle,
        description: description.trim(),
        status,
        priority,
        due_date: dueDate || null,
        category: editingTask?.category || 'General',
      };

      if (editingTask) {
        await onUpdate?.(editingTask.id, payload);
      } else {
        await onCreate?.(payload);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save personal task:', err);
      setError(err?.message || 'Failed to save personal task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextareaKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-personal-task-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 font-['Inter']"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. Subtle Translucent Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* 2. Floating Centered Modal Card */}
      <div
        className="relative w-[calc(100vw-32px)] max-w-[540px] bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-xl flex flex-col overflow-hidden z-10 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between bg-white dark:bg-[#18181B] select-none">
          <div>
            <h2
              id="add-personal-task-title"
              className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] dark:text-[#F4F4F5] tracking-tight"
            >
              {editingTask ? 'Edit Personal Task' : 'Add Personal Task'}
            </h2>
            <p className="text-[12.5px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              Create a private task visible only to you.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1.5 rounded-[6px] flex items-center justify-center text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-5 sm:p-6 space-y-4">
            {/* Task Title */}
            <div>
              <label
                htmlFor="personal-task-title-input"
                className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5"
              >
                Task Title <span className="text-rose-500">*</span>
              </label>
              <input
                ref={titleInputRef}
                id="personal-task-title-input"
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                placeholder="What do you need to do?"
                className={`w-full h-10 px-3 text-[13px] text-[#18181B] dark:text-white bg-[#FAFAFA] dark:bg-[#121214] border rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95] ${
                  error && !title.trim()
                    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-1 focus:ring-[#DC2626]/20'
                    : 'border-[#E5E7EB] dark:border-[#3F3F46] focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669]'
                }`}
              />
            </div>

            {/* Notes */}
            <div>
              <label
                htmlFor="personal-task-notes-input"
                className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5"
              >
                Notes
              </label>
              <textarea
                id="personal-task-notes-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                placeholder="Add notes or details..."
                className="w-full min-h-[88px] max-h-[140px] p-3 text-[13px] text-[#18181B] dark:text-white bg-[#FAFAFA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#3F3F46] focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669] rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95] resize-y"
              />
            </div>

            {/* Property Grid: Status | Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Status Select */}
              <div className="space-y-1.5" ref={statusRef}>
                <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8]">
                  Status
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsStatusOpen((prev) => !prev);
                      setIsPriorityOpen(false);
                    }}
                    className="w-full h-10 px-3 rounded-[8px] bg-[#FAFAFA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#3F3F46] flex items-center justify-between text-[#18181B] dark:text-white transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${currentStatusObj.dotColor}`} />
                      <span className="text-[13px] font-medium text-[#18181B] dark:text-white">
                        {currentStatusObj.label}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
                  </button>

                  {isStatusOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#18181B] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] shadow-xl p-1 z-50 animate-fade-in space-y-0.5">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setStatus(opt.id);
                            setIsStatusOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[12.5px] cursor-pointer hover:bg-[#F5F6F8] dark:hover:bg-[#202023] transition-colors ${
                            status === opt.id
                              ? 'bg-[#F4F4F5] dark:bg-[#27272A] font-semibold text-[#18181B] dark:text-white'
                              : 'text-[#52525B] dark:text-[#A1A1AA]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${opt.dotColor}`} />
                            <span>{opt.label}</span>
                          </div>
                          {status === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Priority Select */}
              <div className="space-y-1.5" ref={priorityRef}>
                <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8]">
                  Priority
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPriorityOpen((prev) => !prev);
                      setIsStatusOpen(false);
                    }}
                    className="w-full h-10 px-3 rounded-[8px] bg-[#FAFAFA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#3F3F46] flex items-center justify-between text-[#18181B] dark:text-white transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Flag className={`w-3.5 h-3.5 ${currentPriorityObj.iconColor}`} />
                      <span className={`text-[13px] font-medium ${currentPriorityObj.color}`}>
                        {currentPriorityObj.label}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
                  </button>

                  {isPriorityOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white dark:bg-[#18181B] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] shadow-xl p-1 z-50 animate-fade-in space-y-0.5">
                      {PRIORITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setPriority(opt.id);
                            setIsPriorityOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[12.5px] cursor-pointer hover:bg-[#F5F6F8] dark:hover:bg-[#202023] transition-colors ${
                            priority === opt.id
                              ? 'bg-[#F4F4F5] dark:bg-[#27272A] font-semibold text-[#18181B] dark:text-white'
                              : 'text-[#52525B] dark:text-[#A1A1AA]'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Flag className={`w-3.5 h-3.5 ${opt.iconColor}`} />
                            <span className={opt.color}>{opt.label}</span>
                          </div>
                          {priority === opt.id && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Due Date Picker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="personal-task-due-date-picker"
                  className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8]"
                >
                  Due Date
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      if (dateInputRef.current) {
                        if (typeof dateInputRef.current.showPicker === 'function') {
                          dateInputRef.current.showPicker();
                        } else {
                          dateInputRef.current.focus();
                        }
                      }
                    }}
                    className="w-full h-10 px-3 rounded-[8px] bg-[#FAFAFA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#3F3F46] flex items-center justify-between text-[#18181B] dark:text-white transition-colors cursor-pointer text-left group"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#71717A] group-hover:text-[#18181B] dark:group-hover:text-white transition-colors" />
                      <span
                        className={`text-[13px] ${
                          dueDate ? 'font-medium text-[#18181B] dark:text-white' : 'text-[#8B8B95]'
                        }`}
                      >
                        {formattedDueDateDisplay}
                      </span>
                    </div>
                    {dueDate && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDueDate('');
                        }}
                        className="p-1 rounded text-[#8B8B95] hover:text-[#DC2626] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors"
                        title="Clear due date"
                      >
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>

                  {/* Hidden / native input triggered on button click */}
                  <input
                    ref={dateInputRef}
                    id="personal-task-due-date-picker"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                    tabIndex={-1}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Informational Indicator */}
            <div className="flex items-center gap-1.5 pt-1 text-[12px] text-[#71717A] dark:text-[#A1A1AA] select-none">
              <Lock className="w-3.5 h-3.5 text-[#8B8B95] flex-shrink-0" />
              <span>Only you can see this task.</span>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-[11.5px] text-[#DC2626] font-medium pt-0.5">
                {error}
              </p>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#FAFBFB] dark:bg-[#121214] flex items-center justify-end gap-2.5 select-none">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-[13px] font-medium text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#3F3F46] hover:bg-[#F5F6F8] dark:hover:bg-[#27272A] rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isSubmitting
                  ? editingTask
                    ? 'Saving...'
                    : 'Adding...'
                  : editingTask
                  ? 'Save Changes'
                  : 'Add Task'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
