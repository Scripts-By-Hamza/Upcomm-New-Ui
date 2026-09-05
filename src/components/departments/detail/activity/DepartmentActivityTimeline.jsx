import React, { useState, useMemo } from 'react';
import { Avatar } from '../../../common/Avatar';
import {
  Activity,
  Paperclip,
  ArrowRight,
  FilterX,
  ChevronDown,
} from 'lucide-react';

export function DepartmentActivityTimeline({
  groupedActivities = [],
  totalCount = 0,
  hasActiveFilters = false,
  onResetFilters,
  onTaskClick,
}) {
  const [displayLimit, setDisplayLimit] = useState(25);

  if (groupedActivities.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-8 sm:p-12 text-center text-[#8B8B95] space-y-3 select-none">
        {hasActiveFilters ? (
          <>
            <FilterX className="w-8 h-8 text-[#71717A] mx-auto opacity-50 mb-1" />
            <h4 className="text-[14px] font-semibold text-[#18181B]">
              No activity matches these filters
            </h4>
            <p className="text-[12.5px] text-[#52525B] max-w-sm mx-auto">
              Try adjusting or clearing your active filters to see all department activity.
            </p>
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer"
              >
                <span>Clear filters</span>
              </button>
            )}
          </>
        ) : (
          <>
            <Activity className="w-8 h-8 text-[#71717A] mx-auto opacity-50 mb-1" />
            <h4 className="text-[14px] font-semibold text-[#18181B]">
              No department activity yet
            </h4>
            <p className="text-[12.5px] text-[#52525B] max-w-sm mx-auto">
              Activity related to tasks, status updates, attachments, and assignments in this department will appear here in chronological order.
            </p>
          </>
        )}
      </div>
    );
  }

  // Count items across groups and slice to displayLimit
  let itemsCounted = 0;
  const visibleGroups = [];

  for (const group of groupedActivities) {
    if (itemsCounted >= displayLimit) break;
    const remainingSlots = displayLimit - itemsCounted;
    const visibleItems = group.items.slice(0, remainingSlots);
    if (visibleItems.length > 0) {
      visibleGroups.push({
        ...group,
        items: visibleItems,
      });
      itemsCounted += visibleItems.length;
    }
  }

  const hasMore = totalCount > itemsCounted;

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + 25);
  };

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-3.5 sm:p-7 shadow-none select-none max-w-full">
      <div className="space-y-6 sm:space-y-8">
        {visibleGroups.map((group) => {
          const isTodayGroup = group.isToday;

          return (
            <div key={group.key} className="space-y-3 sm:space-y-4">
              {/* Date Header */}
              <h3 className="text-[11px] sm:text-[12px] font-bold text-[#71717A] uppercase tracking-wider select-none">
                {group.label}
              </h3>

              {/* Items List with Timeline Connector */}
              <div className="relative space-y-4 sm:space-y-6">
                {group.items.map((item, itemIdx) => {
                  const isLastItem = itemIdx === group.items.length - 1;
                  const dotColor = isTodayGroup ? 'bg-[#16A34A]' : 'bg-[#A1A1AA]';

                  return (
                    <div
                      key={item.id}
                      className="relative flex items-start gap-2.5 sm:gap-4 group"
                    >
                      {/* 1. Time Column (Desktop Only e.g. 10:42 AM) */}
                      <div className="hidden sm:block w-16 sm:w-20 text-right text-[12px] sm:text-[12.5px] font-medium text-[#71717A] pt-1 flex-shrink-0 font-mono">
                        {item.timeFormatted || '—'}
                      </div>

                      {/* 2. Timeline Connector Line & Dot */}
                      <div className="relative flex flex-col items-center flex-shrink-0 self-stretch">
                        {/* Dot */}
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ring-white z-10 mt-1.5 flex-shrink-0 transition-transform group-hover:scale-110`}
                          aria-hidden="true"
                        />

                        {/* Vertical line downwards (except if last item of group) */}
                        {!isLastItem && (
                          <div
                            className="absolute top-3 bottom-[-18px] sm:bottom-[-24px] w-[1px] bg-[#E5E7EB]"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      {/* 3. Actor Avatar */}
                      <div className="flex-shrink-0 pt-0.5">
                        <Avatar
                          src={item.actor?.avatar_url}
                          name={item.actor?.full_name || 'Team Member'}
                          size="sm"
                          className="w-7 h-7 sm:w-9 sm:h-9"
                        />
                      </div>

                      {/* 4. Event Content */}
                      <div className="min-w-0 flex-1 pt-0.5 text-left">
                        {/* Line 1: Primary Action Sentence with Mobile Time */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="text-[12.5px] sm:text-[13.5px] leading-snug text-[#18181B] min-w-0 flex-1 break-words">
                            <span className="font-semibold text-[#18181B] mr-1">
                              {item.actor?.full_name || 'Team Member'}
                            </span>
                            <span className="text-[#52525B] mr-1">{item.verb}</span>

                            {item.taskNumber && (
                              <button
                                type="button"
                                onClick={() => {
                                  const targetId = item.task?.id || item.rawLog?.entity_id || item.rawLog?.metadata?.task_id;
                                  if (targetId && onTaskClick) {
                                    onTaskClick(targetId);
                                  }
                                }}
                                className="font-semibold text-[#2563EB] hover:underline font-mono inline cursor-pointer mr-1 break-words"
                                title={`Open ${item.taskNumber}`}
                              >
                                {item.taskNumber}
                              </button>
                            )}

                            {item.targetSubject && (
                              <span className="text-[#18181B] font-normal break-words">
                                {item.targetSubject}
                              </span>
                            )}
                          </div>

                          {/* Time on mobile */}
                          <span className="sm:hidden text-[11px] font-medium text-[#71717A] tabular-nums font-mono flex-shrink-0 whitespace-nowrap pt-0.5">
                            {item.timeFormatted || '—'}
                          </span>
                        </div>

                        {/* Line 2: Secondary Metadata (Status transition, attachment, completion tag) */}
                        {item.secondary && (
                          <div className="mt-1">
                            {item.secondary.type === 'status_transition' && (
                              <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium">
                                {item.secondary.from && (
                                  <>
                                    <span className="text-[#71717A]">{item.secondary.from}</span>
                                    <span className="text-[#8B8B95]">→</span>
                                  </>
                                )}
                                <span
                                  className={
                                    item.secondary.to === 'Completed'
                                      ? 'text-[#16A34A] font-semibold'
                                      : item.secondary.to === 'In Progress'
                                      ? 'text-[#2563EB] font-semibold'
                                      : 'text-[#71717A] font-semibold'
                                  }
                                >
                                  {item.secondary.to}
                                </span>
                              </div>
                            )}

                            {item.secondary.type === 'attachment' && (
                              <div className="flex items-center gap-1.5 text-[11px] sm:text-[12px] text-[#52525B]">
                                <Paperclip className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
                                {item.secondary.url ? (
                                  <a
                                    href={item.secondary.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-[#2563EB] hover:underline truncate max-w-[200px] sm:max-w-sm"
                                  >
                                    {item.secondary.name}
                                  </a>
                                ) : (
                                  <span className="font-medium truncate max-w-[200px] sm:max-w-sm">
                                    {item.secondary.name}
                                  </span>
                                )}
                              </div>
                            )}

                            {item.secondary.type === 'completion_badge' && (
                              <div className="text-[11px] sm:text-[12px] text-[#059669] font-medium">
                                {item.secondary.label}
                              </div>
                            )}

                            {item.secondary.type === 'deletion_badge' && (
                              <div className="text-[11px] sm:text-[12px] text-[#DC2626] font-medium">
                                {item.secondary.label}
                                {item.secondary.reason ? ` (${item.secondary.reason})` : ''}
                              </div>
                            )}

                            {item.secondary.type === 'comment' && (
                              <div className="text-[11px] sm:text-[12px] text-[#71717A] italic line-clamp-1">
                                &ldquo;{item.secondary.text}&rdquo;
                              </div>
                            )}

                            {item.secondary.type === 'priority_transition' && (
                              <div className="flex items-center gap-1 text-[11px] sm:text-[12px] text-[#52525B]">
                                <span>{item.secondary.from}</span>
                                <span>→</span>
                                <span className="font-semibold text-[#18181B]">
                                  {item.secondary.to}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer: Load earlier activity */}
      {hasMore && (
        <div className="border-t border-[#F4F4F5] pt-4 sm:pt-5 mt-5 sm:mt-6 text-left">
          <button
            type="button"
            onClick={handleLoadMore}
            className="text-[12.5px] sm:text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] hover:underline transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <span>Load earlier activity</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default DepartmentActivityTimeline;
