import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmUserActionDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'danger', // 'danger' | 'primary'
  onClose,
  onConfirm,
  isProcessing = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in select-none">
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                confirmVariant === 'danger'
                  ? 'bg-red-50 text-[#DC2626]'
                  : 'bg-emerald-50 text-[#059669]'
              }`}
            >
              <AlertTriangle className="w-4.5 h-4.5" />
            </div>
            <h3 className="text-[15px] font-semibold text-[#18181B]">
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] hover:bg-[#F4F4F5] text-[#8B8B95] hover:text-[#18181B] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-2">
          <p className="text-[13px] text-[#52525B] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 p-5 pt-4 border-t border-[#F4F4F5] mt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-3.5 py-1.5 text-[13px] font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-[7px] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className={`px-4 py-1.5 text-[13px] font-semibold text-white rounded-[7px] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
              confirmVariant === 'danger'
                ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                : 'bg-[#059669] hover:bg-[#047857]'
            }`}
          >
            {isProcessing ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
