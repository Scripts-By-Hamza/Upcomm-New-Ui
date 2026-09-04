import React from 'react';
import { Plus } from 'lucide-react';

export function DepartmentHeader({ canCreateDepartment, onNewDepartment }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#18181B] tracking-tight">
          Departments
        </h1>
        <p className="text-[13.5px] text-[#52525B] mt-1">
          Organize teams and work across UPCOMM.
        </p>
      </div>

      {canCreateDepartment && (
        <button
          type="button"
          onClick={onNewDepartment}
          className="inline-flex items-center justify-center gap-1.5 h-[38px] px-3.5 bg-white border border-[#059669] text-[#059669] hover:bg-[#ECFDF5] rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer shadow-none flex-shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#059669] stroke-[2.2]" />
          <span>New Department</span>
        </button>
      )}
    </div>
  );
}
