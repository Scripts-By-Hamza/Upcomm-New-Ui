import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { DEPARTMENT_ICON_LIST, getDepartmentIconComponent } from '../../utils/departmentIcons';

export function DepartmentModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  availableUsers = [],
}) {
  const isEditing = !!initialData?.id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');
  const [hodId, setHodId] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setIcon(initialData.icon || '');
        setHodId(initialData.hod_id || '');
      } else {
        setName('');
        setDescription('');
        setIcon('Code2');
        setHodId('');
      }
      setError('');
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [initialData, isOpen]);

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

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Department name is required.');
      if (nameInputRef.current) nameInputRef.current.focus();
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        name: trimmedName,
        description: description.trim(),
        icon: icon || null,
        hod_id: hodId || null,
      });
      onClose();
    } catch (err) {
      console.error('Failed to save department:', err);
      setError(err?.message || 'Failed to save department. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="department-dialog-title"
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
              id="department-dialog-title"
              className="text-[17px] sm:text-[18px] font-semibold text-[#18181B] tracking-tight"
            >
              {isEditing ? 'Edit Department' : 'New Department'}
            </h2>
            <p className="text-[12.5px] text-[#71717A] mt-0.5">
              {isEditing
                ? 'Update department details and management assignment.'
                : 'Create a departmental workspace for organizing teams and work.'}
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

            {/* Department Name */}
            <div>
              <label
                htmlFor="department-name-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Department Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                ref={nameInputRef}
                id="department-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Website Development & AI Automation"
                className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95]"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="department-desc-input"
                className="block text-[12px] font-medium text-[#18181B] mb-1.5"
              >
                Description
              </label>
              <textarea
                id="department-desc-input"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of department responsibilities and functions..."
                className="w-full min-h-[76px] max-h-[120px] p-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors placeholder:text-[#8B8B95] resize-y"
              />
            </div>

            {/* Department Icon & HOD Assignment */}
            <div className="space-y-4">
              {/* Department Icon Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-medium text-[#18181B]">
                    Department Icon
                  </label>
                  <span className="text-[11.5px] text-[#71717A]">
                    {DEPARTMENT_ICON_LIST.find(
                      (i) => i.key.toLowerCase() === (icon || '').toLowerCase()
                    )?.label || 'Selected Icon'}
                  </span>
                </div>
                <div className="p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[8px]">
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-[110px] overflow-y-auto pr-0.5">
                    {DEPARTMENT_ICON_LIST.map((item) => {
                      const ItemIcon = item.icon;
                      const isSelected =
                        (icon || '').toLowerCase() === item.key.toLowerCase();
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setIcon(item.key)}
                          title={item.label}
                          className={`h-9 rounded-[6px] flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ECFDF5] border-2 border-[#059669] text-[#059669] shadow-xs'
                              : 'bg-white border border-[#E5E7EB] text-[#52525B] hover:text-[#18181B] hover:border-[#D4D4D8]'
                          }`}
                        >
                          <ItemIcon className="w-4 h-4 stroke-[2]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Assign Active HOD */}
              <div>
                <label
                  htmlFor="department-hod-select"
                  className="block text-[12px] font-medium text-[#18181B] mb-1.5"
                >
                  Assign Active HOD
                </label>
                <select
                  id="department-hod-select"
                  value={hodId}
                  onChange={(e) => setHodId(e.target.value)}
                  className="w-full h-10 px-3 text-[13px] text-[#18181B] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669]/20 rounded-[8px] outline-none transition-colors cursor-pointer"
                >
                  <option value="">-- No HOD Assigned --</option>
                  {availableUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role?.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
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
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 text-[13px] font-medium text-white bg-[#059669] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>
                {isSubmitting
                  ? 'Saving...'
                  : isEditing
                  ? 'Save Changes'
                  : 'Create Department'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
