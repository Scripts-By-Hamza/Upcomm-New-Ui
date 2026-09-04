import React from 'react';

export function CommandSection({ label, children }) {
  return (
    <div className="py-1">
      {label && (
        <div className="px-3 pt-2 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#8B8B95] select-none">
          {label}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
