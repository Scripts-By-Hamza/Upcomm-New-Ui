import React from 'react';
import { Avatar } from '../common/Avatar';
import { formatDateTime } from '../../utils/dateUtils';
import {
  FileText,
  Download,
  ExternalLink,
  Trash2,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  File,
  Calendar,
  Clock,
  Building2,
  Briefcase,
  User,
} from 'lucide-react';

export function ReportCard({ report, department, currentUser, onDelete }) {
  const isAuthor = currentUser?.id === report.submitted_by;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'it_support_admin';
  const canDelete = isAuthor || isAdmin;

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return 'Document';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file type badge & icon
  const getFileTypeDetails = (ext) => {
    const cleanExt = (ext || '').toUpperCase();
    if (['PDF'].includes(cleanExt)) {
      return {
        label: 'PDF',
        icon: FileText,
        color: 'bg-rose-50 text-rose-700 border-rose-200',
        badgeColor: 'bg-rose-600 text-white',
      };
    }
    if (['XLS', 'XLSX', 'CSV'].includes(cleanExt)) {
      return {
        label: 'EXCEL',
        icon: FileSpreadsheet,
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        badgeColor: 'bg-emerald-600 text-white',
      };
    }
    if (['DOC', 'DOCX'].includes(cleanExt)) {
      return {
        label: 'WORD',
        icon: FileText,
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeColor: 'bg-blue-600 text-white',
      };
    }
    if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'SVG'].includes(cleanExt)) {
      return {
        label: 'IMAGE',
        icon: ImageIcon,
        color: 'bg-purple-50 text-purple-700 border-purple-200',
        badgeColor: 'bg-purple-600 text-white',
      };
    }
    return {
      label: cleanExt || 'FILE',
      icon: File,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      badgeColor: 'bg-slate-700 text-white',
    };
  };

  const fileInfo = getFileTypeDetails(report.file_type);
  const FileIcon = fileInfo.icon;

  const handleDownload = () => {
    if (!report.file_url) return;
    const a = document.createElement('a');
    a.href = report.file_url;
    a.download = report.file_name || 'report-download';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between font-['Inter'] group" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Card Header */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className={`p-2.5 rounded-2xl border ${fileInfo.color} shadow-2xs`}>
              <FileIcon className="w-5 h-5" />
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase ${fileInfo.badgeColor}`}>
              {fileInfo.label}
            </span>
          </div>

          {canDelete && (
            <button
              onClick={() => onDelete(report.id)}
              className="text-slate-300 hover:text-rose-600 p-1.5 rounded-xl hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
              title="Delete report"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-[15px] font-bold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors line-clamp-2">
            {report.title}
          </h3>
          {report.description && (
            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
              {report.description}
            </p>
          )}
        </div>

        {/* Author / HOD Profile */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={report.author_name} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {report.author_name}
              </p>
              <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <span>{report.author_role === 'admin' ? 'Administrator' : report.author_role === 'it_support_admin' ? 'IT Support Admin' : 'Head of Department'}</span>
              </p>
            </div>
          </div>

          {department && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border max-w-[130px] truncate shadow-2xs"
              style={{
                backgroundColor: `${department.color || '#10b981'}15`,
                color: department.color || '#10b981',
                borderColor: `${department.color || '#10b981'}35`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: department.color || '#10b981' }} />
              <span className="truncate">{department.name || 'Department'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Footer: Metadata & Actions */}
      <div className="px-5 py-3.5 sm:px-6 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
        {/* Date & Time */}
        <div className="space-y-0.5">
          <p className="text-[10px] uppercase font-bold text-slate-400">Submission Date & Time</p>
          <p className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>{formatDateTime(report.created_at)}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {report.file_url && (
            <a
              href={report.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors shadow-2xs"
              title="Open / Preview in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs hover:shadow-sm cursor-pointer"
            title={`Download ${report.file_name || 'report'}`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>
    </div>
  );
}
