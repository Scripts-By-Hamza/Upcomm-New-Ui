import React, { useState } from 'react';

export function TaskCompletionTrendChart({ trendSeries = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (trendSeries.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-6 h-[340px] flex items-center justify-center text-[#71717A] text-[13px] select-none">
        No trend data available for this reporting period.
      </div>
    );
  }

  // Dimensions
  const svgWidth = 640;
  const svgHeight = 220;
  const paddingLeft = 35;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Calculate maximum value for Y scale
  const maxVal = Math.max(
    ...trendSeries.map((d) => Math.max(d.createdCount || 0, d.completedCount || 0)),
    5
  );
  const yTicks = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  // Coordinates helper
  const getX = (index) => {
    if (trendSeries.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (trendSeries.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return paddingTop + chartHeight - (val / maxVal) * chartHeight;
  };

  // Build SVG path strings
  const createdPoints = trendSeries.map((d, i) => `${getX(i)},${getY(d.createdCount || 0)}`).join(' ');
  const completedPoints = trendSeries.map((d, i) => `${getX(i)},${getY(d.completedCount || 0)}`).join(' ');

  // X Axis Ticks (Show ~5-6 evenly spaced date labels)
  const tickStep = Math.max(1, Math.floor(trendSeries.length / 5));
  const xTickIndices = [];
  for (let i = 0; i < trendSeries.length; i += tickStep) {
    xTickIndices.push(i);
  }
  if (!xTickIndices.includes(trendSeries.length - 1)) {
    xTickIndices.push(trendSeries.length - 1);
  }

  const activePoint = hoverIndex !== null ? trendSeries[hoverIndex] : null;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-4 mb-3">
        <h3 className="text-[14px] font-semibold text-[#18181B]">
          Task Completion Trend
        </h3>

        {/* Inline Legend */}
        <div className="flex items-center gap-4 text-[12px] font-medium text-[#52525B]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#2563EB] rounded-full inline-block" />
            <span>Created</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#16A34A] rounded-full inline-block" />
            <span>Completed</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Horizontal Gridlines & Y-Axis Labels */}
          {yTicks.map((tickVal, idx) => {
            const y = getY(tickVal);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#F1F3F5"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="#8B8B95"
                  fontFamily="Inter, sans-serif"
                >
                  {tickVal}
                </text>
              </g>
            );
          })}

          {/* Line 1: Created (Blue) */}
          <polyline
            fill="none"
            stroke="#2563EB"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={createdPoints}
          />

          {/* Line 2: Completed (Green) */}
          <polyline
            fill="none"
            stroke="#16A34A"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={completedPoints}
          />

          {/* Interactive Hover Guides & Circles */}
          {trendSeries.map((d, idx) => {
            const x = getX(idx);
            const isHovered = hoverIndex === idx;

            return (
              <g key={idx}>
                {/* Invisible hover trigger zone */}
                <rect
                  x={x - chartWidth / trendSeries.length / 2}
                  y={paddingTop}
                  width={chartWidth / trendSeries.length}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoverIndex(idx)}
                />

                {isHovered && (
                  <>
                    {/* Vertical guideline */}
                    <line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + chartHeight}
                      stroke="#D4D4D8"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />

                    {/* Point 1: Created */}
                    <circle
                      cx={x}
                      cy={getY(d.createdCount || 0)}
                      r="4"
                      fill="#2563EB"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />

                    {/* Point 2: Completed */}
                    <circle
                      cx={x}
                      cy={getY(d.completedCount || 0)}
                      r="4"
                      fill="#16A34A"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* X-Axis Date Labels */}
          {xTickIndices.map((idx) => {
            const d = trendSeries[idx];
            if (!d) return null;
            const x = getX(idx);
            return (
              <text
                key={idx}
                x={x}
                y={svgHeight - 8}
                textAnchor="middle"
                fontSize="10.5"
                fill="#71717A"
                fontFamily="Inter, sans-serif"
              >
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {activePoint && hoverIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-900 text-white rounded-[6px] px-2.5 py-1.5 text-[11.5px] shadow-lg z-30 transform -translate-x-1/2 transition-all space-y-0.5"
            style={{
              left: `${(getX(hoverIndex) / svgWidth) * 100}%`,
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-0.5 mb-1">
              {activePoint.label}
            </div>
            <div className="flex items-center justify-between gap-3 text-blue-300">
              <span>Created:</span>
              <span className="font-semibold text-white">{activePoint.createdCount}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-emerald-300">
              <span>Completed:</span>
              <span className="font-semibold text-white">{activePoint.completedCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
