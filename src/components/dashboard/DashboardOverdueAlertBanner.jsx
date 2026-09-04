import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ChevronRight, ChevronLeft, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateUtils';

const SNOOZE_24_HOURS_MS = 24 * 60 * 60 * 1000; // 24 Hours in Milliseconds

export function DashboardOverdueAlertBanner({ overdueTasks = [] }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);

  const storageKey = currentUser?.id
    ? `upcomm_overdue_dismissed_${currentUser.id}`
    : 'upcomm_overdue_dismissed_guest';

  // State to trigger re-render when dismissed
  const [dismissedMapState, setDismissedMapState] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      return {};
    }
  });

  // Calculate how many days have passed after the due date
  const getDaysOverdue = (dueDateStr) => {
    if (!dueDateStr) return 1;
    try {
      const due = new Date(dueDateStr);
      if (isNaN(due.getTime())) return 1;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - due.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch (e) {
      return 1;
    }
  };

  // Filter tasks: if a task was dismissed within the last 24 hours, hide it. If 24 hours have passed, show it again.
  const activeOverdueTasks = useMemo(() => {
    const now = Date.now();
    return (overdueTasks || []).filter((task) => {
      const dismissedTimestamp = dismissedMapState[task.id];
      if (!dismissedTimestamp) return true; // Never dismissed -> show
      // If 24 hours have elapsed since dismissal -> show again!
      if (now - dismissedTimestamp >= SNOOZE_24_HOURS_MS) {
        return true;
      }
      return false; // Snoozed within 24h
    });
  }, [overdueTasks, dismissedMapState]);

  if (!activeOverdueTasks || activeOverdueTasks.length === 0) {
    return null;
  }

  const safeIndex = currentIndex >= activeOverdueTasks.length ? 0 : currentIndex;
  const currentTask = activeOverdueTasks[safeIndex] || activeOverdueTasks[0];
  const daysPassed = getDaysOverdue(currentTask?.due_date);

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % activeOverdueTasks.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + activeOverdueTasks.length) % activeOverdueTasks.length);
  };

  // Record dismissal timestamp for current task (or all active tasks)
  const handleDismiss = (e) => {
    if (e) e.stopPropagation();
    try {
      const now = Date.now();
      const updatedMap = { ...dismissedMapState };

      // Record timestamp for the current task so it snoozes for 24h
      if (currentTask?.id) {
        updatedMap[currentTask.id] = now;
      } else {
        activeOverdueTasks.forEach((t) => {
          updatedMap[t.id] = now;
        });
      }

      localStorage.setItem(storageKey, JSON.stringify(updatedMap));
      setDismissedMapState(updatedMap);
    } catch (err) {
      console.warn('Failed to save overdue dismiss timestamp:', err);
    }
  };

  return (
    <div
      className="bg-rose-50 border border-rose-200/90 rounded-2xl px-3.5 sm:px-5 py-2 sm:py-2.5 shadow-2xs text-rose-900 font-['Inter'] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 animate-fade-in transition-all"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Left & Middle: Icon + Badge + Task Info */}
      <div
        onClick={() => navigate(`/tasks/${currentTask.id}`)}
        className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
      >
        {/* Left Overdue Pill Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-600 text-white font-extrabold text-[10px] sm:text-[11px] shadow-2xs flex-shrink-0">
          <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="uppercase tracking-wider">Overdue</span>
          {activeOverdueTasks.length > 1 && (
            <span className="bg-rose-700/90 px-1.5 py-0.2 rounded-md text-[9px] font-mono">
              {safeIndex + 1}/{activeOverdueTasks.length}
            </span>
          )}
        </div>

        {/* Task Number & Title & Overdue Stats */}
        <div className="flex items-center gap-2 min-w-0 flex-1 text-xs overflow-hidden">
          <span className="px-1.5 py-0.5 rounded-md bg-white border border-rose-200 text-rose-800 font-mono font-bold text-[10px] sm:text-xs flex-shrink-0">
            {currentTask.task_number || 'TASK'}
          </span>

          <span className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors truncate max-w-[200px] sm:max-w-md">
            {currentTask.title}
          </span>

          <span className="hidden md:inline-flex items-center gap-1.5 text-rose-700 text-[11px] font-medium flex-shrink-0">
            <span>•</span>
            <span>Due: <strong className="font-bold font-mono">{formatDate(currentTask.due_date)}</strong></span>
            <span>•</span>
            <span className="font-extrabold text-rose-800 bg-rose-100/90 px-2 py-0.2 rounded-full">
              {daysPassed} {daysPassed === 1 ? 'day' : 'days'} overdue
            </span>
          </span>
        </div>
      </div>

      {/* Mobile visible sub-info */}
      <div className="flex md:hidden items-center gap-2 text-[11px] text-rose-700 font-medium pl-1">
        <span>Due: <strong className="font-bold font-mono">{formatDate(currentTask.due_date)}</strong></span>
        <span>•</span>
        <span className="font-extrabold text-rose-800 bg-rose-100/90 px-2 py-0.2 rounded-full">
          {daysPassed} {daysPassed === 1 ? 'day' : 'days'} overdue
        </span>
      </div>

      {/* Right: Controls & CTA */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-2 flex-shrink-0 self-end sm:self-auto">
        {/* Next / Previous if multiple */}
        {activeOverdueTasks.length > 1 && (
          <div className="flex items-center gap-0.5 bg-white rounded-xl border border-rose-200 p-0.5">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg hover:bg-rose-50 text-rose-700 transition-colors cursor-pointer"
              title="Previous overdue task"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg hover:bg-rose-50 text-rose-700 transition-colors cursor-pointer"
              title="Next overdue task"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* View Link Button */}
        <button
          type="button"
          onClick={() => navigate(`/tasks/${currentTask.id}`)}
          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
        >
          <span>Resolve</span>
          <ArrowRight className="w-3 h-3" />
        </button>

        {/* Dismiss Button with 24h Timestamp Snooze */}
        <button
          type="button"
          onClick={handleDismiss}
          className="p-1 text-rose-400 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
          title="Dismiss alert for 24 hours"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
