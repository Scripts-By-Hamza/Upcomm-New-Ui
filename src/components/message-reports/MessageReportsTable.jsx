import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import {
  Search,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
} from 'lucide-react';

const STATUS_CONFIG = {
  open: { label: 'Open Pending', color: 'bg-red-50 text-red-700 border-red-200' },
  investigating: { label: 'Investigating', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  action_taken: { label: 'Action Taken', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  dismissed: { label: 'Dismissed', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export function MessageReportsTable({
  reports = [],
  onSelectReport,
}) {
  const { users = [] } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'open' | 'investigating' | 'action_taken' | 'dismissed'
  const [searchQuery, setSearchQuery] = useState('');

  // Counts for tabs
  const openCount = reports.filter((r) => r.status === 'open').length;
  const investigatingCount = reports.filter((r) => r.status === 'investigating').length;
  const actionTakenCount = reports.filter((r) => r.status === 'action_taken').length;
  const dismissedCount = reports.filter((r) => r.status === 'dismissed').length;

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Tab filter
      if (activeTab !== 'all' && r.status !== activeTab) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();

      const reportedUser = users.find((u) => u.id === r.reported_user_id);
      const reporterUser = users.find((u) => u.id === r.reported_by_user_id);

      const reportedName = (reportedUser?.full_name || '').toLowerCase();
      const reportedEmail = (reportedUser?.email || '').toLowerCase();
      const reporterName = (reporterUser?.full_name || '').toLowerCase();
      const reason = (r.reason || '').toLowerCase();
      const note = (r.reporter_note || '').toLowerCase();
      const body = (r.message_snapshot?.body || '').toLowerCase();

      return (
        reportedName.includes(q) ||
        reportedEmail.includes(q) ||
        reporterName.includes(q) ||
        reason.includes(q) ||
        note.includes(q) ||
        body.includes(q)
      );
    });
  }, [reports, activeTab, searchQuery, users]);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden shadow-xs">
      {/* Search & Tabs Toolbar */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAFBFB]">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#18181B] text-white'
                : 'bg-white text-[#52525B] hover:bg-[#F4F4F5] border border-[#E5E7EB]'
            }`}
          >
            All ({reports.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('open')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'open'
                ? 'bg-[#DC2626] text-white'
                : 'bg-white text-[#52525B] hover:bg-[#F4F4F5] border border-[#E5E7EB]'
            }`}
          >
            <span>Open Pending</span>
            {openCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'open' ? 'bg-white text-[#DC2626]' : 'bg-red-100 text-red-700'}`}>
                {openCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('investigating')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'investigating'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-[#52525B] hover:bg-[#F4F4F5] border border-[#E5E7EB]'
            }`}
          >
            <span>Investigating</span>
            {investigatingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === 'investigating' ? 'bg-white text-amber-700' : 'bg-amber-100 text-amber-700'}`}>
                {investigatingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('action_taken')}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'action_taken'
                ? 'bg-[#059669] text-white'
                : 'bg-white text-[#52525B] hover:bg-[#F4F4F5] border border-[#E5E7EB]'
            }`}
          >
            Action Taken ({actionTakenCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dismissed')}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'dismissed'
                ? 'bg-gray-700 text-white'
                : 'bg-white text-[#52525B] hover:bg-[#F4F4F5] border border-[#E5E7EB]'
            }`}
          >
            Dismissed ({dismissedCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search reports or message text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-white border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] text-[#18181B]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[11.5px] font-semibold uppercase tracking-wider text-[#71717A]">
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Reported User</th>
              <th className="py-3 px-4">Reported By</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Message Excerpt</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F4F5] text-[13px]">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#8B8B95]">
                  <div className="flex flex-col items-center justify-center">
                    <ShieldAlert className="w-8 h-8 text-[#A1A1AA] mb-2" />
                    <p className="font-medium text-[14px] text-[#18181B]">No message reports found</p>
                    <p className="text-[12px] text-[#71717A] mt-0.5">
                      No reports match the selected status filter or search query.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => {
                const reportedUser = users.find((u) => u.id === report.reported_user_id);
                const reporterUser = users.find((u) => u.id === report.reported_by_user_id);
                const statusMeta = STATUS_CONFIG[report.status] || {
                  label: report.status,
                  color: 'bg-gray-100 text-gray-700',
                };

                return (
                  <tr
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="hover:bg-[#F9FAFB] transition-colors cursor-pointer group"
                  >
                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.color}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Reported User */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          src={reportedUser?.avatar_url}
                          name={reportedUser?.full_name || 'User'}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#18181B] truncate group-hover:text-[#059669] transition-colors">
                            {reportedUser?.full_name || 'Reported User'}
                          </p>
                          <p className="text-[11px] text-[#71717A] truncate">
                            {reportedUser?.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Reported By */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar
                          src={reporterUser?.avatar_url}
                          name={reporterUser?.full_name || 'Reporter'}
                          size="xs"
                        />
                        <span className="text-[#3F3F46] truncate">
                          {reporterUser?.full_name || 'Reporter'}
                        </span>
                      </div>
                    </td>

                    {/* Reason */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#18181B] truncate block max-w-[150px]">
                        {report.reason}
                      </span>
                    </td>

                    {/* Message Excerpt */}
                    <td className="py-3 px-4">
                      <p className="text-[#52525B] truncate max-w-[220px] font-mono text-[12px]">
                        "{report.message_snapshot?.body || ''}"
                      </p>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-[#71717A] text-[12px] whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReport(report);
                        }}
                        className="px-3 py-1 text-[12px] font-semibold text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MessageReportsTable;
