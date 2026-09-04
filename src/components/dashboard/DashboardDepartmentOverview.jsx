import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { isTaskOverdue } from '../../utils/dateUtils';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';
import { Building2, ArrowRight } from 'lucide-react';

export function DashboardDepartmentOverview({
  departments = [],
  tasks = [],
  users = [],
}) {
  const navigate = useNavigate();

  const departmentData = useMemo(() => {
    const nonDeletedTasks = (tasks || []).filter((t) => !t.is_deleted);

    return (departments || []).map((dept) => {
      // Find all tasks associated with this department
      const deptTasks = nonDeletedTasks.filter((t) =>
        isTaskInDepartment(t, dept.id, users)
      );

      const total = deptTasks.length;
      const completed = deptTasks.filter((t) => t.status === 'completed').length;
      const active = deptTasks.filter((t) => t.status !== 'completed').length;
      const overdue = deptTasks.filter((t) => isTaskOverdue(t.due_date, t.status)).length;
      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Find department members (excluding system & hidden accounts)
      const members = (users || []).filter(
        (u) =>
          u &&
          u.department_id === dept.id &&
          !u.exclude_from_directory &&
          !u.is_system_account &&
          u.role !== 'it_support_admin'
      );

      return {
        dept,
        total,
        completed,
        active,
        overdue,
        completionRate,
        members,
      };
    });
  }, [departments, tasks, users]);

  return (
    <div className="space-y-3 select-none">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
          Department Overview
        </h2>
        <button
          type="button"
          onClick={() => navigate('/departments')}
          className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
        >
          <span>All Departments</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {departmentData.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-8 text-center text-[#8B8B95]">
          <Building2 className="w-6 h-6 text-[#71717A] mx-auto mb-1 opacity-60" />
          <p className="text-[13px] font-medium text-[#18181B]">No departments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {departmentData.map(({ dept, active, overdue, completionRate, members }) => {
            const displayedMembers = members.slice(0, 3);
            const extraCount = members.length - 3;

            return (
              <div
                key={dept.id}
                onClick={() => navigate(`/tasks?department=${dept.id}`)}
                className="bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[10px] p-4 flex flex-col justify-between transition-all cursor-pointer shadow-none group"
              >
                {/* Top: Department Name */}
                <div className="text-center mb-2">
                  <h3 className="text-[13.5px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
                    {dept.name}
                  </h3>
                </div>

                {/* Middle: Avatar stack */}
                <div className="flex items-center justify-center my-2">
                  {members.length === 0 ? (
                    <div className="h-7 flex items-center text-[11px] text-[#8B8B95] italic">
                      No members assigned
                    </div>
                  ) : (
                    <div className="flex items-center -space-x-1.5">
                      {displayedMembers.map((member) => (
                        <div key={member.id} className="ring-2 ring-white rounded-full">
                          <Avatar
                            src={member.avatar_url}
                            name={member.full_name}
                            size="sm"
                          />
                        </div>
                      ))}
                      {extraCount > 0 && (
                        <div className="w-8 h-8 rounded-full bg-[#F4F4F5] text-[#52525B] text-[11px] font-semibold flex items-center justify-center ring-2 ring-white">
                          +{extraCount}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Metrics row */}
                <div className="flex items-center justify-between text-[11.5px] font-medium mt-2 pt-2 border-t border-[#F4F4F5]">
                  <span className="text-[#2563EB]">
                    {active} active
                  </span>
                  <span className="text-[#DC2626]">
                    {overdue} overdue
                  </span>
                  <span className="text-[#059669]">
                    {completionRate}% complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-[#F4F4F5] h-1.5 rounded-full overflow-hidden mt-2.5">
                  <div
                    className="bg-[#059669] h-full rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                    role="progressbar"
                    aria-valuenow={completionRate}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${dept.name} completion rate`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
