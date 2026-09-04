import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { UnreadBadge } from '../common/UnreadBadge';
import { getTaskUnreadCount } from '../../utils/comments/unreadCommentSelectors';
import {
  Flag,
  MoreHorizontal,
  ChevronDown,
  MessageSquare,
  Paperclip,
  Check,
  Edit2,
  Trash2,
  Eye,
  Clock,
} from 'lucide-react';
import {
  getTaskAssigneeIds,
  getTaskAssistantIds,
  getTaskDepartmentsInfo,
} from '../../utils/taskDepartmentUtils';
import { getTaskPermissions } from '../../utils/taskPermissions';
import { isTaskOverdue } from '../../utils/dateUtils';

export function TaskListRow({
  task,
  isLastRow = false,
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  onUpdateStatus,
  onUpdatePriority,
  onRequestCompletion,
  onRequestDelete,
  onDirectDelete,
  visibleColumns = {},
  onOpenTask,
  onEditTask,
}) {
  const navigate = useNavigate();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuOpenUpward, setMenuOpenUpward] = useState(false);
  const [statusOpenUpward, setStatusOpenUpward] = useState(false);
  const [priorityOpenUpward, setPriorityOpenUpward] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusRef = useRef(null);
  const priorityRef = useRef(null);
  const menuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (statusRef.current && !statusRef.current.contains(e.target)) setIsStatusOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(e.target)) setIsPriorityOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const permissions = getTaskPermissions(task, currentUser);

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

  // Assistants
  const assistantIds = getTaskAssistantIds(task);
  const assistants = assistantIds.map((id) => userMap[id]).filter(Boolean);
  const firstAssistant = assistants[0];
  const secondAssistant = assistants[1];
  const extraAssistCount = assistants.length > 2 ? assistants.length - 2 : 0;

  // Department info
  const allDepartments = React.useMemo(() => {
    return getTaskDepartmentsInfo(task, users, departments) || [];
  }, [task, users, departments]);

  const primaryDepartment =
    allDepartments.find((d) => d?.isPrimary) || allDepartments[0] || null;
  const additionalDepartmentsCount =
    allDepartments.length > 1 ? allDepartments.length - 1 : 0;

  // Overdue check
  const isOverdue = isTaskOverdue(task.due_date, task.status);

  // Due date formatting
  const formattedDueDate = (() => {
    if (!task.due_date) return '—';
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

  // Pending Completion Request Check
  const pendingCompletionRequest = (completionRequests || []).find(
    (r) => r.task_id === task.id && r.status === 'pending'
  );
  const hasMyPendingRequest =
    pendingCompletionRequest?.requested_by === currentUser?.id;

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

  const getStatusInfo = (status) => {
    switch (status) {
      case 'in_progress':
        return { label: 'In Progress', dot: 'bg-[#2563EB]', color: 'text-[#2563EB]' };
      case 'completed':
        return { label: 'Completed', dot: 'bg-[#16A34A]', color: 'text-[#16A34A]' };
      case 'pending':
      default:
        return { label: 'Pending', dot: 'bg-[#71717A]', color: 'text-[#71717A]' };
    }
  };

  const statusInfo = getStatusInfo(task.status);

  // Handlers with smart upward flip detection
  const handleToggleStatus = (e) => {
    e.stopPropagation();
    if (!isStatusOpen && statusRef.current) {
      const rect = statusRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setStatusOpenUpward(spaceBelow < 180 || isLastRow);
    }
    setIsStatusOpen((prev) => !prev);
  };

  const handleTogglePriority = (e) => {
    e.stopPropagation();
    if (!isPriorityOpen && priorityRef.current) {
      const rect = priorityRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setPriorityOpenUpward(spaceBelow < 180 || isLastRow);
    }
    setIsPriorityOpen((prev) => !prev);
  };

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setMenuOpenUpward(spaceBelow < 180 || isLastRow);
    }
    setIsMenuOpen((prev) => !prev);
  };

  // Priority Change Handler
  const handleSelectPriority = async (newPriority) => {
    setIsPriorityOpen(false);
    if (newPriority === task.priority) return;

    setIsUpdating(true);
    try {
      await onUpdatePriority(task.id, newPriority);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <tr
      onClick={() => {
        if (onOpenTask) {
          onOpenTask(task.id);
        } else {
          navigate(`/tasks/${task.id}`);
        }
      }}
      className="h-[54px] border-b border-[#F4F4F5] hover:bg-[#F8F9FA] transition-colors cursor-pointer group text-[12.5px]"
    >
      {/* 1. Task Column (ID + Title) */}
      <td className="pl-4 py-2 pr-3 min-w-[220px] max-w-[280px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] text-[#71717A] flex-shrink-0">
            {task.task_number || 'TM-0000'}
          </span>
          <span className="font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
            {task.title}
          </span>
        </div>
      </td>

      {/* 2. Status Column */}
      {visibleColumns.status !== false && (
        <td
          className="py-2 pr-3 min-w-[125px] whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {hasMyPendingRequest ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
              <Clock className="w-3 h-3" />
              <span>Requested</span>
            </span>
          ) : permissions.canUpdateGlobalTaskStatus ? (
            <div className="relative inline-block" ref={statusRef}>
              <button
                type="button"
                onClick={handleToggleStatus}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] hover:bg-[#F5F6F8] transition-colors cursor-pointer outline-none focus:outline-none"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                <span className={`text-[12px] font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
              </button>

              {isStatusOpen && (
                <div
                  className={`absolute left-0 ${
                    statusOpenUpward ? 'bottom-full mb-1.5' : 'top-full mt-1'
                  } w-36 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5`}
                >
                  {['pending', 'in_progress', 'completed'].map((st) => {
                    const sInfo = getStatusInfo(st);
                    const isMustRequest = st === 'completed' && permissions.mustRequestCompletion;

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          setIsStatusOpen(false);
                          if (isMustRequest) {
                            onRequestCompletion?.(task.id);
                          } else {
                            onUpdateStatus?.(task.id, st);
                          }
                        }}
                        className="w-full flex items-center justify-between px-2 py-1 rounded-[5px] text-[11.5px] hover:bg-[#F5F6F8] text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${sInfo.dot}`} />
                          <span className={sInfo.color}>
                            {isMustRequest ? 'Request Complete' : sInfo.label}
                          </span>
                        </div>
                        {task.status === st && <Check className="w-3 h-3 text-[#059669]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 pl-2">
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
              <span className={`text-[12px] font-medium ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          )}
        </td>
      )}

      {/* 2. Assignee Column - Avatars Only */}
      {visibleColumns.assignee !== false && (
        <td className="py-2 pr-3 whitespace-nowrap w-20">
          <div
            className="flex items-center"
            title={assignees.map((a) => a.full_name).join(', ') || 'Unassigned'}
          >
            {assignees.length === 0 ? (
              <span className="text-[12px] text-[#8B8B95] pl-1">—</span>
            ) : (
              <div className="flex items-center -space-x-1.5 flex-shrink-0">
                {assignees.slice(0, 3).map((a) => (
                  <Avatar
                    key={a.id}
                    src={a.avatar_url}
                    name={a.full_name || 'Member'}
                    size="xs"
                    className="border-2 border-white"
                  />
                ))}
                {assignees.length > 3 && (
                  <span className="w-5 h-5 rounded-full bg-[#F4F4F5] border-2 border-white text-[10px] font-bold text-[#52525B] flex items-center justify-center">
                    +{assignees.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </td>
      )}

      {/* 3. Assist Column (Assisted By) - Avatars Only */}
      {visibleColumns.assist !== false && (
        <td className="py-2 pr-3 whitespace-nowrap w-20">
          <div
            className="flex items-center"
            title={assistants.map((a) => a.full_name).join(', ') || 'No assistants'}
          >
            {assistants.length === 0 ? (
              <span className="text-[12px] text-[#8B8B95] pl-1">—</span>
            ) : (
              <div className="flex items-center -space-x-1.5 flex-shrink-0">
                {assistants.slice(0, 3).map((ast) => (
                  <Avatar
                    key={ast.id}
                    src={ast.avatar_url}
                    name={ast.full_name || 'Assistant'}
                    size="xs"
                    className="border-2 border-white"
                  />
                ))}
                {assistants.length > 3 && (
                  <span className="w-5 h-5 rounded-full bg-[#F4F4F5] border-2 border-white text-[10px] font-bold text-[#52525B] flex items-center justify-center">
                    +{assistants.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </td>
      )}

      {/* 4. Priority Column */}
      {visibleColumns.priority !== false && (
        <td
          className="py-2 pr-3 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {permissions.canEdit ? (
            <div className="relative inline-block" ref={priorityRef}>
              <button
                type="button"
                onClick={handleTogglePriority}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] hover:bg-[#F5F6F8] transition-colors cursor-pointer outline-none focus:outline-none"
              >
                <Flag className={`w-3 h-3 ${priorityInfo.iconColor}`} />
                <span className={`text-[12px] font-medium ${priorityInfo.color}`}>
                  {priorityInfo.label}
                </span>
                <ChevronDown className="w-3 h-3 text-[#8B8B95]" />
              </button>

              {isPriorityOpen && (
                <div
                  className={`absolute left-0 ${
                    priorityOpenUpward ? 'bottom-full mb-1.5' : 'top-full mt-1'
                  } w-32 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5`}
                >
                  {['urgent', 'high', 'medium', 'low'].map((p) => {
                    const info = getPriorityInfo(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleSelectPriority(p)}
                        className="w-full flex items-center justify-between px-2 py-1 rounded-[5px] text-[11.5px] hover:bg-[#F5F6F8] text-left cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5">
                          <Flag className={`w-3 h-3 ${info.iconColor}`} />
                          <span className={info.color}>{info.label}</span>
                        </div>
                        {task.priority?.toLowerCase() === p && (
                          <Check className="w-3 h-3 text-[#059669]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Flag className={`w-3 h-3 ${priorityInfo.iconColor}`} />
              <span className={`text-[12px] font-medium ${priorityInfo.color}`}>
                {priorityInfo.label}
              </span>
            </div>
          )}
        </td>
      )}

      {/* 5. Department Column */}
      {visibleColumns.department !== false && (
        <td className="py-2 pr-3 min-w-[120px] max-w-[170px]">
          <span
            className="text-[12px] text-[#52525B] truncate block"
            title={allDepartments.map((d) => d?.name).filter(Boolean).join(', ') || 'No department'}
          >
            {primaryDepartment ? (
              <>
                {primaryDepartment.name}
                {additionalDepartmentsCount > 0 && ` +${additionalDepartmentsCount}`}
              </>
            ) : (
              <span className="text-[#8B8B95]">No department</span>
            )}
          </span>
        </td>
      )}

      {/* 6. Due Date Column */}
      {visibleColumns.due_date !== false && (
        <td className="py-2 pr-3 whitespace-nowrap">
          <span
            className={`text-[12px] font-medium ${
              isOverdue
                ? 'text-[#DC2626]'
                : formattedDueDate === 'Today'
                ? 'text-[#059669]'
                : 'text-[#52525B]'
            }`}
          >
            {formattedDueDate}
          </span>
        </td>
      )}

      {/* 7. Activity & More Actions Column */}
      {visibleColumns.activity !== false && (
        <td
          className="py-2 pr-4 text-right whitespace-nowrap w-28"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end gap-2.5">
            {/* Unread Comments Indicator - shown ONLY when unreadCommentCount > 0 */}
            {unreadCommentCount > 0 && (
              <div
                className="flex items-center gap-1 text-[#2563EB] dark:text-[#3B82F6] text-[11px] font-medium relative cursor-pointer hover:opacity-80 transition-opacity"
                title={`${unreadCommentCount} unread comment${unreadCommentCount === 1 ? '' : 's'}`}
                aria-label={`Open ${unreadCommentCount} unread comment${unreadCommentCount === 1 ? '' : 's'} for ${task.task_number || task.title}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onTaskClick) onTaskClick(task);
                  else navigate(`/tasks/${task.id}`);
                }}
              >
                <MessageSquare className="w-3.5 h-3.5 fill-blue-50 dark:fill-blue-950/40" />
                <UnreadBadge count={unreadCommentCount} size="sm" />
              </div>
            )}

            {/* Attachments Count */}
            {attachmentCount > 0 && (
              <div
                className="flex items-center gap-1 text-[#71717A] text-[11px] cursor-pointer hover:text-[#18181B]"
                title={`${attachmentCount} attachments`}
                onClick={() => navigate(`/tasks/${task.id}`)}
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span>{attachmentCount}</span>
              </div>
            )}

            {/* Three-Dot Menu */}
            <div className="relative inline-flex items-center" ref={menuRef}>
              <button
                type="button"
                onClick={handleToggleMenu}
                className={`w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors cursor-pointer outline-none focus:outline-none ${
                  isMenuOpen
                    ? 'bg-[#F4F4F5] text-[#18181B]'
                    : 'text-[#8B8B95] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                }`}
                aria-label="More task actions"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div
                  className={`absolute right-0 ${
                    menuOpenUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                  } w-40 bg-white rounded-[8px] border border-[#E5E7EB] shadow-lg py-1 px-1 z-50 animate-fade-in space-y-0.5 text-left`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate(`/tasks/${task.id}`);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[12.5px] font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-[#71717A]" />
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[12.5px] font-medium text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4 text-[#71717A]" />
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
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[12.5px] font-medium text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-[#DC2626]" />
                      <span>Delete Task</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onRequestDelete(task);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-[12.5px] font-medium text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-[#DC2626]" />
                      <span>Request Delete</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </td>
      )}
    </tr>
  );
}
