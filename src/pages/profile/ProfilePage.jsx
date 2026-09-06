import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../../components/common/Avatar';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import { getRoleDisplayLabel } from '../../utils/employeeWorkloadUtils';
import {
  Upload,
  Check,
  CheckCircle2,
  LogOut,
  Loader2,
  Lock,
  RotateCcw,
  Bell,
  Smartphone,
  AlertCircle,
} from 'lucide-react';
import {
  isStandalone,
  isMobileDevice,
  isPushSupported,
  isSupportedStandaloneMobile,
  getNotificationPermission,
} from '../../lib/pwa/pwaEnvironment';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentPushSubscription,
} from '../../lib/pwa/pushSubscription';
import {
  getUserPushPreference,
} from '../../lib/pwa/pushPreferences';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250',
];

export function ProfilePage() {
  const { currentUser, updateUser, uploadAvatar, updateAvatar, logout } = useAuth();
  const { departments = [] } = useAppData();
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  // Form Fields State
  const [fullName, setFullName] = useState(currentUser?.full_name || '');
  const [designation, setDesignation] = useState(currentUser?.designation || '');

  // UI States
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Push Notification States
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);
  const [pushFeedback, setPushFeedback] = useState('');
  const [pushEnvStatus, setPushEnvStatus] = useState('desktop'); // 'enabled' | 'off' | 'install_required' | 'desktop' | 'blocked' | 'unsupported'

  // Load push notification status on profile load
  useEffect(() => {
    let isMounted = true;

    async function evaluatePushStatus() {
      if (!isPushSupported()) {
        if (isMounted) setPushEnvStatus('unsupported');
        return;
      }

      if (!isMobileDevice()) {
        if (isMounted) setPushEnvStatus('desktop');
        return;
      }

      if (!isStandalone()) {
        if (isMounted) setPushEnvStatus('install_required');
        return;
      }

      const permission = getNotificationPermission();
      if (permission === 'denied') {
        if (isMounted) {
          setPushEnvStatus('blocked');
          setPushEnabled(false);
        }
        return;
      }

      if (currentUser?.id) {
        try {
          const pref = await getUserPushPreference(currentUser.id);
          const sub = await getCurrentPushSubscription();
          if (isMounted) {
            const active = Boolean(pref && sub);
            setPushEnabled(active);
            setPushEnvStatus(active ? 'enabled' : 'off');
          }
        } catch (e) {
          if (isMounted) setPushEnvStatus('off');
        }
      }
    }

    evaluatePushStatus();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const handleToggleMobilePush = async () => {
    if (!currentUser?.id || isTogglingPush) return;

    if (pushEnvStatus === 'install_required' || pushEnvStatus === 'desktop' || pushEnvStatus === 'unsupported') {
      return;
    }

    setIsTogglingPush(true);
    setPushFeedback('');

    if (pushEnabled) {
      // Turn OFF
      const res = await unsubscribeFromPushNotifications(currentUser.id);
      if (res.success) {
        setPushEnabled(false);
        setPushEnvStatus('off');
        setPushFeedback('Mobile push notifications disabled.');
        setTimeout(() => setPushFeedback(''), 3000);
      }
    } else {
      // Turn ON
      const res = await subscribeToPushNotifications(currentUser.id);
      if (res.success) {
        setPushEnabled(true);
        setPushEnvStatus('enabled');
        setPushFeedback('Mobile push notifications enabled for this device.');
        setTimeout(() => setPushFeedback(''), 3000);
      } else {
        if (res.permission === 'denied') {
          setPushEnvStatus('blocked');
          setPushEnabled(false);
          setPushFeedback('Permission was blocked in browser settings.');
        } else {
          setPushFeedback(res.error || 'Failed to enable push notifications.');
        }
        setTimeout(() => setPushFeedback(''), 4000);
      }
    }
    setIsTogglingPush(false);
  };

  // Sync initial state when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setDesignation(currentUser.designation || '');
    }
  }, [currentUser]);

  const userDept = departments.find((d) => String(d.id) === String(currentUser?.department_id));
  const roleLabel = getRoleDisplayLabel(currentUser?.role);
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'it_support_admin';
  const isActive = currentUser?.is_active !== false && currentUser?.status !== 'inactive';

  // Check if form is modified
  const isPristine =
    fullName.trim() === (currentUser?.full_name || '').trim() &&
    designation.trim() === (currentUser?.designation || '').trim();

  // Reset form to current user values
  const handleCancel = () => {
    if (currentUser) {
      setFullName(currentUser.full_name || '');
      setDesignation(currentUser.designation || '');
    }
  };

  // Handle Photo File Upload (PNG, JPG, WEBP, up to 5MB)
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
    setUploadMessage('Uploading image...');

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

  // Handle Preset Avatar Selection
  const handleSelectPreset = (url) => {
    setUploadError('');
    updateAvatar(url);
    setUploadMessage('Avatar updated from presets!');
    setTimeout(() => setUploadMessage(''), 2500);
  };

  // Handle Remove Custom Avatar
  const handleRemoveAvatar = () => {
    setUploadError('');
    updateAvatar(null);
    setUploadMessage('Avatar reset to default initials.');
    setTimeout(() => setUploadMessage(''), 2500);
  };

  // Handle Profile Form Submission
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    if (!currentUser || isPristine) return;

    if (!fullName.trim()) {
      alert('Please enter a valid full name.');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        full_name: fullName.trim(),
        designation: designation.trim(),
      };

      await updateUser(currentUser.id, updates);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  // Department display text
  const departmentDisplay = isAdmin
    ? 'Executive / All Departments'
    : userDept
    ? `${userDept.name} Department`
    : 'Executive / No Department';

  const departmentAccessDisplay = isAdmin
    ? 'All Departments'
    : userDept
    ? userDept.name
    : 'None Assigned';

  return (
    <div className="max-w-[1100px] mx-auto space-y-5 font-['Inter'] pb-12 select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] sm:text-[24px] font-semibold text-[#18181B] tracking-tight">
            Profile
          </h1>
          <p className="text-[13px] text-[#52525B] mt-0.5 font-normal">
            Manage your personal information, profile picture and account security.
          </p>
        </div>

        {/* Right: Restrained Sign Out Button */}
        <button
          type="button"
          onClick={handleSignOut}
          className="h-[38px] px-3.5 bg-white border border-[#E5E7EB] hover:border-red-300 hover:bg-red-50/50 text-[#DC2626] text-[13px] font-medium rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-none self-start sm:self-auto flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 2. Top Main Surface: Identity Header & Profile Picture Section */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] shadow-none overflow-hidden">
        {/* Identity Summary Header */}
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-5">
            {/* Left: Avatar + Name + Email + Role Badge */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 text-center sm:text-left">
              <div className="relative">
                <Avatar
                  src={currentUser?.avatar_url}
                  name={currentUser?.full_name}
                  className="w-16 h-16 text-lg rounded-full border border-[#E5E7EB]"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#16A34A] ring-2 ring-white" />
              </div>

              <div className="space-y-1">
                <h2 className="text-[17px] font-semibold text-[#18181B]">
                  {currentUser?.full_name || 'Support Administrator'}
                </h2>
                <div className="text-[12.5px] text-[#71717A]">
                  {currentUser?.email || 'support@upcomm.com'}
                </div>
                <div className="pt-0.5">
                  <span className="inline-block px-2.5 py-0.5 text-[11.5px] font-medium text-[#52525B] bg-white border border-[#E5E7EB] rounded-[6px]">
                    {roleLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Department + Active Status */}
            <div className="text-center sm:text-right space-y-1.5 self-center sm:self-start">
              <div className="text-[12.5px] text-[#52525B] font-medium">
                {departmentDisplay}
              </div>
              <div className="inline-flex items-center gap-1.5 text-[12px] font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isActive ? 'bg-[#16A34A]' : 'bg-[#8B8B95]'
                  }`}
                />
                <span className={isActive ? 'text-[#18181B]' : 'text-[#71717A]'}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#E5E7EB]" />

        {/* Profile Picture Section */}
        <div className="p-6 space-y-3.5">
          <div>
            <h3 className="text-[13.5px] font-semibold text-[#18181B]">
              Profile Picture
            </h3>
            <p className="text-[12px] text-[#71717A] mt-0.5">
              Upload your profile photo or choose a preset avatar.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pt-1">
            {/* Avatar Preview */}
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.full_name}
              className="w-14 h-14 text-base rounded-full border border-[#E5E7EB] flex-shrink-0"
            />

            {/* Actions & Presets */}
            <div className="space-y-3 flex-1 min-w-0">
              {/* Upload Button + Remove Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="h-[34px] px-3 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B] text-[12.5px] font-medium rounded-[7px] flex items-center gap-1.5 transition-all cursor-pointer shadow-none disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>{isUploadingPhoto ? 'Uploading...' : 'Upload New Photo'}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {currentUser?.avatar_url && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[12.5px] text-[#52525B] hover:text-[#DC2626] font-medium transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Preset Avatars Row */}
              <div className="space-y-1.5">
                <div className="text-[11.5px] text-[#71717A] font-medium">
                  Or choose a preset avatar
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Option 1: Default initials avatar */}
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold bg-[#F4F4F5] text-[#52525B] border transition-all cursor-pointer ${
                      !currentUser?.avatar_url
                        ? 'border-[#059669] ring-2 ring-[#059669]/20'
                        : 'border-[#E5E7EB] hover:border-[#D4D4D8]'
                    }`}
                    title="Default initials"
                  >
                    {(currentUser?.full_name || 'SA')
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </button>

                  {/* Preset Photos */}
                  {PRESET_AVATARS.map((url, idx) => {
                    const isSelected = currentUser?.avatar_url === url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(url)}
                        className={`relative rounded-full p-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? 'ring-2 ring-[#059669] ring-offset-1'
                            : 'opacity-80 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={url}
                          alt={`Preset ${idx + 1}`}
                          className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB]"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format & Size Helper */}
              <div className="text-[11px] text-[#8B8B95]">
                PNG, JPG or WEBP • Max 5 MB
              </div>

              {uploadMessage && (
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[#059669] bg-emerald-50 border border-emerald-200 rounded-[5px]">
                    <Check className="w-3 h-3" />
                    {uploadMessage}
                  </span>
                </div>
              )}

              {uploadError && (
                <div className="pt-0.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[#DC2626] bg-red-50 border border-red-200 rounded-[5px]">
                    {uploadError}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Personal Information (Left) + Organization Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Personal Information (Span 7) */}
        <div className="lg:col-span-7 bg-white border border-[#E5E7EB] rounded-[10px] p-6 shadow-none flex flex-col justify-between">
          <form onSubmit={handleSaveChanges} className="space-y-4">
            <div>
              <h3 className="text-[14px] font-semibold text-[#18181B]">
                Personal Information
              </h3>
            </div>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[7px] text-[12px] text-[#065F46] font-medium flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                <span>Your profile details have been saved successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. Full Name (Editable) */}
              <div>
                <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full h-[38px] px-3 text-[13px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[7px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] text-[#18181B] transition-colors"
                />
              </div>

              {/* 2. Email Address (Read-Only with Lock Icon) */}
              <div>
                <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    readOnly
                    value={currentUser?.email || 'support@upcomm.com'}
                    className="w-full h-[38px] pl-3 pr-8 text-[13px] bg-white border border-[#E5E7EB] rounded-[7px] text-[#52525B] cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#8B8B95] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 3. Department (Read-Only with Lock Icon) */}
              <div>
                <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                  Department
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={departmentDisplay}
                    className="w-full h-[38px] pl-3 pr-8 text-[13px] bg-white border border-[#E5E7EB] rounded-[7px] text-[#52525B] cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#8B8B95] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 4. Designation / Job Title (Editable) */}
              <div>
                <label className="block text-[12px] font-medium text-[#18181B] mb-1">
                  Designation / Job Title
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Support Administrator"
                  className="w-full h-[38px] px-3 text-[13px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[7px] focus:outline-none focus:ring-1 focus:ring-[#059669] focus:border-[#059669] text-[#18181B] transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving || isPristine}
                className="h-[36px] px-4 text-[12.5px] font-medium text-[#52525B] hover:text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] disabled:opacity-40 disabled:cursor-not-allowed rounded-[7px] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving || isPristine}
                className="h-[36px] px-4 text-[12.5px] font-semibold text-white bg-[#059669] hover:bg-[#047857] disabled:opacity-40 disabled:cursor-not-allowed rounded-[7px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-none"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Card: Organization Details (Span 5) */}
        <div className="lg:col-span-5 bg-white border border-[#E5E7EB] rounded-[10px] p-6 shadow-none flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-[14px] font-semibold text-[#18181B]">
              Organization Details
            </h3>

            <div className="space-y-3 text-[13px]">
              <div className="flex items-center justify-between py-1">
                <span className="text-[#71717A]">Portal Role</span>
                <span className="text-[#18181B] font-medium">{roleLabel}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#71717A]">Department Access</span>
                <span className="text-[#18181B] font-medium">{departmentAccessDisplay}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#71717A]">Account Status</span>
                <div className="inline-flex items-center gap-1.5 font-medium">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-[#16A34A]' : 'bg-[#8B8B95]'
                    }`}
                  />
                  <span className={isActive ? 'text-[#18181B]' : 'text-[#71717A]'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F4F4F5] text-[11.5px] text-[#71717A] leading-relaxed">
            Role and department access are managed by authorized administrators.
          </div>
        </div>
      </div>

      {/* 4. Bottom Surface: Security */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 shadow-none">
        <div className="space-y-3">
          <h3 className="text-[14px] font-semibold text-[#18181B]">
            Security
          </h3>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-[8px] border border-[#E5E7EB] bg-white flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-[#18181B]" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-[13.5px] font-semibold text-[#18181B]">
                  Account Password
                </h4>
                <p className="text-[12px] text-[#52525B]">
                  Update your account password and keep your account secure.
                </p>
                <div className="text-[11.5px] text-[#71717A] pt-0.5">
                  Password <span className="tracking-widest font-mono">••••••••••</span> • Last changed <span className="text-[#52525B]">Not available</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="h-[36px] px-3.5 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer shadow-none self-start sm:self-auto flex-shrink-0"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>

      {/* 5. Mobile Notifications Surface */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 shadow-none">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
              MOBILE NOTIFICATIONS
            </div>
            {/* Dynamic Status Badge */}
            {pushEnvStatus === 'enabled' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium text-[#059669] bg-emerald-50 border border-emerald-200 rounded-[6px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                Enabled on this device
              </span>
            )}
            {pushEnvStatus === 'off' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium text-[#71717A] bg-[#F4F4F5] border border-[#E5E7EB] rounded-[6px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B8B95]" />
                Disabled
              </span>
            )}
            {pushEnvStatus === 'blocked' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium text-[#DC2626] bg-red-50 border border-red-200 rounded-[6px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                Blocked by device
              </span>
            )}
            {pushEnvStatus === 'install_required' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium text-[#52525B] bg-[#F4F4F5] border border-[#E5E7EB] rounded-[6px]">
                Install required
              </span>
            )}
            {pushEnvStatus === 'desktop' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium text-[#52525B] bg-[#F4F4F5] border border-[#E5E7EB] rounded-[6px]">
                Mobile PWA Only
              </span>
            )}
            {pushEnvStatus === 'unsupported' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11.5px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-[6px]">
                Unsupported
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-[8px] border border-[#E5E7EB] bg-white flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#18181B]" />
              </div>
              <div className="space-y-0.5 max-w-xl">
                <h4 className="text-[13.5px] font-semibold text-[#18181B]">
                  Mobile Push Notifications
                </h4>
                <p className="text-[12px] text-[#52525B] leading-relaxed">
                  Receive alerts for messages, task comments, task assignments and approval requests even when UPCOMM is closed.
                </p>
                {pushEnvStatus === 'install_required' && (
                  <p className="text-[11.5px] text-[#059669] font-medium pt-1">
                    Install UPCOMM on this device (Chrome menu → Install App or Safari → Add to Home Screen) to enable mobile push notifications.
                  </p>
                )}
                {pushEnvStatus === 'desktop' && (
                  <p className="text-[11.5px] text-[#71717A] pt-1">
                    Mobile Push notifications are configured from your installed mobile UPCOMM app. Desktop uses the built-in portal sound.
                  </p>
                )}
                {pushEnvStatus === 'blocked' && (
                  <p className="text-[11.5px] text-[#DC2626] font-medium pt-1">
                    Notifications are blocked in your browser/system settings. Please enable them to receive mobile alerts.
                  </p>
                )}
                {pushEnvStatus === 'unsupported' && (
                  <p className="text-[11.5px] text-amber-600 font-medium pt-1">
                    Mobile notifications aren't supported on this device version (iOS 16.4+ required for iPhone/iPad).
                  </p>
                )}
              </div>
            </div>

            {/* Toggle Button for installed PWA */}
            {(pushEnvStatus === 'enabled' || pushEnvStatus === 'off' || pushEnvStatus === 'blocked') && (
              <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={handleToggleMobilePush}
                  disabled={isTogglingPush || pushEnvStatus === 'blocked'}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    pushEnabled ? 'bg-[#059669]' : 'bg-[#E5E7EB]'
                  }`}
                  aria-label="Toggle mobile push notifications"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-xs transform transition-transform ${
                      pushEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {pushFeedback && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-[7px] text-[12px] text-[#065F46] font-medium flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
              <span>{pushFeedback}</span>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
