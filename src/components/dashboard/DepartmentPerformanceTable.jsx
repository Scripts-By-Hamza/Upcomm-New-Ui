import React from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import { isTaskOverdue } from '../../utils/dateUtils';
import { Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';

export function DepartmentPerformanceTable() {
  const { departments, tasks } = useAppData();
  const { users } = useAuth();
  const navigate = useNavigate();

  const stats = departments.map((dept) => {
    const deptTasks = tasks.filter((t) => isTaskInDepartment(t, dept.id, users));
    const total = deptTasks.length;
    const completed = deptTasks.filter((t) => t.status === 'completed').length;
    const pending = deptTasks.filter((t) => t.status === 'pending').length;
    const inProgress = deptTasks.filter((t) => t.status === 'in_progress').length;
    const overdue = deptTasks.filter((t) => isTaskOverdue(t.due_date, t.status)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const deptHods = users.filter(
      (u) => u.department_id === dept.id && u.role === 'hod' && !u.exclude_from_directory
    );

    return {
      ...dept,
      hods: deptHods,
      total,
      completed,
      pending,
      inProgress,
      overdue,
      completionRate,
    };
  });

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden font-['Inter']"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-[14px] font-semibold leading-[20px] text-slate-900 flex items-center gap-2">
            <Building2 className="w-4.5 h-4.5 text-emerald-600" />
            Department Performance Matrix
          </h3>
          <p className="text-[12px] text-slate-500 mt-0.5">
            Real-time task distribution and completion rates across UPCOMM departments
          </p>
        </div>
      </div>

      <div className="overflow-x-auto font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
        {stats.length === 0 ? (
          <div className="py-12 px-6 text-center text-slate-400">
            <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">No departments configured yet.</p>
            <p className="text-xs text-slate-400 mt-1">
              Create your first department from the Departments page to get started.
            </p>
          </div>
        ) : (
          <table
            className="w-full text-left border-collapse font-['Inter']"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <thead>
              <tr className="bg-slate-50 text-[14px] font-semibold leading-[20px] text-slate-600 tracking-tight border-b border-slate-200/80">
                <th className="py-3.5 px-6 text-[14px] font-semibold leading-[20px]">Department</th>
                <th className="py-3.5 px-4 text-[14px] font-semibold leading-[20px]">Active HOD(s)</th>
                <th className="py-3.5 px-4 text-center text-[14px] font-semibold leading-[20px]">Total Tasks</th>
                <th className="py-3.5 px-4 text-center text-[14px] font-semibold leading-[20px]">Completed</th>
                <th className="py-3.5 px-4 text-center text-[14px] font-semibold leading-[20px]">In Progress</th>
                <th className="py-3.5 px-4 text-center text-[14px] font-semibold leading-[20px]">Overdue</th>
                <th className="py-3.5 px-6 text-right text-[14px] font-semibold leading-[20px]">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[14px] font-semibold leading-[20px] text-slate-700">
              {stats.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => navigate(`/tasks?department=${row.id}`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group text-[14px] font-semibold leading-[20px]"
                >
                  <td className="py-3.5 px-6 font-semibold text-[14px] leading-[20px] text-slate-900 flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="group-hover:text-emerald-700 transition-colors text-[14px] font-semibold leading-[20px]">
                      {row.name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[14px] font-semibold leading-[20px]">
                    {row.hods && row.hods.length > 0 ? (
                      <div className="flex flex-col gap-1.5">
                        {row.hods.map((h) => (
                          <div key={h.id} className="flex items-center gap-2">
                            <Avatar src={h.avatar_url} name={h.full_name} size="xs" />
                            <span className="text-slate-800 font-semibold text-[13px] leading-[18px] truncate max-w-[140px]">
                              {h.full_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-rose-500 font-semibold bg-rose-50 px-2 py-0.5 rounded-full text-[12px] leading-[18px]">
                        No HOD Assigned
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-[14px] leading-[20px] text-slate-800">
                    {row.total}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-[14px] leading-[20px] text-emerald-600 bg-emerald-50/30">
                    {row.completed}
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-[14px] leading-[20px] text-emerald-700">
                    {row.inProgress}
                  </td>
                  <td
                    className={`py-3.5 px-4 text-center font-semibold text-[14px] leading-[20px] ${
                      row.overdue > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-400'
                    }`}
                  >
                    {row.overdue}
                  </td>
                  <td className="py-3.5 px-6 text-right text-[14px] font-semibold leading-[20px]">
                    <div className="flex items-center justify-end gap-3 text-[14px] font-semibold leading-[20px]">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden hidden sm:block">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${row.completionRate}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-900 w-10 text-right text-[14px] leading-[20px]">
                        {row.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
