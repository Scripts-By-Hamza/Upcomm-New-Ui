import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  getDateRangeBounds,
  filterTasksForReport,
  computeReportKpis,
  buildDailyTrendSeries,
  computeStatusDistribution,
  computeDepartmentPerformance,
  computeTeamWorkloadRanking,
  computeWeeklyOverdueTrend,
  exportReportToCsv,
} from '../../utils/reportAnalyticsUtils';
import { ReportToolbar } from '../../components/reports/ReportToolbar';
import { ReportKpiRow } from '../../components/reports/ReportKpiRow';
import { TaskCompletionTrendChart } from '../../components/reports/TaskCompletionTrendChart';
import { TasksByStatusDonut } from '../../components/reports/TasksByStatusDonut';
import { DepartmentPerformancePanel } from '../../components/reports/DepartmentPerformancePanel';
import { TeamWorkloadPanel } from '../../components/reports/TeamWorkloadPanel';
import { OverdueTrendPanel } from '../../components/reports/OverdueTrendPanel';

export function ReportsPage() {
  const { currentUser, users = [] } = useAuth();
  const { tasks = [], departments = [] } = useAppData();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL-backed filter states
  const dateRange = searchParams.get('range') || '30d';
  const departmentId = searchParams.get('department') || 'all';
  const employeeId = searchParams.get('employee') || 'all';

  const handleDateRangeChange = (newRange) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newRange === '30d') {
          next.delete('range');
        } else {
          next.set('range', newRange);
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleDepartmentChange = (newDeptId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newDeptId === 'all') {
          next.delete('department');
        } else {
          next.set('department', String(newDeptId));
        }
        // If employee is no longer in this department, clear employee
        if (newDeptId !== 'all' && employeeId !== 'all') {
          const emp = users.find((u) => String(u.id) === String(employeeId));
          if (emp && String(emp.department_id) !== String(newDeptId)) {
            next.delete('employee');
          }
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleEmployeeChange = (newEmpId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (newEmpId === 'all') {
          next.delete('employee');
        } else {
          next.set('employee', String(newEmpId));
        }
        return next;
      },
      { replace: true }
    );
  };

  // 1. Resolve date boundaries
  const dateBounds = useMemo(() => getDateRangeBounds(dateRange), [dateRange]);

  // 2. Lookup Maps
  const departmentsMap = useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d?.id) {
        map[d.id] = d;
        map[String(d.id)] = d;
      }
    });
    return map;
  }, [departments]);

  const usersMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u?.id) {
        map[u.id] = u;
        map[String(u.id)] = u;
      }
    });
    return map;
  }, [users]);

  // 3. Authorized & Filtered Tasks Dataset
  const scopedTasks = useMemo(() => {
    return filterTasksForReport(tasks, {
      currentUser,
      departmentId,
      employeeId,
      users,
    });
  }, [tasks, currentUser, departmentId, employeeId, users]);

  // 4. Authorized Departments & Employees for Filter Dropdowns
  const role = (currentUser?.role || 'team_member').toLowerCase();
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHod = role === 'hod';

  const authorizedDepartments = useMemo(() => {
    if (isAdmin) return departments;
    if (isHod && currentUser?.department_id) {
      return departments.filter((d) => String(d.id) === String(currentUser.department_id));
    }
    return departments.filter((d) => String(d.id) === String(currentUser?.department_id));
  }, [departments, isAdmin, isHod, currentUser]);

  const authorizedEmployees = useMemo(() => {
    const visibleUsers = (users || []).filter(
      (u) => !u.exclude_from_directory && !u.is_system_account
    );
    if (departmentId !== 'all') {
      return visibleUsers.filter((u) => String(u.department_id) === String(departmentId));
    }
    if (!isAdmin && currentUser?.department_id) {
      return visibleUsers.filter((u) => String(u.department_id) === String(currentUser.department_id));
    }
    return visibleUsers;
  }, [users, departmentId, isAdmin, currentUser]);

  // 5. Analytics Calculations
  const kpis = useMemo(() => {
    return computeReportKpis(scopedTasks, dateBounds);
  }, [scopedTasks, dateBounds]);

  const trendSeries = useMemo(() => {
    return buildDailyTrendSeries(scopedTasks, dateBounds);
  }, [scopedTasks, dateBounds]);

  const statusDistribution = useMemo(() => {
    return computeStatusDistribution(scopedTasks);
  }, [scopedTasks]);

  const departmentPerformance = useMemo(() => {
    return computeDepartmentPerformance(authorizedDepartments, tasks, users);
  }, [authorizedDepartments, tasks, users]);

  const workloadList = useMemo(() => {
    return computeTeamWorkloadRanking(users, tasks, departmentId);
  }, [users, tasks, departmentId]);

  const overdueTrend = useMemo(() => {
    return computeWeeklyOverdueTrend(scopedTasks, dateBounds);
  }, [scopedTasks, dateBounds]);

  // 6. CSV Export Handler
  const handleExport = () => {
    exportReportToCsv(scopedTasks, departmentsMap, usersMap, `${dateRange}-${departmentId}`);
  };

  return (
    <div className="space-y-5 font-['Inter'] pb-12 select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Page Header */}
      <div>
        <h1 className="text-[22px] sm:text-[24px] font-semibold text-[#18181B] tracking-tight">
          Reports
        </h1>
        <p className="text-[13px] text-[#52525B] mt-0.5 font-normal">
          Understand productivity, workload and task performance.
        </p>
      </div>

      {/* 2. Top Filter Toolbar */}
      <ReportToolbar
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        departmentId={departmentId}
        onDepartmentChange={handleDepartmentChange}
        employeeId={employeeId}
        onEmployeeChange={handleEmployeeChange}
        departments={authorizedDepartments}
        employees={authorizedEmployees}
        onExport={handleExport}
        totalFilteredCount={scopedTasks.length}
      />

      {/* 3. Four KPI Cards Row */}
      <ReportKpiRow kpis={kpis} />

      {/* 4. Top Charts Row: Task Completion Trend (2/3) + Tasks by Status (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <TaskCompletionTrendChart trendSeries={trendSeries} />
        </div>
        <div className="lg:col-span-4">
          <TasksByStatusDonut distribution={statusDistribution} />
        </div>
      </div>

      {/* 5. Middle Charts Row: Department Performance (1/2) + Team Workload (1/2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6">
          <DepartmentPerformancePanel departments={departmentPerformance} />
        </div>
        <div className="lg:col-span-6">
          <TeamWorkloadPanel workloadList={workloadList} />
        </div>
      </div>

      {/* 6. Bottom Full-Width Panel: Overdue Trend */}
      <div>
        <OverdueTrendPanel overdueTrend={overdueTrend} />
      </div>
    </div>
  );
}
