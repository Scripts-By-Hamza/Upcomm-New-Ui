import React, { useState, useRef, useEffect } from 'react';
import { CreateTaskForm } from './CreateTaskForm';
import { X, AlertCircle, Loader2 } from 'lucide-react';

export function CreateTaskDrawer({
  isOpen,
  onClose,
  initialDepartmentId = '',
  initialStatus = 'pending',
}) {
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef(null);

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

  const handleSuccess = (createdTask) => {
    setIsDirty(false);
    onClose?.();
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

  if (!isOpen) return null;

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
        aria-labelledby="create-task-drawer-title"
        className="fixed right-0 top-16 bottom-0 w-full sm:w-[620px] max-w-full bg-white border-l border-[#E5E7EB] shadow-2xl z-40 flex flex-col font-['Inter'] animate-slide-in-right"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Drawer Header */}
        <div className="h-[72px] px-6 border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0 bg-white select-none">
          <div className="min-w-0 pr-3">
            <h2
              id="create-task-drawer-title"
              className="text-[18px] sm:text-[19px] font-semibold text-[#18181B] tracking-tight leading-tight truncate"
            >
              Create Task
            </h2>
            <p className="text-[12px] sm:text-[12.5px] text-[#71717A] mt-0.5 font-normal truncate">
              Create and assign a new company task.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAttemptClose}
            className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer flex-shrink-0"
            title="Close"
            aria-label="Close Create Task"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <CreateTaskForm
            formRef={formRef}
            isDrawer
            hideActions
            initialDepartmentId={initialDepartmentId}
            initialStatus={initialStatus}
            onDirtyChange={setIsDirty}
            onSuccess={handleSuccess}
            onCancel={handleAttemptClose}
            isSubmittingExternal={isSubmitting}
          />
        </div>

        {/* Sticky Drawer Footer */}
        <div className="h-16 px-6 border-t border-[#E5E7EB] flex items-center justify-end gap-3 bg-white flex-shrink-0 select-none">
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
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-[12.5px] font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-none disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Task</span>
            )}
          </button>
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
                  Discard unsaved task?
                </h3>
                <p className="text-[12.5px] text-[#71717A] leading-normal">
                  You have unsaved changes in this task. If you leave now, your draft will be discarded.
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
