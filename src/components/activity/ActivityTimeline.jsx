import React from 'react';
import { groupActivitiesByDate } from '../../utils/activity/groupActivitiesByDate';
import ActivityEventRow from './ActivityEventRow';
import { ChevronDown, Loader2 } from 'lucide-react';

/**
 * Timeline view rendering chronological activity grouped by date cards.
 */
export default function ActivityTimeline({
  activities = [],
  onTaskClick,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
}) {
  const dateGroups = groupActivitiesByDate(activities);

  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {dateGroups.map((group) => (
        <div
          key={group.key}
          className="bg-white rounded-xl border border-[#E5E7EB] shadow-2xs overflow-hidden"
        >
          {/* Date Group Header */}
          <div className="px-5 py-3 bg-[#FAFAFA] border-b border-[#E5E7EB] flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-[#71717A] uppercase">
              {group.label}
            </span>
            <span className="text-xs text-[#A1A1AA] font-medium">
              {group.items.length} {group.items.length === 1 ? 'event' : 'events'}
            </span>
          </div>

          {/* Group Activities List */}
          <div className="divide-y divide-[#F4F4F5]">
            {group.items.map((item, idx) => (
              <ActivityEventRow
                key={item.id || `${group.key}-${idx}`}
                item={item}
                isFirst={idx === 0}
                isLast={idx === group.items.length - 1}
                onTaskClick={onTaskClick}
              />
            ))}
          </div>
        </div>
      ))}

      {/* "Load earlier activity" Pagination */}
      {hasMore && (
        <div className="pt-2 pb-6 flex justify-center">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-[#F9FAFB] active:bg-[#F4F4F5] text-[#52525B] hover:text-[#18181B] text-xs font-semibold rounded-lg border border-[#E5E7EB] shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#71717A]" />
                <span>Loading earlier activity...</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Load earlier activity</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
