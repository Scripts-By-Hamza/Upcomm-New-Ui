import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useAppData } from '../../contexts/AppDataContext';
import { Trash2, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

export function RequestDeleteModal({ isOpen, onClose, task }) {
  const { requestTaskDeletion } = useAppData();
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await requestTaskDeletion(task.id, reason);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setReason('');
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error requesting task deletion:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Task Deletion" maxWidth="max-w-md">
      {submitted ? (
        <div className="text-center py-6">
          <CheckCircle2 className="w-12 h-12 text-[#059669] mx-auto mb-3 animate-bounce" />
          <h4 className="text-[15px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">Deletion Request Submitted!</h4>
          <p className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
            Admin has been notified. The task will remain active until approved.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-[8px] flex items-start gap-2.5 text-amber-900 dark:text-amber-300 text-[12px]">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Task Deletion Policy</p>
              <p className="mt-0.5 text-amber-800 dark:text-amber-300/80">
                Department members cannot permanently delete tasks directly. Submitting this request routes it to Admin for review.
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#FAFAFA] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] text-[12px]">
            <p className="text-[#71717A] dark:text-[#A1A1AA]">Target Task</p>
            <p className="font-semibold text-[#18181B] dark:text-white mt-0.5">
              <span className="font-mono text-[#059669] mr-1.5">{task.task_number || 'TM-0000'}</span>
              {task.title}
            </p>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
              Reason for Deletion Request <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this task should be deleted (e.g. duplicate created, project cancelled)..."
              className="w-full px-3 py-2 text-[12.5px] bg-[#FAFAFA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#18181B] dark:text-white rounded-[7px] focus:outline-none focus:border-[#DC2626] focus:bg-white dark:focus:bg-[#18181B] transition-colors resize-none placeholder-[#8B8B95]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#27272A]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12.5px] font-medium text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-4 py-2 rounded-[7px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Send Deletion Request</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export default RequestDeleteModal;
