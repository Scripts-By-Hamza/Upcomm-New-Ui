import React, { useState } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { PersonalKanbanBoard } from '../../components/kanban/PersonalKanbanBoard';
import { CreatePersonalTaskModal } from '../../components/kanban/CreatePersonalTaskModal';
import { ViewPersonalTaskModal } from '../../components/kanban/ViewPersonalTaskModal';
import { Lock, Plus } from 'lucide-react';

export function PersonalTasksPage() {
  const { currentUser } = useAuth();
  const {
    personalTasks = [],
    createPersonalTask,
    updatePersonalTaskStatus,
    updatePersonalTask,
    deletePersonalTask,
    reorderPersonalTasks,
  } = useAppData();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalInitialStatus, setModalInitialStatus] = useState('pending');
  const [editingTask, setEditingTask] = useState(null);
  const [viewingTask, setViewingTask] = useState(null);

  const handleOpenCreateModal = (status = 'pending') => {
    setEditingTask(null);
    setModalInitialStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setViewingTask(null);
    setEditingTask(task);
    setIsCreateModalOpen(true);
  };

  const handleOpenViewModal = (task) => {
    setViewingTask(task);
  };

  // Keep viewingTask in sync with live tasks data if status changes
  const activeViewingTask = viewingTask
    ? personalTasks.find((t) => t.id === viewingTask.id) || viewingTask
    : null;

  return (
    <div className="space-y-6 max-w-full font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Page Header with Title, Privacy Tag and Add Personal Task Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-2xl sm:text-[26px] font-bold text-[#18181B] tracking-tight">
            Personal Tasks
          </h1>
          <p className="text-[13.5px] text-[#71717A] mt-0.5">
            Private tasks visible only to you.
          </p>
        </div>

        {/* Top Right Action: Outlined Add Personal Task Button (Desktop only, hidden on mobile) */}
        <button
          type="button"
          onClick={() => handleOpenCreateModal('pending')}
          className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-[#18181B] hover:bg-[#ECFDF5] dark:hover:bg-[#064E3B]/20 text-[#059669] dark:text-[#34D399] border border-[#059669] dark:border-[#059669]/50 rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer shadow-none flex-shrink-0 self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Add Personal Task</span>
        </button>
      </div>

      {/* 2. Main Private Kanban Board Workspace */}
      <PersonalKanbanBoard
        tasks={personalTasks}
        onStatusChange={updatePersonalTaskStatus}
        onReorder={reorderPersonalTasks}
        onAddTask={handleOpenCreateModal}
        onViewTask={handleOpenViewModal}
        onEditTask={handleOpenEditModal}
        onDeleteTask={deletePersonalTask}
      />

      {/* 3. View Task Details Modal */}
      <ViewPersonalTaskModal
        isOpen={Boolean(activeViewingTask)}
        onClose={() => setViewingTask(null)}
        task={activeViewingTask}
        onEdit={handleOpenEditModal}
        onDelete={deletePersonalTask}
        onStatusChange={updatePersonalTaskStatus}
      />

      {/* 4. Create / Edit Task Modal */}
      <CreatePersonalTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialStatus={modalInitialStatus}
        editingTask={editingTask}
        onCreate={createPersonalTask}
        onUpdate={updatePersonalTask}
      />
    </div>
  );
}
