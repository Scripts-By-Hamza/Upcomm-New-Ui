import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PersonalTaskCard } from './PersonalTaskCard';
import { Plus } from 'lucide-react';

export function KanbanColumn({
  id,
  title,
  tasks = [],
  onAddTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onStatusChange,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'Column',
      columnId: id,
    },
  });

  const taskIds = tasks.map((t) => t.id);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col rounded-[12px] bg-[#F8F9FA] border transition-all duration-150 p-3.5 font-['Inter'] min-h-[380px] ${
        isOver
          ? 'border-[#059669] ring-2 ring-[#059669]/20 bg-[#ECFDF5]/30'
          : 'border-[#E5E7EB]'
      }`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. Column Header */}
      <div className="flex items-center justify-between gap-2 mb-3 px-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-[12.5px] font-bold text-[#18181B] tracking-wider uppercase">
            {title}
          </h3>
          <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-[#E4E4E7] text-[#52525B]">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* 2. Task Cards List (Sortable Droppable Container) */}
      <div className="flex-1 space-y-2.5">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <PersonalTaskCard
                key={task.id}
                task={task}
                onView={onViewTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onStatusChange={onStatusChange}
              />
            ))
          ) : (
            <div className="h-28 flex flex-col items-center justify-center p-4 text-center border-2 border-dashed border-[#E5E7EB] rounded-[10px] bg-white/60">
              <p className="text-[11.5px] font-medium text-[#8B8B95]">No tasks here</p>
            </div>
          )}
        </SortableContext>
      </div>

      {/* 3. Bottom + Add task Action */}
      {onAddTask && (
        <button
          type="button"
          onClick={() => onAddTask(id)}
          className="w-full py-1.5 mt-2 text-[12px] font-medium text-[#71717A] hover:text-[#059669] hover:bg-white rounded-[7px] transition-colors cursor-pointer flex items-center gap-1.5 pl-1.5 select-none"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add task</span>
        </button>
      )}
    </div>
  );
}
