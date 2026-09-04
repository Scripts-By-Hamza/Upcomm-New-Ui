import React from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { isTaskDueSoon } from '../../utils/dateUtils';
import { Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';

export function DueSoonAlert({ departmentId = null, filterUserTasksOnly = false }) {
  const { tasks, settings } = useAppData();
  const { currentUser, users } = useAuth();
  const navigate = useNavigate();

  let dueSoonTasks = tasks.filter((t) => isTaskDueSoon(t.due_date, t.status, settings.due_soon_days));

  if (departmentId) {
    dueSoonTasks = dueSoonTasks.filter((t) => isTaskInDepartment(t, departmentId, users));
  }

  if (filterUserTasksOnly) {
    dueSoonTasks = dueSoonTasks.filter(
      (t) => t.assigned_to === currentUser?.id || t.created_by === currentUser?.id
    );
  }

  if (dueSoonTasks.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-xs flex-shrink-0">
          <Clock className="w-5 h-5 animate-spin-slow" />
        </div>
        <div>
          <h4 className="text-[14px] leading-[20px] font-semibold text-amber-950">
            {dueSoonTasks.length} {dueSoonTasks.length === 1 ? 'Task' : 'Tasks'} Due Within {settings.due_soon_days} Days!
          </h4>
          <p className="text-[12px] leading-[16px] font-semibold text-amber-800 mt-0.5">
            Review approaching deadlines to ensure on-time delivery.
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/tasks?filter=due_soon')}
        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-[12px] leading-[16px] rounded-2xl shadow-xs flex items-center justify-center gap-2 transition-colors self-start sm:self-center cursor-pointer"
      >
        <span>View Upcoming Deadlines</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
