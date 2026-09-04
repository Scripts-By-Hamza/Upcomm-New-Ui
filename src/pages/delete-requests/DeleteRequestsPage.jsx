import React from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../../components/common/Avatar';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { formatDate } from '../../utils/dateUtils';
import { Trash2, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function DeleteRequestsPage() {
  const { deleteRequests, allTasks, departments, reviewDeleteRequest } = useAppData();
  const { users, currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Task Delete Requests Approval Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review task deletion requests submitted by department heads and team members.
          </p>
        </div>

        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>Soft-Delete Audit Policy Enforced</span>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-600" />
            Pending & Historical Deletion Requests ({deleteRequests.length})
          </h3>
        </div>

        {deleteRequests.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No deletion requests submitted.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-6">Target Task</th>
                  <th className="py-3.5 px-4">Requested By</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-6">Reason for Deletion</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                {deleteRequests.map((req) => {
                  const task = allTasks.find((t) => t.id === req.task_id);
                  const requester = users.find((u) => u.id === req.requested_by);
                  const dept = departments.find((d) => d.id === req.department_id);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        {task ? (
                          <div>
                            <button
                              onClick={() => navigate(`/tasks/${task.id}`)}
                              className="font-bold text-slate-900 hover:text-brand-600 font-mono"
                            >
                              [{task.task_number}] {task.title}
                            </button>
                            <p className="text-[10px] text-slate-400 mt-0.5">Submitted {formatDate(req.created_at)}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal">Task Already Removed</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {requester ? (
                          <div className="flex items-center gap-2">
                            <Avatar src={requester.avatar_url} name={requester.full_name} size="xs" />
                            <span className="font-semibold text-slate-800">{requester.full_name}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-4 px-4 font-semibold text-slate-700">{dept?.name || '-'}</td>

                      <td className="py-4 px-6 max-w-xs">
                        <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-700 italic">
                          "{req.reason}"
                        </p>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right">
                        {req.status === 'pending' &&
                        (currentUser.role === 'admin' || currentUser.role === 'it_support_admin') ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              icon={CheckCircle2}
                              onClick={() => reviewDeleteRequest(req.id, true)}
                            >
                              Approve & Soft Delete
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={XCircle}
                              onClick={() => reviewDeleteRequest(req.id, false)}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-normal">
                            Reviewed
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
    </div>
  );
}
