import React, { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns';
import { toLocalDateKey, isTaskOverdue } from '../../utils/dateUtils';
import { TaskCalendarDay } from './TaskCalendarDay';
import { TaskUpcomingDeadlines } from './TaskUpcomingDeadlines';
import { TaskCalendarChip } from './TaskCalendarChip';

const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function TaskCalendar({
  tasks = [],
  currentMonth = new Date(),
  users = [],
  departments = [],
  onOpenTask,
}) {
  const [mobileSelectedDate, setMobileSelectedDate] = useState(new Date());

  // 1. Generate full calendar day cells starting on Monday
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  // 2. Memoize tasksByDate map using local date keys
  const tasksByDate = useMemo(() => {
    const map = {};
    (tasks || []).forEach((task) => {
      if (!task.due_date) return;
      const key = toLocalDateKey(task.due_date);
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });

    // Deterministic sort within each day
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => {
        const isOverdueA = isTaskOverdue(a.due_date, a.status);
        const isOverdueB = isTaskOverdue(b.due_date, b.status);
        if (isOverdueA && !isOverdueB) return -1;
        if (!isOverdueA && isOverdueB) return 1;

        const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
        const pA = weight[a.priority?.toLowerCase()] || 0;
        const pB = weight[b.priority?.toLowerCase()] || 0;
        if (pA !== pB) return pB - pA;

        return (a.title || '').localeCompare(b.title || '');
      });
    });

    return map;
  }, [tasks]);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toLocalDateKey(today), [today]);

  const mobileSelectedDateKey = useMemo(
    () => toLocalDateKey(mobileSelectedDate),
    [mobileSelectedDate]
  );
  const mobileSelectedTasks = tasksByDate[mobileSelectedDateKey] || [];

  return (
    <div className="space-y-4 select-none">
      {/* Main Content Row: Calendar Grid (Desktop) + Right Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left / Main Calendar Surface */}
        <div className="lg:col-span-9 bg-white rounded-[12px] border border-[#E5E7EB] overflow-hidden shadow-2xs">
          {/* Weekday Column Headers (Desktop) */}
          <div className="hidden md:grid grid-cols-7 border-b border-[#E5E7EB] bg-[#F8F9FA] text-center text-[12px] font-semibold text-[#71717A] py-2.5">
            {WEEKDAYS.map((dayName) => (
              <div key={dayName} className="truncate px-1">
                {dayName}
              </div>
            ))}
          </div>

          {/* Desktop Month Grid */}
          <div className="hidden md:grid grid-cols-7 border-l border-t border-[#E5E7EB]">
            {calendarDays.map((day) => {
              const dateKey = toLocalDateKey(day);
              const dayTasks = tasksByDate[dateKey] || [];
              const isCurrMonth = isSameMonth(day, currentMonth);
              const isCurrDay = dateKey === todayKey;

              return (
                <TaskCalendarDay
                  key={dateKey}
                  day={day}
                  isCurrentMonth={isCurrMonth}
                  isToday={isCurrDay}
                  tasks={dayTasks}
                  onOpenTask={onOpenTask}
                />
              );
            })}
          </div>

          {/* Mobile Month Grid (< md) */}
          <div className="md:hidden p-3 space-y-3">
            <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-[#71717A] pb-2 border-b border-[#F4F4F5]">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dateKey = toLocalDateKey(day);
                const dayTasks = tasksByDate[dateKey] || [];
                const isCurrMonth = isSameMonth(day, currentMonth);
                const isCurrDay = dateKey === todayKey;
                const isSelected = isSameDay(day, mobileSelectedDate);

                return (
                  <button
                    key={dateKey}
                    type="button"
                    onClick={() => setMobileSelectedDate(day)}
                    className={`h-11 rounded-[8px] flex flex-col items-center justify-center p-1 transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-[#059669] text-white font-bold shadow-2xs'
                        : isCurrDay
                        ? 'bg-[#ECFDF5] text-[#059669] font-bold border border-[#A7F3D0]'
                        : isCurrMonth
                        ? 'text-[#18181B] hover:bg-[#F4F4F5]'
                        : 'text-[#A1A1AA] hover:bg-[#F4F4F5]'
                    }`}
                  >
                    <span className="text-[12px]">{format(day, 'd')}</span>
                    {dayTasks.length > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected
                            ? 'bg-white'
                            : dayTasks.some((t) => isTaskOverdue(t.due_date, t.status))
                            ? 'bg-[#DC2626]'
                            : 'bg-[#2563EB]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Selected Date Agenda */}
            <div className="pt-3 border-t border-[#F4F4F5] space-y-2">
              <h4 className="text-[12.5px] font-bold text-[#18181B]">
                {format(mobileSelectedDate, 'EEEE, MMMM d, yyyy')}
              </h4>
              {mobileSelectedTasks.length === 0 ? (
                <p className="text-[12px] text-[#A1A1AA] py-2">
                  No deadlines on this day
                </p>
              ) : (
                <div className="space-y-1.5">
                  {mobileSelectedTasks.map((task) => (
                    <TaskCalendarChip
                      key={task.id}
                      task={task}
                      onOpenTask={onOpenTask}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right / Upcoming Deadlines Panel */}
        <div className="lg:col-span-3">
          <TaskUpcomingDeadlines
            tasks={tasks}
            users={users}
            departments={departments}
            onOpenTask={onOpenTask}
          />
        </div>
      </div>

      {/* Bottom Status Legend */}
      <div className="flex flex-wrap items-center gap-6 pt-1 text-[12px] text-[#52525B]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#71717A]" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
          <span>Overdue</span>
        </div>
      </div>
    </div>
  );
}
