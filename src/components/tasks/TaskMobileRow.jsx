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
} from 'lucide-react';
import {
  getTaskAssigneeIds,
  getTaskAssistantIds,
  getTaskDepartmentsInfo,
} from '../../utils/taskDepartmentUtils';
import { getTaskPermissions } from '../../utils/taskPermissions';
import { isTaskOverdue } from '../../utils/dateUtils';

export function TaskMobileRow({
  task,
  currentUser,
  users = [],
  departments = [],
  readChatIds = [],
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

  const formattedDueDate = (() => {
    if (!task.due_date) return '—';
    const todayStr = new Date().toISOString().split('T')[0];
    const dueDateStr = task.due_date.split('T')[0];
    if (dueDateStr === todayStr) return 'Today';
    const d = new Date(task.due_date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  })();

  const updates = task.task_updates || [];
  const messageCount = updates.filter((u) => Boolean(u.text && u.text.trim())).length;
  const attachmentCount = task.attachments?.length || 0;

  const hasUnread = updates.some((u) => {
    if (u.user_id === currentUser?.id) return false;
    const isSeenInUpdate = Array.isArray(u.seen_by) && u.seen_by.includes(currentUser?.id);
    const isReadInChat = readChatIds.includes(u.id);
    return !isSeenInUpdate && !isReadInChat;
  });

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

  return (
    <div
      onClick={() => {
        if (onOpenTask) {
          onOpenTask(task.id);
        } else {
          navigate(`/tasks/${task.id}`);
        }
      }}
      className="p-3.5 bg-white border-b border-[#E5E7EB] hover:bg-[#F8F9FA] transition-colors cursor-pointer space-y-2"
    >
      {/* Line 1: Task Number + Title */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[11px] text-[#71717A]">
              {task.task_number || 'TM-0000'}
            </span>
            <span className="font-semibold text-[13.5px] text-[#18181B] truncate block">
              {task.title}
            </span>
          </div>
        </div>

        {/* Priority & Due Date */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
            <Flag className={`w-3 h-3 ${getPriorityColor(task.priority)}`} />
            <span className={`text-[11.5px] font-medium capitalize ${getPriorityColor(task.priority)}`}>
              {task.priority || 'Normal'}
            </span>
          </div>

          <span
            className={`text-[11.5px] font-medium ${
              isOverdue
                ? 'text-[#DC2626]'
                : formattedDueDate === 'Today'
                ? 'text-[#059669]'
                : 'text-[#52525B]'
            }`}
          >
            {formattedDueDate}
          </span>
        </div>
      </div>

      {/* Line 2: Assignee, Assist & Dept */}
      <div className="flex items-center justify-between gap-2 text-[12px] text-[#71717A] flex-wrap">
        <div className="flex items-center gap-3 min-w-0 truncate">
          {/* Assignee */}
          <div className="flex items-center gap-1 truncate">
            <Avatar
              src={firstAssignee?.avatar_url}
              name={firstAssignee?.full_name || 'Unassigned'}
              size="xs"
            />
            <span className="text-[#52525B] font-medium truncate max-w-[85px]">
              {firstAssignee?.full_name?.split(' ')[0] || 'Unassigned'}
            </span>
          </div>

          {/* Assist */}
          {firstAssistant && (
            <div className="flex items-center gap-1 truncate text-[#71717A]">
              <span className="text-[10px] uppercase font-bold text-[#8B8B95]">Assist:</span>
              <Avatar
                src={firstAssistant.avatar_url}
                name={firstAssistant.full_name}
                size="xs"
              />
              <span className="text-[#52525B] truncate max-w-[80px]">
                {firstAssistant.full_name.split(' ')[0]}
              </span>
            </div>
          )}

          {primaryDepartment && (
            <span className="text-[#8B8B95] truncate max-w-[90px]">
              • {primaryDepartment.name}
            </span>
          )}
        </div>
      </div>

      {/* Line 3: Activity & More Menu */}
      <div className="flex items-center justify-between pt-1 border-t border-[#F4F4F5]">
        <div className="flex items-center gap-3 text-[11px] text-[#71717A]">
          {messageCount > 0 && (
            <div className="flex items-center gap-1 relative">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{messageCount}</span>
              {hasUnread && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -top-0.5 -right-1" />
              )}
            </div>
          )}

          {attachmentCount > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" />
              <span>{attachmentCount}</span>
            </div>
          )}
        </div>

        {/* Menu button */}
        <div className="relative">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-1 text-[#8B8B95] hover:text-[#18181B] rounded-[4px]"
            aria-label="Task menu"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5 text-left"
            >
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate(`/tasks/${task.id}`);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B] cursor-pointer"
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#52525B] hover:bg-[#F5F6F8] hover:text-[#18181B] cursor-pointer"
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
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#DC2626] hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onRequestDelete(task);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[5px] text-[12px] text-[#DC2626] hover:bg-red-50 cursor-pointer"
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
