import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../../../contexts/AppDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Avatar } from '../../common/Avatar';
import {
  CANONICAL_CSV_HEADERS,
  downloadCsvTemplate,
  parseAndValidateCsvFile,
} from '../../../utils/tasks/csvTaskImport';
import {
  X,
  FileUp,
  FileSpreadsheet,
  Download,
  CircleHelp,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  Trash2,
  RefreshCw,
  ArrowRight,
  Users,
  Paperclip,
  Calendar,
  Flag,
  ShieldCheck,
} from 'lucide-react';

export function ImportTaskDialog({ isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const { createTask, departments = [] } = useAppData();
  const { currentUser, users = [] } = useAuth();

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseResult, setParseResult] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Import execution states
  const [importStatus, setImportStatus] = useState('idle'); // 'idle' | 'importing' | 'completed' | 'partial_failure'
  const [progress, setProgress] = useState({ current: 0, total: 0, percent: 0 });
  const [rowResults, setRowResults] = useState({}); // { [rowNumber]: { status: 'success'|'failed', error?: string, task?: object } }

  const fileInputRef = useRef(null);
  const helpRef = useRef(null);

  // Reset dialog state
  const handleReset = useCallback(() => {
    setFile(null);
    setIsParsing(false);
    setParseResult(null);
    setExpandedRow(null);
    setIsHelpOpen(false);
    setImportStatus('idle');
    setProgress({ current: 0, total: 0, percent: 0 });
    setRowResults({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Close help on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (helpRef.current && !helpRef.current.contains(e.target)) {
        setIsHelpOpen(false);
      }
    }
    if (isHelpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isHelpOpen]);

  // Handle file parsing
  const handleProcessFile = useCallback(
    async (selectedFile) => {
      if (!selectedFile) return;
      setFile(selectedFile);
      setIsParsing(true);
      setImportStatus('idle');
      setRowResults({});

      try {
        const result = await parseAndValidateCsvFile(
          selectedFile,
          users,
          currentUser,
          departments
        );
        setParseResult(result);
      } catch (err) {
        setParseResult({
          fileError: err?.message || 'Failed to parse CSV file.',
          rows: [],
          totalRows: 0,
          readyCount: 0,
          errorCount: 0,
          warningCount: 0,
        });
      } finally {
        setIsParsing(false);
      }
    },
    [users, currentUser, departments]
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (importStatus === 'importing') return;
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleProcessFile(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleProcessFile(selectedFile);
    }
  };

  // Concurrency-controlled bulk creation
  const executeBatchImport = async (rowsToImport) => {
    if (!rowsToImport || rowsToImport.length === 0) return;
    setImportStatus('importing');

    const total = rowsToImport.length;
    let completedCount = 0;
    const updatedResults = { ...rowResults };

    const CONCURRENCY_LIMIT = 5;
    const queue = [...rowsToImport];

    const worker = async () => {
      while (queue.length > 0) {
        const row = queue.shift();
        if (!row) continue;

        try {
          const createdTask = await createTask(row.taskData);
          updatedResults[row.rowNumber] = {
            status: 'success',
            task: createdTask,
          };
        } catch (err) {
          console.error(`Error importing row ${row.rowNumber}:`, err);
          updatedResults[row.rowNumber] = {
            status: 'failed',
            error: err?.message || 'Failed to create task in database.',
          };
        }

        completedCount += 1;
        setProgress({
          current: completedCount,
          total,
          percent: Math.round((completedCount / total) * 100),
        });
        setRowResults({ ...updatedResults });
      }
    };

    const workers = Array.from(
      { length: Math.min(CONCURRENCY_LIMIT, queue.length) },
      () => worker()
    );

    await Promise.all(workers);

    const hasFailures = Object.values(updatedResults).some((r) => r.status === 'failed');
    if (hasFailures) {
      setImportStatus('partial_failure');
    } else {
      setImportStatus('completed');
    }
  };

  const handleStartImport = () => {
    if (!parseResult || parseResult.errorCount > 0) return;
    const validRows = parseResult.rows.filter((r) => r.isValid);
    executeBatchImport(validRows);
  };

  const handleRetryFailed = () => {
    if (!parseResult) return;
    const failedRows = parseResult.rows.filter(
      (r) => rowResults[r.rowNumber]?.status === 'failed'
    );
    executeBatchImport(failedRows);
  };

  const role = currentUser?.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';

  if (!isOpen || !isAdmin) return null;

  const totalRows = parseResult?.totalRows || 0;
  const readyCount = parseResult?.readyCount || 0;
  const errorCount = parseResult?.errorCount || 0;
  const warningCount = parseResult?.warningCount || 0;
  const isImportDisabled =
    !parseResult ||
    parseResult.fileError ||
    errorCount > 0 ||
    totalRows === 0 ||
    importStatus === 'importing';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in font-['Inter'] select-none"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto text-[12.5px]">
        {/* 1. Dialog Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between bg-white dark:bg-[#18181B] flex-shrink-0 relative">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[8px] bg-[#ECFDF5] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#059669] flex-shrink-0">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-[#18181B] dark:text-[#F4F4F5] tracking-tight">
                Import Tasks from CSV
              </h2>
              <p className="text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                Upload a CSV file to create multiple UPCOMM tasks at once.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Help Icon Button with Popover */}
            <div className="relative" ref={helpRef}>
              <button
                type="button"
                onClick={() => setIsHelpOpen((p) => !p)}
                className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                  isHelpOpen
                    ? 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#18181B] dark:text-white'
                    : 'text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#27272A]'
                }`}
                aria-label="CSV Import Guide"
                title="CSV Import Guide"
              >
                <CircleHelp className="w-4 h-4" />
              </button>

              {/* Help Popover */}
              {isHelpOpen && (
                <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[460px] bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-2xl p-4 z-50 text-left space-y-3 animate-fade-in text-[12px] max-h-[75vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#27272A] pb-2.5">
                    <div>
                      <h4 className="font-bold text-[#18181B] dark:text-white text-[13px]">
                        CSV Import Guide
                      </h4>
                      <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                        Required and optional columns formatted for bulk creation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsHelpOpen(false)}
                      className="p-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-white rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <span className="font-semibold text-[#18181B] dark:text-white block">
                        1. Required Fields (*)
                      </span>
                      <p className="text-[#52525B] dark:text-[#D4D4D8] text-[11.5px] mt-0.5">
                        <span className="font-medium text-[#DC2626]">* Task title</span>,{' '}
                        <span className="font-medium text-[#DC2626]">* Assignee</span>, and{' '}
                        <span className="font-medium text-[#DC2626]">* Start Date</span> are required.
                        Optional fields may be left blank.
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-[#18181B] dark:text-white block">
                        2. Assignees & Assistants (First Name / Unique ID or Email)
                      </span>
                      <p className="text-[#52525B] dark:text-[#D4D4D8] text-[11.5px] mt-0.5">
                        Use user's <span className="font-semibold text-[#059669]">Unique ID / First Name</span> (e.g. <code className="px-1 py-0.5 bg-[#ECFDF5] text-[#059669] rounded font-mono font-bold">Ahmed</code>, <code className="px-1 py-0.5 bg-[#ECFDF5] text-[#059669] rounded font-mono font-bold">Ahsan</code>, <code className="px-1 py-0.5 bg-[#ECFDF5] text-[#059669] rounded font-mono font-bold">Hamza</code>) or work email. For multiple users, separate with pipe (<code className="px-1 py-0.5 bg-[#F4F4F5] dark:bg-[#27272A] rounded font-mono font-bold text-[#059669]">|</code>).
                      </p>
                      <div className="mt-1 p-2 bg-[#F9FAFB] dark:bg-[#121214] rounded-[6px] border border-[#E5E7EB] dark:border-[#27272A] font-mono text-[11px] text-[#18181B] dark:text-[#F4F4F5] truncate">
                        Ahmed|Ahsan <span className="text-[#71717A] dark:text-[#A1A1AA]">(or ahmadbinazeem007@gmail.com|ahsanishfaq2019@gmail.com)</span>
                      </div>
                    </div>

                    <div>
                      <span className="font-semibold text-[#18181B] dark:text-white block">
                        3. Dates
                      </span>
                      <p className="text-[#52525B] dark:text-[#D4D4D8] text-[11.5px] mt-0.5">
                        Use <span className="font-mono font-semibold">YYYY-MM-DD</span> format (e.g. <code>2026-09-05</code>). Due Date is optional, but if provided must be on or after Start Date.
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-[#18181B] dark:text-white block">
                        4. Priority & Status
                      </span>
                      <p className="text-[#52525B] dark:text-[#D4D4D8] text-[11.5px] mt-0.5">
                        • Priority: <code className="text-[#2563EB]">Urgent</code>, <code className="text-[#2563EB]">High</code>, <code className="text-[#2563EB]">Medium</code> (default), <code className="text-[#2563EB]">Low</code>.
                        <br />
                        • Status: <code className="text-[#059669]">Pending</code> (default), <code className="text-[#059669]">In Progress</code>. Completed status cannot be imported directly.
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-[#18181B] dark:text-white block">
                        5. Attachments
                      </span>
                      <p className="text-[#52525B] dark:text-[#D4D4D8] text-[11.5px] mt-0.5">
                        CSV files cannot embed local computer files. Add <span className="font-semibold">HTTPS links</span> separated by <code className="px-1 py-0.5 bg-[#F4F4F5] dark:bg-[#27272A] rounded font-mono font-bold text-[#059669]">|</code>.
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-[#18181B] dark:text-white block">
                        6. Sample CSV
                      </span>
                      <div className="mt-1 p-2 bg-[#18181B] text-slate-200 rounded-[6px] font-mono text-[10.5px] overflow-x-auto whitespace-pre leading-relaxed">
{`Task title*,Description,Assignee*,Assistant Users,Priority,Status,Start Date*,Due Date,Attachments
"Redesign homepage","Mobile QA","Ahmed|Ahsan","Hamza","High","In Progress","2026-09-05","2026-09-15","https://example.com/mock.png"
"Research suppliers","","Zeeshan","","Medium","Pending","2026-09-06","",""`}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#27272A]">
                    <button
                      type="button"
                      onClick={() => {
                        downloadCsvTemplate();
                        setIsHelpOpen(false);
                      }}
                      className="w-full py-1.5 px-3 rounded-[6px] bg-[#059669] hover:bg-[#047857] text-white font-semibold text-[11.5px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Sample Template</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                if (importStatus === 'importing') {
                  if (window.confirm('Import is currently running. Are you sure you want to close?')) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white rounded-[6px] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Dialog Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* A. SUCCESS STATE VIEW */}
          {importStatus === 'completed' ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#ECFDF5] dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-[#059669]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[#18181B] dark:text-white">
                  {totalRows} {totalRows === 1 ? 'Task' : 'Tasks'} Imported Successfully
                </h3>
                <p className="text-[12.5px] text-[#71717A] dark:text-[#A1A1AA] max-w-md mx-auto">
                  All tasks have been created as normal UPCOMM tasks and notifications have been delivered to assigned members.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-[8px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12.5px] font-semibold text-[#18181B] dark:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                >
                  Import Another CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSuccess) {
                      onSuccess();
                    } else {
                      navigate('/tasks');
                    }
                  }}
                  className="px-5 py-2 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-white text-[12.5px] font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>View Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* B. FILE UPLOAD & DROPZONE */}
              {!file ? (
                <div className="space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[10px] p-8 text-center transition-all cursor-pointer select-none ${
                      isDragging
                        ? 'border-[#059669] bg-[#ECFDF5]/60 dark:bg-emerald-950/20'
                        : 'border-[#E5E7EB] dark:border-[#3F3F46] hover:border-[#059669] bg-[#FAFAFA] dark:bg-[#121214] hover:bg-white dark:hover:bg-[#18181B]'
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".csv,text/csv"
                      className="hidden"
                    />
                    <FileSpreadsheet className="w-10 h-10 text-[#059669] mx-auto mb-2" />
                    <p className="text-[13px] font-bold text-[#18181B] dark:text-white">
                      Drop your CSV file here or <span className="text-[#059669] underline">Browse</span>
                    </p>
                    <p className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA] mt-1">
                      Supports .csv files formatted according to canonical headers
                    </p>
                  </div>

                  {/* Template download link */}
                  <div className="flex items-center justify-between px-1 text-[12px]">
                    <span className="text-[#71717A] dark:text-[#A1A1AA]">Need a ready-made format?</span>
                    <button
                      type="button"
                      onClick={() => downloadCsvTemplate()}
                      className="inline-flex items-center gap-1 font-semibold text-[#059669] hover:text-[#047857] transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download CSV Template</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Selected file banner */
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-[#F8F9FA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#27272A] rounded-[8px]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className="w-5 h-5 text-[#059669] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-[#18181B] dark:text-white text-[12.5px] truncate">
                          {file.name}
                        </p>
                        <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] font-mono">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    {importStatus !== 'importing' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-[6px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[11.5px] font-medium text-[#18181B] dark:text-white hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                        >
                          Replace File
                        </button>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="p-1 text-[#71717A] hover:text-[#DC2626] rounded cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".csv,text/csv"
                      className="hidden"
                    />
                  </div>

                  {/* C. PARSING LOADING STATE */}
                  {isParsing && (
                    <div className="p-6 text-center space-y-2">
                      <Loader2 className="w-6 h-6 text-[#059669] animate-spin mx-auto" />
                      <p className="text-[12.5px] font-medium text-[#18181B] dark:text-white">
                        Parsing and validating CSV tasks...
                      </p>
                    </div>
                  )}

                  {/* D. FILE-LEVEL ERROR */}
                  {parseResult?.fileError && (
                    <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-[8px] flex items-center gap-2 text-[#DC2626] dark:text-red-300 text-[12px] font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{parseResult.fileError}</span>
                    </div>
                  )}

                  {/* E. VALIDATION SUMMARY CHIPS */}
                  {!isParsing && parseResult && !parseResult.fileError && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-[#FAFBFB] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A]">
                        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#18181B] dark:text-white">
                          <span>{totalRows} {totalRows === 1 ? 'row' : 'rows'} detected</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11.5px] font-semibold bg-[#ECFDF5] text-[#059669] dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{readyCount} Ready</span>
                          </span>

                          {errorCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11.5px] font-semibold bg-red-50 text-[#DC2626] dark:bg-red-950/40 border border-red-200 dark:border-red-900">
                              <AlertCircle className="w-3 h-3" />
                              <span>{errorCount} Need Attention</span>
                            </span>
                          )}

                          {warningCount > 0 && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11.5px] font-semibold bg-amber-50 text-[#D97706] dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900">
                              <AlertTriangle className="w-3 h-3" />
                              <span>{warningCount} Warning</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* F. IMPORT PROGRESS BAR (ACTIVE IMPORT) */}
                      {importStatus === 'importing' && (
                        <div className="p-4 bg-[#F8F9FA] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] space-y-2">
                          <div className="flex items-center justify-between text-[12px] font-medium text-[#18181B] dark:text-white">
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#059669]" />
                              <span>Importing tasks into database...</span>
                            </span>
                            <span className="font-mono font-bold text-[#059669]">
                              {progress.current} of {progress.total} ({progress.percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#E5E7EB] dark:bg-[#27272A] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#059669] transition-all duration-200 rounded-full"
                              style={{ width: `${progress.percent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* G. PARTIAL FAILURE SUMMARY BANNER */}
                      {importStatus === 'partial_failure' && (
                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-[8px] flex items-center justify-between gap-3 text-[12px]">
                          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
                            <AlertCircle className="w-4 h-4 text-[#D97706] flex-shrink-0" />
                            <span>Some tasks failed during server creation. Click retry for failed rows.</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRetryFailed}
                            className="px-3 py-1 rounded-[6px] bg-[#D97706] hover:bg-amber-700 text-white font-semibold text-[11.5px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs flex-shrink-0"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Retry Failed</span>
                          </button>
                        </div>
                      )}

                      {/* H. PREVIEW CARD LIST */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11.5px] font-semibold text-[#71717A] dark:text-[#A1A1AA] px-1">
                          <span>TASK PREVIEW & RESOLUTION</span>
                          <span>Click row for details</span>
                        </div>

                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                          {parseResult.rows.map((row) => {
                            const isExpanded = expandedRow === row.rowNumber;
                            const runResult = rowResults[row.rowNumber];

                            return (
                              <div
                                key={row.rowNumber}
                                onClick={() => setExpandedRow(isExpanded ? null : row.rowNumber)}
                                className={`p-3 rounded-[8px] border transition-all cursor-pointer text-left ${
                                  runResult?.status === 'success'
                                    ? 'bg-[#ECFDF5]/50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800'
                                    : runResult?.status === 'failed' || !row.isValid
                                    ? 'bg-red-50/50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                                    : row.hasWarnings
                                    ? 'bg-amber-50/40 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900'
                                    : 'bg-white dark:bg-[#18181B] border-[#E5E7EB] dark:border-[#27272A] hover:border-[#D4D4D8]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-[10.5px] font-bold text-[#71717A] dark:text-[#A1A1AA] bg-[#F4F4F5] dark:bg-[#27272A] px-1.5 py-0.5 rounded">
                                        Row {row.rowNumber}
                                      </span>
                                      <h4 className="font-semibold text-[#18181B] dark:text-white text-[12.5px] truncate">
                                        {row.taskData.title || '(Untitled Task)'}
                                      </h4>
                                    </div>

                                    {/* Assignees and Date summary */}
                                    <div className="flex flex-wrap items-center gap-3 text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                                      {/* Resolved Assignees */}
                                      <div className="flex items-center gap-1.5">
                                        <Users className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                                        {row.resolvedAssignees.length > 0 ? (
                                          <div className="flex items-center gap-1 truncate max-w-[200px]">
                                            <div className="flex -space-x-1.5 overflow-hidden flex-shrink-0">
                                              {row.resolvedAssignees.map((u) => (
                                                <Avatar
                                                  key={u.id}
                                                  src={u.avatar_url}
                                                  name={u.full_name}
                                                  size="xs"
                                                  className="w-4 h-4 border border-white dark:border-[#18181B]"
                                                />
                                              ))}
                                            </div>
                                            <span className="truncate font-medium text-[#18181B] dark:text-white">
                                              {row.resolvedAssignees.map((u) => u.full_name).join(', ')}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="text-red-500 italic">No valid assignee</span>
                                        )}
                                      </div>

                                      {/* Start & Due Date */}
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        <span>
                                          {row.taskData.start_date || '—'}
                                          {row.taskData.due_date ? ` → ${row.taskData.due_date}` : ''}
                                        </span>
                                      </div>

                                      {/* Priority & Status */}
                                      <span className="capitalize font-medium text-[#18181B] dark:text-white bg-[#F4F4F5] dark:bg-[#27272A] px-1.5 py-0.5 rounded text-[10.5px]">
                                        {row.taskData.priority}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Right: Validation / Run Status Badge */}
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {runResult?.status === 'success' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Created</span>
                                      </span>
                                    ) : runResult?.status === 'failed' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold bg-red-50 text-[#DC2626] border border-red-200">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>Failed</span>
                                      </span>
                                    ) : row.isValid ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Ready</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold bg-red-50 text-[#DC2626] border border-red-200">
                                        <AlertCircle className="w-3 h-3" />
                                        <span>{row.errors.length} Error</span>
                                      </span>
                                    )}

                                    <ChevronDown
                                      className={`w-3.5 h-3.5 text-[#71717A] transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                  <div className="mt-3 pt-3 border-t border-[#E5E7EB] dark:border-[#27272A] space-y-2 text-[11.5px] animate-fade-in">
                                    {/* Errors list */}
                                    {row.errors.length > 0 && (
                                      <div className="p-2 bg-red-50 dark:bg-red-950/40 rounded-[6px] text-[#DC2626] dark:text-red-300 space-y-1">
                                        <span className="font-semibold block">Validation Errors:</span>
                                        <ul className="list-disc list-inside space-y-0.5">
                                          {row.errors.map((err, i) => (
                                            <li key={i}>{err}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Warnings list */}
                                    {row.warnings.length > 0 && (
                                      <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-[6px] text-amber-800 dark:text-amber-300 space-y-1">
                                        <span className="font-semibold block">Warnings:</span>
                                        <ul className="list-disc list-inside space-y-0.5">
                                          {row.warnings.map((warn, i) => (
                                            <li key={i}>{warn}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Runtime server failure error */}
                                    {runResult?.error && (
                                      <div className="p-2 bg-red-50 dark:bg-red-950/40 rounded-[6px] text-[#DC2626] dark:text-red-300">
                                        <span className="font-semibold">Server Error:</span> {runResult.error}
                                      </div>
                                    )}

                                    {/* Description */}
                                    {row.taskData.description && (
                                      <div>
                                        <span className="font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                                          Description:
                                        </span>
                                        <p className="text-[#18181B] dark:text-white mt-0.5 whitespace-pre-wrap bg-[#FAFAFA] dark:bg-[#121214] p-2 rounded-[6px]">
                                          {row.taskData.description}
                                        </p>
                                      </div>
                                    )}

                                    {/* Assistants */}
                                    {row.resolvedAssistants.length > 0 && (
                                      <div>
                                        <span className="font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                                          Assistant Users:
                                        </span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                          {row.resolvedAssistants.map((ast) => (
                                            <span
                                              key={ast.id}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F4F4F5] dark:bg-[#27272A] rounded-[5px] text-[11px]"
                                            >
                                              <Avatar src={ast.avatar_url} name={ast.full_name} size="xs" />
                                              <span>{ast.full_name}</span>
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Attachments */}
                                    {row.taskData.attachments.length > 0 && (
                                      <div>
                                        <span className="font-semibold text-[#71717A] dark:text-[#A1A1AA]">
                                          Attachments ({row.taskData.attachments.length}):
                                        </span>
                                        <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[#059669]">
                                          {row.taskData.attachments.map((att, i) => (
                                            <li key={i} className="truncate">
                                              <a
                                                href={att.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="hover:underline"
                                              >
                                                {att.name || att.url}
                                              </a>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* 3. Dialog Footer Actions */}
        {importStatus !== 'completed' && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#FAFBFB] dark:bg-[#121214] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div>
              {errorCount > 0 ? (
                <span className="text-[12px] text-[#DC2626] font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Fix {errorCount} {errorCount === 1 ? 'error' : 'errors'} before importing</span>
                </span>
              ) : readyCount > 0 ? (
                <span className="text-[12px] text-[#059669] font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{readyCount} {readyCount === 1 ? 'task' : 'tasks'} ready to import</span>
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={importStatus === 'importing'}
                className="px-3.5 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12.5px] font-medium text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleStartImport}
                disabled={isImportDisabled}
                className="px-4 py-2 rounded-[7px] bg-[#059669] hover:bg-[#047857] text-white text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-2xs"
              >
                {importStatus === 'importing' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <FileUp className="w-3.5 h-3.5" />
                    <span>
                      {readyCount > 1
                        ? `Import ${readyCount} Tasks`
                        : readyCount === 1
                        ? 'Import 1 Task'
                        : 'Import Tasks'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
