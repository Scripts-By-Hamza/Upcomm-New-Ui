import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';
import { EditTaskForm } from '../../components/tasks/edit/EditTaskForm';
import { ArrowLeft } from 'lucide-react';

export function EditTaskPage() {
  const { taskId, id } = useParams();
  const navigate = useNavigate();
  const { tasks, allTasks } = useAppData();

  const effectiveTaskId = taskId || id;
  const taskList = allTasks || tasks || [];
  const task = taskList.find((t) => t.id === effectiveTaskId);

  if (!task) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center bg-white rounded-[12px] border border-[#E5E7EB] font-['Inter']">
        <h3 className="text-base font-bold text-[#18181B]">Task Not Found</h3>
        <p className="text-xs text-[#71717A] mt-1">The task you are trying to edit does not exist or has been removed.</p>
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="mt-4 px-4 py-2 bg-[#F4F4F5] hover:bg-[#E5E7EB] text-[#18181B] rounded-[8px] text-[12.5px] font-medium transition-colors cursor-pointer"
        >
          Back to Task List
        </button>
      </div>
    );
  }

  return (
    <div
      className="max-w-3xl mx-auto space-y-6 font-['Inter'] pb-12"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 select-none">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[#F4F4F5] rounded-[8px] transition-colors text-[#71717A] hover:text-[#18181B] cursor-pointer"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
            Edit Task
          </h1>
          <p className="text-[12px] font-mono font-medium text-[#71717A] mt-0.5">
            {task.task_number || 'TM-0000'}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
        <EditTaskForm
          task={task}
          isDrawer={false}
          onSuccess={() => navigate(`/tasks/${task.id}`)}
          onCancel={() => navigate(-1)}
        />
      </div>
    </div>
  );
}
