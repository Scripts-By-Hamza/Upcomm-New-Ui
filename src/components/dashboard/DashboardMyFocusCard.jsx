import React, { useState, useEffect, useRef } from 'react';
import { Timer, RotateCcw, Plus, Minus, CheckCircle2, Play } from 'lucide-react';
import { useFocusTimer } from '../../contexts/FocusTimerContext';

export function DashboardMyFocusCard() {
  const {
    status,
    remainingSeconds,
    startTimer,
    addSeconds,
    subtractSeconds,
    resetTimer,
    startAnother,
  } = useFocusTimer();

  // Local duration input state
  const [hours, setHours] = useState('00');
  const [minutes, setMinutes] = useState('25');
  const [seconds, setSeconds] = useState('00');

  const hoursInputRef = useRef(null);
  const minutesInputRef = useRef(null);
  const secondsInputRef = useRef(null);

  // Format seconds into HH:MM:SS or MM:SS
  const formatTimeDisplay = (totalSecs) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const pad = (n) => String(n).padStart(2, '0');

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  };

  const parseNumber = (val, max) => {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    if (!clean) return '';
    const num = Math.min(max, Math.max(0, parseInt(clean, 10)));
    return String(num).padStart(2, '0');
  };

  const handleHoursChange = (e) => {
    const val = parseNumber(e.target.value, 23);
    setHours(val);
  };

  const handleMinutesChange = (e) => {
    const val = parseNumber(e.target.value, 59);
    setMinutes(val);
  };

  const handleSecondsChange = (e) => {
    const val = parseNumber(e.target.value, 59);
    setSeconds(val);
  };

  const handleInputBlur = (type) => {
    if (type === 'hours') setHours((prev) => prev.padStart(2, '0') || '00');
    if (type === 'minutes') setMinutes((prev) => prev.padStart(2, '0') || '00');
    if (type === 'seconds') setSeconds((prev) => prev.padStart(2, '0') || '00');
  };

  const handlePresetSelect = (presetMins) => {
    const h = Math.floor(presetMins / 60);
    const m = presetMins % 60;
    setHours(String(h).padStart(2, '0'));
    setMinutes(String(m).padStart(2, '0'));
    setSeconds('00');
  };

  const totalInputSeconds =
    (parseInt(hours || 0, 10) || 0) * 3600 +
    (parseInt(minutes || 0, 10) || 0) * 60 +
    (parseInt(seconds || 0, 10) || 0);

  const isInputValid = totalInputSeconds > 0;

  const handleStart = (e) => {
    if (e) e.preventDefault();
    if (!isInputValid) return;

    startTimer({
      hours: parseInt(hours || 0, 10) || 0,
      minutes: parseInt(minutes || 0, 10) || 0,
      seconds: parseInt(seconds || 0, 10) || 0,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isInputValid) {
      e.preventDefault();
      handleStart();
    }
  };

  return (
    <div className="bg-white dark:bg-[#181B1F] border border-[#E5E7EB] dark:border-slate-800 rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between transition-colors min-h-[220px]">
      {/* 1. Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/40 text-[#059669] dark:text-emerald-400">
            <Timer className="w-4 h-4" />
          </div>
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B] dark:text-slate-100">
            My Focus
          </h2>
        </div>

        {status === 'idle' && (
          <span className="text-[12px] font-medium text-[#71717A] dark:text-slate-400">
            Set a timer
          </span>
        )}

        {status === 'running' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            In Progress
          </span>
        )}

        {status === 'completed' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-[#059669] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Done
          </span>
        )}
      </div>

      {/* 2. Main Content Body Based on Timer Status */}
      <div className="flex-1 flex flex-col justify-center py-1">
        {/* --- IDLE STATE --- */}
        {status === 'idle' && (
          <form onSubmit={handleStart} className="space-y-4">
            <p className="text-[12.5px] text-[#52525B] dark:text-slate-400 text-center font-normal">
              Set a focus timer and stay on track.
            </p>

            {/* Time Input Segments */}
            <div className="flex items-center justify-center gap-1.5 sm:gap-2.5" onKeyDown={handleKeyDown}>
              {/* Hours */}
              <div className="flex flex-col items-center w-[58px] sm:w-[64px]">
                <input
                  ref={hoursInputRef}
                  type="text"
                  inputMode="numeric"
                  value={hours}
                  onChange={handleHoursChange}
                  onBlur={() => handleInputBlur('hours')}
                  aria-label="Hours"
                  placeholder="00"
                  className="w-full h-[40px] text-center font-bold text-[17px] sm:text-[18px] text-[#18181B] dark:text-white bg-[#F9FAFB] dark:bg-slate-800/70 border border-[#E5E7EB] dark:border-slate-700 rounded-[8px] focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 tabular-nums shadow-none"
                />
                <span className="text-[10px] font-semibold text-[#8B8B95] uppercase tracking-wider mt-1">
                  HH
                </span>
              </div>

              <span className="text-[18px] font-bold text-[#A1A1AA] dark:text-slate-500 pb-4 select-none">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center w-[58px] sm:w-[64px]">
                <input
                  ref={minutesInputRef}
                  type="text"
                  inputMode="numeric"
                  value={minutes}
                  onChange={handleMinutesChange}
                  onBlur={() => handleInputBlur('minutes')}
                  aria-label="Minutes"
                  placeholder="25"
                  className="w-full h-[40px] text-center font-bold text-[17px] sm:text-[18px] text-[#18181B] dark:text-white bg-[#F9FAFB] dark:bg-slate-800/70 border border-[#E5E7EB] dark:border-slate-700 rounded-[8px] focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 tabular-nums shadow-none"
                />
                <span className="text-[10px] font-semibold text-[#8B8B95] uppercase tracking-wider mt-1">
                  MM
                </span>
              </div>

              <span className="text-[18px] font-bold text-[#A1A1AA] dark:text-slate-500 pb-4 select-none">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center w-[58px] sm:w-[64px]">
                <input
                  ref={secondsInputRef}
                  type="text"
                  inputMode="numeric"
                  value={seconds}
                  onChange={handleSecondsChange}
                  onBlur={() => handleInputBlur('seconds')}
                  aria-label="Seconds"
                  placeholder="00"
                  className="w-full h-[40px] text-center font-bold text-[17px] sm:text-[18px] text-[#18181B] dark:text-white bg-[#F9FAFB] dark:bg-slate-800/70 border border-[#E5E7EB] dark:border-slate-700 rounded-[8px] focus:outline-none focus:border-[#059669] focus:ring-2 focus:ring-[#059669]/20 tabular-nums shadow-none"
                />
                <span className="text-[10px] font-semibold text-[#8B8B95] uppercase tracking-wider mt-1">
                  SS
                </span>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center justify-center gap-1.5">
              {[10, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handlePresetSelect(mins)}
                  className="px-2.5 py-1 text-[11.5px] font-medium text-[#52525B] dark:text-slate-300 hover:text-[#18181B] dark:hover:text-white bg-[#F4F4F5] dark:bg-slate-800 hover:bg-[#E4E4E7] dark:hover:bg-slate-700 rounded-[6px] transition-colors cursor-pointer"
                >
                  {mins}m
                </button>
              ))}
            </div>

            {/* Start Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={!isInputValid}
                className="w-full h-[38px] inline-flex items-center justify-center gap-1.5 px-4 bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] disabled:opacity-40 disabled:cursor-not-allowed text-white text-[13.5px] font-semibold rounded-[8px] shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Focus</span>
              </button>
            </div>
          </form>
        )}

        {/* --- RUNNING STATE --- */}
        {status === 'running' && (
          <div className="space-y-4 text-center py-2">
            {/* Countdown Digits */}
            <div
              className="text-[38px] sm:text-[42px] font-extrabold text-[#18181B] dark:text-white tracking-tight tabular-nums leading-none"
              aria-label={`Time remaining: ${formatTimeDisplay(remainingSeconds)}`}
            >
              {formatTimeDisplay(remainingSeconds)}
            </div>

            <p className="text-[12px] text-[#71717A] dark:text-slate-400 font-medium">
              Focus session in progress
            </p>

            {/* Controls: -10s, +10s */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => subtractSeconds(10)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#52525B] dark:text-slate-300 bg-[#F4F4F5] dark:bg-slate-800 hover:bg-[#E4E4E7] dark:hover:bg-slate-700 rounded-[7px] border border-[#E5E7EB] dark:border-slate-700 transition-colors cursor-pointer"
                title="Subtract 10 seconds"
              >
                <Minus className="w-3 h-3 text-[#71717A]" />
                <span>10 sec</span>
              </button>

              <button
                type="button"
                onClick={() => addSeconds(10)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] font-semibold text-[#059669] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-[7px] border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
                title="Add 10 seconds"
              >
                <Plus className="w-3 h-3 text-[#059669] dark:text-emerald-400" />
                <span>10 sec</span>
              </button>
            </div>

            {/* Secondary Reset Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={resetTimer}
                className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#71717A] dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* --- COMPLETED STATE --- */}
        {status === 'completed' && (
          <div className="space-y-4 text-center py-2">
            {/* 00:00 Display */}
            <div className="text-[38px] sm:text-[42px] font-extrabold text-[#059669] dark:text-emerald-400 tracking-tight tabular-nums leading-none">
              00:00
            </div>

            <div className="inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#059669] dark:text-emerald-400" role="status">
              <CheckCircle2 className="w-4 h-4" />
              <span>Focus complete</span>
            </div>

            {/* Start Another Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={startAnother}
                className="w-full h-[38px] inline-flex items-center justify-center gap-1.5 px-4 bg-[#059669] hover:bg-[#047857] active:bg-[#065F46] text-white text-[13.5px] font-semibold rounded-[8px] shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Another</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardMyFocusCard;
