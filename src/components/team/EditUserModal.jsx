import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Lock } from 'lucide-react';

export function EditUserModal({
  isOpen,
  user,
  onClose,
  onSubmit,
  departments = [],
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [customId, setCustomId] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('team_member');
  const [departmentId, setDepartmentId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setCustomId(user.custom_id || '');
      setDesignation(user.designation || '');
      setRole(user.role || 'team_member');
      setDepartmentId(user.department_id || '');
      setIsActive(user.is_active !== false && user.status !== 'inactive');
      setError('');
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [user, isOpen]);

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

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setError('Full name is required.');
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit(user.id, {
        full_name: trimmedName,
        custom_id: customId.trim() || null,
        designation: designation.trim(),
        role,
        department_id: departmentId || null,
        is_active: isActive,
        status: isActive ? 'active' : 'inactive',
      });

      onClose();
    } catch (err) {
      console.error('Failed to update user:', err);
      setError(err?.message || 'Failed to update employee details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-dialog-title"
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
        className="relative w-[calc(100vw-24px)] max-w-[500px] bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_18px_50px_rgba(24,24,27,0.16)] flex flex-col overflow-hidden z-10 animate-scale-up select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-white select-none">
          <div>
            <h2
              id="edit-user-dialog-title"
              className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] tracking-tight"
            >
              Edit User Details
            </h2>
            <p className="text-[12.5px] text-[#71717A] mt-0.5">
              Update role, department, designation, or account status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className="p-5 sm:p-6 space-y-4">
            {error && (
              <p className="text-[12px] text-[#DC2626] font-medium animate-fade-in">
                {error}
              </p>
            )}

            {/* Full Name */}
            <div>
              <label
                htmlFor="edit-user-fullname-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Full Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="edit-user-fullname-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError('');
                }}
                className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors"
              />
            </div>

            {/* Work Email (Read-only identifier) */}
            <div>
              <label
                htmlFor="edit-user-email-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Work Email
              </label>
              <div className="relative">
                <input
                  id="edit-user-email-input"
                  type="email"
                  disabled
                  readOnly
                  value={email}
                  className="w-full h-10 pl-3 pr-8 text-[13px] bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[#52525B] cursor-not-allowed select-none"
                />
                <Lock className="w-3.5 h-3.5 text-[#8B8B95] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Job Title / Designation */}
            <div>
              <label
                htmlFor="edit-user-designation-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Job Title / Designation
              </label>
              <input
                id="edit-user-designation-input"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
              />
            </div>

            {/* Custom User ID (Unique identifier for CSV task import & quick assignments) */}
            <div>
              <label
                htmlFor="edit-user-customid-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Unique User ID (First Name / Identifier){' '}
                <span className="text-[11px] font-normal text-[#71717A]">(e.g. Ahmed, Hamza — used in CSV task import)</span>
              </label>
              <input
                id="edit-user-customid-input"
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="e.g. Ahmed, Hamza, Ahsan"
                className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95] font-mono"
              />
            </div>

            {/* Role & Department Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Role */}
              <div>
                <label
                  htmlFor="edit-user-role-select"
                  className="block text-[12px] font-medium text-[#18181B] mb-1.5"
                >
                  Application Role
                </label>
                <select
                  id="edit-user-role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors cursor-pointer"
                >
                  <option value="team_member">Team Member</option>
                  <option value="hod">Head of Department (HOD)</option>
                  <option value="admin">Administrator</option>
                  <option value="it_support_admin">IT Support Admin</option>
                </select>
              </div>

              {/* Department */}
              <div>
                <label
                  htmlFor="edit-user-department-select"
                  className="block text-[12px] font-medium text-[#18181B] mb-1.5"
                >
                  Department
                </label>
                <select
                  id="edit-user-department-select"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors cursor-pointer"
                >
                  <option value="">No Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Account Status Checkbox */}
            <div className="pt-1">
              <label className="flex items-center gap-2 text-[13px] font-medium text-[#18181B] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#059669] focus:ring-[#059669] border-[#D4D4D8] accent-[#059669]"
                />
                <span>Account is Active</span>
              </label>
              <p className="text-[11.5px] text-[#71717A] ml-6 mt-0.5">
                Inactive accounts cannot log in or be assigned new deliverables.
              </p>
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
              disabled={isSubmitting || !fullName.trim()}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
