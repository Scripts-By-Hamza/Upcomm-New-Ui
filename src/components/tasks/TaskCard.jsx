import React, { useMemo } from 'react';
import { Badge } from '../common/Badge';
import { Avatar } from '../common/Avatar';
import { isTaskOverdue, formatDate } from '../../utils/dateUtils';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, CornerDownRight, Paperclip, UserCheck, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { cleanTaskDescription } from '../../contexts/AppDataContext';
import { getTaskDepartmentsInfo, isDepartmentAssistantOnly } from '../../utils/taskDepartmentUtils';
import { UnreadBadge } from '../common/UnreadBadge';
import { getTaskUnreadCount } from '../../utils/comments/unreadCommentSelectors';

export function TaskCard({ task, currentDeptId = null }) {
  const { departments, readChatIds = [] } = useAppData();
  const { currentUser, users } = useAuth();
  const navigate = useNavigate();

  const allAssigneeIds = Array.from(
    new Set(task.assigned_to_ids || (task.assigned_to ? [task.assigned_to] : []))
  );
  const assignees = users.filter((u) => allAssigneeIds.includes(u.id));
  const primaryAssignee = assignees[0] || users.find((u) => u.id === task.assigned_to);

  const allAssistantIds = Array.from(
    new Set(
      task.assisted_by_ids ||
        (Array.isArray(task.assisted_by)
          ? task.assisted_by
          : task.assisted_by
          ? [task.assisted_by]
          : [])
    )
  );
  const assistants = users.filter((u) => allAssistantIds.includes(u.id));

  // Compute unread comment count for current user
  const unreadChatCount = useMemo(() => {
    return getTaskUnreadCount(task, currentUser?.id, readChatIds);
  }, [task, currentUser?.id, readChatIds]);

  // Collect all unique departments (assigned + assistant departments)
  const departmentsInfo = useMemo(() => {
    return getTaskDepartmentsInfo(task, users, departments);
  }, [task, users, departments]);

  const isAssistantOnlyForFilteredDept = useMemo(() => {
    if (!currentDeptId || currentDeptId === 'all') return false;
    return isDepartmentAssistantOnly(task, currentDeptId, users);
  }, [task, currentDeptId, users]);

  const isOverdue = isTaskOverdue(task.due_date, task.status);
  const cleanDescription = cleanTaskDescription(task.description);

  return (
    <div
      onClick={() => navigate(`/tasks/${task.id}`)}
      className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between font-['Inter'] h-full min-h-[260px] ${
        isOverdue
          ? 'bg-overdue-bg border-rose-300 hover:border-rose-400 shadow-rose-100'
          : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
      }`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2 py-0.5 text-[12px] leading-[16px] font-mono font-semibold text-slate-700 bg-slate-100 rounded-full border border-slate-200">
              {task.task_number}
            </span>
            <Badge variant={task.priority} size="sm">
              {task.priority ? `${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority` : ''}
            </Badge>
            {isAssistantOnlyForFilteredDept && (
              <Badge variant="assistant" size="sm">
                Assistant
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {unreadChatCount > 0 && (
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-[#2563EB] dark:bg-[#3B82F6] text-white shadow-xs"
                title={`${unreadChatCount} unread comment${unreadChatCount > 1 ? 's' : ''}`}
              >
                <MessageSquare className="w-3 h-3 fill-blue-50 dark:fill-blue-950/40" />
                <span>{unreadChatCount > 9 ? '9+' : unreadChatCount}</span>
              </span>
            )}

            <Badge variant={isOverdue ? 'overdue' : task.status} size="sm">
              {isOverdue
                ? 'Overdue'
                : task.status === 'in_progress'
                ? 'In Progress'
                : task.status === 'completed'
                ? 'Completed'
                : 'Pending'}
            </Badge>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-[14px] font-semibold leading-[20px] text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2">
          {task.title}
        </h3>

        {/* Task Description */}
        {cleanDescription && (
          <p className="text-[12px] leading-[16px] font-semibold text-slate-500 line-clamp-2 mt-1.5">
            {cleanDescription}
          </p>
        )}

        {/* Task Origin Badge */}
        {task.task_origin && (
          <div className="mt-2.5 inline-flex items-center gap-1 text-[12px] leading-[16px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md">
            <CornerDownRight className="w-3 h-3 text-emerald-600" />
            <span>
              {(() => {
                const creator = users.find((u) => u.id === task.created_by);
                const isCrossHod =
                  creator?.role === 'hod' &&
                  primaryAssignee?.role === 'hod' &&
                  creator?.id !== primaryAssignee?.id;
                if (isCrossHod) return 'HOD → HOD Task';
                if (task.task_origin === 'admin_to_hod') return 'Admin → HOD Task';
                if (task.task_origin === 'hod_to_member') return 'Team Task';
                return 'Personal Task';
              })()}
            </span>
          </div>
        )}

        {/* Attached Assets on Card */}
        {task.attachments && task.attachments.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {task.attachments.slice(0, 3).map((att) => {
              if (att.type === 'image' && att.url) {
                return (
                  <img
                    key={att.id || att.url}
                    src={att.url}
                    alt={att.name}
                    className="w-7 h-7 rounded-lg object-cover border border-slate-200"
                    title={att.name}
                  />
                );
              }
              return (
                <span
                  key={att.id || att.name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60"
                  title={att.name}
                >
                  <Paperclip className="w-3 h-3 text-emerald-600" />
                  <span className="max-w-[80px] truncate">{att.ext || att.type}</span>
                </span>
              );
            })}
            {task.attachments.length > 3 && (
              <span className="text-[10px] font-bold text-slate-400">
                +{task.attachments.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-[12px] leading-[16px] font-semibold text-slate-500">
        {/* Top footer row: Assigned Department(s) & Due Date */}
        <div className="flex items-center justify-between gap-2">
          {departmentsInfo.length > 0 ? (
            <div
              className="flex items-center gap-1.5 font-semibold text-[11.5px] text-slate-700 min-w-0 flex-1 overflow-hidden"
              title={`Departments: ${departmentsInfo
                .map((d) => `${d.name}${d.isAssistant ? ' (Assistant)' : ''}`)
                .join(', ')}`}
            >
              {departmentsInfo.length === 1 ? (
                <div className="flex items-center gap-1.5 min-w-0 truncate">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: departmentsInfo[0].color || '#10b981' }}
                  />
                  <span className="truncate max-w-[130px]">{departmentsInfo[0].name}</span>
                  {departmentsInfo[0].isAssistant && (
                    <Badge variant="assistant" size="sm" className="text-[10px] px-1.5 py-0 leading-none">
                      Assistant
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1 min-w-0 truncate">
                  <div className="flex -space-x-1 flex-shrink-0">
                    {departmentsInfo.map((d) => (
                      <span
                        key={d.id}
                        className="w-2 h-2 rounded-full ring-1 ring-white"
                        style={{ backgroundColor: d.color || '#10b981' }}
                      />
                    ))}
                  </div>
                  <span className="truncate max-w-[125px]">
                    {departmentsInfo.map((d) => d.name).join(', ')}
                  </span>
                  {departmentsInfo.some((d) => d.isAssistant) && (
                    <Badge variant="assistant" size="sm" className="text-[10px] px-1.5 py-0 leading-none">
                      Assistant
                    </Badge>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-[11.5px] text-amber-700 min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="truncate max-w-[150px]">No Department, Admin</span>
            </div>
          )}

          {/* Due Date */}
          <div className="flex items-center gap-1 font-semibold text-[11.5px] text-slate-600 flex-shrink-0">
            <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className={isOverdue ? 'text-rose-700 font-bold' : ''}>
              {formatDate(task.due_date, 'dd MMM')}
            </span>
          </div>
        </div>

        {/* Stakeholder Details (Assigned To + Assists By) */}
        <div className="space-y-1.5 pt-1.5 border-t border-slate-100/80">
          {/* Assigned To Row */}
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 flex-shrink-0">
              Assigned:
            </span>
            {assignees.length > 0 ? (
              <div
                className="flex items-center gap-1.5 min-w-0 truncate"
                title={`Assigned to: ${assignees.map((a) => a.full_name).join(', ')}`}
              >
                <div className="flex -space-x-1.5 overflow-hidden flex-shrink-0">
                  {assignees.map((a) => (
                    <Avatar key={a.id} src={a.avatar_url} name={a.full_name} size="xs" />
                  ))}
                </div>
                <span className="font-bold text-slate-800 truncate">
                  {assignees.length === 1
                    ? assignees[0].full_name
                    : `${assignees.length} Assignees`}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">Unassigned</span>
            )}
          </div>

          {/* Assists By Row (Equal reserved height) */}
          <div className="min-h-[20px] flex items-center justify-between gap-2 text-[11px]">
            {assistants.length > 0 ? (
              <>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-teal-700 flex items-center gap-1 flex-shrink-0">
                  <UserCheck className="w-3 h-3 text-teal-600" />
                  <span>Assists:</span>
                </span>
                <div
                  className="flex items-center gap-1.5 min-w-0 truncate"
                  title={`Assisted by: ${assistants.map((a) => a.full_name).join(', ')}`}
                >
                  <div className="flex -space-x-1.5 overflow-hidden flex-shrink-0">
                    {assistants.map((a) => (
                      <Avatar key={a.id} src={a.avatar_url} name={a.full_name} size="xs" />
                    ))}
                  </div>
                  <span className="font-bold text-teal-900 truncate">
                    {assistants.length === 1
                      ? assistants[0].full_name
                      : `${assistants.length} Assistants`}
                  </span>
                </div>
              </>
            ) : (
              <div className="h-[20px]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
