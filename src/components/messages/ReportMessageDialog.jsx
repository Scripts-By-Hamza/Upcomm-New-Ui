import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../common/Avatar';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

const REPORT_REASONS = [
  'Inappropriate language',
  'Harassment or bullying',
  'Spam or unwanted solicitation',
  'Policy or compliance violation',
  'Confidential data leak / security issue',
  'Other',
];

export function ReportMessageDialog({
  isOpen,
  onClose,
  message,
  conversation,
  reportedUser,
}) {
  const { currentUser } = useAuth();
  const { reportMessage } = useAppData();

  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [reporterNote, setReporterNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !message) return null;

  const handleClose = () => {
    setReason(REPORT_REASONS[0]);
    setReporterNote('');
    setIsSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await reportMessage({
        messageId: message.id,
        conversationId: message.conversation_id || conversation?.id,
        reportedUserId: reportedUser?.id || message.sender_id,
        reason,
        reporterNote,
      });

      setIsSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error reporting message:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-xl shadow-2xl border border-[#E5E7EB] w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FDF8F6]">
          <div className="flex items-center gap-2.5 text-[#B91C1C]">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-[#DC2626]">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px] text-[#18181B]">Report Message</h3>
              <p className="text-[12px] text-[#71717A]">
                Submit this message for administrator review
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-[#71717A] hover:text-[#18181B] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#059669] flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-[16px] font-semibold text-[#18181B] mb-1">
              Report Submitted Successfully
            </h4>
            <p className="text-[13px] text-[#71717A] max-w-sm">
              An immutable snapshot of this message has been forwarded to the system administrators for moderation.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
            {/* Message Preview Snapshot Box */}
            <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={reportedUser?.avatar_url}
                    name={reportedUser?.full_name || 'User'}
                    size="xs"
                  />
                  <span className="text-[12.5px] font-medium text-[#18181B]">
                    {reportedUser?.full_name || 'Sender'}
                  </span>
                </div>
                <span className="text-[11px] text-[#71717A]">
                  {message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <p className="text-[13px] text-[#3F3F46] bg-white border border-[#E5E7EB] rounded-md p-2.5 italic">
                "{message.body}"
              </p>
            </div>

            {/* Privacy notice banner */}
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50/60 border border-blue-100 text-[12px] text-blue-900">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Notice:</strong> UPCOMM maintains strict message isolation. Admins cannot browse employee private chats. Submitting this report shares only this message snapshot and context with moderation.
              </span>
            </div>

            {/* Reason Radio Group */}
            <div>
              <label className="block text-[13px] font-medium text-[#18181B] mb-2">
                Reason for reporting <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border text-[13px] cursor-pointer transition-all ${
                      reason === r
                        ? 'border-[#059669] bg-[#ECFDF5] text-[#065F46] font-medium'
                        : 'border-[#E5E7EB] hover:bg-[#F9FAFB] text-[#3F3F46]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="report_reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="text-[#059669] focus:ring-[#059669]"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Additional Note */}
            <div>
              <label className="block text-[13px] font-medium text-[#18181B] mb-1.5">
                Additional context or notes (optional)
              </label>
              <textarea
                value={reporterNote}
                onChange={(e) => setReporterNote(e.target.value)}
                placeholder="Explain what happened or why this message requires administrator review..."
                rows={3}
                className="w-full px-3 py-2 text-[13px] border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B] placeholder:text-[#A1A1AA]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] font-medium bg-[#DC2626] hover:bg-[#B91C1C] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting Report...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    Submit Report to Admin
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default ReportMessageDialog;
