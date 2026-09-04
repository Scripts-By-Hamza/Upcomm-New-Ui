import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Sun, Moon, CheckCircle2, Loader2, Check, AlertCircle } from 'lucide-react';

export function AppearanceSettingsPanel() {
  const { currentUser, updateUser } = useAuth();

  const persistedTheme = currentUser?.theme === 'dark' ? 'dark' : 'light';
  const persistedDensity = currentUser?.density || 'comfortable';

  const [theme, setTheme] = useState(persistedTheme);
  const [density, setDensity] = useState(persistedDensity);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Sync state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      const active = currentUser.theme === 'dark' ? 'dark' : 'light';
      setTheme(active);
      setDensity(currentUser.density || 'comfortable');
    }
  }, [currentUser]);

  // Immediate preview when theme is toggled
  const handleSelectTheme = (selectedTheme) => {
    setTheme(selectedTheme);
    if (selectedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const isDirty = theme !== persistedTheme || density !== persistedDensity;

  const handleCancel = () => {
    setTheme(persistedTheme);
    setDensity(persistedDensity);
    setSaveError('');
    // Restore root to persisted theme
    if (persistedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentUser || !isDirty || isSaving) return;

    setIsSaving(true);
    setSaveError('');

    try {
      await updateUser(currentUser.id, {
        theme,
        density,
      });

      try {
        localStorage.setItem(`upcomm_theme_${currentUser.id}`, theme);
      } catch (e) {}

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving appearance preferences:', err);
      setSaveError("Couldn't save appearance preference. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#17191C] border border-[#E5E7EB] dark:border-[#2A2E34] rounded-[10px] p-6 sm:p-8 shadow-none flex-1 min-w-0 font-['Inter'] transition-colors">
      {/* 1. Top Section Label */}
      <div className="text-[11px] sm:text-[12px] font-semibold text-[#71717A] dark:text-[#8E949E] uppercase tracking-wider mb-2">
        APPEARANCE
      </div>

      {/* 2. Heading & Subtitle */}
      <div className="mb-6">
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#18181B] dark:text-[#F4F4F5] tracking-tight">
          Theme & Interface Display
        </h2>
        <p className="text-[13px] text-[#52525B] dark:text-[#C4C7CE] mt-1">
          Customize how the UPCOMM application looks and feels on your device.
        </p>
      </div>

      {/* Success / Error Banners */}
      {saveSuccess && (
        <div className="mb-6 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-[8px] text-[12.5px] text-[#065F46] dark:text-emerald-300 font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#059669] dark:text-emerald-400 shrink-0" />
          <span>Appearance preferences saved successfully!</span>
        </div>
      )}
      {saveError && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] text-[12.5px] text-[#DC2626] dark:text-red-300 font-medium flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-[#DC2626] dark:text-red-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-7">
        {/* Interface Theme - Exactly 2 Cards: Light & Dark */}
        <div>
          <label className="block text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-3">
            Interface Theme
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Light Card */}
            <button
              type="button"
              onClick={() => handleSelectTheme('light')}
              className={`p-4 sm:p-5 rounded-[8px] border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                theme === 'light'
                  ? 'border-[#059669] bg-[#F1F3F5] dark:bg-[#22262B] ring-1 ring-[#059669]'
                  : 'border-[#E5E7EB] dark:border-[#2A2E34] hover:border-[#D4D4D8] dark:hover:border-[#343A40] bg-white dark:bg-[#1D2024]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Sun
                  className={`w-5 h-5 ${
                    theme === 'light' ? 'text-[#059669]' : 'text-[#71717A] dark:text-[#8E949E]'
                  }`}
                />
                {theme === 'light' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400" />
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="text-[13.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                  Light
                </div>
                <div className="text-[12px] text-[#71717A] dark:text-[#8E949E] mt-0.5">
                  Clean, bright interface
                </div>
              </div>
            </button>

            {/* 2. Dark Card */}
            <button
              type="button"
              onClick={() => handleSelectTheme('dark')}
              className={`p-4 sm:p-5 rounded-[8px] border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${
                theme === 'dark'
                  ? 'border-[#059669] bg-[#F1F3F5] dark:bg-[#22262B] ring-1 ring-[#059669]'
                  : 'border-[#E5E7EB] dark:border-[#2A2E34] hover:border-[#D4D4D8] dark:hover:border-[#343A40] bg-white dark:bg-[#1D2024]'
              }`}
            >
              <div className="flex items-center justify-between">
                <Moon
                  className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-[#059669]' : 'text-[#71717A] dark:text-[#8E949E]'
                  }`}
                />
                {theme === 'dark' && (
                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-[#059669] dark:text-emerald-400" />
                  </span>
                )}
              </div>
              <div className="mt-3">
                <div className="text-[13.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                  Dark
                </div>
                <div className="text-[12px] text-[#71717A] dark:text-[#8E949E] mt-0.5">
                  Low-light interface with reduced brightness
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Layout Density */}
        <div className="border-t border-[#E5E7EB] dark:border-[#2A2E34] pt-6">
          <label className="block text-[13px] font-semibold text-[#18181B] dark:text-[#F4F4F5] mb-3">
            Table & List Density
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2.5 text-[13px] text-[#18181B] dark:text-[#F4F4F5] cursor-pointer">
              <input
                type="radio"
                name="density"
                value="comfortable"
                checked={density === 'comfortable'}
                onChange={() => setDensity('comfortable')}
                className="text-[#059669] focus:ring-[#059669]"
              />
              <span>Comfortable (Standard row heights)</span>
            </label>
            <label className="flex items-center gap-2.5 text-[13px] text-[#18181B] dark:text-[#F4F4F5] cursor-pointer">
              <input
                type="radio"
                name="density"
                value="compact"
                checked={density === 'compact'}
                onChange={() => setDensity('compact')}
                className="text-[#059669] focus:ring-[#059669]"
              />
              <span>Compact (High-density information)</span>
            </label>
          </div>
        </div>

        {/* Action Footer */}
        <div className="border-t border-[#E5E7EB] dark:border-[#2A2E34] pt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || isSaving}
            className="h-[40px] px-4 text-[13px] font-medium text-[#52525B] dark:text-[#C4C7CE] hover:text-[#18181B] dark:hover:text-[#F4F4F5] bg-white dark:bg-[#1D2024] border border-[#E5E7EB] dark:border-[#2A2E34] hover:border-[#D4D4D8] dark:hover:border-[#343A40] rounded-[8px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-none"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!isDirty || isSaving}
            className="h-[40px] px-5 text-[13px] font-medium text-white bg-[#059669] hover:bg-[#047857] rounded-[8px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-none"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
