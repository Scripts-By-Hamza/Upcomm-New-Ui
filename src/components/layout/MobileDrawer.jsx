import React from 'react';
import { Sidebar } from './Sidebar';
import { X } from 'lucide-react';

export function MobileDrawer({ isOpen, onClose, onOpenCommandPalette }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-64 z-50 animate-slide-right flex flex-col bg-white shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-3 z-50 text-[#71717A] hover:text-[#18181B] p-1.5 rounded-[6px] hover:bg-[#F1F3F5] transition-colors cursor-pointer"
          aria-label="Close navigation drawer"
        >
          <X className="w-4 h-4" />
        </button>
        <Sidebar
          className="w-full relative shadow-none border-r-0"
          onNavItemClick={onClose}
          onOpenCommandPalette={() => {
            onClose();
            if (onOpenCommandPalette) onOpenCommandPalette();
          }}
        />
      </div>
    </div>
  );
}
