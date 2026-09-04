import React from 'react';
import { TaskListRow } from './TaskListRow';
import { TaskMobileRow } from './TaskMobileRow';
import { ListTodo, Search, RotateCcw } from 'lucide-react';
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
}) {
  // Empty State Rendering
  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center select-none shadow-none space-y-2.5">
        <div className="w-12 h-12 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto text-[#71717A]">
          {hasActiveFilters ? (
            <Search className="w-5 h-5" />
          ) : (
            <ListTodo className="w-5 h-5 text-[#059669]" />
          )}
        </div>
        <h3 className="text-[15px] font-bold text-[#18181B]">
          {hasActiveFilters ? 'No matching tasks' : 'No tasks found'}
        </h3>
        <p className="text-[13px] text-[#71717A] max-w-sm mx-auto">
          {hasActiveFilters
            ? 'No tasks match your current filter and search criteria. Try adjusting or clearing your filters.'
            : 'There are no deliverables currently available in this workspace.'}
        </p>
        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer mt-2"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#71717A]" />
            <span>Clear Filters</span>
          </button>
        )}
      </div>
    );
  }

  // Grouping logic if selectedGroup !== 'none'
  const renderGroupedRows = () => {
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

    return Object.keys(groups).map((groupTitle) => {
      const groupTasks = groups[groupTitle];

      return (
        <React.Fragment key={groupTitle}>
          {/* Group Header Row */}
          <tr className="bg-[#F8F9FA] border-y border-[#E5E7EB]">
            <td colSpan={7} className="py-2 px-4">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold text-[#18181B]">
                  {groupTitle}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10.5px] font-semibold bg-[#E4E4E7] text-[#52525B]">
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

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-t-[10px] shadow-none overflow-hidden select-none">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="h-10 bg-white border-b border-[#E5E7EB] text-[12px] text-[#71717A] font-medium">
              {/* Columns */}
              <th className="pl-4 py-2 pr-3 font-medium min-w-[220px]">Task</th>
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
      <div className="md:hidden divide-y divide-[#E5E7EB]">
        {tasks.map((task) => (
          <TaskMobileRow
            key={task.id}
            task={task}
            currentUser={currentUser}
            users={users}
            departments={departments}
            completionRequests={completionRequests}
            readChatIds={readChatIds}
            onRequestDelete={onRequestDelete}
            onDirectDelete={onDirectDelete}
            onOpenTask={onOpenTask}
            onEditTask={onEditTask}
          />
        ))}
      </div>
    </div>
  );
}
