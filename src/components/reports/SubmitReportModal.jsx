import React, { useState, useRef, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { formatDateTime } from '../../utils/dateUtils';
import {
  FileText,
  UploadCloud,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Building2,
  AlertCircle,
  X,
  Loader2,
  Lock,
} from 'lucide-react';

export function SubmitReportModal({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const { departments, uploadReportFile, submitReport } = useAppData();

  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fixed current submission timestamp
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date().toISOString());

  useEffect(() => {
    if (isOpen) {
      setCurrentTimestamp(new Date().toISOString());
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setErrorMessage('');
      setSuccessMessage('');

      // Auto-set department for HOD
      if (currentUser?.department_id) {
        setDepartmentId(currentUser.department_id);
      } else if (departments.length > 0) {
        setDepartmentId(departments[0].id);
      }
    }
  }, [isOpen, currentUser, departments]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit. Please choose a smaller file.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 25MB limit. Please choose a smaller file.');
      return;
    }

    setErrorMessage('');
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter a report title.');
      return;
    }

    if (!selectedFile) {
      setErrorMessage('Please attach a report file (PDF, Word, Excel, Text, or Image).');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload file to Supabase Storage reports bucket
      const uploadedInfo = await uploadReportFile(selectedFile);
      if (!uploadedInfo) {
        throw new Error('Failed to upload attachment file.');
      }

      // 2. Submit report to database
      await submitReport({
        title: title.trim(),
        description: description.trim(),
        department_id: departmentId || null,
        file_url: uploadedInfo.file_url,
        file_name: uploadedInfo.file_name,
        file_type: uploadedInfo.file_type,
        file_size: uploadedInfo.file_size,
      });

      setSuccessMessage('Report submitted successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Report submission error:', err);
      setErrorMessage(err.message || 'Failed to submit report. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Department Report">
      {successMessage ? (
        <div className="text-center py-8 space-y-3 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
          <h4 className="text-lg font-bold text-slate-900">{successMessage}</h4>
          <p className="text-xs text-slate-500">
            The document has been securely uploaded and linked to your department.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Report Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Report Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q3 Weekly Performance Audit & Deliverables Summary"
              className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2. Department */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Department *
              </label>
              {currentUser?.role === 'hod' && currentUser.department_id ? (
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={`${departments.find((d) => d.id === currentUser.department_id)?.name || 'My'} Department`}
                    className="w-full px-3.5 py-2 text-xs bg-slate-100/90 border border-slate-200 rounded-xl text-slate-600 font-semibold cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              ) : (
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="">-- General / Executive Management --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} Department
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Submission Date & Time */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Submission Date & Time
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled
                  readOnly
                  value={formatDateTime(currentTimestamp)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100/90 border border-slate-200 rounded-xl text-slate-600 font-bold cursor-not-allowed shadow-2xs select-none"
                />
                <Clock className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4. Description / Executive Briefing */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Brief Summary / Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief summary or notes regarding this submission..."
              className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900 transition-all resize-none"
            />
          </div>

          {/* 5. File Upload Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attach Report Document *
            </label>

            {selectedFile ? (
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="p-2 bg-emerald-600 text-white rounded-xl flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                    <p className="text-[11px] text-emerald-700 font-medium">
                      {formatSize(selectedFile.size)} • {selectedFile.name.split('.').pop()?.toUpperCase()} Document
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  disabled={isSubmitting}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
              >
                <UploadCloud className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Click to browse or drag & drop your report file here
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Supports PDF, DOC, DOCX, XLS, XLSX, CSV, TXT, PNG, JPG (Max 25MB)
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg,.webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              icon={isSubmitting ? Loader2 : UploadCloud}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Uploading to Supabase...' : 'Submit Report'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
