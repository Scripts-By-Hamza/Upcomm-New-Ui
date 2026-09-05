import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';
import { TaskDetailContent } from '../../components/tasks/detail/TaskDetailContent';
import { ArrowLeft } from 'lucide-react';

export function TaskDetailPage() {
  const { taskId, id } = useParams();
  const navigate = useNavigate();
  const { tasks, allTasks } = useAppData();

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

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-['Inter'] pb-12" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Header with Back Navigation */}
      <div className="flex items-center justify-between gap-3 select-none">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#71717A] hover:text-[#18181B] transition-colors cursor-pointer self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Workspace</span>
        </button>
      </div>

      {/* Main Task Detail Layout (Fiverr style 2-column on desktop, stacked on mobile) */}
      <TaskDetailContent task={task} isDrawer={false} />
    </div>
  );
}
