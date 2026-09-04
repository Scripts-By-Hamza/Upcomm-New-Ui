import React from 'react';
import { AlertTriangle, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/dateUtils';

export function DashboardOverdueCard({ overdueTasks = [], departments = [] }) {
  const navigate = useNavigate();

  const deptMap = React.useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => { if (d?.id) map[d.id] = d; });
    return map;
  }, [departments]);

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col gap-3 font-['Inter'] h-full"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 leading-tight">Overdue Tasks</h3>
            <p className="text-[11px] text-slate-400 font-medium leading-tight">Past deadline</p>
          </div>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
            overdueTasks.length > 0
              ? 'bg-rose-100 text-rose-800 border border-rose-200'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {overdueTasks.length}
        </span>
      </div>

      {/* Task List */}
      <div className="flex-1 flex flex-col gap-2 overflow-hidden">
        {overdueTasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8 bg-emerald-50/60 rounded-2xl border border-emerald-100 gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-emerald-900">All On Track!</p>
            <p className="text-[11px] text-emerald-700 font-medium text-center px-4">
              No overdue tasks right now.
            </p>
          </div>
        ) : (
          overdueTasks.slice(0, 4).map((task) => {
            const dept = deptMap[task.department_id];
            return (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="p-3 rounded-2xl bg-slate-50 hover:bg-rose-50/60 border border-slate-200/70 hover:border-rose-200 transition-all cursor-pointer group"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <p
                    className="text-xs font-bold text-slate-900 group-hover:text-rose-700 transition-colors truncate leading-snug"
                    title={task.title}
                  >
                    {task.title}
                  </p>
                  <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200 flex-shrink-0">
                    {task.task_number}
                  </span>
                </div>

                {/* Meta row */}
                <div className="flex items-center justify-between gap-2 mt-1.5">
                  {dept ? (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium truncate">
                      <span
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dept.color || '#F43F5E' }}
                      />
                      <span className="truncate">{dept.name}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">General</span>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-rose-700 font-bold flex-shrink-0">
                    <Clock className="w-3 h-3 text-rose-500" />
                    <span className="font-mono">
                      {task.due_date ? formatDate(task.due_date) : 'Overdue'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {overdueTasks.length > 0 && (
        <button
          type="button"
          onClick={() => navigate('/tasks?status=overdue')}
          className="flex items-center justify-between text-xs font-bold text-rose-700 hover:text-rose-900 pt-2.5 border-t border-slate-100 cursor-pointer hover:underline transition-colors"
        >
          <span>View all {overdueTasks.length} overdue tasks</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
