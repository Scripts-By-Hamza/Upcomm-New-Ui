import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export function ChangePasswordModal({ isOpen, onClose }) {
  const { currentUser, changePassword, logout } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentInputRef = useRef(null);

  // Reset form and purge sensitive password values when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
      setError('');
      setSuccess(false);
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        if (currentInputRef.current) {
          currentInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  // Handle ESC key and scroll lock
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError('');

    // 1. Verify Current Password
    const expectedCurrent = currentUser?.password || '123456';
    if (!currentPassword) {
      setError('Please enter your current password.');
      return;
    }
    if (currentPassword !== expectedCurrent) {
      setError('Current password is incorrect. Please try again.');
      return;
    }

    // 2. Validate New Password
    if (!newPassword) {
      setError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword === '123456') {
      setError('Please choose a different password than the default "123456".');
      return;
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await changePassword(newPassword);
      setSuccess(true);

      // Purge password values from memory immediately
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Password change error:', err);
      setError(err?.message || 'Failed to update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 font-['Inter'] selection:bg-[#ECFDF5] selection:text-[#059669]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. Subtle Translucent Backdrop */}
      <div
        className="fixed inset-0 bg-[#18181B]/15 transition-opacity"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      {/* 2. Floating Centered Modal Card */}
      <div
        className="relative w-[calc(100vw-24px)] max-w-[460px] bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_18px_50px_rgba(24,24,27,0.16)] flex flex-col overflow-hidden z-10 animate-scale-up select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white select-none">
          <div>
            <h2
              id="change-password-dialog-title"
              className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] tracking-tight"
            >
              Change Password
            </h2>
            <p className="text-[12.5px] text-[#71717A] mt-0.5">
              Choose a strong password for your UPCOMM account.
            </p>
          </div>
          {!success && (
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Close Change Password dialog"
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        {success ? (
          <div className="p-8 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="w-11 h-11 text-[#059669] mx-auto" />
            <h3 className="text-[16px] font-semibold text-[#18181B]">
              Password Updated Successfully!
            </h3>
            <p className="text-[12.5px] text-[#52525B] max-w-xs mx-auto leading-relaxed">
              Your credentials have been securely updated in the UPCOMM system.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="p-5 sm:px-6 sm:py-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] text-red-700 text-[12.5px] flex items-center gap-2 animate-fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1. Current Password */}
              <div>
                <label
                  htmlFor="change-current-password"
                  className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
                >
                  Current Password
                </label>
                <div className="relative">
                  <input
                    ref={currentInputRef}
                    id="change-current-password"
                    type={showCurrent ? 'text' : 'password'}
                    name="current-password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter current password"
                    className="w-full h-10 pl-3.5 pr-10 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8B8B95] hover:text-[#18181B] transition-colors cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 2. New Password */}
              <div>
                <label
                  htmlFor="change-new-password"
                  className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="change-new-password"
                    type={showNew ? 'text' : 'password'}
                    name="new-password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Enter new password"
                    className="w-full h-10 pl-3.5 pr-10 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    aria-label={showNew ? 'Hide new password' : 'Show new password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8B8B95] hover:text-[#18181B] transition-colors cursor-pointer"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11.5px] text-[#71717A] mt-1">
                  Use at least 6 characters.
                </p>
              </div>

              {/* 3. Confirm New Password */}
              <div>
                <label
                  htmlFor="change-confirm-password"
                  className="block text-[12.5px] font-medium text-[#18181B] mb-1.5"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    id="change-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirm-password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Re-enter new password"
                    className="w-full h-10 pl-3.5 pr-10 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8B8B95] hover:text-[#18181B] transition-colors cursor-pointer"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Informational text */}
              <div className="flex items-center gap-1.5 pt-1 text-[12px] text-[#71717A]">
                <Lock className="w-3.5 h-3.5 text-[#8B8B95] flex-shrink-0" />
                <span>Keep your account password private.</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[#E5E7EB] bg-white flex items-center justify-end gap-2.5 select-none">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-[13px] font-medium text-[#18181B] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 text-[13px] font-medium text-white bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isSubmitting ? 'Changing...' : 'Change Password'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
