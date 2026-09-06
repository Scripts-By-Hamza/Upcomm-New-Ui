import React, { useState, useEffect, useRef } from 'react';
import { Building2, Upload, Trash2, CheckCircle2, AlertCircle, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useAppData } from '../../contexts/AppDataContext';

export function SoftwareSettingsTab() {
  const { settings, updateSoftwareSettings } = useAppData();

  const [portalName, setPortalName] = useState(settings?.portal_name || 'UPCOMM');
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(settings?.sidebar_logo_url || '/logo.png');
  const [isRemovedLogo, setIsRemovedLogo] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  // Synchronize when settings change from external realtime events
  useEffect(() => {
    if (!isSaving) {
      setPortalName(settings?.portal_name || 'UPCOMM');
      if (!logoFile && !isRemovedLogo) {
        setPreviewUrl(settings?.sidebar_logo_url || '/logo.png');
      }
    }
  }, [settings?.portal_name, settings?.sidebar_logo_url, isSaving, logoFile, isRemovedLogo]);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset messages
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage('Invalid file type. Please upload a PNG, JPG, or WebP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 2MB limit. Please choose a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setLogoFile(file);
    setIsRemovedLogo(false);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setIsRemovedLogo(true);
    setPreviewUrl('/logo.png');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrorMessage('');
  };

  const handleResetChanges = () => {
    setPortalName(settings?.portal_name || 'UPCOMM');
    setLogoFile(null);
    setIsRemovedLogo(false);
    setPreviewUrl(settings?.sidebar_logo_url || '/logo.png');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setErrorMessage('');
    setSuccessMessage('');
  };

  const hasChanges =
    portalName !== (settings?.portal_name || 'UPCOMM') ||
    logoFile !== null ||
    isRemovedLogo;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!portalName.trim()) {
      setErrorMessage('Portal Name cannot be empty.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    setUploadProgress(10);

    try {
      await updateSoftwareSettings({
        portal_name: portalName.trim(),
        logoFile: logoFile,
        removeLogo: isRemovedLogo,
        onUploadProgress: (progress) => {
          setUploadProgress(progress);
        },
      });

      setLogoFile(null);
      setIsRemovedLogo(false);
      setSuccessMessage('Software settings and branding updated successfully!');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Failed to save software settings:', err);
      setErrorMessage(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Global Workspace
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Software Settings & Global Branding
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system-wide portal name and primary sidebar logo across the entire organization.
          </p>
        </div>
      </div>

      {/* Notifications */}
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
        {/* Portal Name */}
        <div className="space-y-2">
          <label htmlFor="portalName" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Portal Name <span className="text-emerald-600 dark:text-emerald-400">*</span>
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            The title displayed in the browser tab, header branding, and sidebar navigation.
          </p>
          <input
            id="portalName"
            type="text"
            value={portalName}
            onChange={(e) => setPortalName(e.target.value)}
            disabled={isSaving}
            maxLength={60}
            required
            placeholder="e.g. UPCOMM Solutions"
            className="w-full max-w-lg h-11 px-4 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Sidebar Logo */}
        <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-slate-800">
          <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            Sidebar Logo
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Recommended size: 256x256px or horizontal logo. Max file size: 2MB (PNG, JPG, WebP).
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-2">
            {/* Logo Preview */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center p-2 overflow-hidden shadow-inner">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Portal Logo Preview"
                    className="max-w-full max-h-full object-contain rounded-lg transition-transform group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = '/logo.png';
                    }}
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                id="sidebarLogoInput"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileChange}
                disabled={isSaving}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-xl border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                {logoFile ? 'Change Selected File' : 'Upload New Logo'}
              </button>

              {(previewUrl !== '/logo.png' || logoFile) && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-sm font-medium rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Reset to Default
                </button>
              )}
            </div>
          </div>

          {logoFile && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              Selected file: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)} KB) — Ready to save.
            </p>
          )}

          {/* Upload Progress Bar */}
          {isSaving && uploadProgress > 0 && (
            <div className="w-full max-w-md pt-2 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Uploading & saving branding...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
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
                onClick={handleResetChanges}
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
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Software Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
