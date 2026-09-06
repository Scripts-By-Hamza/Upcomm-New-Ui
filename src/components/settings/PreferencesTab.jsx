import React, { useState, useEffect } from 'react';
import { Sun, Moon, LayoutList, Kanban, Calendar, CheckCircle2, AlertCircle, Loader2, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function PreferencesTab() {
  const { currentUser, updateCurrentUserPreferences } = useAuth();

  const currentTheme = currentUser?.theme === 'dark' ? 'dark' : 'light';
  const currentDefaultView = ['list', 'board', 'calendar'].includes(currentUser?.task_default_view)
    ? currentUser.task_default_view
    : 'list';

  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [selectedDefaultView, setSelectedDefaultView] = useState(currentDefaultView);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync state when currentUser changes from outside
  useEffect(() => {
    if (!isSaving) {
      setSelectedTheme(currentUser?.theme === 'dark' ? 'dark' : 'light');
      setSelectedDefaultView(
        ['list', 'board', 'calendar'].includes(currentUser?.task_default_view)
          ? currentUser.task_default_view
          : 'list'
      );
    }
  }, [currentUser?.theme, currentUser?.task_default_view, isSaving]);

  // Live theme preview on documentElement
  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const handleReset = () => {
    const origTheme = currentUser?.theme === 'dark' ? 'dark' : 'light';
    setSelectedTheme(origTheme);
    handleThemeSelect(origTheme);
    setSelectedDefaultView(
      ['list', 'board', 'calendar'].includes(currentUser?.task_default_view)
        ? currentUser.task_default_view
        : 'list'
    );
    setErrorMessage('');
    setSuccessMessage('');
  };

  const hasChanges =
    selectedTheme !== currentTheme ||
    selectedDefaultView !== currentDefaultView;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await updateCurrentUserPreferences({
        theme: selectedTheme,
        task_default_view: selectedDefaultView,
      });

      setSuccessMessage('Your personal preferences were saved successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save preferences:', err);
      // Revert theme if save failed
      handleThemeSelect(currentTheme);
      setErrorMessage(err.message || 'Failed to save preferences. Reverting changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            User Preferences
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Personal Appearance & Workspace Preferences
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Customize your own display theme and preferred landing view for task management.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {successMessage && (
        <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl text-sm text-red-800 dark:text-red-300 flex items-center gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        {/* Theme Preference */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Color Theme
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select your preferred visual style. Live preview applies immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            {/* Light Option */}
            <button
              type="button"
              onClick={() => handleThemeSelect('light')}
              disabled={isSaving}
              className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                selectedTheme === 'light'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  selectedTheme === 'light'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                }`}
              >
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Light Mode
                  </span>
                  {selectedTheme === 'light' && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Clean crisp high-contrast light interface optimized for daylight work.
                </p>
              </div>
            </button>

            {/* Dark Option */}
            <button
              type="button"
              onClick={() => handleThemeSelect('dark')}
              disabled={isSaving}
              className={`p-4 rounded-xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                selectedTheme === 'dark'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  selectedTheme === 'dark'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                }`}
              >
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    Dark Mode
                  </span>
                  {selectedTheme === 'dark' && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sleek dark theme reducing eye strain in low-light environments.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Default Task View Mode */}
        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              Default Task View Mode
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose the layout shown by default whenever you navigate to the Tasks page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
            {/* List View */}
            <button
              type="button"
              onClick={() => setSelectedDefaultView('list')}
              disabled={isSaving}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                selectedDefaultView === 'list'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedDefaultView === 'list'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <LayoutList className="w-4 h-4" />
                </div>
                {selectedDefaultView === 'list' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  List View
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Compact rows with full details and sorting controls.
                </p>
              </div>
            </button>

            {/* Kanban Board View */}
            <button
              type="button"
              onClick={() => setSelectedDefaultView('board')}
              disabled={isSaving}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                selectedDefaultView === 'board'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedDefaultView === 'board'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Kanban className="w-4 h-4" />
                </div>
                {selectedDefaultView === 'board' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  Kanban Board
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Visual workflow columns for stages & progress tracking.
                </p>
              </div>
            </button>

            {/* Calendar View */}
            <button
              type="button"
              onClick={() => setSelectedDefaultView('calendar')}
              disabled={isSaving}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                selectedDefaultView === 'calendar'
                  ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedDefaultView === 'calendar'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                {selectedDefaultView === 'calendar' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                )}
              </div>
              <div>
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  Calendar View
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Monthly and weekly calendar grid mapped to due dates.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            {hasChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Discard
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving || !hasChanges}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Preferences...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
