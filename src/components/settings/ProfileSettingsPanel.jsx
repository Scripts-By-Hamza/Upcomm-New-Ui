import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../common/Avatar';
import { Lock, ChevronDown, Check, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

const TIMEZONE_OPTIONS = [
  { value: 'Asia/Karachi', label: 'Asia/Karachi (UTC+05:00)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC+04:00)' },
  { value: 'Asia/Riyadh', label: 'Asia/Riyadh (UTC+03:00)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC+05:30)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC+08:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (UTC+09:00)' },
  { value: 'Asia/Hong_Kong', label: 'Asia/Hong_Kong (UTC+08:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'America/Toronto', label: 'America/Toronto (EST/EDT)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export function ProfileSettingsPanel() {
  const { currentUser, updateUser, uploadAvatar } = useAuth();
  const { departments = [], settings, updateSettings } = useAppData();

  const fileInputRef = useRef(null);

  // Form Field States
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.designation || '');
  const [timezone, setTimezone] = useState(
    currentUser?.timezone || settings?.timezone || 'Asia/Karachi'
  );
  const [dateFormat, setDateFormat] = useState(
    currentUser?.date_format || settings?.date_format || 'DD MMM YYYY'
  );

  // UI Statuses
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Sync state when currentUser or settings change
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setJobTitle(currentUser.designation || '');
      setTimezone(currentUser.timezone || settings?.timezone || 'Asia/Karachi');
      setDateFormat(currentUser.date_format || settings?.date_format || 'DD MMM YYYY');
    }
  }, [currentUser, settings]);

  // Derived user details
  const userDept = departments.find(
    (d) => String(d.id) === String(currentUser?.department_id)
  );
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'it_support_admin';
  const departmentDisplay = isAdmin
    ? 'Executive / All Departments'
    : userDept
    ? userDept.name
    : 'No department assigned';

  // Dirty state calculation
  const persistedFullName = (currentUser?.full_name || '').trim();
  const persistedJobTitle = (currentUser?.designation || '').trim();
  const persistedTimezone = currentUser?.timezone || settings?.timezone || 'Asia/Karachi';
  const persistedDateFormat = currentUser?.date_format || settings?.date_format || 'DD MMM YYYY';

  const isDirty =
    fullName.trim() !== persistedFullName ||
    jobTitle.trim() !== persistedJobTitle ||
    timezone !== persistedTimezone ||
    dateFormat !== persistedDateFormat;

  // Reset editable values to last persisted
  const handleCancel = () => {
    setFullName(persistedFullName);
    setJobTitle(persistedJobTitle);
    setTimezone(persistedTimezone);
    setDateFormat(persistedDateFormat);
    setSaveError('');
  };

  // Photo Upload Handler
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setUploadMessage('');

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit. Please choose a smaller image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Unsupported format. Please upload a PNG, JPG, or WEBP image.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const publicUrl = await uploadAvatar(file);
      if (publicUrl) {
        setUploadMessage('Profile photo updated successfully!');
        setTimeout(() => setUploadMessage(''), 3000);
      }
    } catch (err) {
      console.error('Failed to upload avatar:', err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Form Submit Handler
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!currentUser || !isDirty || isSaving) return;

    if (!fullName.trim()) {
      setSaveError('Please enter a valid full name.');
      return;
    }

    setIsSaving(true);
    setSaveError('');

    try {
      const userUpdates = {
        full_name: fullName.trim(),
        designation: jobTitle.trim(),
        timezone,
        date_format: dateFormat,
      };

      // 1. Update user profile in AuthContext / Supabase users table
      await updateUser(currentUser.id, userUpdates);

      // 2. Synchronize workspace settings context
      if (updateSettings) {
        updateSettings({
          timezone,
          date_format: dateFormat,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 sm:p-8 shadow-none flex-1 min-w-0 font-['Inter']">
      {/* 1. TOP SECTION LABEL */}
      <div className="text-[11px] sm:text-[12px] font-semibold text-[#71717A] uppercase tracking-wider mb-6">
        PROFILE
      </div>

      {/* 2. IDENTITY BLOCK */}
      <div className="flex items-center gap-5 sm:gap-6">
        <div className="relative flex-shrink-0">
          <Avatar
            src={currentUser?.avatar_url}
            name={currentUser?.full_name || 'Hasan Ali'}
            size="2xl"
            className="w-[84px] h-[84px] sm:w-[88px] sm:h-[88px] text-2xl font-bold rounded-full border border-[#E5E7EB] object-cover"
          />
        </div>

        <div className="space-y-2 min-w-0">
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#18181B] truncate tracking-tight">
            {currentUser?.full_name || 'Hasan Ali'}
          </h2>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingPhoto}
              className="h-[34px] px-3.5 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] hover:bg-[#F9FAFB] text-[13px] font-medium text-[#18181B] rounded-[7px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-none"
            >
              {isUploadingPhoto ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#71717A]" />
                  <span>Uploading...</span>
                </>
              ) : (
                <span>Change photo</span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Upload Messages */}
      {uploadMessage && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium text-[#059669] bg-emerald-50 border border-emerald-200 rounded-[6px]">
          <Check className="w-3.5 h-3.5" />
          <span>{uploadMessage}</span>
        </div>
      )}
      {uploadError && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-medium text-[#DC2626] bg-red-50 border border-red-200 rounded-[6px]">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* 3. PROFILE DIVIDER */}
      <div className="border-t border-[#E5E7EB] my-7" />

      {/* 4. FORM */}
      <form onSubmit={handleSaveChanges} className="space-y-7">
        {/* Success / Error Banners */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-[8px] text-[12.5px] text-[#065F46] font-medium flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-[12.5px] text-[#DC2626] font-medium flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {/* PERSONAL DETAILS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {/* Row 1, Col 1: Full Name */}
          <div>
            <label
              htmlFor="settings-full-name"
              className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
            >
              Full Name
            </label>
            <input
              id="settings-full-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Hasan Ali"
              className="w-full h-[42px] px-3.5 text-[13.5px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[#18181B] outline-none transition-colors"
            />
          </div>

          {/* Row 1, Col 2: Email (Read-only) */}
          <div>
            <label
              htmlFor="settings-email"
              className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <input
                id="settings-email"
                type="email"
                readOnly
                value={currentUser?.email || 'hasan@upcomm.com'}
                className="w-full h-[42px] pl-3.5 pr-9 text-[13.5px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] text-[#52525B] cursor-default select-all outline-none"
              />
              <Lock className="w-3.5 h-3.5 text-[#8B8B95] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="flex items-center gap-1 text-[11.5px] text-[#71717A] mt-1.5">
              <Lock className="w-3 h-3 text-[#8B8B95]" />
              <span>Read-only</span>
            </div>
          </div>

          {/* Row 2, Col 1: Job Title */}
          <div>
            <label
              htmlFor="settings-job-title"
              className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
            >
              Job Title
            </label>
            <input
              id="settings-job-title"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Frontend Developer"
              className="w-full h-[42px] px-3.5 text-[13.5px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[#18181B] outline-none transition-colors"
            />
          </div>

          {/* Row 2, Col 2: Department (Read-only) */}
          <div>
            <label
              htmlFor="settings-department"
              className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
            >
              Department
            </label>
            <input
              id="settings-department"
              type="text"
              readOnly
              value={departmentDisplay}
              className="w-full h-[42px] px-3.5 text-[13.5px] bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px] text-[#52525B] cursor-default outline-none"
            />
          </div>
        </div>

        {/* 5. WORKSPACE PREFERENCES DIVIDER */}
        <div className="border-t border-[#E5E7EB] my-7" />

        {/* WORKSPACE PREFERENCES SECTION */}
        <div>
          <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] tracking-tight">
            Workspace Preferences
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mt-4">
            {/* Timezone */}
            <div>
              <label
                htmlFor="settings-timezone"
                className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
              >
                Timezone
              </label>
              <div className="relative">
                <select
                  id="settings-timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-[42px] pl-3.5 pr-9 text-[13.5px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[#18181B] outline-none transition-colors appearance-none cursor-pointer font-medium"
                >
                  {TIMEZONE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Date Format */}
            <div>
              <label
                htmlFor="settings-date-format"
                className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
              >
                Date Format
              </label>
              <div className="relative">
                <select
                  id="settings-date-format"
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full h-[42px] pl-3.5 pr-9 text-[13.5px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[#18181B] outline-none transition-colors appearance-none cursor-pointer font-medium"
                >
                  {DATE_FORMAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[#71717A] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 6. SAVE / CANCEL FOOTER */}
        <div className="border-t border-[#E5E7EB] pt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={!isDirty || isSaving}
            className="h-[40px] px-4 text-[13px] font-medium text-[#52525B] hover:text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-none"
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
