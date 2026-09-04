import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Avatar } from '../common/Avatar';
import {
  GripVertical,
  MoreHorizontal,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Edit2,
  Trash2,
  Clock,
} from 'lucide-react';
import {
  getTaskAssigneeIds,
  getTaskDepartmentsInfo,
} from '../../utils/taskDepartmentUtils';
import { getTaskPermissions } from '../../utils/taskPermissions';
import { isTaskOverdue } from '../../utils/dateUtils';
import { UnreadBadge } from '../common/UnreadBadge';
import { getTaskUnreadCount } from '../../utils/comments/unreadCommentSelectors';

export function TaskBoardCard({
  task,
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  onRequestDelete,
  onDirectDelete,
  isOverlay = false,
  onOpenTask,
  onEditTask,
}) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOpenUpward, setMenuOpenUpward] = useState(false);
  const menuRef = useRef(null);

  const permissions = getTaskPermissions(task, currentUser);

  // Can user drag this card? (Must have status permission and cannot be completed)
  const canDrag = permissions.canUpdateGlobalTaskStatus && task.status !== 'completed';

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canDrag || isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // User Map
  const userMap = React.useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  // Assignees
  const assigneeIds = getTaskAssigneeIds(task);
  const assignees = assigneeIds.map((id) => userMap[id]).filter(Boolean);
  const firstAssignee = assignees[0];
  const secondAssignee = assignees[1];
  const extraAssigneeCount = assignees.length > 2 ? assignees.length - 2 : 0;

  // Department Info
  const allDepartments = React.useMemo(() => {
    return getTaskDepartmentsInfo(task, users, departments) || [];
  }, [task, users, departments]);

  const primaryDepartment =
    allDepartments.find((d) => d?.isPrimary) || allDepartments[0] || null;
  const additionalDepartmentsCount =
    allDepartments.length > 1 ? allDepartments.length - 1 : 0;

  // Pending completion request check
  const pendingCompletionRequest = (completionRequests || []).find(
    (r) => r.task_id === task.id && r.status === 'pending'
  );
  const hasMyPendingRequest =
    pendingCompletionRequest?.requested_by === currentUser?.id;

  // Overdue check
  const isOverdue = isTaskOverdue(task.due_date, task.status);

  // Due date formatting
  const formattedDueDate = (() => {
    if (!task.due_date) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDateStr = task.due_date.split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dueDateStr === todayStr) return 'Today';
    if (dueDateStr === tomorrowStr) return 'Tomorrow';

    const d = new Date(task.due_date);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  })();

  // Activity counts
  const updates = task.task_updates || [];
  const unreadCommentCount = getTaskUnreadCount(task, currentUser?.id, readChatIds);
  const attachmentCount =
    (task.attachments?.length || 0) +
    updates.reduce((acc, u) => acc + (u.attachments?.length || 0), 0);

  const getPriorityInfo = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return { label: 'Urgent', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' };
      case 'high':
        return { label: 'High', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' };
      case 'medium':
        return { label: 'Medium', color: 'text-[#D97706]', iconColor: 'text-[#D97706]' };
      case 'low':
      default:
        return { label: 'Low', color: 'text-[#71717A]', iconColor: 'text-[#71717A]' };
    }
  };

  const priorityInfo = getPriorityInfo(task.priority);

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuOpenUpward(spaceBelow < 180);
    }
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => {
        if (onOpenTask) {
          onOpenTask(task.id);
        } else {
          navigate(`/tasks/${task.id}`);
        }
      }}
      className={`bg-white rounded-[10px] border border-[#E5E7EB] hover:border-[#D4D4D8] p-3.5 space-y-2.5 transition-all select-none cursor-pointer group shadow-2xs ${
        isOverlay
          ? 'shadow-lg border-[#2563EB] ring-2 ring-[#2563EB]/20 rotate-1'
          : ''
      }`}
    >
      {/* 1. Top Row: Task Number + Drag Handle + Menu */}
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[11.5px] text-[#71717A] tracking-tight">
          {task.task_number || 'TM-0000'}
        </span>

        <div
          className="flex items-center gap-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          {canDrag && !isOverlay && (
            <div
              {...attributes}
              {...listeners}
              className="p-1 text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#F4F4F5] rounded-[4px] cursor-grab active:cursor-grabbing transition-colors"
              title="Drag to change status"
            >
              <GripVertical className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Three-Dot Menu */}
          <div className="relative inline-flex items-center" ref={menuRef}>
            <button
              type="button"
              onClick={handleToggleMenu}
              className={`w-6 h-6 flex items-center justify-center rounded-[4px] transition-colors cursor-pointer outline-none focus:outline-none ${
                isMenuOpen
                  ? 'bg-[#F4F4F5] text-[#18181B]'
                  : 'text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#F4F4F5]'
              }`}
              aria-label="Task actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMenuOpen && (
              <div
                className={`absolute right-0 ${
                  menuOpenUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                } w-36 bg-white rounded-[8px] border border-[#E5E7EB] shadow-lg py-1 px-1 z-50 animate-fade-in space-y-0.5 text-left`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(`/tasks/${task.id}`);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#71717A]" />
                  <span>Open Task</span>
                </button>

                {permissions.canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onEditTask) {
                        onEditTask(task.id);
                      } else {
                        navigate(`/tasks/edit/${task.id}`);
                      }
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
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
                      onDirectDelete(task);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Delete Task</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onRequestDelete(task);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Request Delete</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Task Title */}
      <div>
        <h4 className="text-[13.5px] font-semibold text-[#18181B] leading-snug line-clamp-2 group-hover:text-[#059669] transition-colors">
          {task.title}
        </h4>
      </div>

      {/* 3. Department Label */}
      {primaryDepartment && (
        <div className="text-[11.5px] text-[#71717A] truncate">
          <span>{primaryDepartment.name}</span>
          {additionalDepartmentsCount > 0 && (
            <span className="ml-1 text-[#A1A1AA]">+{additionalDepartmentsCount}</span>
          )}
        </div>
      )}

      {/* 4. People & Status Badge */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {/* Assignees */}
        <div
          className="flex items-center gap-1.5 truncate"
          title={assignees.map((a) => a.full_name).join(', ') || 'Unassigned'}
        >
          {assignees.length === 0 ? (
            <span className="text-[11.5px] text-[#A1A1AA]">Unassigned</span>
          ) : (
            <>
              <div className="flex items-center -space-x-1.5 flex-shrink-0">
                <Avatar
                  src={firstAssignee?.avatar_url}
                  name={firstAssignee?.full_name || 'Member'}
                  size="xs"
                  className="border-2 border-white"
                />
                {secondAssignee && (
                  <Avatar
                    src={secondAssignee?.avatar_url}
                    name={secondAssignee?.full_name || 'Member'}
                    size="xs"
                    className="border-2 border-white"
                  />
                )}
              </div>
              <span className="text-[12px] text-[#52525B] font-medium truncate">
                {firstAssignee?.full_name}
                {secondAssignee && extraAssigneeCount === 0 && ` + ${secondAssignee.full_name}`}
                {extraAssigneeCount > 0 && ` +${extraAssigneeCount + 1}`}
              </span>
            </>
          )}
        </div>

        {/* Optional Status / Workflow Badge */}
        {hasMyPendingRequest ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[10.5px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200 flex-shrink-0">
            <Clock className="w-3 h-3" />
            <span>Requested</span>
          </span>
        ) : task.status === 'in_progress' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10.5px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex-shrink-0">
            In Progress
          </span>
        ) : task.status === 'completed' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] text-[10.5px] font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex-shrink-0">
            Completed
          </span>
        ) : null}
      </div>

      {/* 5. Bottom Row: Priority + Due Date + Activity */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[#F4F4F5] text-[11.5px]">
        {/* Priority & Due Date */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center gap-1 flex-shrink-0">
            <Flag className={`w-3 h-3 ${priorityInfo.iconColor}`} />
            <span className={`font-medium ${priorityInfo.color}`}>
              {priorityInfo.label}
            </span>
          </div>

          {formattedDueDate && (
            <span
              className={`font-medium truncate ${
                isOverdue
                  ? 'text-[#DC2626]'
                  : formattedDueDate === 'Today'
                  ? 'text-[#DC2626] font-semibold'
                  : 'text-[#71717A]'
              }`}
            >
              {formattedDueDate}
            </span>
          )}
        </div>

        {/* Message & Attachment Counts */}
        <div className="flex items-center gap-2.5 text-[#71717A] text-[11px] flex-shrink-0">
          {unreadCommentCount > 0 && (
            <div
              className="flex items-center gap-1 text-[#2563EB] dark:text-[#3B82F6] font-medium"
              title={`${unreadCommentCount} unread comment${unreadCommentCount === 1 ? '' : 's'}`}
              aria-label={`Open ${unreadCommentCount} unread comment${unreadCommentCount === 1 ? '' : 's'}`}
            >
              <MessageSquare className="w-3.5 h-3.5 fill-blue-50 dark:fill-blue-950/40" />
              <UnreadBadge count={unreadCommentCount} size="sm" />
            </div>
          )}

          {attachmentCount > 0 && (
            <div
              className="flex items-center gap-1"
              title={`${attachmentCount} attachments`}
            >
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
