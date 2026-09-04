import React from 'react';
import { Check, Trash2 } from 'lucide-react';

export function InboxCategoryIcon({ type }) {
  if (type === 'delete') {
    return (
      <div
        className="w-10 h-10 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center text-[#DC2626] flex-shrink-0"
        aria-hidden="true"
      >
        <Trash2 className="w-4 h-4" />
      </div>
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full bg-[#ECFDF5] border border-[#A7F3D0]/60 flex items-center justify-center text-[#059669] flex-shrink-0"
      aria-hidden="true"
    >
      <Check className="w-4 h-4 stroke-[2.5]" />
    </div>
  );
}
