import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { getTaskDepartmentsInfo } from '../../utils/taskDepartmentUtils';
import { getTaskPermissions } from '../../utils/taskPermissions';
import { isTaskOverdue, parseTaskDueDateLocal } from '../../utils/dateUtils';
import { format } from 'date-fns';

export function MyTasksRow({
  task,
  currentUser,
  users = [],
  departments = [],
  completionRequests = [],
  readChatIds = [],
  isSelected = false,
  onToggleSelect,
  onUpdateStatus,
  onUpdatePriority,
  onRequestCompletion,
  onRequestDelete,
  onDirectDelete,
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

  const statusRef = useRef(null);
  const priorityRef = useRef(null);
  const menuRef = useRef(null);

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

  // Department Info
  const allDepartments = React.useMemo(() => {
    return getTaskDepartmentsInfo(task, users, departments) || [];
  }, [task, users, departments]);

  const primaryDepartment =
    allDepartments.find((d) => d?.isPrimary) || allDepartments[0] || null;
  const additionalDepartmentsCount =
    allDepartments.length > 1 ? allDepartments.length - 1 : 0;

  // Pending Completion Request Check
  const pendingCompletionRequest = (completionRequests || []).find(
    (r) => r.task_id === task.id && r.status === 'pending'
  );
  const hasMyPendingRequest =
    pendingCompletionRequest?.requested_by === currentUser?.id;

  // Overdue Check
  const isOverdue = isTaskOverdue(task.due_date, task.status);

  // Due Date Formatting
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

  // Activity Counts
  const updates = task.task_updates || [];
  const messageCount = updates.filter((u) => Boolean(u.text && u.text.trim())).length;
  const attachmentCount =
    (task.attachments?.length || 0) +
    updates.reduce((acc, u) => acc + (u.attachments?.length || 0), 0);

  const hasUnread = updates.some((u) => {
    if (u.user_id === currentUser?.id) return false;
    const isSeenInUpdate = Array.isArray(u.seen_by) && u.seen_by.includes(currentUser?.id);
    const isReadInChat = readChatIds.includes(u.id);
    return !isSeenInUpdate && !isReadInChat;
  });

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

  // Smart Upward Dropdown Handlers
  const handleToggleStatus = (e) => {
    e.stopPropagation();
    if (!isStatusOpen && statusRef.current) {
      const rect = statusRef.current.getBoundingClientRect();
      setStatusOpenUpward(window.innerHeight - rect.bottom < 180);
    }
    setIsStatusOpen((prev) => !prev);
  };

  const handleTogglePriority = (e) => {
    e.stopPropagation();
    if (!isPriorityOpen && priorityRef.current) {
      const rect = priorityRef.current.getBoundingClientRect();
      setPriorityOpenUpward(window.innerHeight - rect.bottom < 180);
    }
    setIsPriorityOpen((prev) => !prev);
  };

  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!isMenuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setMenuOpenUpward(window.innerHeight - rect.bottom < 180);
    }
    setIsMenuOpen((prev) => !prev);
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
      className="h-[52px] border-b border-[#F4F4F5] hover:bg-[#F8F9FA] transition-colors cursor-pointer group text-[12.5px]"
    >
      {/* 1. Selection Checkbox */}
      <td
        className="pl-4 pr-2 w-9 py-2"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onToggleSelect(task.id, e)}
          className="rounded border-[#D4D4D8] text-[#059669] focus:ring-0 cursor-pointer w-3.5 h-3.5"
          aria-label={`Select ${task.task_number || 'task'} ${task.title}`}
        />
      </td>

      {/* 2. Task Number & Title */}
      <td className="py-2 pr-3 min-w-[220px] max-w-[300px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-[11px] text-[#71717A] flex-shrink-0">
            {task.task_number || 'TM-0000'}
          </span>
          <span className="font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
            {task.title}
          </span>
        </div>
      </td>

      {/* 3. Status Column */}
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
                          onRequestCompletion(task.id);
                        } else {
                          onUpdateStatus(task.id, st);
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

      {/* 4. Priority Column */}
      <td
        className="py-2 pr-3 whitespace-nowrap min-w-[105px]"
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
                  const pInfo = getPriorityInfo(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setIsPriorityOpen(false);
                        onUpdatePriority(task.id, p);
                      }}
                      className="w-full flex items-center justify-between px-2 py-1 rounded-[5px] text-[11.5px] hover:bg-[#F5F6F8] text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Flag className={`w-3 h-3 ${pInfo.iconColor}`} />
                        <span className={pInfo.color}>{pInfo.label}</span>
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

      {/* 5. Department Column */}
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
            <span className="text-[#8B8B95]">—</span>
          )}
        </span>
      </td>

      {/* 6. Due Date Column */}
      <td className="py-2 pr-3 whitespace-nowrap w-24">
        <span
          className={`text-[12px] font-medium ${
            isOverdue
              ? 'text-[#DC2626] font-semibold'
              : formattedDueDate === 'Today'
              ? 'text-[#059669] font-semibold'
              : 'text-[#52525B]'
          }`}
        >
          {formattedDueDate}
        </span>
      </td>

      {/* 7. Comments Count */}
      <td
        className="py-2 px-2 text-center w-12"
        onClick={(e) => e.stopPropagation()}
      >
        {messageCount > 0 ? (
          <div
            className="inline-flex items-center gap-1 text-[#71717A] text-[11px] relative cursor-pointer hover:text-[#18181B]"
            title={`${messageCount} comments`}
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{messageCount}</span>
            {hasUnread && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -top-0.5 -right-1" />
            )}
          </div>
        ) : null}
      </td>

      {/* 8. Attachments Count */}
      <td
        className="py-2 px-2 text-center w-10"
        onClick={(e) => e.stopPropagation()}
      >
        {attachmentCount > 0 ? (
          <div
            className="inline-flex items-center gap-1 text-[#71717A] text-[11px] cursor-pointer hover:text-[#18181B]"
            title={`${attachmentCount} attachments`}
            onClick={() => navigate(`/tasks/${task.id}`)}
          >
            <Paperclip className="w-3.5 h-3.5" />
          </div>
        ) : null}
      </td>

      {/* 9. Three-Dot Action Menu */}
      <td
        className="py-2 pr-4 text-right whitespace-nowrap w-10"
        onClick={(e) => e.stopPropagation()}
      >
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
      </td>
    </tr>
  );
}
