import React from 'react';
import {
  CheckSquare,
  Clock,
  CheckCircle2,
  Calendar,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DashboardKpiRow({
  total = 0,
  pending = 0,
  completed = 0,
  completionRate = 0,
  fromDate = '',
  toDate = '',
  onFromDateChange,
  onToDateChange,
  onResetDateFilter,
  activePreset = 'all',
  onPresetChange,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 font-['Inter']"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. Total Tasks Card */}
      <div
        onClick={() => navigate('/tasks')}
        className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group min-h-[160px]"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
              TOTAL TASKS
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            {total}
          </h3>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
          <span>View all deliverables</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 2. Pending Tasks Card */}
      <div
        onClick={() => navigate('/tasks?status=in_progress')}
        className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group min-h-[160px]"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-700">
              PENDING TASKS
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 flex-shrink-0 group-hover:scale-105 transition-transform">
              <Clock className="w-4.5 h-4.5" />
            </div>
          </div>
          <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mt-2 tracking-tight">
            {pending}
          </h3>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
          <span>Active queue in progress</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 3. Completed Tasks Card */}
      <div
        onClick={() => navigate('/tasks?status=completed')}
        className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group min-h-[160px]"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
              COMPLETED TASKS
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {completed}
            </h3>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/80">
              {completionRate}% Done
            </span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
          <span>Finished milestones</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 4. Task Duration Period Filter Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-2 min-h-[160px]">
        <div>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Duration Period</span>
            </span>
            {(fromDate || toDate || activePreset !== 'all') && (
              <button
                type="button"
                onClick={onResetDateFilter}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-0.5 cursor-pointer"
                title="Clear date filter"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-4 gap-1 mt-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange?.(p.id)}
                className={`py-1 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer text-center ${
                  activePreset === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* From / To Date Inputs */}
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <div>
              <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => onFromDateChange?.(e.target.value)}
                className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>
            <div>
              <label className="text-[9px] font-extrabold uppercase text-slate-400 block mb-0.5">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => onToDateChange?.(e.target.value)}
                className="w-full px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
