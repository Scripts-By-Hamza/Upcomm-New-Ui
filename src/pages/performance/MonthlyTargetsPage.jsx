import React, { useState, useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { MonthlyTargetsHeader } from '../../components/monthlyTargets/MonthlyTargetsHeader';
import { MonthlyTargetsSummaryRow } from '../../components/monthlyTargets/MonthlyTargetsSummaryRow';
import { MonthlyTargetsToolbar } from '../../components/monthlyTargets/MonthlyTargetsToolbar';
import { MonthlyTargetsList } from '../../components/monthlyTargets/MonthlyTargetsList';
import { MonthlyTargetsBoard } from '../../components/monthlyTargets/MonthlyTargetsBoard';
import { AddMonthlyTargetModal } from '../../components/monthlyTargets/AddMonthlyTargetModal';
import { MonthlyTargetDetailDrawer } from '../../components/monthlyTargets/MonthlyTargetDetailDrawer';
import {
  canViewMonthlyTarget,
} from '../../utils/monthlyTargets/monthlyTargetPermissions';
import {
  getCurrentYearMonth,
  isTargetOverdue,
} from '../../utils/monthlyTargets/monthlyTargetUtils';

export function MonthlyTargetsPage() {
  const {
    monthlyTargets = [],
    monthlyTargetComments = [],
    createMonthlyTarget,
    updateMonthlyTarget,
    updateMonthlyTargetStatus,
    deleteMonthlyTarget,
    addMonthlyTargetComment,
    departments = [],
  } = useAppData();

  const { currentUser, users = [] } = useAuth();

  // Date selection state (Defaults to current year and month)
  const initialDate = useMemo(() => getCurrentYearMonth(), []);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);

  // Filters & Toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [groupBy, setGroupBy] = useState('department');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'

  // Modal and Drawer state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [targetToEdit, setTargetToEdit] = useState(null);
  const [selectedTargetId, setSelectedTargetId] = useState(null);

  // 1. Filter targets authorized for the current user & matching selected month/year
  const authorizedMonthTargets = useMemo(() => {
    return (monthlyTargets || []).filter((t) => {
      // Security rule: Only visible targets
      if (!canViewMonthlyTarget(currentUser, t, users, departments)) {
        return false;
      }

      // Date match: Belongs to selected year and month
      const matchesYear = Number(t.year) === Number(selectedYear);
      const matchesMonth = Number(t.month) === Number(selectedMonth);
      return matchesYear && matchesMonth;
    });
  }, [monthlyTargets, currentUser, users, departments, selectedYear, selectedMonth]);

  // 2. Summary KPI Metrics for the selected month
  const summaryMetrics = useMemo(() => {
    const totalCount = authorizedMonthTargets.length;
    const inProgressCount = authorizedMonthTargets.filter((t) => t.status === 'in_progress').length;
    const completedCount = authorizedMonthTargets.filter((t) => t.status === 'completed').length;
    const overdueCount = authorizedMonthTargets.filter((t) => isTargetOverdue(t)).length;

    return {
      totalCount,
      inProgressCount,
      completedCount,
      overdueCount,
    };
  }, [authorizedMonthTargets]);

  // 3. Apply Toolbar Search & Filters
  const filteredTargets = useMemo(() => {
    let result = [...authorizedMonthTargets];

    // Search query filter (title, description, owner name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const userMap = {};
      (users || []).forEach((u) => {
        if (u && u.id) userMap[u.id] = u;
      });

      result = result.filter((t) => {
        const titleMatch = t.title?.toLowerCase().includes(q);
        const descMatch = t.description?.toLowerCase().includes(q);
        const owner = userMap[t.owner_user_id];
        const ownerMatch = owner?.full_name?.toLowerCase().includes(q);
        return titleMatch || descMatch || ownerMatch;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'overdue') {
        result = result.filter((t) => isTargetOverdue(t));
      } else {
        result = result.filter((t) => (t.status || 'not_started') === statusFilter);
      }
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((t) => (t.type || 'target') === typeFilter);
    }

    // Owner filter
    if (ownerFilter !== 'all') {
      result = result.filter((t) => t.owner_user_id === ownerFilter);
    }

    // Department filter (Admin only)
    if (departmentFilter !== 'all') {
      result = result.filter((t) => t.department_id === departmentFilter);
    }

    // Sort order
    result.sort((a, b) => {
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'progress') {
        return (b.progress || 0) - (a.progress || 0);
      }
      // 'newest' default
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return result;
  }, [
    authorizedMonthTargets,
    searchQuery,
    statusFilter,
    typeFilter,
    ownerFilter,
    departmentFilter,
    sortBy,
    users,
  ]);

  // Resolve currently opened target in drawer
  const selectedTarget = useMemo(() => {
    if (!selectedTargetId) return null;
    return (monthlyTargets || []).find((t) => t.id === selectedTargetId) || null;
  }, [monthlyTargets, selectedTargetId]);

  // Handlers
  const handleMonthChange = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setOwnerFilter('all');
    setDepartmentFilter('all');
  };

  const handleOpenAdd = () => {
    setTargetToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (target) => {
    setTargetToEdit(target);
    setIsAddModalOpen(true);
  };

  const handleSaveTarget = async (payload) => {
    if (targetToEdit) {
      await updateMonthlyTarget(targetToEdit.id, payload);
    } else {
      await createMonthlyTarget(payload);
    }
  };

  const handleUpdateStatus = async (targetId, newStatus) => {
    await updateMonthlyTargetStatus(targetId, newStatus);
  };

  const handleUpdateProgress = async (targetId, newProgress, newKpiCurrent) => {
    const updateData = { progress: newProgress };
    if (newKpiCurrent !== null && newKpiCurrent !== undefined) {
      updateData.kpi_current_value = newKpiCurrent;
    }
    await updateMonthlyTarget(targetId, updateData);
  };

  const handleDeleteTarget = async (targetId) => {
    await deleteMonthlyTarget(targetId);
    if (selectedTargetId === targetId) {
      setSelectedTargetId(null);
    }
  };

  const handleAddComment = async (targetId, commentData) => {
    await addMonthlyTargetComment(targetId, commentData);
  };

  return (
    <div className="space-y-5 max-w-full pb-10">
      {/* 1. Header & Month Navigator */}
      <MonthlyTargetsHeader
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        onOpenAddModal={handleOpenAdd}
      />

      {/* 2. KPI Summary Row */}
      <MonthlyTargetsSummaryRow
        totalCount={summaryMetrics.totalCount}
        inProgressCount={summaryMetrics.inProgressCount}
        completedCount={summaryMetrics.completedCount}
        overdueCount={summaryMetrics.overdueCount}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      {/* 3. Toolbar (Search, Filter, Group, View Switcher) */}
      <MonthlyTargetsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        departmentFilter={departmentFilter}
        onDepartmentFilterChange={setDepartmentFilter}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        users={users}
        departments={departments}
        currentUser={currentUser}
        onResetFilters={handleResetFilters}
      />

      {/* 4. Main Targets Content (List or Board View) */}
      {viewMode === 'list' ? (
        <MonthlyTargetsList
          targets={filteredTargets}
          comments={monthlyTargetComments}
          users={users}
          departments={departments}
          currentUser={currentUser}
          groupBy={groupBy}
          onSelectTarget={(t) => setSelectedTargetId(t.id)}
          onEditTarget={handleOpenEdit}
          onDeleteTarget={handleDeleteTarget}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : (
        <MonthlyTargetsBoard
          targets={filteredTargets}
          comments={monthlyTargetComments}
          users={users}
          departments={departments}
          onSelectTarget={(t) => setSelectedTargetId(t.id)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* 5. Add / Edit Modal */}
      <AddMonthlyTargetModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveTarget}
        targetToEdit={targetToEdit}
        initialYear={selectedYear}
        initialMonth={selectedMonth}
        users={users}
        departments={departments}
        currentUser={currentUser}
      />

      {/* 6. Target Detail Drawer */}
      <MonthlyTargetDetailDrawer
        target={selectedTarget}
        isOpen={Boolean(selectedTargetId)}
        onClose={() => setSelectedTargetId(null)}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteTarget}
        onUpdateStatus={handleUpdateStatus}
        onUpdateProgress={handleUpdateProgress}
        comments={monthlyTargetComments}
        onAddComment={handleAddComment}
        users={users}
        departments={departments}
        currentUser={currentUser}
      />
    </div>
  );
}
