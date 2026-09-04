import React from 'react';

export function DepartmentPerformancePanel({ departments = [] }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="text-[14px] font-semibold text-[#18181B]">
          Department Performance
        </h3>
        <p className="text-[12px] text-[#71717A] mt-0.5">
          Completion rate by department
        </p>
      </div>

      {departments.length === 0 ? (
        <div className="py-8 text-center text-[#8B8B95] text-[12.5px]">
          No departmental data available in this scope.
        </div>
      ) : (
        <div className="space-y-3.5">
          {departments.map((dept, idx) => {
            // Colors: Top performer green #16A34A, others restrained blue/green #2563EB or #059669
            const barColor = idx === 0 ? 'bg-[#16A34A]' : 'bg-[#2563EB]';

            return (
              <div key={dept.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-[#18181B] truncate max-w-[200px]">
                    {dept.name}
                  </span>
                  <span className="font-semibold text-[#18181B]">
                    {dept.completionRate}%
                  </span>
                </div>

                <div className="w-full h-2 bg-[#F4F4F5] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${Math.max(3, dept.completionRate)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
