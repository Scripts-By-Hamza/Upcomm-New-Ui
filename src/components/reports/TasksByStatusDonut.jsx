import React from 'react';

export function TasksByStatusDonut({ distribution }) {
  const {
    total = 0,
    pending = { count: 0, percentage: 0 },
    inProgress = { count: 0, percentage: 0 },
    completed = { count: 0, percentage: 0 },
  } = distribution || {};

  // Donut SVG geometry
  const size = 160;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Arc stroke dash offsets
  const pendingLength = (pending.percentage / 100) * circumference;
  const inProgressLength = (inProgress.percentage / 100) * circumference;
  const completedLength = (completed.percentage / 100) * circumference;

  const inProgressOffset = -pendingLength;
  const completedOffset = -(pendingLength + inProgressLength);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <h3 className="text-[14px] font-semibold text-[#18181B] mb-2">
        Tasks by Status
      </h3>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-2">
        {/* SVG Donut */}
        <div className="relative w-[140px] h-[140px] flex items-center justify-center flex-shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full transform -rotate-90"
          >
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#F4F4F5"
              strokeWidth={strokeWidth}
            />

            {total > 0 && (
              <>
                {/* 1. Pending (Gray) */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#94A3B8"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${pendingLength} ${circumference}`}
                  strokeDashoffset="0"
                />

                {/* 2. In Progress (Blue) */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${inProgressLength} ${circumference}`}
                  strokeDashoffset={inProgressOffset}
                />

                {/* 3. Completed (Green) */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="#16A34A"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${completedLength} ${circumference}`}
                  strokeDashoffset={completedOffset}
                />
              </>
            )}
          </svg>

          {/* Center Total Count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[20px] font-bold text-[#18181B] leading-none">
              {total}
            </span>
            <span className="text-[10.5px] font-medium text-[#71717A] mt-0.5">
              Total
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-2.5 text-[12.5px] min-w-[130px]">
          {/* Pending */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
              <span className="text-[#52525B]">Pending</span>
            </div>
            <div className="font-semibold text-[#18181B]">{pending.percentage}%</div>
          </div>

          {/* In Progress */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
              <span className="text-[#52525B]">In Progress</span>
            </div>
            <div className="font-semibold text-[#18181B]">{inProgress.percentage}%</div>
          </div>

          {/* Completed */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16A34A]" />
              <span className="text-[#52525B]">Completed</span>
            </div>
            <div className="font-semibold text-[#18181B]">{completed.percentage}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
