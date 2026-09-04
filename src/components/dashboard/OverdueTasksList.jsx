import React from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { isTaskOverdue, formatDate } from '../../utils/dateUtils';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { AlertCircle, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';

export function OverdueTasksList({ departmentId = null, filterUserTasksOnly = false }) {
  const { tasks, departments } = useAppData();
  const { users, currentUser } = useAuth();
  const navigate = useNavigate();

  let overdueTasks = tasks.filter((t) => isTaskOverdue(t.due_date, t.status));

  if (departmentId) {
    overdueTasks = overdueTasks.filter((t) => isTaskInDepartment(t, departmentId, users));
  }

  if (filterUserTasksOnly) {
    overdueTasks = overdueTasks.filter(
      (t) => t.assigned_to === currentUser?.id || t.created_by === currentUser?.id
    );
  }

  if (overdueTasks.length === 0) {
    return (
      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-6 text-center font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
          ✓
        </div>
        <h4 className="text-[14px] leading-[20px] font-semibold text-emerald-900">No Overdue Tasks!</h4>
        <p className="text-[12px] leading-[16px] font-semibold text-emerald-700 mt-1">All department assignments are currently on schedule.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-rose-200 shadow-xs overflow-hidden font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="px-6 py-4 bg-rose-50 border-b border-rose-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-rose-900">
          <AlertCircle className="w-5 h-5 text-rose-600 animate-pulse" />
          <h3 className="text-[14px] leading-[20px] font-semibold">Overdue Tasks Attention List ({overdueTasks.length})</h3>
        </div>
        <span className="text-[12px] leading-[16px] font-semibold text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-200">
          Immediate Action Required
        </span>
      </div>

      {/* Overdue Items list */}
      <div className="divide-y divide-rose-100">
        {overdueTasks.map((t) => {
          const dept = departments.find((d) => d.id === t.department_id);
          const assignee = users.find((u) => u.id === t.assigned_to);

          return (
            <div
              key={t.id}
              onClick={() => navigate(`/tasks/${t.id}`)}
              className="p-4 sm:p-5 bg-overdue-bg hover:bg-rose-100/60 transition-colors border-l-4 border-rose-600 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] leading-[16px] font-mono font-semibold text-rose-800 bg-rose-100/80 px-2 py-0.5 rounded">
                    {t.task_number}
                  </span>
                  <Badge variant={t.priority} size="sm">
                    {t.priority ? `${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)} Priority` : ''}
                  </Badge>
                  {dept && (
                    <span className="text-[12px] leading-[16px] font-semibold text-slate-600">
                      {dept.name}
                    </span>
                  )}
                </div>
                <h4 className="text-[14px] font-semibold leading-[20px] text-rose-950 group-hover:text-rose-700 transition-colors">
                  {t.title}
                </h4>
              </div>

              <div className="flex items-center gap-4 text-[12px] leading-[16px] font-semibold text-rose-900 self-end sm:self-center">
                {assignee && (
                  <div className="flex items-center gap-2">
                    <Avatar src={assignee.avatar_url} name={assignee.full_name} size="xs" />
                    <span className="font-semibold text-[12px] leading-[16px] text-slate-800">{assignee.full_name}</span>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-[12px] leading-[16px] text-rose-600 font-semibold">Due Date</p>
                  <p className="font-semibold text-[12px] leading-[16px] text-rose-800">{formatDate(t.due_date)}</p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-rose-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
