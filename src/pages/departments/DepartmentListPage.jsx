import React, { useState, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { isTaskOverdue } from '../../utils/dateUtils';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';
import { DepartmentHeader } from '../../components/departments/DepartmentHeader';
import { DepartmentToolbar } from '../../components/departments/DepartmentToolbar';
import { DepartmentCard } from '../../components/departments/DepartmentCard';
import { DepartmentCardSkeleton } from '../../components/departments/DepartmentCardSkeleton';
import { DepartmentModal } from '../../components/departments/DepartmentModal';
import { DepartmentDeleteDialog } from '../../components/departments/DepartmentDeleteDialog';
import { Building2, Search, Plus } from 'lucide-react';

export function DepartmentListPage() {
  const {
    departments = [],
    tasks = [],
    createDepartment,
    updateDepartment,
    deleteDepartment,
    isRefreshing,
  } = useAppData();
  const { currentUser, users = [] } = useAuth();

  const role = currentUser?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const canCreateDepartment = isAdmin;
  const canManage = isAdmin;

  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('default');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deletingDepartment, setDeletingDepartment] = useState(null);

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

  // Derive department summaries with truthful metric calculations
  const departmentSummaries = useMemo(() => {
    const nonDeletedTasks = (tasks || []).filter((t) => !t.is_deleted);

    return (departments || []).map((department) => {
      // Find all tasks associated with this department using canonical helper
      const deptTasks = nonDeletedTasks.filter((t) =>
        isTaskInDepartment(t, department.id, users)
      );

      const totalTasks = deptTasks.length;
      const completedTasks = deptTasks.filter((t) => t.status === 'completed').length;
      const activeTasks = deptTasks.filter((t) => t.status !== 'completed').length;
      const overdueTasks = deptTasks.filter((t) => isTaskOverdue(t.due_date, t.status)).length;
      const completionPercentage =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      // Find department members (deduplicated by user ID, excluding system & hidden accounts)
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
      const members = Array.from(memberMap.values());

      return {
        department,
        members,
        totalTasks,
        completedTasks,
        activeTasks,
        overdueTasks,
        completionPercentage,
      };
    });
  }, [departments, tasks, users]);

  // Filter and Sort department summaries
  const filteredAndSortedSummaries = useMemo(() => {
    let result = [...departmentSummaries];

    // Search query filter (by name or description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.department.name?.toLowerCase().includes(q) ||
          s.department.description?.toLowerCase().includes(q)
      );
    }

    // Sort order
    if (sortOption === 'name_asc') {
      result.sort((a, b) => (a.department.name || '').localeCompare(b.department.name || ''));
    } else if (sortOption === 'name_desc') {
      result.sort((a, b) => (b.department.name || '').localeCompare(a.department.name || ''));
    } else if (sortOption === 'members_desc') {
      result.sort((a, b) => b.members.length - a.members.length);
    } else if (sortOption === 'active_desc') {
      result.sort((a, b) => b.activeTasks - a.activeTasks);
    } else if (sortOption === 'overdue_desc') {
      result.sort((a, b) => b.overdueTasks - a.overdueTasks);
    } else if (sortOption === 'completion_desc') {
      result.sort((a, b) => b.completionPercentage - a.completionPercentage);
    } else if (sortOption === 'completion_asc') {
      result.sort((a, b) => a.completionPercentage - b.completionPercentage);
    }

    return result;
  }, [departmentSummaries, searchQuery, sortOption]);

  const handleCreateSubmit = async (formData) => {
    if (createDepartment) {
      await createDepartment(formData);
    }
  };

  const handleEditSubmit = async (formData) => {
    if (updateDepartment && editingDepartment) {
      await updateDepartment(editingDepartment.id, formData);
    }
  };

  const handleDeleteConfirm = async (deptId) => {
    if (deleteDepartment) {
      await deleteDepartment(deptId);
    }
  };

  return (
    <div className="space-y-5 max-w-full pb-10">
      {/* 1. Page Header with New Department & Sort on the right */}
      <DepartmentHeader
        canCreateDepartment={canCreateDepartment}
        onNewDepartment={() => setIsCreateModalOpen(true)}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

      {/* 2. Toolbar with Search & Desktop Sort */}
      <DepartmentToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortOption={sortOption}
        onSortChange={setSortOption}
      />

      {/* 3. Main Departments Grid / Empty / Loading State */}
      {isRefreshing && departments.length === 0 ? (
        <DepartmentCardSkeleton count={6} />
      ) : departments.length === 0 ? (
        /* Zero Departments Empty State */
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center text-[#8B8B95] space-y-3 select-none">
          <div className="w-12 h-12 rounded-[10px] bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#71717A]">
            <Building2 className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#18181B]">No departments yet</h3>
          <p className="text-[13px] text-[#52525B] max-w-md mx-auto">
            Create your first department to organize teams and work across UPCOMM.
          </p>
          {canCreateDepartment && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-[38px] px-3.5 bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Department</span>
            </button>
          )}
        </div>
      ) : filteredAndSortedSummaries.length === 0 ? (
        /* Search Empty State */
        <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-12 text-center text-[#8B8B95] space-y-3 select-none">
          <div className="w-12 h-12 rounded-[10px] bg-[#F4F4F5] border border-[#E5E7EB] flex items-center justify-center mx-auto text-[#71717A]">
            <Search className="w-6 h-6 opacity-70" />
          </div>
          <h3 className="text-[16px] font-semibold text-[#18181B]">No matching departments</h3>
          <p className="text-[13px] text-[#52525B] max-w-md mx-auto">
            No departments matched your search for &ldquo;<span className="text-[#18181B] font-medium">{searchQuery}</span>&rdquo;.
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-1.5 h-[34px] px-3 bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B] rounded-[7px] text-[12.5px] font-medium transition-colors cursor-pointer mt-1"
          >
            Clear Search
          </button>
        </div>
      ) : (
        /* 3-Column Responsive Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedSummaries.map((summary) => (
            <DepartmentCard
              key={summary.department.id}
              department={summary.department}
              members={summary.members}
              activeTasks={summary.activeTasks}
              overdueTasks={summary.overdueTasks}
              completionPercentage={summary.completionPercentage}
              canManage={canManage}
              onEdit={(dept) => setEditingDepartment(dept)}
              onDelete={(dept) => setDeletingDepartment(dept)}
            />
          ))}
        </div>
      )}

      {/* 4. Create Department Modal */}
      <DepartmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateSubmit}
        availableUsers={availableUsersForHod}
      />

      {/* 5. Edit Department Modal */}
      <DepartmentModal
        isOpen={!!editingDepartment}
        onClose={() => setEditingDepartment(null)}
        onSubmit={handleEditSubmit}
        initialData={editingDepartment}
        availableUsers={availableUsersForHod}
      />

      {/* 6. Delete Department Confirmation Dialog */}
      <DepartmentDeleteDialog
        isOpen={!!deletingDepartment}
        onClose={() => setDeletingDepartment(null)}
        onConfirm={handleDeleteConfirm}
        department={deletingDepartment}
      />
    </div>
  );
}
