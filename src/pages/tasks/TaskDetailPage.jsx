import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { TaskDetailContent } from '../../components/tasks/detail/TaskDetailContent';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { getTaskPermissions } from '../../utils/taskPermissions';
import { EditTaskModal } from '../../components/tasks/EditTaskModal';
import { RequestDeleteModal } from '../../components/tasks/RequestDeleteModal';

export function TaskDetailPage() {
  const { taskId, id } = useParams();
  const navigate = useNavigate();
  const { tasks, allTasks, softDeleteTask } = useAppData();
  const { currentUser } = useAuth();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const effectiveTaskId = taskId || id;
  const taskList = allTasks || tasks || [];
  const task = taskList.find((t) => t.id === effectiveTaskId);

  if (!task) {
    return (
      <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#E5E7EB] font-['Inter'] shadow-xs max-w-xl mx-auto my-12" style={{ fontFamily: 'Inter, sans-serif' }}>
        <h3 className="text-lg font-bold text-[#18181B]">Task Not Found</h3>
        <p className="text-xs text-[#71717A] mt-1.5">
          The requested deliverable does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="mt-5 px-4 py-2 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer"
        >
          Back to Task List
        </button>
      </div>
    );
  }

  const permissions = getTaskPermissions(task, currentUser);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1500);
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto font-['Inter'] pb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header with Back Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </button>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {permissions.canEdit && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] text-[12.5px] font-medium text-[#18181B] transition-colors cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Edit Task</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] text-[12.5px] font-medium text-[#18181B] transition-colors cursor-pointer shadow-2xs"
          >
            {copiedLink ? (
              <Check className="w-3.5 h-3.5 text-[#059669]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#71717A]" />
            )}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
          </button>

          {(permissions.canDelete || permissions.canRequestDelete) && (
            <button
              type="button"
              onClick={() => {
                if (permissions.canDelete) {
                  if (window.confirm('Are you sure you want to soft-delete this task?')) {
                    softDeleteTask(task.id, currentUser.id);
                    navigate('/tasks');
                  }
                } else {
                  setIsDeleteModalOpen(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-red-50 text-[12.5px] font-medium text-[#DC2626] transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>{permissions.canDelete ? 'Delete' : 'Request Delete'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Task Detail Container */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] shadow-xs overflow-hidden min-h-[500px]">
        {/* Task Number Top Bar */}
        <div className="h-12 px-6 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <span className="font-mono text-[12px] font-semibold text-[#71717A]">
            {task.task_number || 'TM-0000'}
          </span>
        </div>

        {/* Task Detail Shared Content */}
        <TaskDetailContent task={task} isDrawer={false} />
      </div>

      {/* Edit & Delete Modals */}
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
    </div>
  );
}
