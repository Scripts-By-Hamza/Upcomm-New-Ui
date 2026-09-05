import React from 'react';
import { TaskListRow } from './TaskListRow';
import { TaskMobileRow } from './TaskMobileRow';
import { ListTodo, Search, RotateCcw, MessageSquare } from 'lucide-react';
import { getTaskDepartmentsInfo } from '../../utils/taskDepartmentUtils';

export function TaskListTable({
  tasks = [],
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  onUpdateStatus,
  onUpdatePriority,
  onRequestCompletion,
  onRequestDelete,
  onDirectDelete,
  visibleColumns = {},
  selectedGroup = 'none',
  hasActiveFilters = false,
  onResetFilters,
  onOpenTask,
  onEditTask,
  unreadFilter = false,
  onClearUnread,
}) {
  // Empty State Rendering
  if (tasks.length === 0) {
    if (unreadFilter) {
      return (
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center select-none shadow-none space-y-2.5 dark:bg-[#18181B] dark:border-[#27272A]">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto text-[#059669] dark:bg-[#064E3B]/30 dark:text-[#34D399]">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
            No unread messages
          </h3>
          <p className="text-[13px] text-[#71717A] max-w-sm mx-auto dark:text-[#A1A1AA]">
            You're all caught up on task conversations.
          </p>
          {(onClearUnread || onResetFilters) && (
            <button
              type="button"
              onClick={onClearUnread || onResetFilters}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] text-[12.5px] font-semibold rounded-[7px] transition-colors cursor-pointer mt-2 dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399] dark:hover:bg-[#064E3B]/50"
            >
              <span>Show all tasks</span>
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center select-none shadow-none space-y-2.5 dark:bg-[#18181B] dark:border-[#27272A]">
        <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto text-[#71717A] dark:bg-[#27272A] dark:text-[#A1A1AA]">
          {hasActiveFilters ? (
            <Search className="w-5 h-5" />
          ) : (
            <ListTodo className="w-5 h-5 text-[#059669]" />
          )}
        </div>
        <h3 className="text-[15px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
          {hasActiveFilters ? 'No matching tasks' : 'No tasks found'}
        </h3>
        <p className="text-[13px] text-[#71717A] max-w-sm mx-auto dark:text-[#A1A1AA]">
          {hasActiveFilters
            ? 'No tasks match your current filter and search criteria. Try adjusting or clearing your filters.'
            : 'There are no deliverables currently available in this workspace.'}
        </p>
        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer mt-2 dark:bg-[#27272A] dark:hover:bg-[#3F3F46] dark:text-[#F4F4F5]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#71717A] dark:text-[#A1A1AA]" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    );
  }

  // Grouping logic if selectedGroup !== 'none'
  const computeGroups = () => {
    const groups = {};

    tasks.forEach((task) => {
      let groupKey = 'Other';

      if (selectedGroup === 'status') {
        const rawStatus = task.status || 'pending';
        groupKey =
          rawStatus === 'in_progress'
            ? 'In Progress'
            : rawStatus === 'completed'
            ? 'Completed'
            : 'Pending';
      } else if (selectedGroup === 'department') {
        const allDepts = getTaskDepartmentsInfo(task, users, departments) || [];
        const primaryDept = allDepts.find((d) => d?.isPrimary) || allDepts[0] || null;
        groupKey = primaryDept?.name || 'No Department';
      } else if (selectedGroup === 'priority') {
        const rawPriority = task.priority?.toLowerCase() || 'low';
        groupKey =
          rawPriority === 'urgent'
            ? 'Urgent'
            : rawPriority === 'high'
            ? 'High'
            : rawPriority === 'medium'
            ? 'Medium'
            : 'Low';
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(task);
    });

    return groups;
  };

  const renderGroupedRows = () => {
    const groups = computeGroups();

    return Object.keys(groups).map((groupTitle) => {
      const groupTasks = groups[groupTitle];

      return (
        <React.Fragment key={groupTitle}>
          {/* Group Header Row */}
          <tr className="bg-[#F8F9FA] dark:bg-[#1F2227] border-y border-[#E5E7EB] dark:border-[#27272A]">
            <td colSpan={10} className="py-2 px-4">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5] tracking-wider uppercase">
                  {groupTitle}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10.5px] font-semibold bg-[#E4E4E7] dark:bg-[#2A2E34] text-[#52525B] dark:text-[#C4C7CE]">
                  {groupTasks.length}
                </span>
              </div>
            </td>
          </tr>

          {groupTasks.map((task, idx) => (
            <TaskListRow
              key={task.id}
              task={task}
              isLastRow={idx >= groupTasks.length - 2}
              currentUser={currentUser}
              users={users}
              departments={departments}
              completionRequests={completionRequests}
              readChatIds={readChatIds}
              onUpdateStatus={onUpdateStatus}
              onUpdatePriority={onUpdatePriority}
              onRequestCompletion={onRequestCompletion}
              onRequestDelete={onRequestDelete}
              onDirectDelete={onDirectDelete}
              visibleColumns={visibleColumns}
              onOpenTask={onOpenTask}
              onEditTask={onEditTask}
            />
          ))}
        </React.Fragment>
      );
    });
  };

  const renderMobileGroupedRows = () => {
    const groups = computeGroups();

    return Object.keys(groups).map((groupTitle) => {
      const groupTasks = groups[groupTitle];

      return (
        <div key={groupTitle} className="border-b border-[#E5E7EB] dark:border-[#27272A] last:border-b-0">
          <div className="px-3.5 py-2 bg-[#F8F9FA] dark:bg-[#1F2227] flex items-center justify-between">
            <span className="text-[12px] font-bold text-[#18181B] dark:text-[#F4F4F5] tracking-wider uppercase">
              {groupTitle}
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[10.5px] font-semibold bg-[#E4E4E7] dark:bg-[#2A2E34] text-[#52525B] dark:text-[#C4C7CE]">
              {groupTasks.length}
            </span>
          </div>

          <div className="divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
            {groupTasks.map((task) => (
              <TaskMobileRow
                key={task.id}
                task={task}
                currentUser={currentUser}
                users={users}
                departments={departments}
                completionRequests={completionRequests}
                readChatIds={readChatIds}
                onUpdateStatus={onUpdateStatus}
                onRequestCompletion={onRequestCompletion}
                onRequestDelete={onRequestDelete}
                onDirectDelete={onDirectDelete}
                onOpenTask={onOpenTask}
                onEditTask={onEditTask}
              />
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-t-[10px] shadow-none overflow-hidden select-none">
      {/* Desktop Table View (md: and up) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="h-10 bg-white dark:bg-[#18181B] border-b border-[#E5E7EB] dark:border-[#27272A] text-[12px] text-[#71717A] dark:text-[#A1A1AA] font-medium">
              {/* Columns */}
              <th className="pl-4 py-2 pr-3 font-medium min-w-[220px]">Task</th>
              {visibleColumns.status !== false && (
                <th className="py-2 pr-3 font-medium min-w-[125px]">Status</th>
              )}
              {visibleColumns.assignee !== false && (
                <th className="py-2 pr-3 font-medium w-20">Assignee</th>
              )}
              {visibleColumns.assist !== false && (
                <th className="py-2 pr-3 font-medium w-20">Assist</th>
              )}
              {visibleColumns.priority !== false && (
                <th className="py-2 pr-3 font-medium">Priority</th>
              )}
              {visibleColumns.department !== false && (
                <th className="py-2 pr-3 font-medium min-w-[120px]">Department</th>
              )}
              {visibleColumns.due_date !== false && (
                <th className="py-2 pr-3 font-medium">Due Date</th>
              )}
              {visibleColumns.activity !== false && (
                <th className="py-2 pr-4 font-medium text-right w-28">Activity</th>
              )}
            </tr>
          </thead>

          <tbody>
            {selectedGroup !== 'none'
              ? renderGroupedRows()
              : tasks.map((task, index) => (
                  <TaskListRow
                    key={task.id}
                    task={task}
                    isLastRow={index >= tasks.length - 2}
                    currentUser={currentUser}
                    users={users}
                    departments={departments}
                    completionRequests={completionRequests}
                    readChatIds={readChatIds}
                    onUpdateStatus={onUpdateStatus}
                    onUpdatePriority={onUpdatePriority}
                    onRequestCompletion={onRequestCompletion}
                    onRequestDelete={onRequestDelete}
                    onDirectDelete={onDirectDelete}
                    visibleColumns={visibleColumns}
                    onOpenTask={onOpenTask}
                    onEditTask={onEditTask}
                  />
                ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card / Row View (< md) */}
      <div className="md:hidden divide-y divide-[#E5E7EB] dark:divide-[#27272A]">
        {selectedGroup !== 'none' ? (
          renderMobileGroupedRows()
        ) : (
          tasks.map((task) => (
            <TaskMobileRow
              key={task.id}
              task={task}
              currentUser={currentUser}
              users={users}
              departments={departments}
              completionRequests={completionRequests}
              readChatIds={readChatIds}
              onUpdateStatus={onUpdateStatus}
              onRequestCompletion={onRequestCompletion}
              onRequestDelete={onRequestDelete}
              onDirectDelete={onDirectDelete}
              onOpenTask={onOpenTask}
              onEditTask={onEditTask}
            />
          ))
        )}
      </div>
    </div>
  );
}
