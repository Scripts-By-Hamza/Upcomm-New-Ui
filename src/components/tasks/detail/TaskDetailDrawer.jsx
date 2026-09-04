import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../../../contexts/AppDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { TaskDetailContent } from './TaskDetailContent';
import {
  ExternalLink,
  MoreHorizontal,
  X,
  Edit2,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { getTaskPermissions } from '../../../utils/taskPermissions';
import { EditTaskModal } from '../EditTaskModal';
import { RequestDeleteModal } from '../RequestDeleteModal';

export function TaskDetailDrawer({
  taskId,
  task: propTask,
  onClose,
  onEditTask,
  onOpenEdit,
}) {
  const { allTasks, tasks, softDeleteTask } = useAppData();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const menuRef = useRef(null);

  const effectiveTaskId = taskId || propTask?.id;
  const taskList = allTasks || tasks || [];
  const task = propTask || taskList.find((t) => t.id === effectiveTaskId);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key closes drawer
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isEditModalOpen && !isDeleteModalOpen) {
        onClose?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditModalOpen, isDeleteModalOpen]);

  const handleCopyLink = () => {
    if (!task) return;
    const url = `${window.location.origin}/tasks/${task.id}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
      setIsMenuOpen(false);
    }, 1500);
  };

  const handleOpenFullPage = () => {
    if (!task) return;
    navigate(`/tasks/${task.id}`);
  };

  const permissions = task ? getTaskPermissions(task, currentUser) : {};

  return (
    <>
      {/* 1. Subtle Semi-Transparent Neutral Backdrop Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 top-16 bg-slate-900/15 backdrop-blur-[0.5px] z-30 transition-opacity animate-fade-in"
        aria-hidden="true"
      />

      {/* 2. Right-Side Drawer Container */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="fixed right-0 top-16 bottom-0 w-full sm:w-[680px] max-w-full bg-white border-l border-[#E5E7EB] shadow-2xl z-40 flex flex-col font-['Inter'] animate-slide-in-right"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Drawer Header */}
        <div className="h-14 px-5 sm:px-7 border-b border-[#E5E7EB] flex items-center justify-between flex-shrink-0 bg-white select-none">
          {/* Left: Task Number */}
          <span className="font-mono text-[12px] font-semibold text-[#71717A]">
            {task?.task_number || 'TM-0000'}
          </span>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            {/* Open Full Page Action */}
            <button
              type="button"
              onClick={handleOpenFullPage}
              className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
              title="Open full page"
              aria-label="Open task in full page"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* More Menu */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className={`p-1.5 rounded-[6px] transition-colors cursor-pointer ${
                  isMenuOpen
                    ? 'bg-[#F4F4F5] text-[#18181B]'
                    : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                }`}
                title="More actions"
                aria-label="More task actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5 text-left text-[12px] font-medium text-[#52525B]">
                  {permissions.canEdit && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onEditTask) {
                          onEditTask(task.id);
                        } else if (onOpenEdit) {
                          onOpenEdit(task.id);
                        } else {
                          navigate(`/tasks/edit/${task.id}`);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[#F5F6F8] hover:text-[#18181B] cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#71717A]" />
                      <span>Edit Task</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-[#F5F6F8] hover:text-[#18181B] cursor-pointer"
                  >
                    {copiedLink ? (
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-[#71717A]" />
                    )}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Task Link'}</span>
                  </button>

                  {(permissions.canDelete || permissions.canRequestDelete) && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (permissions.canDelete) {
                          if (window.confirm('Are you sure you want to soft-delete this task?')) {
                            softDeleteTask(task.id, currentUser.id);
                            onClose?.();
                          }
                        } else {
                          setIsDeleteModalOpen(true);
                        }
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] hover:bg-red-50 text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span>{permissions.canDelete ? 'Delete Task' : 'Request Delete'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Close X Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer ml-1"
              title="Close drawer"
              aria-label="Close task drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {task ? (
          <div className="flex-1 min-h-0">
            <TaskDetailContent task={task} isDrawer onClose={onClose} />
          </div>
        ) : (
          <div className="p-8 text-center space-y-3">
            <h4 className="text-[15px] font-semibold text-[#18181B]">Task Unavailable</h4>
            <p className="text-[12.5px] text-[#71717A]">
              You may not have access to this task, or it may have been removed.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] rounded-[8px] text-[12.5px] font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}

        {/* Edit & Delete Modals */}
        {task && (
          <>
            <EditTaskModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              task={task}
            />
            <RequestDeleteModal
              isOpen={isDeleteModalOpen}
              onClose={() => setIsDeleteModalOpen(false)}
              task={task}
            />
          </>
        )}
      </aside>
    </>
  );
}
