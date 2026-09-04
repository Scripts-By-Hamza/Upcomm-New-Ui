import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, KeyRound } from 'lucide-react';
import { ChangePasswordModal } from './ChangePasswordModal';

export function ChangePasswordAlert() {
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!currentUser?.must_change_password) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-3.5 sm:p-4 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm font-medium animate-fade-in border border-amber-400/40">
        <div className="flex items-start sm:items-center gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-100 flex-shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">
            <strong className="font-bold">Security Reminder:</strong> You are currently using the default temporary password (<code className="bg-amber-700/60 px-1.5 py-0.5 rounded text-amber-100 font-mono text-xs">123456</code>). Please change your password.
          </span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 sm:py-1.5 bg-white text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer self-stretch sm:self-auto flex-shrink-0"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Change Password</span>
        </button>
      </div>

      <ChangePasswordModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
