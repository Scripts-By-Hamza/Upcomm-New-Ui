import React from 'react';

export function OverdueTrendPanel({ overdueTrend }) {
  const { weeklyData = [], currentOverdueRate = 0 } = overdueTrend || {};

  const svgWidth = 700;
  const svgHeight = 150;
  const paddingTop = 25;
  const paddingBottom = 25;
  const paddingLeft = 30;
  const paddingRight = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(...weeklyData.map((d) => d.overdueCount || 0), 5);

  const getX = (idx) => {
    if (weeklyData.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (idx / (weeklyData.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  };

  const trendPoints = weeklyData.map((d, i) => `${getX(i)},${getY(d.overdueCount || 0)}`).join(' ');

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none">
      {/* Header with Title + Current Overdue Rate Right Badge */}
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h3 className="text-[14px] font-semibold text-[#18181B]">
            Overdue Trend
          </h3>
        </div>

        <div className="text-right">
          <div className="text-[26px] font-bold text-[#DC2626] leading-none font-mono">
            {currentOverdueRate}%
          </div>
          <div className="text-[11.5px] text-[#71717A] mt-0.5">
            current overdue rate
          </div>
        </div>
      </div>

      {/* SVG Weekly Bar + Trend Chart */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
        >
          {/* Subtle Grid Lines */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight / 2}
            x2={svgWidth - paddingRight}
            y2={paddingTop + chartHeight / 2}
            stroke="#F4F4F5"
            strokeDasharray="4 4"
          />
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight}
            x2={svgWidth - paddingRight}
            y2={paddingTop + chartHeight}
            stroke="#E5E7EB"
          />

          {/* Red Trend Line */}
          {weeklyData.length > 1 && (
            <polyline
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={trendPoints}
            />
          )}

          {/* Weekly Columns & Markers */}
          {weeklyData.map((d, idx) => {
            const x = getX(idx);
            const y = getY(d.overdueCount || 0);
            const barWidth = 26;
            const barHeight = Math.max(4, paddingTop + chartHeight - y);

            return (
              <g key={idx}>
                {/* Column bar */}
                <rect
                  x={x - barWidth / 2}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="3"
                  fill="#DC2626"
                  opacity="0.85"
                />

                {/* Top value label */}
                <text
                  x={x}
                  y={y - 7}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#18181B"
                  fontFamily="Inter, sans-serif"
                >
                  {d.overdueCount}
                </text>

                {/* Bottom week label */}
                <text
                  x={x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#71717A"
                  fontFamily="Inter, sans-serif"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
