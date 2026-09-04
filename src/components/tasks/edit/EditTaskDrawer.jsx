import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppData } from '../../../contexts/AppDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { EditTaskForm } from './EditTaskForm';
import { formatDistanceToNow } from 'date-fns';
import { X, AlertCircle, Loader2, Clock3 } from 'lucide-react';

export function EditTaskDrawer({ taskId, isOpen, onClose }) {
  const { allTasks, tasks, activityLogs = [] } = useAppData();
  const { users = [] } = useAuth();

  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

  const taskList = allTasks || tasks || [];
  const task = taskList.find((t) => t.id === taskId);

  // Close attempt handler (with dirty check)
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      onClose?.();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardModal(false);
    setIsDirty(false);
    onClose?.();
  };

  const handleSuccess = (updatedTask) => {
    setIsDirty(false);
    onClose?.(updatedTask);
  };

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        if (showDiscardModal) {
          setShowDiscardModal(false);
        } else {
          handleAttemptClose();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showDiscardModal, isDirty]);

  // Compute truthful "Last updated ... [by User Name]"
  const lastUpdatedInfo = useMemo(() => {
    if (!task) return '';

    const timestamp = task.updated_at || task.created_at;
    let timeStr = '';
    if (timestamp) {
      try {
        timeStr = formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      } catch (err) {
        timeStr = '';
      }
    }

    // Check activityLogs for most recent task update
    let updaterName = '';
    if (task.id) {
      const recentLog = (activityLogs || []).find(
        (log) =>
          (log.entity_id === task.id || log.metadata?.task_id === task.id) &&
          (log.action === 'TASK_UPDATED' || log.action === 'TASK_STATUS_UPDATED')
      );
      if (recentLog?.user_id) {
        const updater = users.find((u) => u.id === recentLog.user_id);
        if (updater?.full_name) {
          updaterName = updater.full_name;
        }
      }
    }

    if (!timeStr) return '';
    if (updaterName) {
      return `Last updated ${timeStr} by ${updaterName}`;
    }
    return `Last updated ${timeStr}`;
  }, [task, activityLogs, users]);

  if (!isOpen || !task) return null;

  const handleTriggerSubmit = () => {
    if (formRef.current) {
      if (typeof formRef.current.requestSubmit === 'function') {
        formRef.current.requestSubmit();
      } else {
        formRef.current.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  };

  return (
    <>
      {/* 1. Subtle Semi-Transparent Neutral Backdrop */}
      <div
        onClick={handleAttemptClose}
        className="fixed inset-0 top-16 bg-slate-900/15 backdrop-blur-[0.5px] z-30 transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* 2. Right-Side Drawer Container */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-task-drawer-title"
        className="fixed right-0 top-16 bottom-0 w-full sm:w-[620px] max-w-full bg-white border-l border-[#E5E7EB] shadow-2xl z-40 flex flex-col font-['Inter'] animate-slide-in-right"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Drawer Header */}
        <div className="h-[72px] px-6 border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0 bg-white select-none">
          <div className="min-w-0 pr-3">
            <h2
              id="edit-task-drawer-title"
              className="text-[18px] sm:text-[19px] font-semibold text-[#18181B] tracking-tight leading-tight truncate"
            >
              Edit Task
            </h2>
            <p className="text-[11.5px] sm:text-[12px] font-mono font-medium text-[#71717A] mt-0.5 truncate">
              {task.task_number || 'TM-0000'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer flex-shrink-0"
            title="Close"
            aria-label="Close Edit Task"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <EditTaskForm
            task={task}
            formRef={formRef}
            isDrawer
            hideActions
            onDirtyChange={setIsDirty}
            onSuccess={handleSuccess}
            onCancel={handleAttemptClose}
            isSubmittingExternal={isSubmitting}
          />
        </div>

        {/* Sticky Drawer Footer */}
        <div className="min-h-16 px-6 py-3 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white flex-shrink-0 select-none">
          {/* Left: Truthful Last Updated Info */}
          <div className="flex items-center gap-1.5 text-[11.5px] text-[#71717A] min-w-0">
            {lastUpdatedInfo && (
              <>
                <Clock3 className="w-3.5 h-3.5 flex-shrink-0 text-[#8B8B95]" />
                <span className="truncate">{lastUpdatedInfo}</span>
              </>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-end gap-2.5 flex-shrink-0">
            <button
              type="button"
              onClick={handleAttemptClose}
              className="px-4 py-2 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] text-[12.5px] font-medium text-[#18181B] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleTriggerSubmit}
              disabled={isSubmitting || !isDirty}
              className="px-4 py-2 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-[12.5px] font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-none disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Unsaved Changes Discard Confirmation Dialog */}
      {showDiscardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-['Inter']">
          <div
            className="w-full max-w-sm bg-white rounded-[12px] border border-[#E5E7EB] shadow-2xl p-5 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-50 text-[#D97706] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[14.5px] font-semibold text-[#18181B]">
                  Discard unsaved changes?
                </h3>
                <p className="text-[12.5px] text-[#71717A] leading-normal">
                  You have unsaved changes on this task. If you discard, your edits will be lost.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardModal(false)}
                className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] text-[12.5px] font-medium text-[#18181B] transition-colors cursor-pointer"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={handleConfirmDiscard}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#DC2626] hover:bg-[#B91C1C] text-[12.5px] font-medium text-white transition-colors cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
