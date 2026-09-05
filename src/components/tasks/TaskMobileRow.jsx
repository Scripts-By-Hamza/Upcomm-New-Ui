import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import {
  Flag,
  MoreHorizontal,
  MessageSquare,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  getTaskAssigneeIds,
  getTaskAssistantIds,
  getTaskDepartmentsInfo,
} from '../../utils/taskDepartmentUtils';
import { getTaskPermissions } from '../../utils/taskPermissions';
import { isTaskOverdue, parseTaskDueDateLocal } from '../../utils/dateUtils';
import { format } from 'date-fns';
import { UnreadBadge } from '../common/UnreadBadge';
import { getTaskUnreadCount } from '../../utils/comments/unreadCommentSelectors';

export function TaskMobileRow({
  task,
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  isSelected = false,
  onToggleSelect,
  onUpdateStatus,
  onRequestCompletion,
  onRequestDelete,
  onDirectDelete,
  onOpenTask,
  onEditTask,
}) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const permissions = getTaskPermissions(task, currentUser);

  const userMap = React.useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  const assigneeIds = getTaskAssigneeIds(task);
  const assignees = assigneeIds.map((id) => userMap[id]).filter(Boolean);
  const firstAssignee = assignees[0];

  const assistantIds = getTaskAssistantIds(task);
  const assistants = assistantIds.map((id) => userMap[id]).filter(Boolean);
  const firstAssistant = assistants[0];

  const allDepartments = React.useMemo(() => {
    return getTaskDepartmentsInfo(task, users, departments) || [];
  }, [task, users, departments]);

  const primaryDepartment =
    allDepartments.find((d) => d?.isPrimary) || allDepartments[0] || null;

  const isOverdue = isTaskOverdue(task.due_date, task.status);

  // Pending Completion Request Check
  const pendingCompletionRequest = (completionRequests || []).find(
    (r) => r.task_id === task.id && r.status === 'pending'
  );
  const hasMyPendingRequest =
    pendingCompletionRequest?.requested_by === currentUser?.id;

  const formattedDueDate = (() => {
    if (!task.due_date) return '—';
    const parsed = parseTaskDueDateLocal(task.due_date);
    if (!parsed) return '—';

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const taskDateStr = format(parsed, 'yyyy-MM-dd');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

    if (taskDateStr === todayStr) return 'Today';
    if (taskDateStr === tomorrowStr) return 'Tomorrow';

    return format(parsed, 'MMM dd');
  })();

  const updates = task.task_updates || [];
  const unreadCommentCount = getTaskUnreadCount(task, currentUser?.id, readChatIds);
  const attachmentCount =
    (task.attachments?.length || 0) +
    updates.reduce((acc, u) => acc + (u.attachments?.length || 0), 0);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return 'text-[#DC2626]';
      case 'medium':
        return 'text-[#D97706]';
      case 'low':
      default:
        return 'text-[#71717A]';
    }
  };

  const getStatusBadge = () => {
    if (hasMyPendingRequest) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10.5px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-[#D97706] border border-amber-200 dark:border-amber-900/40">
          <Clock className="w-3 h-3" />
          <span>Requested</span>
        </span>
      );
    }

    const st = task.status || 'pending';
    if (st === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10.5px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Completed</span>
        </span>
      );
    }
    if (st === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10.5px] font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          <span>In Progress</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10.5px] font-medium bg-zinc-50 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700">
        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
        <span>Pending</span>
      </span>
    );
  };

  return (
    <div
      onClick={() => {
        if (onOpenTask) {
          onOpenTask(task.id);
        } else {
          navigate(`/tasks/${task.id}`);
        }
      }}
      className="p-3 bg-white dark:bg-[#18181B] border-b border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F8F9FA] dark:hover:bg-[#1F2227] transition-colors cursor-pointer space-y-2 select-none"
    >
      {/* Line 1: Checkbox (optional) + Task Number + Title + Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={isSelected}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onToggleSelect(task.id, e)}
              className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer w-3.5 h-3.5 flex-shrink-0"
              aria-label={`Select ${task.task_number || 'task'} ${task.title}`}
            />
          )}
          <span className="font-mono text-[11px] text-[#71717A] dark:text-[#A1A1AA] flex-shrink-0">
            {task.task_number || 'TM-0000'}
          </span>
          <span className="font-semibold text-[13px] text-[#18181B] dark:text-[#F4F4F5] truncate block flex-1">
            {task.title}
          </span>
        </div>

        {/* Status Badge */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {getStatusBadge()}
        </div>
      </div>

      {/* Line 2: Priority, Department, Assignee, Due Date */}
      <div className="flex items-center justify-between gap-2 text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
        {/* Left Side Info */}
        <div className="flex items-center gap-2 min-w-0 truncate">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
            <span className={`font-medium capitalize ${getPriorityColor(task.priority)}`}>
              {task.priority || 'Normal'}
            </span>
          </div>

          {primaryDepartment && (
            <span className="truncate max-w-[110px] text-[#8B8B95] dark:text-[#71717A]">
              • {primaryDepartment.name}
            </span>
          )}

          {firstAssignee && (
            <div className="flex items-center gap-1 truncate text-[#52525B] dark:text-[#C4C7CE]">
              <Avatar
                src={firstAssignee.avatar_url}
                name={firstAssignee.full_name}
                size="xs"
                className="w-4 h-4 text-[9px] flex-shrink-0"
              />
              <span className="truncate max-w-[75px]">
                {firstAssignee.full_name?.split(' ')[0]}
              </span>
            </div>
          )}
        </div>

        {/* Right Side Due Date */}
        <div className="flex-shrink-0">
          <span
            className={`font-medium ${
              isOverdue
                ? 'text-[#DC2626] font-semibold'
                : formattedDueDate === 'Today'
                ? 'text-[#059669] font-semibold'
                : 'text-[#52525B] dark:text-[#C4C7CE]'
            }`}
          >
            {formattedDueDate}
          </span>
        </div>
      </div>

      {/* Line 3: Activity Indicators & Menu */}
      <div className="flex items-center justify-between pt-1 border-t border-[#F4F4F5] dark:border-[#27272A] text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
        <div className="flex items-center gap-3">
          {unreadCommentCount > 0 ? (
            <div className="flex items-center gap-1 text-[#2563EB] dark:text-[#3B82F6] font-semibold">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{unreadCommentCount} unread</span>
            </div>
          ) : updates.length > 0 ? (
            <div className="flex items-center gap-1 text-[#71717A] dark:text-[#A1A1AA]">
              <MessageSquare className="w-3 h-3" />
              <span>{updates.length}</span>
            </div>
          ) : null}

          {attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-[#71717A] dark:text-[#A1A1AA]">
              <Paperclip className="w-3 h-3" />
              <span>{attachmentCount}</span>
            </div>
          )}
        </div>

        {/* More Actions Menu */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-[#8B8B95] hover:text-[#18181B] dark:hover:text-[#F4F4F5] rounded-[4px] cursor-pointer"
            aria-label="Task menu"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div
              className="absolute right-0 bottom-full mb-1 w-40 bg-white dark:bg-[#18181B] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A] shadow-xl p-1 z-50 animate-fade-in space-y-0.5 text-left"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (onOpenTask) onOpenTask(task.id);
                  else navigate(`/tasks/${task.id}`);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5] cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-[#71717A]" />
                <span>Open Task</span>
              </button>

              {permissions.canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (onEditTask) onEditTask(task.id);
                    else navigate(`/tasks/edit/${task.id}`);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#52525B] dark:text-[#C4C7CE] hover:bg-[#F5F6F8] dark:hover:bg-[#22262B] hover:text-[#18181B] dark:hover:text-[#F4F4F5] cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>Edit Task</span>
                </button>
              )}

              {permissions.canDeleteDirectly ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onDirectDelete?.(task);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRequestDelete?.(task);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Request Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
