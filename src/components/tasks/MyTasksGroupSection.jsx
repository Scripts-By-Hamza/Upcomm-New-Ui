import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MyTasksRow } from './MyTasksRow';

export function MyTasksGroupSection({
  groupId,
  title,
  tasks = [],
  previewLimit = null,
  isCollapsed = false,
  onToggleCollapse,
  isExpanded = false,
  onToggleExpand,
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  selectedTaskIds = [],
  onToggleSelectTask,
  onUpdateStatus,
  onUpdatePriority,
  onRequestCompletion,
  onRequestDelete,
  onDirectDelete,
  onOpenTask,
  onEditTask,
}) {
  if (tasks.length === 0) return null;

  const shouldLimit = previewLimit !== null && !isExpanded && tasks.length > previewLimit;
  const visibleTasks = shouldLimit ? tasks.slice(0, previewLimit) : tasks;
  const remainingCount = tasks.length - (previewLimit || 0);

  return (
    <>
      {/* 1. Group Header Row */}
      <tr className="bg-[#F8F9FA] border-b border-[#E5E7EB] select-none">
        <td colSpan={9} className="py-2 px-4">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-2 text-left cursor-pointer group"
            aria-expanded={!isCollapsed}
            aria-label={`${title} section, ${tasks.length} tasks`}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#71717A] group-hover:text-[#18181B] transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#71717A] group-hover:text-[#18181B] transition-transform" />
            )}
            <span className="text-[12px] font-bold text-[#18181B] tracking-wider uppercase">
              {title}
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-[#E4E4E7] text-[#52525B]">
              {tasks.length}
            </span>
          </button>
        </td>
      </tr>

      {/* 2. Group Rows (when not collapsed) */}
      {!isCollapsed && (
        <>
          {visibleTasks.map((task) => (
            <MyTasksRow
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
              onUpdatePriority={onUpdatePriority}
              onRequestCompletion={onRequestCompletion}
              onRequestDelete={onRequestDelete}
              onDirectDelete={onDirectDelete}
              onOpenTask={onOpenTask}
              onEditTask={onEditTask}
            />
          ))}

          {/* 3. Preview Expansion Row */}
          {previewLimit !== null && tasks.length > previewLimit && (
            <tr className="border-b border-[#F4F4F5] bg-white">
              <td colSpan={9} className="py-2 pl-12 pr-4 text-left">
                <button
                  type="button"
                  onClick={onToggleExpand}
                  className="text-[12px] font-medium text-[#71717A] hover:text-[#059669] transition-colors cursor-pointer flex items-center gap-1.5"
                  aria-label={
                    isExpanded
                      ? `Show less ${title.toLowerCase()} tasks`
                      : `Show ${remainingCount} more ${title.toLowerCase()} tasks`
                  }
                >
                  <span>
                    {isExpanded
                      ? 'Show less'
                      : `${remainingCount} more ${title.toLowerCase()} tasks`}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </td>
            </tr>
          )}
        </>
      )}
    </>
  );
}
