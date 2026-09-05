import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../common/Avatar';
import {
  X,
  ShieldAlert,
  Clock,
  User,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MessageSquare,
  FileText,
  Send,
  CornerDownRight,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open Pending Review', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'investigating', label: 'Under Investigation', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'action_taken', label: 'Action Taken / Resolved', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'dismissed', label: 'Dismissed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

export function MessageReportDrawer({
  isOpen,
  onClose,
  report,
}) {
  const { currentUser, users = [] } = useAuth();
  const { updateReportStatus, departments = [], messages = [] } = useAppData();
  const navigate = useNavigate();

  const [status, setStatus] = useState('open');
  const [adminNote, setAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (report) {
      setStatus(report.status || 'open');
      setAdminNote(report.admin_note || '');
      setSavedSuccess(false);
    }
  }, [report]);

  if (!isOpen || !report) return null;

  const reportedUser = users.find((u) => u.id === report.reported_user_id);
  const reporterUser = users.find((u) => u.id === report.reported_by_user_id);
  const reviewerUser = report.reviewed_by ? users.find((u) => u.id === report.reviewed_by) : null;

  const reportedDept = departments.find((d) => d.id === reportedUser?.department_id);
  const reporterDept = departments.find((d) => d.id === reporterUser?.department_id);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    try {
      await updateReportStatus({
        reportId: report.id,
        status,
        adminNote: adminNote.trim(),
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error updating report status:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContactUser = (userId) => {
    if (!userId) return;
    onClose();
    navigate(`/messages?userId=${userId}`);
  };

  const snapshot = report.message_snapshot || {};

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden border-l border-[#E5E7EB]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-[#FAFBFB]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-[#DC2626] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[16px] text-[#18181B]">
                  Report #{report.id.replace('mr-', '')}
                </h3>
                <span
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${
                    STATUS_OPTIONS.find((s) => s.value === report.status)?.color ||
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {STATUS_OPTIONS.find((s) => s.value === report.status)?.label || report.status}
                </span>
              </div>
              <p className="text-[12px] text-[#71717A]">
                Reported on {new Date(report.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#71717A] hover:text-[#18181B] hover:bg-[#E5E7EB]/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Reason Box */}
          <div className="bg-red-50/70 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-800 font-semibold text-[13.5px] mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Report Reason: {report.reason}</span>
            </div>
            {report.reporter_note && (
              <p className="text-[13px] text-red-900/90 mt-2 bg-white/70 p-2.5 rounded-lg border border-red-100">
                <strong>Reporter notes:</strong> "{report.reporter_note}"
              </p>
            )}
          </div>

          {/* Immutable Message Snapshot Box */}
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="bg-[#F9FAFB] px-4 py-2.5 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#18181B]">
                <Lock className="w-3.5 h-3.5 text-[#059669]" />
                <span>Immutable Message Snapshot</span>
              </div>
              <span className="text-[11px] text-[#71717A]">
                Sent at {snapshot.created_at ? new Date(snapshot.created_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-center gap-2.5 mb-2.5">
                <Avatar
                  src={reportedUser?.avatar_url}
                  name={reportedUser?.full_name || 'Reported User'}
                  size="sm"
                />
                <div>
                  <span className="text-[13px] font-semibold text-[#18181B]">
                    {reportedUser?.full_name || 'Sender'}
                  </span>
                  <span className="text-[11px] text-[#71717A] ml-2">
                    {reportedUser?.designation || reportedDept?.name}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#F4F4F5] rounded-lg text-[13.5px] text-[#18181B] font-mono leading-relaxed border border-[#E5E7EB]">
                "{snapshot.body || '[Message body empty]'}"
              </div>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Reported User Card */}
            <div className="p-3 border border-[#E5E7EB] rounded-xl bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
                  Reported User
                </span>
                <button
                  type="button"
                  onClick={() => handleContactUser(reportedUser?.id)}
                  className="text-[11px] font-medium text-[#059669] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Message</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <Avatar
                  src={reportedUser?.avatar_url}
                  name={reportedUser?.full_name || 'User'}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#18181B] truncate">
                    {reportedUser?.full_name}
                  </p>
                  <p className="text-[11px] text-[#71717A] truncate">
                    {reportedDept?.name || 'General'} • {reportedUser?.role}
                  </p>
                  <p className="text-[10.5px] text-[#8B8B95] truncate font-mono">
                    {reportedUser?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Reporter User Card */}
            <div className="p-3 border border-[#E5E7EB] rounded-xl bg-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#059669]">
                  Reported By (Reporter)
                </span>
                <button
                  type="button"
                  onClick={() => handleContactUser(reporterUser?.id)}
                  className="text-[11px] font-medium text-[#059669] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Message</span>
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <Avatar
                  src={reporterUser?.avatar_url}
                  name={reporterUser?.full_name || 'Reporter'}
                  size="md"
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#18181B] truncate">
                    {reporterUser?.full_name}
                  </p>
                  <p className="text-[11px] text-[#71717A] truncate">
                    {reporterDept?.name || 'General'} • {reporterUser?.role}
                  </p>
                  <p className="text-[10.5px] text-[#8B8B95] truncate font-mono">
                    {reporterUser?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Moderator Action / Resolution Form */}
          <form onSubmit={handleSave} className="p-4 border border-[#E5E7EB] rounded-xl bg-[#FAFBFB] space-y-3.5">
            <h4 className="text-[13.5px] font-bold text-[#18181B] flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#059669]" />
              <span>Moderation & Resolution</span>
            </h4>

            {/* Status Dropdown */}
            <div>
              <label className="block text-[12px] font-medium text-[#52525B] mb-1">
                Moderation Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Resolution Note */}
            <div>
              <label className="block text-[12px] font-medium text-[#52525B] mb-1">
                Administrative Resolution / Action Notes
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Detail the investigation results, resolution, warning issued, or reason for dismissal..."
                rows={3}
                className="w-full px-3 py-2 text-[13px] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B] placeholder:text-[#A1A1AA]"
              />
            </div>

            {report.reviewed_at && (
              <p className="text-[11.5px] text-[#71717A]">
                Last reviewed by {reviewerUser?.full_name || 'Admin'} on{' '}
                {new Date(report.reviewed_at).toLocaleString()}
              </p>
            )}

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-1">
              {savedSuccess ? (
                <span className="text-[12px] text-[#059669] font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Status updated successfully
                </span>
              ) : <div />}

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-[13px] font-semibold bg-[#059669] hover:bg-[#047857] text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isSaving ? 'Updating...' : 'Save Resolution'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MessageReportDrawer;
