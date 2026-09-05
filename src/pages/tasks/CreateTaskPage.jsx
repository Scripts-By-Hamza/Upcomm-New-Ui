import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CreateTaskForm } from '../../components/tasks/create/CreateTaskForm';
import { ImportTaskDialog } from '../../components/tasks/import/ImportTaskDialog';
import { ArrowLeft, FileUp } from 'lucide-react';

export function CreateTaskPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const [isImportOpen, setIsImportOpen] = useState(false);

  const role = currentUser?.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHod = role === 'hod';

  const initialStatus = searchParams.get('status') || 'pending';
  const initialDepartmentId = searchParams.get('department') || '';

  return (
    <div
      className="max-w-3xl mx-auto space-y-6 font-['Inter'] pb-12"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
            className="p-2 hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] rounded-[8px] transition-colors text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white cursor-pointer"
            title="Back to Tasks"
            aria-label="Back to Tasks"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] dark:text-white tracking-tight">
              Create New Task
            </h1>
            <p className="text-[12.5px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
              {isAdmin
                ? 'Assign company tasks with deliverables to one or multiple HODs, Admins, or Team Members'
                : isHod
                ? 'Assign deliverables to your department team, other HODs, or Executive Admins'
                : 'Create a personal task or assign a deliverable to any Department HOD'}
            </p>
          </div>
        </div>

        {/* Import Task Secondary Outlined Button (Admin Only) */}
        {isAdmin && (
          <div className="flex items-center sm:self-center pl-10 sm:pl-0">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="h-[38px] sm:h-[40px] px-3.5 rounded-[8px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[#18181B] dark:text-white hover:bg-[#F5F6F8] dark:hover:bg-[#27272A] text-[12.5px] font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
            >
              <FileUp className="w-4 h-4 text-[#71717A] dark:text-[#A1A1AA]" />
              <span>Import Task</span>
            </button>
          </div>
        )}
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] p-6 sm:p-8 shadow-xs">
        <CreateTaskForm
          isDrawer={false}
          initialStatus={initialStatus}
          initialDepartmentId={initialDepartmentId}
          onSuccess={() => navigate('/tasks')}
          onCancel={() => navigate('/tasks')}
        />
      </div>

      {/* CSV Import Dialog */}
      <ImportTaskDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={() => navigate('/tasks')}
      />
    </div>
  );
}

