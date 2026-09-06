import React from 'react';

export function SettingsPageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse font-sans">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>

      {/* Card skeleton */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <div className="h-6 w-40 bg-slate-200 dark:bg-slate-800 rounded-md" />
          <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
        </div>

        <div className="space-y-4 pt-4">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-10 w-full max-w-md bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
        </div>

        <div className="space-y-4 pt-4">
          <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60 flex justify-end">
          <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
