import React, { useState } from 'react';
import { SlidersHorizontal, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';

export function PreferencesSettingsPanel() {
  const [startupView, setStartupView] = useState('dashboard');
  const [defaultTaskView, setDefaultTaskView] = useState('list');
  const [autoRefresh, setAutoRefresh] = useState('realtime');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 400);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 sm:p-8 shadow-none flex-1 min-w-0 font-['Inter']">
      <div className="text-[11px] sm:text-[12px] font-semibold text-[#71717A] uppercase tracking-wider mb-2">
        PREFERENCES
      </div>

      <div className="mb-6">
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#18181B] tracking-tight">
          Workspace Behavior Preferences
        </h2>
        <p className="text-[13px] text-[#52525B] mt-1">
          Configure default views and workspace behaviors for your account.
        </p>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-[8px] text-[12.5px] text-[#065F46] font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>Workspace preferences saved successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* Default Startup View */}
          <div>
            <label className="block text-[12.5px] font-medium text-[#18181B] mb-1.5">
              Default Landing Screen
            </label>
            <div className="relative">
              <select
                value={startupView}
                onChange={(e) => setStartupView(e.target.value)}
                className="w-full h-[42px] pl-3.5 pr-9 text-[13.5px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[#18181B] outline-none transition-colors appearance-none cursor-pointer font-medium"
              >
                <option value="dashboard">Dashboard (Hub)</option>
                <option value="my-tasks">My Tasks</option>
                <option value="all-tasks">All Tasks Workspace</option>
                <option value="inbox">Requests & Inbox</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Default Task View Mode */}
          <div>
            <label className="block text-[12.5px] font-medium text-[#18181B] mb-1.5">
              Default Task View Mode
            </label>
            <div className="relative">
              <select
                value={defaultTaskView}
                onChange={(e) => setDefaultTaskView(e.target.value)}
                className="w-full h-[42px] pl-3.5 pr-9 text-[13.5px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[#18181B] outline-none transition-colors appearance-none cursor-pointer font-medium"
              >
                <option value="list">List View (Compact Rows)</option>
                <option value="board">Kanban Board (Columns)</option>
                <option value="calendar">Calendar View (Timeline)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Realtime Data Sync */}
          <div className="md:col-span-2">
            <label className="block text-[12.5px] font-medium text-[#18181B] mb-1.5">
              Live Data Sync Policy
            </label>
            <div className="relative">
              <select
                value={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.value)}
                className="w-full h-[42px] pl-3.5 pr-9 text-[13.5px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[#18181B] outline-none transition-colors appearance-none cursor-pointer font-medium"
              >
                <option value="realtime">Real-time (Instant WebSocket updates)</option>
                <option value="5min">Periodic (Every 5 minutes)</option>
                <option value="manual">Manual Refresh only</option>
              </select>
              <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] pt-6 flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="h-[40px] px-5 text-[13px] font-medium text-white bg-[#059669] hover:bg-[#047857] rounded-[8px] cursor-pointer transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-none"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Preferences</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
