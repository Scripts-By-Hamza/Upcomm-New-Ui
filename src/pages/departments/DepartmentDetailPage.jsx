import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';
import { isTaskOverdue } from '../../utils/dateUtils';
import { DepartmentDetailHeader } from '../../components/departments/detail/DepartmentDetailHeader';
import { DepartmentDetailTabs } from '../../components/departments/detail/DepartmentDetailTabs';
import { DepartmentKpiRow } from '../../components/departments/detail/DepartmentKpiRow';
import { DepartmentUpcomingDeadlines } from '../../components/departments/detail/DepartmentUpcomingDeadlines';
import { DepartmentTeamWorkloadPanel } from '../../components/departments/detail/DepartmentTeamWorkloadPanel';
import { DepartmentTaskStatusPanel } from '../../components/departments/detail/DepartmentTaskStatusPanel';
import { DepartmentRecentActivityPanel } from '../../components/departments/detail/DepartmentRecentActivityPanel';
import { DepartmentTasksTab } from '../../components/departments/detail/DepartmentTasksTab';
import { DepartmentTeamTab } from '../../components/departments/detail/DepartmentTeamTab';
import { DepartmentActivityTab } from '../../components/departments/detail/DepartmentActivityTab';
import { DepartmentDetailSkeleton } from '../../components/departments/detail/DepartmentDetailSkeleton';
import { DepartmentModal } from '../../components/departments/DepartmentModal';
import { DepartmentDeleteDialog } from '../../components/departments/DepartmentDeleteDialog';
import { TaskDetailDrawer } from '../../components/tasks/detail/TaskDetailDrawer';
import { EditTaskDrawer } from '../../components/tasks/edit/EditTaskDrawer';
import { Building2, ArrowLeft } from 'lucide-react';

export function DepartmentDetailPage() {
  const { departmentId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    departments = [],
    tasks = [],
    activityLogs = [],
    updateDepartment,
    deleteDepartment,
    isRefreshing,
  } = useAppData();
  const { currentUser, users = [] } = useAuth();

  const role = currentUser?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const canManage = isAdmin;

  // Active tab state from URL parameter
  const activeTab = searchParams.get('tab') || 'overview';

  const handleTabChange = (tabId) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (tabId === 'overview') {
          next.delete('tab');
        } else {
          next.set('tab', tabId);
        }
        return next;
      },
      { replace: false }
    );
  };

  // Find department by route ID
  const department = useMemo(() => {
    return (departments || []).find((d) => d.id === departmentId);
  }, [departments, departmentId]);

  // Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Task Drawer States (URL-backed & local)
  const activeDrawerTaskId = searchParams.get('task');
  const activeEditTaskId = searchParams.get('edit');
  const [editOriginIsDetail, setEditOriginIsDetail] = useState(false);

  const selectedDrawerTask = useMemo(() => {
    if (!activeDrawerTaskId) return null;
    return (tasks || []).find((t) => t.id === activeDrawerTaskId);
  }, [tasks, activeDrawerTaskId]);

  const handleOpenTaskDrawer = (taskOrId) => {
    if (!taskOrId) return;
    const taskId = typeof taskOrId === 'object' && taskOrId !== null ? taskOrId.id : taskOrId;
    if (!taskId) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('edit');
      next.set('task', taskId);
      return next;
    });
  };

  const handleCloseTaskDrawer = () => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('task');
      return next;
    });
  };

  const handleOpenEditDrawer = (taskOrId, fromDetail = false) => {
    setEditOriginIsDetail(fromDetail);
    if (!taskOrId) return;
    const taskId = typeof taskOrId === 'object' && taskOrId !== null ? taskOrId.id : taskOrId;
    if (!taskId) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('task');
      next.set('edit', taskId);
      return next;
    });
  };

  const handleCloseEditDrawer = (savedTask) => {
    const closedEditId = searchParams.get('edit');
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('edit');
      if (editOriginIsDetail && closedEditId) {
        next.set('task', closedEditId);
      }
      return next;
    });
    setEditOriginIsDetail(false);
  };

  // Available users for assigning HOD
  const availableUsersForHod = useMemo(() => {
    return (users || []).filter(
      (u) =>
        u &&
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    );
  }, [users]);

  // Derived department tasks & metrics (using canonical helper)
  const {
    departmentTasks,
    activeCount,
    inProgressCount,
    overdueCount,
    completedCount,
    completionRate,
    departmentMembers,
  } = useMemo(() => {
    if (!department) {
      return {
        departmentTasks: [],
        activeCount: 0,
        inProgressCount: 0,
        overdueCount: 0,
        completedCount: 0,
        completionRate: 0,
        departmentMembers: [],
      };
    }

    const nonDeleted = (tasks || []).filter((t) => !t.is_deleted);
    const deptTasks = nonDeleted.filter((t) =>
      isTaskInDepartment(t, department.id, users)
    );

    const active = deptTasks.filter((t) => t.status !== 'completed').length;
    const inProgress = deptTasks.filter((t) => t.status === 'in_progress').length;
    const overdue = deptTasks.filter((t) => isTaskOverdue(t.due_date, t.status)).length;
    const completed = deptTasks.filter((t) => t.status === 'completed').length;
    const total = deptTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const memberMap = new Map();
    (users || []).forEach((u) => {
      if (
        u &&
        u.department_id === department.id &&
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.role !== 'it_support_admin'
      ) {
        memberMap.set(u.id, u);
      }
    });

    return {
      departmentTasks: deptTasks,
      activeCount: active,
      inProgressCount: inProgress,
      overdueCount: overdue,
      completedCount: completed,
      completionRate: rate,
      departmentMembers: Array.from(memberMap.values()),
    };
  }, [department, tasks, users]);

  const handleEditSubmit = async (formData) => {
    if (updateDepartment && department) {
      await updateDepartment(department.id, formData);
    }
  };

  const handleDeleteConfirm = async (deptId) => {
    if (deleteDepartment) {
      await deleteDepartment(deptId);
      navigate('/departments', { replace: true });
    }
  };

  // Loading Skeleton State
  if (isRefreshing && !department && departments.length === 0) {
    return <DepartmentDetailSkeleton />;
  }

  // Department Not Found Graceful Empty State
  if (!department) {
    return (
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center text-[#8B8B95] space-y-4 max-w-lg mx-auto my-12 select-none">
        <div className="w-14 h-14 rounded-[10px] bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#71717A]">
          <Building2 className="w-7 h-7 opacity-70" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#18181B]">Department not found</h2>
          <p className="text-[13px] text-[#52525B] mt-1 leading-relaxed">
            The department with ID &ldquo;<span className="font-mono text-[#18181B]">{departmentId}</span>&rdquo; could not be located or may have been removed.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/departments')}
          className="inline-flex items-center gap-2 h-[38px] px-4 bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Departments</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full pb-12">
      {/* 1. Page Header */}
      <DepartmentDetailHeader
        department={department}
        memberCount={departmentMembers.length}
        activeTaskCount={activeCount}
        canManage={canManage}
        onEdit={() => setIsEditModalOpen(true)}
        onDelete={() => setIsDeleteDialogOpen(true)}
      />

      {/* 2. Navigation Tabs */}
      <DepartmentDetailTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* 3. Tab Content Switcher */}
      {activeTab === 'overview' ? (
        <div className="space-y-6">
          {/* A. 4-Card KPI Row */}
          <DepartmentKpiRow
            activeCount={activeCount}
            inProgressCount={inProgressCount}
            overdueCount={overdueCount}
            completionRate={completionRate}
          />

          {/* B. Main 2x2 Panels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top-Left: Upcoming Deadlines */}
            <DepartmentUpcomingDeadlines
              tasks={departmentTasks}
              users={users}
              onTaskClick={handleOpenTaskDrawer}
              onViewAllTasks={() => handleTabChange('tasks')}
            />

            {/* Top-Right: Team Workload */}
            <DepartmentTeamWorkloadPanel
              tasks={departmentTasks}
              members={departmentMembers}
              onMemberClick={(member) => handleTabChange('team')}
              onViewTeam={() => handleTabChange('team')}
            />

            {/* Bottom-Left: Task Status */}
            <DepartmentTaskStatusPanel tasks={departmentTasks} />

            {/* Bottom-Right: Recent Department Activity */}
            <DepartmentRecentActivityPanel
              activityLogs={activityLogs}
              users={users}
              tasks={tasks}
              departmentId={department.id}
              onTaskClick={handleOpenTaskDrawer}
              onViewAllActivity={() => handleTabChange('activity')}
            />
          </div>
        </div>
      ) : activeTab === 'tasks' ? (
        <DepartmentTasksTab
          department={department}
          onOpenTask={handleOpenTaskDrawer}
          onEditTask={handleOpenEditDrawer}
        />
      ) : activeTab === 'team' ? (
        <DepartmentTeamTab
          department={department}
          members={departmentMembers}
          tasks={departmentTasks}
        />
      ) : activeTab === 'activity' ? (
        <DepartmentActivityTab
          activityLogs={activityLogs}
          users={users}
          tasks={tasks}
          departmentId={department.id}
          onTaskClick={handleOpenTaskDrawer}
        />
      ) : null}

      {/* 4. Edit Department Modal */}
      <DepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={department}
        availableUsers={availableUsersForHod}
      />

      {/* 5. Delete Department Dialog */}
      <DepartmentDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        department={department}
      />

      {/* 6. Task Detail Drawer */}
      {activeDrawerTaskId && (
        <TaskDetailDrawer
          taskId={activeDrawerTaskId}
          task={selectedDrawerTask}
          onClose={handleCloseTaskDrawer}
          onEditTask={(taskId) => handleOpenEditDrawer(taskId, true)}
        />
      )}

      {/* 7. Edit Task Drawer */}
      {activeEditTaskId && (
        <EditTaskDrawer
          isOpen={Boolean(activeEditTaskId)}
          onClose={handleCloseEditDrawer}
          taskId={activeEditTaskId}
        />
      )}
    </div>
  );
}
