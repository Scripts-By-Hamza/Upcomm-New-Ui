import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useNavigate } from 'react-router-dom';
import { TaskBoardCard } from './TaskBoardCard';
import { Plus, ListTodo } from 'lucide-react';

export function TaskBoardColumn({
  columnId,
  title,
  tasks = [],
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  onRequestDelete,
  onDirectDelete,
  onOpenTask,
  onEditTask,
}) {
  const navigate = useNavigate();
  const { setNodeRef, isOver } = useDroppable({
    id: columnId,
  });

  const taskIds = React.useMemo(() => tasks.map((t) => t.id), [tasks]);

  const getEmptyMessage = () => {
    switch (columnId) {
      case 'in_progress':
        return 'No tasks in progress';
      case 'completed':
        return 'No completed tasks';
      case 'pending':
      default:
        return 'No pending tasks';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-[12px] border transition-all select-none p-3 space-y-3 min-w-[280px] ${
        isOver
          ? 'bg-[#F0F7FF]/60 border-[#93C5FD] ring-2 ring-[#3B82F6]/15'
          : 'bg-[#F8F9FA] border-[#E5E7EB]'
      }`}
      aria-label={`${title} tasks, ${tasks.length} tasks`}
    >
      {/* 1. Column Header */}
      <div className="flex items-center justify-between px-1 pt-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[12px] font-bold text-[#18181B] tracking-wider uppercase">
            {title}
          </h3>
          <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold bg-[#E4E4E7] text-[#52525B] flex items-center justify-center">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* 2. Sortable Task Cards List */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 min-h-[140px] flex-1">
          {tasks.length === 0 ? (
            <div className="h-32 flex flex-col items-center justify-center border border-dashed border-[#E4E4E7] rounded-[10px] p-4 text-center">
              <ListTodo className="w-5 h-5 text-[#A1A1AA] mb-1.5" />
              <p className="text-[12px] text-[#A1A1AA] font-medium">
                {getEmptyMessage()}
              </p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskBoardCard
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
            ))
          )}
        </div>
      </SortableContext>

      {/* 3. Add Task Button at Bottom */}
      {columnId !== 'completed' && (
        <button
          type="button"
          onClick={() => navigate(`/tasks/create?status=${columnId}`)}
          className="w-full py-2 px-3 flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-[#71717A] hover:text-[#059669] hover:bg-white rounded-[8px] border border-transparent hover:border-[#E5E7EB] transition-all cursor-pointer shadow-none hover:shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Task</span>
        </button>
      )}
    </div>
  );
}
