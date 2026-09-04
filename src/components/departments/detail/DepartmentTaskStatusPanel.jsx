import React, { useMemo } from 'react';

export function DepartmentTaskStatusPanel({ tasks = [] }) {
  const { pendingCount, inProgressCount, completedCount, totalCount, pendingPct, inProgressPct, completedPct } =
    useMemo(() => {
      const nonDeleted = (tasks || []).filter((t) => !t.is_deleted);
      const total = nonDeleted.length;
      const pending = nonDeleted.filter((t) => t.status === 'pending').length;
      const inProgress = nonDeleted.filter((t) => t.status === 'in_progress').length;
      const completed = nonDeleted.filter((t) => t.status === 'completed').length;

      const pPct = total > 0 ? Math.round((pending / total) * 100) : 0;
      const ipPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
      const cPct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        pendingCount: pending,
        inProgressCount: inProgress,
        completedCount: completed,
        totalCount: total,
        pendingPct: pPct,
        inProgressPct: ipPct,
        completedPct: cPct,
      };
    }, [tasks]);

  // SVG Donut Calculations (Circumference: 2 * PI * 36 ≈ 226.19)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;

  // Segment strokeDasharray and offsets
  const pendingStroke = (pendingPct / 100) * circumference;
  const inProgressStroke = (inProgressPct / 100) * circumference;
  const completedStroke = (completedPct / 100) * circumference;

  const inProgressOffset = -pendingStroke;
  const completedOffset = -(pendingStroke + inProgressStroke);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between h-full">
      <div>
        <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B] mb-4">
          Task Status
        </h2>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Status Breakdown List */}
          <div className="space-y-3.5 flex-1 w-full min-w-0">
            {/* Pending */}
            <div className="flex items-center justify-between gap-3 text-[12.5px]">
              <div className="flex items-center gap-2 min-w-[90px]">
                <span className="w-2 h-2 rounded-full bg-[#8B8B95] flex-shrink-0" />
                <span className="text-[#52525B] font-medium">Pending</span>
              </div>
              <div className="w-20 sm:w-28 bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden flex-1 max-w-[120px]">
                <div
                  className="bg-[#8B8B95] h-full rounded-full transition-all duration-300"
                  style={{ width: `${pendingPct}%` }}
                />
              </div>
              <div className="text-right whitespace-nowrap min-w-[50px]">
                <span className="font-semibold text-[#18181B]">{pendingCount}</span>{' '}
                <span className="text-[#71717A] text-[11.5px]">({pendingPct}%)</span>
              </div>
            </div>

            {/* In Progress */}
            <div className="flex items-center justify-between gap-3 text-[12.5px]">
              <div className="flex items-center gap-2 min-w-[90px]">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] flex-shrink-0" />
                <span className="text-[#52525B] font-medium">In Progress</span>
              </div>
              <div className="w-20 sm:w-28 bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden flex-1 max-w-[120px]">
                <div
                  className="bg-[#2563EB] h-full rounded-full transition-all duration-300"
                  style={{ width: `${inProgressPct}%` }}
                />
              </div>
              <div className="text-right whitespace-nowrap min-w-[50px]">
                <span className="font-semibold text-[#18181B]">{inProgressCount}</span>{' '}
                <span className="text-[#71717A] text-[11.5px]">({inProgressPct}%)</span>
              </div>
            </div>

            {/* Completed */}
            <div className="flex items-center justify-between gap-3 text-[12.5px]">
              <div className="flex items-center gap-2 min-w-[90px]">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] flex-shrink-0" />
                <span className="text-[#52525B] font-medium">Completed</span>
              </div>
              <div className="w-20 sm:w-28 bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden flex-1 max-w-[120px]">
                <div
                  className="bg-[#16A34A] h-full rounded-full transition-all duration-300"
                  style={{ width: `${completedPct}%` }}
                />
              </div>
              <div className="text-right whitespace-nowrap min-w-[50px]">
                <span className="font-semibold text-[#18181B]">{completedCount}</span>{' '}
                <span className="text-[#71717A] text-[11.5px]">({completedPct}%)</span>
              </div>
            </div>
          </div>

          {/* SVG Donut Chart */}
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              {/* Background Ring */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-[#F4F4F5]"
                strokeWidth="8"
                fill="transparent"
              />

              {totalCount > 0 ? (
                <>
                  {/* Pending Segment */}
                  {pendingStroke > 0 && (
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      className="stroke-[#8B8B95] transition-all duration-500"
                      strokeWidth="8"
                      strokeDasharray={`${pendingStroke} ${circumference}`}
                      strokeDashoffset="0"
                      fill="transparent"
                    />
                  )}

                  {/* In Progress Segment */}
                  {inProgressStroke > 0 && (
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      className="stroke-[#2563EB] transition-all duration-500"
                      strokeWidth="8"
                      strokeDasharray={`${inProgressStroke} ${circumference}`}
                      strokeDashoffset={inProgressOffset}
                      fill="transparent"
                    />
                  )}

                  {/* Completed Segment */}
                  {completedStroke > 0 && (
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      className="stroke-[#16A34A] transition-all duration-500"
                      strokeWidth="8"
                      strokeDasharray={`${completedStroke} ${circumference}`}
                      strokeDashoffset={completedOffset}
                      fill="transparent"
                    />
                  )}
                </>
              ) : null}
            </svg>

            {/* Donut Center Count */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[20px] sm:text-[22px] font-bold text-[#18181B] leading-none">
                {totalCount}
              </span>
              <span className="text-[10px] text-[#71717A] font-semibold uppercase tracking-wider mt-0.5">
                Total
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
