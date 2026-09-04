import React, { useMemo, useState } from 'react';
import { Building2, Search, ArrowRight, UserCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useNavigate } from 'react-router-dom';
import { isTaskOverdue } from '../../utils/dateUtils';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';

export function DashboardDepartmentOverviewTable({
  departments = [],
  tasks = [],
  users = [],
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate table rows with department metrics
  const departmentStats = useMemo(() => {
    return (departments || []).map((dept) => {
      const deptTasks = (tasks || []).filter((t) => isTaskInDepartment(t, dept.id, users));
      const total = deptTasks.length;
      const completed = deptTasks.filter((t) => t.status === 'completed').length;
      const overdue = deptTasks.filter((t) => isTaskOverdue(t.due_date, t.status)).length;
      const inProgress = deptTasks.filter(
        (t) => t.status === 'in_progress' && !isTaskOverdue(t.due_date, t.status)
      ).length;
      const pending = deptTasks.filter(
        (t) => (t.status === 'pending' || !t.status) && !isTaskOverdue(t.due_date, t.status)
      ).length;

      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Find HODs for this department
      const deptHods = (users || []).filter(
        (u) =>
          u &&
          !u.exclude_from_directory &&
          !u.is_system_account &&
          u.department_id === dept.id &&
          u.role === 'hod'
      );

      // In case hod_id is set directly on department
      if (deptHods.length === 0 && dept.hod_id) {
        const directHod = (users || []).find((u) => u.id === dept.hod_id);
        if (directHod) deptHods.push(directHod);
      }

      return {
        ...dept,
        totalTasks: total,
        completedTasks: completed,
        overdueTasks: overdue,
        inProgressTasks: inProgress,
        pendingTasks: pending,
        completionRate: rate,
        hods: deptHods,
      };
    });
  }, [departments, tasks, users]);

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return departmentStats;
    const q = searchQuery.toLowerCase().trim();
    return departmentStats.filter((row) => {
      const matchDept = row.name?.toLowerCase().includes(q);
      const matchHod = row.hods.some((h) => h.full_name?.toLowerCase().includes(q));
      return matchDept || matchHod;
    });
  }, [departmentStats, searchQuery]);

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs font-['Inter'] space-y-4"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
              Department Performance Matrix
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Leadership, deliverables count, completions, and progress distribution
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search department or HOD..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/70">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <th className="py-3.5 px-4">Department Name</th>
              <th className="py-3.5 px-4">HOD (Leadership)</th>
              <th className="py-3.5 px-3 text-center">Tasks</th>
              <th className="py-3.5 px-3 text-center">Completed</th>
              <th className="py-3.5 px-3 text-center">Overdue</th>
              <th className="py-3.5 px-4 min-w-[180px]">Status & Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                  No departments found matching your search.
                </td>
              </tr>
            ) : (
              filteredRows.map((dept) => (
                <tr
                  key={dept.id}
                  onClick={() => navigate(`/tasks?department=${dept.id}`)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Department Name */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: dept.color || '#10B981' }}
                      />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block truncate text-xs">
                          {dept.name}
                        </span>
                        {dept.description && (
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {dept.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* HOD (Leadership) */}
                  <td className="py-3.5 px-4">
                    {dept.hods && dept.hods.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {dept.hods.map((hod) => (
                          <div key={hod.id} className="flex items-center gap-2 min-w-0">
                            <Avatar src={hod.avatar_url} name={hod.full_name} size="xs" />
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block truncate text-xs">
                                {hod.full_name}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200">
                                HOD
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400 italic">
                        Not Assigned
                      </span>
                    )}
                  </td>

                  {/* Total Tasks */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-slate-100 text-slate-900 font-extrabold text-xs font-mono">
                      {dept.totalTasks}
                    </span>
                  </td>

                  {/* Completed Tasks */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold text-xs font-mono">
                      {dept.completedTasks}
                    </span>
                  </td>

                  {/* Overdue Tasks */}
                  <td className="py-3.5 px-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-xl font-extrabold text-xs font-mono ${
                        dept.overdueTasks > 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-50 text-slate-400 border border-slate-100'
                      }`}
                    >
                      {dept.overdueTasks}
                    </span>
                  </td>

                  {/* Status Bar + % */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-700 font-mono">
                          {dept.completionRate}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {dept.completedTasks} / {dept.totalTasks} Done
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${dept.completionRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
