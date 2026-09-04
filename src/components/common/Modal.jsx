import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal dialog box */}
      <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
        <div
          className={`relative w-[calc(100vw-24px)] sm:w-full ${maxWidth} max-h-[88vh] flex flex-col bg-white dark:bg-[#18181B] rounded-[12px] shadow-xl border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden transform transition-all animate-scale-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] flex-shrink-0">
            <h3 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B] dark:text-[#F4F4F5] truncate pr-2 tracking-tight">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white rounded-[6px] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer flex-shrink-0"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-[#18181B] dark:text-[#F4F4F5]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Modal;
