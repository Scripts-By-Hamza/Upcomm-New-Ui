import React, { useState, useMemo } from 'react';
import { startOfDay, addDays } from 'date-fns';
import { toLocalDateKey, isTaskOverdue } from '../../utils/dateUtils';
import { MyTasksGroupSection } from './MyTasksGroupSection';
import { TaskMobileRow } from './TaskMobileRow';
import { MessageSquare, Paperclip, ListTodo, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MyTasksPlannerList({
  tasks = [],
  showCompleted = false,
  onToggleShowCompleted,
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  selectedTaskIds = [],
  onToggleSelectTask,
  onToggleSelectAll,
  onUpdateStatus,
  onUpdatePriority,
  onRequestCompletion,
  onRequestDelete,
  onDirectDelete,
  hasActiveFilters = false,
  onResetFilters,
  onOpenTask,
  onEditTask,
  unreadFilter = false,
  onClearUnread,
}) {
  const navigate = useNavigate();

  // Collapsed & Expanded states for group sections
  const [collapsedGroups, setCollapsedGroups] = useState({
    overdue: false,
    today: false,
    upcoming: false,
    later: false,
    no_due: false,
    completed: false,
  });

  const [expandedGroups, setExpandedGroups] = useState({
    upcoming: false,
    later: false,
  });

  const toggleCollapse = (groupId) => {
    setCollapsedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleExpand = (groupId) => {
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // 1. Group tasks into precise time boundaries
  const groupedTasks = useMemo(() => {
    const today = startOfDay(new Date());
    const todayKey = toLocalDateKey(today);

    const upcomingStart = startOfDay(addDays(today, 1));
    const upcomingKey = toLocalDateKey(upcomingStart);

    const laterStart = startOfDay(addDays(today, 7));
    const laterKey = toLocalDateKey(laterStart);

    const groups = {
      overdue: [],
      today: [],
      upcoming: [],
      later: [],
      no_due: [],
      completed: [],
    };

    tasks.forEach((task) => {
      // Completed tasks
      if (task.status === 'completed') {
        groups.completed.push(task);
        return;
      }

      // No due date
      if (!task.due_date) {
        groups.no_due.push(task);
        return;
      }

      // Overdue
      if (isTaskOverdue(task.due_date, task.status)) {
        groups.overdue.push(task);
        return;
      }

      const taskDateKey = toLocalDateKey(task.due_date);

      if (taskDateKey === todayKey) {
        groups.today.push(task);
      } else if (taskDateKey >= upcomingKey && taskDateKey < laterKey) {
        groups.upcoming.push(task);
      } else if (taskDateKey >= laterKey) {
        groups.later.push(task);
      } else {
        // Any past date not caught by isTaskOverdue fallback
        groups.overdue.push(task);
      }
    });

    return groups;
  }, [tasks]);

  const activeCount =
    groupedTasks.overdue.length +
    groupedTasks.today.length +
    groupedTasks.upcoming.length +
    groupedTasks.later.length +
    groupedTasks.no_due.length;

  const totalVisibleCount = activeCount + (showCompleted ? groupedTasks.completed.length : 0);

  // Checkbox select-all logic
  const allVisibleTaskIds = useMemo(() => {
    const ids = [];
    ['overdue', 'today', 'upcoming', 'later', 'no_due'].forEach((g) => {
      groupedTasks[g].forEach((t) => ids.push(t.id));
    });
    if (showCompleted) {
      groupedTasks.completed.forEach((t) => ids.push(t.id));
    }
    return ids;
  }, [groupedTasks, showCompleted]);

  const isAllSelected =
    allVisibleTaskIds.length > 0 &&
    allVisibleTaskIds.every((id) => selectedTaskIds.includes(id));

  return (
    <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] overflow-hidden shadow-2xs select-none">
      {/* 1. Desktop Planner Table (md: and up) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left">
          {/* Header Row */}
          <thead>
            <tr className="h-10 bg-white dark:bg-[#18181B] border-b border-[#E5E7EB] dark:border-[#27272A] text-[12px] text-[#71717A] dark:text-[#A1A1AA] font-medium">
              <th className="pl-4 pr-2 w-9 py-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => onToggleSelectAll?.(allVisibleTaskIds, e.target.checked)}
                  className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                  aria-label="Select all visible tasks"
                />
              </th>
              <th className="py-2 pr-3 font-medium min-w-[220px]">Task</th>
              <th className="py-2 pr-3 font-medium min-w-[125px]">Status</th>
              <th className="py-2 pr-3 font-medium min-w-[105px]">Priority</th>
              <th className="py-2 pr-3 font-medium min-w-[120px]">Department</th>
              <th className="py-2 pr-3 font-medium w-24">Due Date</th>
              <th className="py-2 px-2 text-center w-12 font-medium" title="Comments">
                <MessageSquare className="w-3.5 h-3.5 mx-auto text-[#71717A] dark:text-[#A1A1AA]" />
              </th>
              <th className="py-2 px-2 text-center w-10 font-medium" title="Attachments">
                <Paperclip className="w-3.5 h-3.5 mx-auto text-[#71717A] dark:text-[#A1A1AA]" />
              </th>
              <th className="py-2 pr-4 text-right w-10 font-medium" />
            </tr>
          </thead>

          <tbody>
            {/* Empty State */}
            {totalVisibleCount === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center">
                  {unreadFilter ? (
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto text-[#059669] dark:bg-[#064E3B]/30 dark:text-[#34D399]">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <h4 className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                        No unread messages
                      </h4>
                      <p className="text-[12.5px] text-[#71717A] dark:text-[#A1A1AA]">
                        You're all caught up on task conversations.
                      </p>
                      {(onClearUnread || onResetFilters) && (
                        <button
                          type="button"
                          onClick={onClearUnread || onResetFilters}
                          className="mt-2 px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors cursor-pointer dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399] dark:hover:bg-[#064E3B]/50"
                        >
                          Show all tasks
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-sm mx-auto space-y-2">
                      <ListTodo className="w-8 h-8 text-[#A1A1AA] mx-auto opacity-60 dark:text-[#71717A]" />
                      <h4 className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                        {hasActiveFilters
                          ? 'No matching tasks'
                          : 'No tasks assigned to you'}
                      </h4>
                      <p className="text-[12.5px] text-[#71717A] dark:text-[#A1A1AA]">
                        {hasActiveFilters
                          ? 'Try clearing active filters to see your work.'
                          : "You don't have any active assigned tasks right now."}
                      </p>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={onResetFilters}
                          className="mt-2 px-3 py-1.5 rounded-[7px] text-[12px] font-semibold text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors cursor-pointer dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399] dark:hover:bg-[#064E3B]/50"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              <>
                {/* 1. OVERDUE Group */}
                <MyTasksGroupSection
                  groupId="overdue"
                  title="OVERDUE"
                  tasks={groupedTasks.overdue}
                  isCollapsed={collapsedGroups.overdue}
                  onToggleCollapse={() => toggleCollapse('overdue')}
                  currentUser={currentUser}
                  users={users}
                  departments={departments}
                  completionRequests={completionRequests}
                  readChatIds={readChatIds}
                  selectedTaskIds={selectedTaskIds}
                  onToggleSelectTask={onToggleSelectTask}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePriority={onUpdatePriority}
                  onRequestCompletion={onRequestCompletion}
                  onRequestDelete={onRequestDelete}
                  onDirectDelete={onDirectDelete}
                  onOpenTask={onOpenTask}
                  onEditTask={onEditTask}
                />

                {/* 2. TODAY Group */}
                <MyTasksGroupSection
                  groupId="today"
                  title="TODAY"
                  tasks={groupedTasks.today}
                  isCollapsed={collapsedGroups.today}
                  onToggleCollapse={() => toggleCollapse('today')}
                  currentUser={currentUser}
                  users={users}
                  departments={departments}
                  completionRequests={completionRequests}
                  readChatIds={readChatIds}
                  selectedTaskIds={selectedTaskIds}
                  onToggleSelectTask={onToggleSelectTask}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePriority={onUpdatePriority}
                  onRequestCompletion={onRequestCompletion}
                  onRequestDelete={onRequestDelete}
                  onDirectDelete={onDirectDelete}
                  onOpenTask={onOpenTask}
                  onEditTask={onEditTask}
                />

                {/* 3. UPCOMING Group (Previews 3 rows) */}
                <MyTasksGroupSection
                  groupId="upcoming"
                  title="UPCOMING"
                  tasks={groupedTasks.upcoming}
                  previewLimit={3}
                  isCollapsed={collapsedGroups.upcoming}
                  onToggleCollapse={() => toggleCollapse('upcoming')}
                  isExpanded={expandedGroups.upcoming}
                  onToggleExpand={() => toggleExpand('upcoming')}
                  currentUser={currentUser}
                  users={users}
                  departments={departments}
                  completionRequests={completionRequests}
                  readChatIds={readChatIds}
                  selectedTaskIds={selectedTaskIds}
                  onToggleSelectTask={onToggleSelectTask}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePriority={onUpdatePriority}
                  onRequestCompletion={onRequestCompletion}
                  onRequestDelete={onRequestDelete}
                  onDirectDelete={onDirectDelete}
                  onOpenTask={onOpenTask}
                  onEditTask={onEditTask}
                />

                {/* 4. LATER Group (Previews 2 rows) */}
                <MyTasksGroupSection
                  groupId="later"
                  title="LATER"
                  tasks={groupedTasks.later}
                  previewLimit={2}
                  isCollapsed={collapsedGroups.later}
                  onToggleCollapse={() => toggleCollapse('later')}
                  isExpanded={expandedGroups.later}
                  onToggleExpand={() => toggleExpand('later')}
                  currentUser={currentUser}
                  users={users}
                  departments={departments}
                  completionRequests={completionRequests}
                  readChatIds={readChatIds}
                  selectedTaskIds={selectedTaskIds}
                  onToggleSelectTask={onToggleSelectTask}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePriority={onUpdatePriority}
                  onRequestCompletion={onRequestCompletion}
                  onRequestDelete={onRequestDelete}
                  onDirectDelete={onDirectDelete}
                  onOpenTask={onOpenTask}
                  onEditTask={onEditTask}
                />

                {/* 5. NO DUE DATE Group (Conditional) */}
                <MyTasksGroupSection
                  groupId="no_due"
                  title="NO DUE DATE"
                  tasks={groupedTasks.no_due}
                  isCollapsed={collapsedGroups.no_due}
                  onToggleCollapse={() => toggleCollapse('no_due')}
                  currentUser={currentUser}
                  users={users}
                  departments={departments}
                  completionRequests={completionRequests}
                  readChatIds={readChatIds}
                  selectedTaskIds={selectedTaskIds}
                  onToggleSelectTask={onToggleSelectTask}
                  onUpdateStatus={onUpdateStatus}
                  onUpdatePriority={onUpdatePriority}
                  onRequestCompletion={onRequestCompletion}
                  onRequestDelete={onRequestDelete}
                  onDirectDelete={onDirectDelete}
                  onOpenTask={onOpenTask}
                  onEditTask={onEditTask}
                />

                {/* 6. COMPLETED Group (when shown) */}
                {showCompleted && (
                  <MyTasksGroupSection
                    groupId="completed"
                    title="COMPLETED"
                    tasks={groupedTasks.completed}
                    isCollapsed={collapsedGroups.completed}
                    onToggleCollapse={() => toggleCollapse('completed')}
                    currentUser={currentUser}
                    users={users}
                    departments={departments}
                    completionRequests={completionRequests}
                    readChatIds={readChatIds}
                    selectedTaskIds={selectedTaskIds}
                    onToggleSelectTask={onToggleSelectTask}
                    onUpdateStatus={onUpdateStatus}
                    onUpdatePriority={onUpdatePriority}
                    onRequestCompletion={onRequestCompletion}
                    onRequestDelete={onRequestDelete}
                    onDirectDelete={onDirectDelete}
                    onOpenTask={onOpenTask}
                    onEditTask={onEditTask}
                  />
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* 2. Mobile Grouped Cards View (< md) */}
      <div className="md:hidden divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
        {/* Mobile Select All Bar */}
        {allVisibleTaskIds.length > 0 && (
          <div className="px-3.5 py-2.5 bg-[#F8F9FA] dark:bg-[#1F2227] flex items-center justify-between border-b border-[#E5E7EB] dark:border-[#27272A]">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-[#52525B] dark:text-[#C4C7CE]">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => onToggleSelectAll?.(allVisibleTaskIds, e.target.checked)}
                className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer w-3.5 h-3.5"
              />
              <span>Select all ({allVisibleTaskIds.length})</span>
            </label>
            {selectedTaskIds.length > 0 && (
              <span className="text-[11.5px] font-semibold text-[#059669] dark:text-[#34D399]">
                {selectedTaskIds.length} selected
              </span>
            )}
          </div>
        )}

        {/* Empty State Mobile */}
        {totalVisibleCount === 0 ? (
          <div className="py-12 px-4 text-center">
            {unreadFilter ? (
              <div className="max-w-sm mx-auto space-y-2">
                <div className="w-10 h-10 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto text-[#059669] dark:bg-[#064E3B]/30 dark:text-[#34D399]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                  No unread messages
                </h4>
                <p className="text-[12.5px] text-[#71717A] dark:text-[#A1A1AA]">
                  You're all caught up on task conversations.
                </p>
                {(onClearUnread || onResetFilters) && (
                  <button
                    type="button"
                    onClick={onClearUnread || onResetFilters}
                    className="mt-2 px-3.5 py-1.5 rounded-[7px] text-[12px] font-semibold text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors cursor-pointer dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399]"
                  >
                    Show all tasks
                  </button>
                )}
              </div>
            ) : (
              <div className="max-w-sm mx-auto space-y-2">
                <ListTodo className="w-8 h-8 text-[#A1A1AA] mx-auto opacity-60 dark:text-[#71717A]" />
                <h4 className="text-[14px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                  {hasActiveFilters ? 'No matching tasks' : 'No tasks assigned to you'}
                </h4>
                <p className="text-[12.5px] text-[#71717A] dark:text-[#A1A1AA]">
                  {hasActiveFilters
                    ? 'Try clearing active filters to see your work.'
                    : "You don't have any active assigned tasks right now."}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="mt-2 px-3 py-1.5 rounded-[7px] text-[12px] font-semibold text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] transition-colors cursor-pointer dark:bg-[#064E3B]/30 dark:text-[#34D399]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {[
              { id: 'overdue', title: 'OVERDUE', tasks: groupedTasks.overdue },
              { id: 'today', title: 'TODAY', tasks: groupedTasks.today },
              { id: 'upcoming', title: 'UPCOMING', tasks: groupedTasks.upcoming, previewLimit: 3 },
              { id: 'later', title: 'LATER', tasks: groupedTasks.later, previewLimit: 2 },
              { id: 'no_due', title: 'NO DUE DATE', tasks: groupedTasks.no_due },
              ...(showCompleted ? [{ id: 'completed', title: 'COMPLETED', tasks: groupedTasks.completed }] : []),
            ].map((grp) => {
              if (grp.tasks.length === 0) return null;
              const isCollapsed = collapsedGroups[grp.id];
              const isExpanded = expandedGroups[grp.id];
              const shouldLimit = grp.previewLimit && !isExpanded && grp.tasks.length > grp.previewLimit;
              const visibleList = shouldLimit ? grp.tasks.slice(0, grp.previewLimit) : grp.tasks;
              const remainingCount = grp.tasks.length - (grp.previewLimit || 0);

              return (
                <div key={grp.id} className="border-b border-[#E5E7EB] dark:border-[#27272A] last:border-b-0">
                  {/* Group Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleCollapse(grp.id)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#F8F9FA] dark:bg-[#1F2227] hover:bg-[#F1F3F5] dark:hover:bg-[#22262B] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
                      )}
                      <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5] tracking-wider uppercase">
                        {grp.title}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#E4E4E7] dark:bg-[#2A2E34] text-[#52525B] dark:text-[#C4C7CE]">
                      {grp.tasks.length}
                    </span>
                  </button>

                  {/* Group Tasks Cards */}
                  {!isCollapsed && (
                    <div className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
                      {visibleList.map((task) => (
                        <TaskMobileRow
                          key={task.id}
                          task={task}
                          currentUser={currentUser}
                          users={users}
                          departments={departments}
                          completionRequests={completionRequests}
                          readChatIds={readChatIds}
                          isSelected={selectedTaskIds.includes(task.id)}
                          onToggleSelect={onToggleSelectTask}
                          onUpdateStatus={onUpdateStatus}
                          onRequestCompletion={onRequestCompletion}
                          onRequestDelete={onRequestDelete}
                          onDirectDelete={onDirectDelete}
                          onOpenTask={onOpenTask}
                          onEditTask={onEditTask}
                        />
                      ))}

                      {/* Show more preview expand button on mobile */}
                      {grp.previewLimit && grp.tasks.length > grp.previewLimit && (
                        <div className="p-2.5 bg-white dark:bg-[#18181B] text-center">
                          <button
                            type="button"
                            onClick={() => toggleExpand(grp.id)}
                            className="text-[12px] font-semibold text-[#059669] dark:text-[#34D399] hover:underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                          >
                            <span>
                              {isExpanded
                                ? 'Show less'
                                : `${remainingCount} more ${grp.title.toLowerCase()} tasks`}
                            </span>
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                isExpanded ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* 3. Planner Footer Row */}
      <div className="h-11 px-4 border-t border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] flex items-center justify-between text-[12.5px]">
        {/* Left: Active Task Count */}
        <span className="font-medium text-[#52525B] dark:text-[#C4C7CE]">
          {activeCount} active task{activeCount === 1 ? '' : 's'}
        </span>

        {/* Right: Show / Hide Completed Tasks Button */}
        <button
          type="button"
          onClick={onToggleShowCompleted}
          className="font-semibold text-[#059669] dark:text-[#34D399] hover:underline cursor-pointer transition-colors"
        >
          {showCompleted ? 'Hide completed tasks' : 'Show completed tasks'}
        </button>
      </div>
    </div>
  );
}
