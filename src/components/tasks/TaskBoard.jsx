import React, { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { TaskBoardColumn } from './TaskBoardColumn';
import { TaskBoardCard } from './TaskBoardCard';
import { getTaskPermissions } from '../../utils/taskPermissions';
import { AlertCircle, CheckCircle2, X, MessageSquare } from 'lucide-react';

const COLUMNS = [
  { id: 'pending', title: 'Pending' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
];

export function TaskBoard({
  tasks = [],
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  onUpdateStatus,
  onRequestCompletion,
  onRequestDelete,
  onDirectDelete,
  onOpenTask,
  onEditTask,
  unreadFilter = false,
  onClearUnread,
}) {
  const [activeTask, setActiveTask] = useState(null);
  const [mobileActiveTab, setMobileActiveTab] = useState('pending');
  const [feedback, setFeedback] = useState(null); // { type: 'info' | 'error' | 'success', message: string }

  // Sensors Configuration
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status columns
  const columnData = useMemo(() => {
    const grouped = {
      pending: [],
      in_progress: [],
      completed: [],
    };

    tasks.forEach((task) => {
      const rawStatus = task.status || 'pending';
      if (grouped[rawStatus]) {
        grouped[rawStatus].push(task);
      } else {
        grouped.pending.push(task);
      }
    });

    return grouped;
  }, [tasks]);

  // Drag Handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
      setFeedback(null);
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id;
    const overId = over.id;

    const draggedTask = tasks.find((t) => t.id === activeTaskId);
    if (!draggedTask) return;

    // Determine target column
    let destinationStatus = null;

    if (COLUMNS.some((col) => col.id === overId)) {
      destinationStatus = overId;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        destinationStatus = overTask.status || 'pending';
      }
    }

    if (!destinationStatus || destinationStatus === draggedTask.status) {
      return;
    }

    const permissions = getTaskPermissions(draggedTask, currentUser);

    // Prevent moving completed tasks casually
    if (draggedTask.status === 'completed' && !permissions.isAdmin) {
      setFeedback({
        type: 'info',
        message: 'Completed tasks are locked and cannot be moved directly.',
      });
      return;
    }

    // Dropping into Completed Column
    if (destinationStatus === 'completed') {
      if (permissions.mustRequestCompletion) {
        // Check if there is already a pending completion request
        const pendingRequest = (completionRequests || []).find(
          (r) => r.task_id === draggedTask.id && r.status === 'pending'
        );

        if (pendingRequest?.requested_by === currentUser?.id) {
          setFeedback({
            type: 'info',
            message: 'Completion has already been requested for this task and is awaiting approval.',
          });
          return;
        }

        try {
          await onRequestCompletion(draggedTask.id);
          setFeedback({
            type: 'success',
            message: 'Completion requested. The task will be marked complete once approved by the creator/admin.',
          });
        } catch (err) {
          setFeedback({
            type: 'error',
            message: err?.message || 'Failed to submit completion request.',
          });
        }
        return;
      }

      // User has direct completion permission
      try {
        await onUpdateStatus(draggedTask.id, 'completed');
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err?.message || 'Failed to update task status.',
        });
      }
      return;
    }

    // Moving between Pending and In Progress
    if (permissions.canUpdateGlobalTaskStatus) {
      try {
        await onUpdateStatus(draggedTask.id, destinationStatus);
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err?.message || 'Failed to update task status.',
        });
      }
    } else {
      setFeedback({
        type: 'error',
        message: 'You do not have permission to update this task status.',
      });
    }
  };

  return (
    <div className="space-y-3 select-none">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-[8px] text-[12.5px] border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]'
              : feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-[#DC2626]'
              : 'bg-blue-50 border-blue-200 text-[#2563EB]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="font-medium">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 hover:opacity-70 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Mobile Status Tabs (< md) */}
      <div className="flex md:hidden items-center gap-1.5 p-1.5 bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] select-none shadow-2xs">
        {COLUMNS.map((col) => {
          const isActive = mobileActiveTab === col.id;
          const count = columnData[col.id]?.length || 0;

          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setMobileActiveTab(col.id)}
              className={`flex-1 py-2 px-2.5 rounded-[9px] text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer outline-none focus:outline-none whitespace-nowrap min-w-0 ${
                isActive
                  ? 'bg-[#18181B] dark:bg-white text-white dark:text-[#18181B] shadow-xs'
                  : 'text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-[#F4F4F5] hover:bg-[#F4F4F5]/60 dark:hover:bg-[#27272A]/60'
              }`}
            >
              <span className="truncate">{col.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 min-w-[18px] text-center rounded-full font-bold inline-flex items-center justify-center flex-shrink-0 ${
                  isActive
                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#18181B]'
                    : 'bg-[#F4F4F5] dark:bg-[#27272A] text-[#52525B] dark:text-[#C4C7CE]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Unread Empty State or Main Kanban Board */}
      {unreadFilter && tasks.length === 0 ? (
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
          {onClearUnread && (
            <button
              type="button"
              onClick={onClearUnread}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#ECFDF5] hover:bg-[#D1FAE5] text-[#059669] text-[12.5px] font-semibold rounded-[7px] transition-colors cursor-pointer mt-2 dark:bg-[#064E3B]/30 dark:border-[#059669]/50 dark:text-[#34D399] dark:hover:bg-[#064E3B]/50"
            >
              <span>Show all tasks</span>
            </button>
          )}
        </div>
      ) : (
        /* Main Kanban Board with DndContext */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {/* Desktop 3-Column Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-3.5 lg:gap-4 items-start">
          {COLUMNS.map((col) => (
            <TaskBoardColumn
              key={col.id}
              columnId={col.id}
              title={col.title}
              tasks={columnData[col.id] || []}
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

        {/* Mobile Single Active Column */}
        <div className="md:hidden">
          {COLUMNS.filter((col) => col.id === mobileActiveTab).map((col) => (
            <TaskBoardColumn
              key={col.id}
              columnId={col.id}
              title={col.title}
              tasks={columnData[col.id] || []}
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

        {/* Drag Overlay for Moving Card */}
        <DragOverlay>
          {activeTask ? (
            <TaskBoardCard
              task={activeTask}
              currentUser={currentUser}
              users={users}
              departments={departments}
              completionRequests={completionRequests}
              readChatIds={readChatIds}
              isOverlay
            />
          ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
