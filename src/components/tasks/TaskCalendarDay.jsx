import React, { useState } from 'react';
import { format } from 'date-fns';
import { TaskCalendarChip } from './TaskCalendarChip';
import { TaskCalendarDayPopover } from './TaskCalendarDayPopover';

export function TaskCalendarDay({
  day,
  isCurrentMonth,
  isToday,
  tasks = [],
  onOpenTask,
}) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const dayNumber = format(day, 'd');
  const visibleTasks = tasks.slice(0, 3);
  const extraCount = tasks.length > 3 ? tasks.length - 3 : 0;

  const accessibleLabel = `${format(day, 'EEEE, MMMM d, yyyy')}, ${tasks.length} tasks`;

  return (
    <div
      className={`min-h-[140px] lg:min-h-[150px] p-2 bg-white border-b border-r border-[#E5E7EB] flex flex-col justify-between transition-colors relative ${
        !isCurrentMonth ? 'bg-[#FAFAFA]/80' : 'hover:bg-[#FCFCFD]'
      }`}
      aria-label={accessibleLabel}
    >
      {/* Top: Day Number */}
      <div className="flex items-center justify-between mb-1.5">
        {isToday ? (
          <span className="w-6 h-6 rounded-full bg-[#059669] text-white flex items-center justify-center font-bold text-[12px] shadow-xs">
            {dayNumber}
          </span>
        ) : (
          <span
            className={`text-[12.5px] font-medium pl-0.5 ${
              isCurrentMonth ? 'text-[#18181B]' : 'text-[#A1A1AA]'
            }`}
          >
            {dayNumber}
          </span>
        )}
      </div>

      {/* Center: Task Chips */}
      <div className="space-y-1 flex-1 min-w-0">
        {visibleTasks.map((task) => (
          <TaskCalendarChip
            key={task.id}
            task={task}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>

      {/* Bottom: +N More Popover Trigger */}
      {extraCount > 0 && (
        <div className="pt-1 relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPopoverOpen(true);
            }}
            className="text-[11px] font-semibold text-[#71717A] hover:text-[#059669] hover:underline cursor-pointer pl-0.5"
          >
            +{extraCount} more
          </button>

          {/* Floating Day Popover */}
          <TaskCalendarDayPopover
            date={day}
            tasks={tasks}
            isOpen={isPopoverOpen}
            onClose={() => setIsPopoverOpen(false)}
            onOpenTask={onOpenTask}
          />
        </div>
      )}
    </div>
  );
}
