import React from 'react';
import {
  FileText,
  ArrowRight,
  Plus,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

export function DashboardReportsCard({
  reports = [],
  departments = [],
}) {
  const navigate = useNavigate();

  // Map departments
  const deptMap = React.useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d && d.id) map[d.id] = d;
    });
    return map;
  }, [departments]);

  // Recent reports
  const recentReports = React.useMemo(() => {
    return (reports || []).slice(0, 6);
  }, [reports]);

  const getFileIcon = (fileType) => {
    const type = (fileType || '').toUpperCase();
    if (type === 'PDF') return <FileText className="w-3.5 h-3.5 text-rose-500" />;
    if (['XLS', 'XLSX', 'CSV'].includes(type))
      return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />;
    if (['PNG', 'JPG', 'JPEG'].includes(type))
      return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
    return <FileCode className="w-3.5 h-3.5 text-indigo-500" />;
  };

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs font-['Inter'] p-5 sm:p-6"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">
              Recent Department Reports
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Department submissions & audit files
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="hidden sm:flex px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Submit Report</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer pl-1"
          >
            <span>View All ({reports.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      {recentReports.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 rounded-2xl border border-slate-100 px-3">
          <FileText className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-700">No Reports Submitted</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Latest submitted department reports and attachments will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {recentReports.map((r) => {
            const dept = deptMap[r.department_id];

            return (
              <div
                key={r.id}
                onClick={() => navigate('/reports')}
                className="p-3.5 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/40 border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer space-y-2 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white border border-slate-200 flex-shrink-0">
                      {getFileIcon(r.file_type)}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                      {r.title || r.name || 'Department Report'}
                    </h4>
                  </div>

                  <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-700 flex-shrink-0">
                    {r.file_type || 'DOC'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-slate-500 pt-1 border-t border-slate-100/80">
                  <span className="truncate text-slate-600 font-medium">
                    {dept ? dept.name : 'General Department'}
                  </span>
                  <span className="text-slate-400 flex-shrink-0">
                    {r.created_at ? formatDate(r.created_at) : 'Recent'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
