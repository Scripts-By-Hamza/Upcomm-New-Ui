import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { InboxTabs } from '../../components/inbox/InboxTabs';
import { InboxToolbar } from '../../components/inbox/InboxToolbar';
import { InboxRequestRow } from '../../components/inbox/InboxRequestRow';
import { TaskDetailDrawer } from '../../components/tasks/detail/TaskDetailDrawer';
import { isTaskInDepartment } from '../../utils/taskDepartmentUtils';
import {
  canUserViewCompletionRequest,
  canReviewCompletionRequest,
  canReviewDeleteRequest,
} from '../../utils/rbac/permissionManager';
import { isToday, isAfter, subDays } from 'date-fns';
import { CheckCircle2, AlertTriangle, RotateCcw, Loader2, History } from 'lucide-react';

export function InboxPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    completionRequests = [],
    deleteRequests = [],
    tasks = [],
    allTasks = [],
    departments = [],
    reviewCompletionRequest,
    reviewDeleteRequest,
  } = useAppData();

  const { currentUser, users = [] } = useAuth();

  const taskList = allTasks.length > 0 ? allTasks : tasks;
  const currentUserId = currentUser?.id;
  const canReviewDelete = canReviewDeleteRequest(currentUser);

  // 1. Actionable Pending Requests (ONLY tasks where currentUser is the OWNER/CREATOR and can review)
  const pendingCompletionRequests = useMemo(() => {
    if (!currentUserId) return [];
    return completionRequests.filter((req) => {
      if (req.status !== 'pending') return false;
      const task = taskList.find((t) => t.id === req.task_id);
      return canReviewCompletionRequest(currentUser, req, task, users);
    });
  }, [completionRequests, taskList, currentUser, users, currentUserId]);

  const pendingDeleteRequests = useMemo(() => {
    if (!currentUserId || !canReviewDelete) return [];
    return deleteRequests.filter((req) => req.status === 'pending');
  }, [deleteRequests, currentUserId, canReviewDelete]);

  // 2. Historical & Tracked Requests (Reviewed requests + Pending requests where user is NOT the owner)
  const historicalCompletionRequests = useMemo(() => {
    if (!currentUserId) return [];
    return completionRequests.filter((req) => {
      const task = taskList.find((t) => t.id === req.task_id);
      const canView = canUserViewCompletionRequest(currentUser, req, task, users);
      if (!canView) return false;

      // If pending, only show in tracking if the user is NOT the owner/reviewer (so it doesn't duplicate)
      if (req.status === 'pending') {
        const canReview = canReviewCompletionRequest(currentUser, req, task, users);
        return !canReview;
      }

      return true;
    });
  }, [completionRequests, taskList, currentUser, users, currentUserId]);

  const historicalDeleteRequests = useMemo(() => {
    if (!currentUserId || !canReviewDelete) return [];

    const list = [...deleteRequests.filter((req) => req.status === 'approved' || req.status === 'rejected')];

    // Also include tasks soft-deleted directly if not in deleteRequests
    (taskList || []).forEach((t) => {
      if (t.is_deleted && !list.some((r) => r.task_id === t.id)) {
        list.push({
          id: `del-hist-${t.id}`,
          task_id: t.id,
          requested_by: t.deleted_by || t.created_by,
          reviewed_by: t.deleted_by,
          reviewed_at: t.deleted_at,
          created_at: t.deleted_at || t.created_at,
          status: 'approved',
          reason: 'Direct task deletion',
        });
      }
    });

    return list;
  }, [deleteRequests, taskList, currentUserId, canReviewDelete]);

  // Combined Normalized Pending Dataset
  const normalizedPendingRequests = useMemo(() => {
    const list = [];

    pendingCompletionRequests.forEach((req) => {
      const task = taskList.find((t) => t.id === req.task_id);
      list.push({
        id: req.id,
        type: 'completion',
        status: req.status,
        requestedAt: req.created_at,
        requesterId: req.requested_by,
        taskId: req.task_id,
        task,
        reason: null,
        originalRequest: req,
      });
    });

    pendingDeleteRequests.forEach((req) => {
      const task = taskList.find((t) => t.id === req.task_id);
      list.push({
        id: req.id,
        type: 'delete',
        status: req.status,
        requestedAt: req.created_at,
        requesterId: req.requested_by,
        taskId: req.task_id,
        task,
        reason: req.reason || '',
        originalRequest: req,
      });
    });

    return list.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));
  }, [pendingCompletionRequests, pendingDeleteRequests, taskList]);

  // Combined Normalized History Dataset
  const normalizedHistoryRequests = useMemo(() => {
    const list = [];

    historicalCompletionRequests.forEach((req) => {
      const task = taskList.find((t) => t.id === req.task_id);
      list.push({
        id: req.id,
        type: 'completion',
        status: req.status || 'approved',
        requestedAt: req.created_at,
        reviewedAt: req.reviewed_at || req.updated_at,
        requesterId: req.requested_by,
        reviewerId: req.reviewed_by,
        taskId: req.task_id,
        task,
        reason: null,
        originalRequest: req,
      });
    });

    historicalDeleteRequests.forEach((req) => {
      const task = taskList.find((t) => t.id === req.task_id);
      list.push({
        id: req.id,
        type: 'delete',
        status: req.status || 'pending',
        requestedAt: req.created_at,
        reviewedAt: req.reviewed_at || req.updated_at,
        requesterId: req.requested_by,
        reviewerId: req.reviewed_by,
        taskId: req.task_id,
        task,
        reason: req.reason || '',
        originalRequest: req,
      });
    });

    return list.sort(
      (a, b) =>
        new Date(b.reviewedAt || b.requestedAt || 0) -
        new Date(a.reviewedAt || a.requestedAt || 0)
    );
  }, [historicalCompletionRequests, historicalDeleteRequests, taskList]);

  // Tab Counts for Pending Requests
  const tabCounts = useMemo(() => {
    return {
      all: pendingCompletionRequests.length + (canReviewDelete ? pendingDeleteRequests.length : 0),
      completion: pendingCompletionRequests.length,
      delete: canReviewDelete ? pendingDeleteRequests.length : 0,
    };
  }, [pendingCompletionRequests.length, pendingDeleteRequests.length, canReviewDelete]);

  // URL State Management
  const activeTab = searchParams.get('type') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const departmentFilter = searchParams.get('dept') || '';
  const requesterFilter = searchParams.get('requester') || '';
  const dateFilter = searchParams.get('date') || 'all';
  const selectedTaskId = searchParams.get('task');

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

  // If a non-admin is on the delete tab, automatically redirect to 'all'
  useEffect(() => {
    if (!canReviewDelete && activeTab === 'delete') {
      updateParam('type', 'all');
    }
  }, [canReviewDelete, activeTab]);

  const handleTabChange = (newTab) => {
    updateParam('type', newTab);
  };

  const handleClearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('dept');
    next.delete('requester');
    next.delete('date');
    setSearchParams(next, { replace: true });
  };

  const hasActiveFilters = Boolean(
    searchQuery || departmentFilter || requesterFilter || dateFilter !== 'all'
  );

  // Active Requesters Pool for Toolbar Filter
  const actionableRequesters = useMemo(() => {
    const requesterIds = Array.from(
      new Set([
        ...normalizedPendingRequests.map((r) => r.requesterId),
        ...normalizedHistoryRequests.map((r) => r.requesterId),
      ].filter(Boolean))
    );
    return users.filter((u) => requesterIds.includes(u.id));
  }, [normalizedPendingRequests, normalizedHistoryRequests, users]);

  // Generic Filter function for both lists
  const filterRequestList = (items) => {
    return items.filter((item) => {
      // 1. Tab Filter
      if (activeTab === 'completion' && item.type !== 'completion') return false;
      if (activeTab === 'delete' && item.type !== 'delete') return false;

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const requester = users.find((u) => u.id === item.requesterId);
        const reqName = requester?.full_name?.toLowerCase() || '';
        const taskNum = item.task?.task_number?.toLowerCase() || '';
        const taskTitle = item.task?.title?.toLowerCase() || '';
        const reason = item.reason?.toLowerCase() || '';

        const matches =
          reqName.includes(q) ||
          taskNum.includes(q) ||
          taskTitle.includes(q) ||
          reason.includes(q);

        if (!matches) return false;
      }

      // 3. Department Filter
      if (departmentFilter && item.task) {
        if (!isTaskInDepartment(item.task, departmentFilter, departments, users)) {
          return false;
        }
      }

      // 4. Requester Filter
      if (requesterFilter && item.requesterId !== requesterFilter) {
        return false;
      }

      // 5. Date Filter
      if (dateFilter !== 'all' && (item.requestedAt || item.reviewedAt)) {
        try {
          const reqDate = new Date(item.requestedAt || item.reviewedAt);
          if (dateFilter === 'today') {
            if (!isToday(reqDate)) return false;
          } else if (dateFilter === '7days') {
            if (!isAfter(reqDate, subDays(new Date(), 7))) return false;
          } else if (dateFilter === '30days') {
            if (!isAfter(reqDate, subDays(new Date(), 30))) return false;
          }
        } catch (_) {
          return true;
        }
      }

      return true;
    });
  };

  const filteredPendingRequests = useMemo(() => {
    return filterRequestList(normalizedPendingRequests);
  }, [
    normalizedPendingRequests,
    activeTab,
    searchQuery,
    departmentFilter,
    requesterFilter,
    dateFilter,
    users,
    departments,
  ]);

  const filteredHistoryRequests = useMemo(() => {
    return filterRequestList(normalizedHistoryRequests);
  }, [
    normalizedHistoryRequests,
    activeTab,
    searchQuery,
    departmentFilter,
    requesterFilter,
    dateFilter,
    users,
    departments,
  ]);

  // Review Actions Handling
  const [processingId, setProcessingId] = useState(null);
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState(null);

  const handleApprove = async (request) => {
    if (processingId) return;

    if (request.type === 'completion') {
      try {
        setProcessingId(request.id);
        await reviewCompletionRequest(request.id, true);
      } catch (err) {
        console.error('Failed to approve completion request:', err);
      } finally {
        setProcessingId(null);
      }
    } else if (request.type === 'delete') {
      setDeleteConfirmTarget(request);
    }
  };

  const handleConfirmApproveDelete = async () => {
    if (!deleteConfirmTarget || processingId) return;
    const targetId = deleteConfirmTarget.id;
    try {
      setProcessingId(targetId);
      setDeleteConfirmTarget(null);
      await reviewDeleteRequest(targetId, true);
    } catch (err) {
      console.error('Failed to approve delete request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request) => {
    if (processingId) return;
    try {
      setProcessingId(request.id);
      if (request.type === 'completion') {
        await reviewCompletionRequest(request.id, false);
      } else {
        await reviewDeleteRequest(request.id, false);
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  // View Task Drawer Handling
  const handleOpenTask = (taskId) => {
    if (!taskId) return;
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      navigate(`/tasks/${taskId}`);
      return;
    }
    const next = new URLSearchParams(searchParams);
    next.set('task', taskId);
    setSearchParams(next);
  };

  const handleCloseTask = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('task');
    setSearchParams(next);
  };

  // On mobile dimension, redirect directly to task detail page if task query param is present
  useEffect(() => {
    if (selectedTaskId && typeof window !== 'undefined' && window.innerWidth < 768) {
      handleCloseTask();
      navigate(`/tasks/${selectedTaskId}`);
    }
  }, [selectedTaskId]);

  return (
    <div
      className="space-y-6 font-['Inter'] max-w-7xl mx-auto pb-16"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* 1. Page Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#18181B] tracking-tight">
          Requests
        </h1>
        <p className="text-[12.5px] text-[#71717A] mt-0.5">
          {canReviewDelete
            ? 'Review pending task requests and track completion & deletion history.'
            : 'Review pending task completion requests and track completion history.'}
        </p>
      </div>

      {/* 2. Tabs */}
      <InboxTabs
        activeTab={activeTab}
        onTabChange={handleTabChange}
        counts={tabCounts}
        showDeleteTab={canReviewDelete}
      />

      {/* 3. Toolbar (Search, Filters, Active Chips) */}
      <InboxToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => updateParam('search', q)}
        departmentFilter={departmentFilter}
        onDepartmentChange={(d) => updateParam('dept', d)}
        departments={departments}
        requesterFilter={requesterFilter}
        onRequesterChange={(r) => updateParam('requester', r)}
        requesters={actionableRequesters}
        dateFilter={dateFilter}
        onDateChange={(d) => updateParam('date', d)}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. SECTION 1: Pending Requests Surface */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] sm:rounded-[12px] shadow-2xs overflow-hidden select-none">
        {/* Surface Header */}
        <div className="h-12 px-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-[13px] font-bold text-[#18181B]">Pending requests</h2>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                filteredPendingRequests.length > 0
                  ? 'bg-[#059669]/10 text-[#059669]'
                  : 'bg-[#F4F4F5] text-[#71717A]'
              }`}
            >
              {filteredPendingRequests.length}
            </span>
          </div>
        </div>

        {/* Pending Surface Content */}
        {filteredPendingRequests.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#F4F4F5] flex items-center justify-center mx-auto text-[#71717A]">
              {hasActiveFilters ? (
                <RotateCcw className="w-4 h-4 text-[#71717A]" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              )}
            </div>
            <h3 className="text-[14px] font-bold text-[#18181B]">
              {hasActiveFilters ? 'No matching pending requests' : "You're all caught up"}
            </h3>
            <p className="text-[12px] text-[#71717A] max-w-sm mx-auto">
              {hasActiveFilters
                ? 'No pending requests match your current filters.'
                : activeTab === 'completion'
                ? 'No completion requests require your review.'
                : activeTab === 'delete'
                ? 'No task deletion requests require your review.'
                : 'No task requests require your attention at this time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {filteredPendingRequests.map((request) => {
              const requester = users.find((u) => u.id === request.requesterId);

              return (
                <InboxRequestRow
                  key={request.id}
                  request={request}
                  requester={requester}
                  onViewTask={handleOpenTask}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processingId === request.id}
                  isHistory={false}
                />
              );
            })}
          </div>
        )}

        {/* Pending Surface Footer */}
        <div className="h-9 px-5 border-t border-[#E5E7EB] bg-[#FAFBFB] flex items-center justify-between text-[11px] text-[#71717A]">
          <span>
            {filteredPendingRequests.length} pending request
            {filteredPendingRequests.length === 1 ? '' : 's'}
          </span>
          <span>Action required</span>
        </div>
      </div>

      {/* 5. SECTION 2: Request History & Tracking Surface */}
      <div className="bg-white border border-[#E5E7EB] rounded-[10px] sm:rounded-[12px] shadow-2xs overflow-hidden select-none">
        {/* Surface Header */}
        <div className="h-12 px-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#71717A]" />
            <h2 className="text-[13px] font-bold text-[#18181B]">
              {activeTab === 'completion'
                ? 'Completion Requests History & Tracking'
                : activeTab === 'delete'
                ? 'Deletion Requests History & Tracking'
                : 'Request History & Tracking'}
            </h2>
            <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-[#F4F4F5] text-[#71717A]">
              {filteredHistoryRequests.length}
            </span>
          </div>
        </div>

        {/* History Surface Content */}
        {filteredHistoryRequests.length === 0 ? (
          <div className="p-10 text-center space-y-1.5 text-[#71717A]">
            <History className="w-5 h-5 mx-auto text-[#A1A1AA] mb-1" />
            <p className="text-[13px] font-semibold text-[#18181B]">
              No request history found
            </p>
            <p className="text-[11.5px] text-[#71717A]">
              Approved and rejected completion or deletion requests will appear here for tracking.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E5E7EB]">
            {filteredHistoryRequests.map((request) => {
              const requester = users.find((u) => u.id === request.requesterId);
              const reviewer = users.find((u) => u.id === request.reviewerId);

              return (
                <InboxRequestRow
                  key={request.id}
                  request={request}
                  requester={requester}
                  reviewer={reviewer}
                  onViewTask={handleOpenTask}
                  isHistory={true}
                />
              );
            })}
          </div>
        )}

        {/* History Surface Footer */}
        <div className="h-9 px-5 border-t border-[#E5E7EB] bg-[#FAFBFB] flex items-center justify-between text-[11px] text-[#71717A]">
          <span>
            {filteredHistoryRequests.length} tracked request
            {filteredHistoryRequests.length === 1 ? '' : 's'}
          </span>
          <span>Historical log</span>
        </div>
      </div>

      {/* 6. Delete Request Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in font-['Inter']">
          <div
            className="w-full max-w-md bg-white rounded-[12px] border border-[#E5E7EB] shadow-2xl p-5 space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 text-[#DC2626] flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-[14.5px] font-bold text-[#18181B]">
                  Approve task deletion?
                </h3>
                <p className="text-[12.5px] text-[#71717A] leading-relaxed">
                  This will approve the deletion request and permanently soft-delete the task:
                </p>
                {deleteConfirmTarget.task && (
                  <div className="p-2.5 bg-[#F4F4F5] rounded-[8px] text-[12px] font-mono text-[#18181B] font-medium">
                    [{deleteConfirmTarget.task.task_number}] {deleteConfirmTarget.task.title}
                  </div>
                )}
                {deleteConfirmTarget.reason && (
                  <p className="text-[11.5px] text-[#52525B] italic pt-1">
                    "{deleteConfirmTarget.reason}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmTarget(null)}
                disabled={Boolean(processingId)}
                className="px-3.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] text-[12.5px] font-medium text-[#18181B] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproveDelete}
                disabled={Boolean(processingId)}
                className="px-3.5 py-1.5 rounded-[8px] bg-[#DC2626] hover:bg-[#B91C1C] text-[12.5px] font-medium text-white transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {processingId === deleteConfirmTarget.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Approve Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Task Detail Drawer Overlay */}
      {selectedTaskId && (
        <TaskDetailDrawer
          taskId={selectedTaskId}
          onClose={handleCloseTask}
        />
      )}
    </div>
  );
}

export default InboxPage;
