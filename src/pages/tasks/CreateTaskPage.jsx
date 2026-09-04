import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CreateTaskForm } from '../../components/tasks/create/CreateTaskForm';
import { ArrowLeft } from 'lucide-react';

export function CreateTaskPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

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
      <div className="flex items-center gap-3 select-none">
        <button
          type="button"
          onClick={() => navigate('/tasks')}
          className="p-2 hover:bg-[#F4F4F5] rounded-[8px] transition-colors text-[#71717A] hover:text-[#18181B] cursor-pointer"
          title="Back to Tasks"
          aria-label="Back to Tasks"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
            Create New Task
          </h1>
          <p className="text-[12.5px] text-[#71717A] mt-0.5">
            {isAdmin
              ? 'Assign company tasks with deliverables to one or multiple HODs, Admins, or Team Members'
              : isHod
              ? 'Assign deliverables to your department team, other HODs, or Executive Admins'
              : 'Create a personal task or assign a deliverable to any Department HOD'}
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-[12px] border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
        <CreateTaskForm
          isDrawer={false}
          initialStatus={initialStatus}
          initialDepartmentId={initialDepartmentId}
          onSuccess={() => navigate('/tasks')}
          onCancel={() => navigate('/tasks')}
        />
      </div>
    </div>
  );
}
