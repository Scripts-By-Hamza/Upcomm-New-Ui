import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Info } from 'lucide-react';

export function AddUserModal({
  isOpen,
  onClose,
  onSubmit,
  departments = [],
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [customId, setCustomId] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('team_member');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setEmail('');
      setCustomId('');
      setDesignation('');
      setRole('team_member');
      setDepartmentId(departments[0]?.id || '');
      setError('');
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, departments]);

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

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setError('Full name is required.');
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid work email address.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const defaultCustomId = customId.trim() || trimmedName.split(/\s+/)[0];
      await onSubmit({
        full_name: trimmedName,
        email: trimmedEmail,
        custom_id: defaultCustomId || null,
        designation: designation.trim() || 'Team Member Specialist',
        role,
        department_id: departmentId || null,
      });

      onClose();
    } catch (err) {
      console.error('Failed to create user:', err);
      setError(err?.message || 'Failed to create user account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-user-dialog-title"
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
              id="add-user-dialog-title"
              className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] tracking-tight"
            >
              Add New User
            </h2>
            <p className="text-[12.5px] text-[#71717A] mt-0.5">
              Provision a staff account with role and department assignment.
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
                htmlFor="user-fullname-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Full Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="user-fullname-input"
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Tariq Mahmood"
                className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
              />
            </div>

            {/* Work Email */}
            <div>
              <label
                htmlFor="user-email-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Work Email <span className="text-[#DC2626]">*</span>
              </label>
              <input
                id="user-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="name@upcomm.com"
                className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
              />
            </div>

            {/* Job Title / Designation */}
            <div>
              <label
                htmlFor="user-designation-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Job Title / Designation
              </label>
              <input
                id="user-designation-input"
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                placeholder="e.g. Senior Frontend Developer"
                className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
              />
            </div>

            {/* Custom User ID (Unique ID for CSV task import & quick assignments) */}
            <div>
              <label
                htmlFor="user-customid-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Unique User ID (First Name / Identifier){' '}
                <span className="text-[11px] font-normal text-[#71717A]">(e.g. Ahmed, Hamza — used for CSV import)</span>
              </label>
              <input
                id="user-customid-input"
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="e.g. Ahmed, Hamza, Ahsan (leave blank to auto-use first name)"
                className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95] font-mono"
              />
            </div>

            {/* Role & Department Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {/* Role */}
              <div>
                <label
                  htmlFor="user-role-select"
                  className="block text-[12px] font-medium text-[#18181B] mb-1.5"
                >
                  Application Role
                </label>
                <select
                  id="user-role-select"
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
                  htmlFor="user-department-select"
                  className="block text-[12px] font-medium text-[#18181B] mb-1.5"
                >
                  Department
                </label>
                <select
                  id="user-department-select"
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

            {/* Informational Callout */}
            <div className="flex items-start gap-2 p-2.5 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] text-[12px] text-[#71717A] leading-relaxed">
              <Info className="w-4 h-4 text-[#8B8B95] flex-shrink-0 mt-0.5" />
              <span>
                Default password is automatically set to <code className="font-mono font-medium text-[#18181B] bg-[#E4E4E7] px-1 py-0.2 rounded">123456</code>. The user can sign in immediately.
              </span>
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
              disabled={isSubmitting || !fullName.trim() || !email.trim()}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Adding...' : 'Add User'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
