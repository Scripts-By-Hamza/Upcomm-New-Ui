import React, { useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/dateUtils';
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Hourglass,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Send,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function CompletionRequestsPage() {
  const { completionRequests = [], tasks = [], allTasks = [], reviewCompletionRequest } = useAppData();
  const { users, currentUser } = useAuth();
  const navigate = useNavigate();

  const taskList = allTasks.length > 0 ? allTasks : tasks;

  // Section 1: Requests for tasks the current user CREATED (to review)
  const incomingRequests = useMemo(() => {
    return completionRequests.filter((req) => {
      const task = taskList.find((t) => t.id === req.task_id);
      if (!task) return false;
      return (
        task.created_by === currentUser?.id ||
        task.assigned_by === currentUser?.id
      );
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [completionRequests, taskList, currentUser?.id]);

  // Section 2: Requests submitted BY the current user (to track their own)
  const mySubmittedRequests = useMemo(() => {
    return completionRequests
      .filter((req) => req.requested_by === currentUser?.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [completionRequests, currentUser?.id]);

  const pendingCount = incomingRequests.filter((r) => r.status === 'pending').length;

  const getStatusBadge = (status) => {
    if (status === 'pending') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
          <Hourglass className="w-3 h-3" />
          Awaiting Approval
        </span>
      );
    }
    if (status === 'approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3" />
          Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">
        <XCircle className="w-3 h-3" />
        Rejected
      </span>
    );
  };

  const getRoleLabel = (role) => {
    if (!role) return 'TMB';
    if (role === 'hod') return 'HOD';
    if (role === 'admin' || role === 'it_support_admin') return 'ADM';
    return 'TMB';
  };

  return (
    <div className="space-y-6">
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Task Completion Requests
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming requests for your tasks, and track requests you've submitted.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-teal-50 border border-teal-200 text-teal-900 rounded-xl text-xs font-bold flex items-center gap-2 flex-shrink-0">
          <ClipboardCheck className="w-4 h-4 text-teal-600" />
          <span>Completion Approval Workflow</span>
          {pendingCount > 0 && (
            <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white rounded-full text-[10px] font-black">
              {pendingCount} Pending
            </span>
          )}
        </div>
      </div>

      {/* ── SECTION 1: Incoming requests to review ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-800">
            Incoming Requests — Review &amp; Approve ({incomingRequests.length})
          </h3>
        </div>

        {incomingRequests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <ClipboardCheck className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-600">No incoming requests</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              When assigned users request to complete one of your tasks, it will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Task</th>
                  <th className="py-3.5 px-4">Requested By</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Request Date</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {incomingRequests.map((req) => {
                  const task = taskList.find((t) => t.id === req.task_id);
                  const requester = users.find((u) => u.id === req.requested_by);
                  const reviewer = users.find((u) => u.id === req.reviewed_by);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        {task ? (
                          <div>
                            <button
                              onClick={() => navigate(`/tasks/${task.id}`)}
                              className="font-bold text-slate-900 hover:text-teal-600 transition-colors text-left group flex items-center gap-1"
                            >
                              <span className="font-mono text-slate-500 text-[10px]">[{task.task_number}]</span>
                              <span className="group-hover:underline">{task.title}</span>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Submitted {formatDate(req.created_at)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">Task Removed</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {requester ? (
                          <div className="flex items-center gap-2">
                            <Avatar src={requester.avatar_url} name={requester.full_name} size="xs" />
                            <span className="font-semibold text-slate-800">{requester.full_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700">
                          {getRoleLabel(req.requested_by_role)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(req.created_at)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {task?.due_date ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(task.due_date)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          {getStatusBadge(req.status)}
                          {req.reviewed_by && reviewer && (
                            <p className="text-[10px] text-slate-400 pl-1">by {reviewer.full_name}</p>
                          )}
                          {req.reviewed_at && (
                            <p className="text-[10px] text-slate-400 pl-1">{formatDate(req.reviewed_at)}</p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex flex-col items-end gap-1.5">
                            <Button variant="success" size="sm" icon={ThumbsUp}
                              onClick={() => reviewCompletionRequest(req.id, true)}>
                              Approve
                            </Button>
                            <Button variant="danger" size="sm" icon={ThumbsDown}
                              onClick={() => reviewCompletionRequest(req.id, false)}>
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-normal">
                            {req.status === 'approved' ? 'Approved ✓' : 'Rejected ✗'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── SECTION 2: My submitted requests (track own status) ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Send className="w-5 h-5 text-indigo-500" />
          <h3 className="text-sm font-bold text-slate-800">
            My Submitted Requests ({mySubmittedRequests.length})
          </h3>
        </div>

        {mySubmittedRequests.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-600">No requests submitted yet</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Requests you submit to complete tasks will appear here with their approval status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Task</th>
                  <th className="py-3.5 px-4">Submitted On</th>
                  <th className="py-3.5 px-4">Due Date</th>
                  <th className="py-3.5 px-4">Reviewed By</th>
                  <th className="py-3.5 px-4">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {mySubmittedRequests.map((req) => {
                  const task = taskList.find((t) => t.id === req.task_id);
                  const reviewer = users.find((u) => u.id === req.reviewed_by);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        {task ? (
                          <div>
                            <button
                              onClick={() => navigate(`/tasks/${task.id}`)}
                              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors text-left group flex items-center gap-1"
                            >
                              <span className="font-mono text-slate-500 text-[10px]">[{task.task_number}]</span>
                              <span className="group-hover:underline">{task.title}</span>
                              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic font-normal">Task Removed</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(req.created_at)}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {task?.due_date ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDate(task.due_date)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {reviewer ? (
                          <div className="flex items-center gap-2">
                            <Avatar src={reviewer.avatar_url} name={reviewer.full_name} size="xs" />
                            <div>
                              <p className="font-semibold text-slate-800">{reviewer.full_name}</p>
                              {req.reviewed_at && (
                                <p className="text-[10px] text-slate-400">{formatDate(req.reviewed_at)}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Awaiting review…</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {getStatusBadge(req.status)}
                        {req.status === 'approved' && (
                          <p className="text-[10px] text-emerald-600 font-semibold mt-1 pl-1">
                            Task marked as Completed ✓
                          </p>
                        )}
                        {req.status === 'rejected' && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1 pl-1">
                            You may re-submit from the task page.
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
