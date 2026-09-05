import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { canManageMessageReports } from '../../utils/messages/messagePermissions';
import { MessageReportsTable } from '../../components/message-reports/MessageReportsTable';
import { MessageReportDrawer } from '../../components/message-reports/MessageReportDrawer';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Search,
} from 'lucide-react';

export function MessageReportsPage() {
  const { currentUser } = useAuth();
  const { messageReports = [] } = useAppData();

  const [selectedReport, setSelectedReport] = useState(null);

  // Authorization check
  const isAuthorized = canManageMessageReports(currentUser);

  // Statistics
  const totalReports = messageReports.length;
  const openReports = messageReports.filter((r) => r.status === 'open').length;
  const investigatingReports = messageReports.filter((r) => r.status === 'investigating').length;
  const actionTakenReports = messageReports.filter((r) => r.status === 'action_taken').length;

  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-[#DC2626] flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-[17px] font-bold text-[#18181B] mb-1">Access Restricted</h3>
        <p className="text-[13px] text-[#71717A]">
          You do not have permission to view or manage employee message reports.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-red-100 text-[#DC2626] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-[#18181B] tracking-tight">
                Message Reports & Moderation
              </h1>
              <p className="text-[13px] text-[#71717A]">
                Review and resolve reported messages with immutable snapshot auditing
              </p>
            </div>
          </div>
        </div>

        {/* Privacy badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#F4F4F5] border border-[#E5E7EB] rounded-lg text-[12px] text-[#52525B] max-w-md">
          <Lock className="w-3.5 h-3.5 text-[#059669] shrink-0" />
          <span>
            Strict privacy guarantee: Employee direct chats remain invisible until reported by a conversation participant.
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total */}
        <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] shadow-xs">
          <span className="text-[11.5px] font-semibold text-[#71717A] uppercase tracking-wider">
            Total Reports
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[22px] font-bold text-[#18181B]">{totalReports}</span>
            <ShieldAlert className="w-4 h-4 text-[#8B8B95]" />
          </div>
        </div>

        {/* Open Pending */}
        <div className="p-4 rounded-xl bg-red-50/50 border border-red-200 shadow-xs">
          <span className="text-[11.5px] font-semibold text-red-700 uppercase tracking-wider">
            Open Pending
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[22px] font-bold text-red-800">{openReports}</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
        </div>

        {/* Investigating */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 shadow-xs">
          <span className="text-[11.5px] font-semibold text-amber-700 uppercase tracking-wider">
            Under Investigation
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[22px] font-bold text-amber-800">{investigatingReports}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        {/* Action Taken */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 shadow-xs">
          <span className="text-[11.5px] font-semibold text-[#065F46] uppercase tracking-wider">
            Action Taken
          </span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-[22px] font-bold text-[#059669]">{actionTakenReports}</span>
            <CheckCircle2 className="w-4 h-4 text-[#059669]" />
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <MessageReportsTable
        reports={messageReports}
        onSelectReport={(report) => setSelectedReport(report)}
      />

      {/* Detail & Resolution Drawer */}
      <MessageReportDrawer
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
      />
    </div>
  );
}

export default MessageReportsPage;
