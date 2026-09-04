import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppData, cleanTaskDescription } from '../../../contexts/AppDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Avatar } from '../../common/Avatar';
import { Modal } from '../../common/Modal';
import {
  Flag,
  CalendarDays,
  Building2,
  Paperclip,
  Send,
  Download,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Pencil,
  ChevronDown,
  Trash2,
  Check,
  CheckCheck,
  X,
  Loader2,
  Plus,
  ExternalLink,
  Link2,
  AtSign,
} from 'lucide-react';
import { format } from 'date-fns';
import { parseTaskDueDateLocal, isTaskOverdue, formatDate } from '../../../utils/dateUtils';
import {
  getTaskAssigneeIds,
  getTaskAssistantIds,
  getTaskDepartmentsInfo,
} from '../../../utils/taskDepartmentUtils';
import { getTaskPermissions } from '../../../utils/taskPermissions';
import { EditTaskModal } from '../EditTaskModal';
import { RequestDeleteModal } from '../RequestDeleteModal';
import { AddTaskTeamModal } from '../AddTaskTeamModal';

// Helper to format comment text with clickable blue links and highlighted @mentions
export function renderFormattedCommentText(text) {
  if (!text) return null;

  // Regex token matching:
  // 1: Markdown link [label](url) -> group 1 (full), group 2 (label), group 3 (url)
  // 2: Raw URL (http://... | https://... | www....) -> group 4
  // 3: Mentions (@Name or @First Last) -> group 5
  const tokenRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s\)]+|www\.[^\s\)]+)\))|(https?:\/\/[^\s<]+|www\.[^\s<]+)|(@[a-zA-Z0-9_]+(?:\s[a-zA-Z0-9_]+)?)/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchIndex = match.index;

    // Push preceding plain text
    if (matchIndex > lastIndex) {
      parts.push(text.substring(lastIndex, matchIndex));
    }

    if (match[1]) {
      // Markdown link [label](url)
      const label = match[2];
      let url = match[3];
      if (url.startsWith('www.')) url = `https://${url}`;
      parts.push(
        <a
          key={matchIndex}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 font-medium underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-0.5 cursor-pointer break-all"
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 inline-block flex-shrink-0 opacity-70" />
        </a>
      );
    } else if (match[4]) {
      // Raw URL
      let url = match[4];
      let trailingPunct = '';
      if (/[.,!?;)]$/.test(url)) {
        trailingPunct = url.slice(-1);
        url = url.slice(0, -1);
      }
      const href = url.startsWith('www.') ? `https://${url}` : url;
      parts.push(
        <React.Fragment key={matchIndex}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 font-medium underline hover:text-blue-700 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-0.5 cursor-pointer break-all"
          >
            <span>{url}</span>
            <ExternalLink className="w-3 h-3 inline-block flex-shrink-0 opacity-70" />
          </a>
          {trailingPunct}
        </React.Fragment>
      );
    } else if (match[5]) {
      // Mention @Name
      const mentionText = match[5];
      parts.push(
        <span
          key={matchIndex}
          className="inline-flex items-center gap-0.5 font-semibold text-[#059669] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.5 rounded-[5px] text-[12px] my-0.5"
        >
          {mentionText}
        </span>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export function TaskDetailContent({
  task,
  isDrawer = false,
  onClose = null,
}) {
  const {
    departments = [],
    completionRequests = [],
    readChatIds = [],
    updateTask,
    updateTaskStatus,
    addTaskUpdate,
    uploadTaskAttachment,
    requestTaskCompletion,
    reviewCompletionRequest,
    markTaskUpdatesAsSeen,
    markAllChatsAsRead,
    softDeleteTask,
  } = useAppData();
  const { currentUser, users = [] } = useAuth();

  const [activeTab, setActiveTab] = useState('comments'); // 'comments' | 'activity'
  const [newCommentText, setNewCommentText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Mentions (@) & Link Dialog (/) States
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [mentionCursorPos, setMentionCursorPos] = useState(null);
  const mentionPopupRef = useRef(null);
  const commentInputRef = useRef(null);

  // Link Insertion Dialog States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkError, setLinkError] = useState('');
  const linkUrlInputRef = useRef(null);

  // Status & Priority Popover States
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const statusMenuRef = useRef(null);
  const priorityMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const commentFileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target)) {
        setIsStatusMenuOpen(false);
      }
      if (priorityMenuRef.current && !priorityMenuRef.current.contains(e.target)) {
        setIsPriorityMenuOpen(false);
      }
      if (mentionPopupRef.current && !mentionPopupRef.current.contains(e.target)) {
        setShowMentionPopup(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark all unread updates as seen upon opening
  useEffect(() => {
    if (task?.id && currentUser?.id && markTaskUpdatesAsSeen) {
      markTaskUpdatesAsSeen(task.id, currentUser.id);
    }
    if (task?.task_updates && markAllChatsAsRead) {
      const chatKeys = task.task_updates.map((u) => u.id).filter(Boolean);
      markAllChatsAsRead(chatKeys);
    }
  }, [task?.id, task?.task_updates, currentUser?.id, markTaskUpdatesAsSeen, markAllChatsAsRead]);

  // Auto-scroll chat feed on new comments
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [task?.task_updates?.length, activeTab]);

  if (!task) return null;

  const permissions = getTaskPermissions(task, currentUser);

  // User Map with multi-key string/number lookup
  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u?.id) {
        map[u.id] = u;
        map[String(u.id)] = u;
      }
    });
    return map;
  }, [users]);

  // Assignees
  const assigneeIds = getTaskAssigneeIds(task);
  const assignees = useMemo(() => {
    return assigneeIds
      .map((id) => {
        if (userMap[id] || userMap[String(id)]) return userMap[id] || userMap[String(id)];
        if (typeof task.assigned_to === 'object' && (task.assigned_to?.id === id || task.assigned_to?.user_id === id)) {
          return task.assigned_to;
        }
        if (Array.isArray(task.assigned_users)) {
          const match = task.assigned_users.find((u) => (u.id || u.user_id) === id);
          if (match) return match;
        }
        return null;
      })
      .filter(Boolean);
  }, [assigneeIds, userMap, task]);

  // Assistants
  const assistantIds = getTaskAssistantIds(task);
  const assistants = useMemo(() => {
    return assistantIds
      .map((id) => {
        if (userMap[id] || userMap[String(id)]) return userMap[id] || userMap[String(id)];
        if (typeof task.assisted_by === 'object' && (task.assisted_by?.id === id || task.assisted_by?.user_id === id)) {
          return task.assisted_by;
        }
        if (Array.isArray(task.assistant_users)) {
          const match = task.assistant_users.find((u) => (u.id || u.user_id) === id);
          if (match) return match;
        }
        return null;
      })
      .filter(Boolean);
  }, [assistantIds, userMap, task]);

  // Departments
  const deptInfo = getTaskDepartmentsInfo(task, users, departments);

  // Creator
  const creator = userMap[task.created_by] || userMap[task.assigned_by];
  const creatorName = creator ? creator.full_name : 'Admin';

  // Task Stakeholders for @ Mentions (Creator, Assignees, Assistants)
  const taskStakeholders = useMemo(() => {
    const map = new Map();

    // 1. Creator / Assigner
    const creatorId = task.created_by || task.assigned_by;
    if (creatorId) {
      const creatorUser = userMap[creatorId] || userMap[String(creatorId)];
      if (creatorUser) {
        map.set(creatorUser.id, {
          ...creatorUser,
          stakeholderRoles: ['Creator'],
        });
      }
    }

    // 2. Assignees
    (assignees || []).forEach((u) => {
      if (u?.id) {
        if (map.has(u.id)) {
          const existing = map.get(u.id);
          if (!existing.stakeholderRoles.includes('Assignee')) {
            existing.stakeholderRoles.push('Assignee');
          }
        } else {
          map.set(u.id, {
            ...u,
            stakeholderRoles: ['Assignee'],
          });
        }
      }
    });

    // 3. Assistants
    (assistants || []).forEach((u) => {
      if (u?.id) {
        if (map.has(u.id)) {
          const existing = map.get(u.id);
          if (!existing.stakeholderRoles.includes('Assistant')) {
            existing.stakeholderRoles.push('Assistant');
          }
        } else {
          map.set(u.id, {
            ...u,
            stakeholderRoles: ['Assistant'],
          });
        }
      }
    });

    return Array.from(map.values());
  }, [task.created_by, task.assigned_by, userMap, assignees, assistants]);

  // Filtered Stakeholders based on current mentionQuery
  const filteredStakeholders = useMemo(() => {
    if (!showMentionPopup) return [];
    const q = mentionQuery.toLowerCase().trim();
    if (!q) return taskStakeholders;
    return taskStakeholders.filter((u) => {
      const name = u.full_name?.toLowerCase() || '';
      const email = u.email?.toLowerCase() || '';
      const designation = u.designation?.toLowerCase() || '';
      const roles = (u.stakeholderRoles || []).join(' ').toLowerCase();
      return name.includes(q) || email.includes(q) || designation.includes(q) || roles.includes(q);
    });
  }, [showMentionPopup, mentionQuery, taskStakeholders]);

  // Comment Input & Mention Handling
  const handleCommentInputChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;

    // Trigger URL Dialog on `/` key
    if (val.slice(pos - 1, pos) === '/') {
      setIsLinkModalOpen(true);
      setLinkUrl('');
      setLinkTitle('');
      setLinkError('');
      const cleanVal = val.slice(0, pos - 1) + val.slice(pos);
      setNewCommentText(cleanVal);
      setShowMentionPopup(false);
      return;
    }

    setNewCommentText(val);

    // Trigger @ Stakeholder Mentions
    const textBeforeCursor = val.slice(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      if (charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0) {
        const query = textBeforeCursor.slice(lastAtIndex + 1);
        if (!query.includes('\n') && query.length < 30) {
          setShowMentionPopup(true);
          setMentionQuery(query);
          setMentionCursorPos(lastAtIndex);
          setMentionIndex(0);
          return;
        }
      }
    }

    setShowMentionPopup(false);
  };

  const handleCommentKeyDown = (e) => {
    if (showMentionPopup && filteredStakeholders.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredStakeholders.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredStakeholders.length) % filteredStakeholders.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selected = filteredStakeholders[mentionIndex] || filteredStakeholders[0];
        if (selected) {
          handleSelectStakeholder(selected);
        }
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionPopup(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showMentionPopup) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleSelectStakeholder = (user) => {
    if (!user || mentionCursorPos === null) return;
    const beforeAt = newCommentText.slice(0, mentionCursorPos);
    const currentCursor = commentInputRef.current?.selectionStart ?? (mentionCursorPos + 1 + mentionQuery.length);
    const afterCursor = newCommentText.slice(currentCursor);
    const insert = `@${user.full_name} `;
    const updated = beforeAt + insert + afterCursor;

    setNewCommentText(updated);
    setShowMentionPopup(false);
    setMentionQuery('');
    setMentionIndex(0);
    setMentionCursorPos(null);

    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        const nextPos = beforeAt.length + insert.length;
        commentInputRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 20);
  };

  // Insert Link Submission
  const handleInsertLink = (e) => {
    e?.preventDefault?.();
    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) {
      setLinkError('Please enter a valid URL.');
      return;
    }

    let validUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(validUrl)) {
      validUrl = `https://${validUrl}`;
    }

    const trimmedTitle = linkTitle.trim();
    const linkMarkdown = trimmedTitle ? `[${trimmedTitle}](${validUrl})` : validUrl;

    const currentPos = commentInputRef.current?.selectionStart ?? newCommentText.length;
    const before = newCommentText.slice(0, currentPos);
    const after = newCommentText.slice(currentPos);
    const spacerBefore = before.length > 0 && !before.endsWith(' ') ? ' ' : '';
    const spacerAfter = ' ';

    const resultText = `${before}${spacerBefore}${linkMarkdown}${spacerAfter}${after}`;
    setNewCommentText(resultText);
    setIsLinkModalOpen(false);
    setLinkUrl('');
    setLinkTitle('');
    setLinkError('');

    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        const newPos = before.length + spacerBefore.length + linkMarkdown.length + spacerAfter.length;
        commentInputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 20);
  };

  // Completion Requests
  const pendingCompletionRequest = (completionRequests || []).find(
    (r) => r.task_id === task.id && r.status === 'pending'
  );
  const hasMyPendingRequest = pendingCompletionRequest?.requested_by === currentUser?.id;

  // Status Presentation Info
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

  // Priority Presentation Info
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

  // Date Formatting
  const formattedDueDate = (() => {
    if (!task.due_date) return 'No due date';
    const parsed = parseTaskDueDateLocal(task.due_date);
    if (!parsed) return task.due_date;
    return format(parsed, 'MMMM d, yyyy');
  })();

  const formattedCreatedDate = (() => {
    if (!task.created_at) return 'Recently';
    try {
      return format(new Date(task.created_at), 'MMMM d, yyyy');
    } catch {
      return formatDate(task.created_at);
    }
  })();

  // Updates & Comments
  const allUpdates = useMemo(() => {
    return [...(task.task_updates || [])].sort(
      (a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0)
    );
  }, [task.task_updates]);

  // Handle Comment Submission
  const handleSendComment = async (e) => {
    e?.preventDefault?.();
    if (!newCommentText.trim() && selectedFiles.length === 0) return;
    if (isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      let uploadedUrls = [];

      if (selectedFiles.length > 0 && uploadTaskAttachment) {
        for (const f of selectedFiles) {
          try {
            const res = await uploadTaskAttachment(task.id, f.file);
            if (res?.url) {
              uploadedUrls.push({
                url: res.url,
                name: f.name,
                type: f.type,
                size: f.size,
              });
            }
          } catch (uploadErr) {
            console.error('File upload failed:', uploadErr);
          }
        }
      }

      await addTaskUpdate(task.id, {
        text: newCommentText.trim(),
        attachments: uploadedUrls,
      });

      setNewCommentText('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle Attachment Upload (from top attachments section)
  const handleAttachmentUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !uploadTaskAttachment) return;

    setIsUploadingAttachment(true);
    try {
      for (const file of files) {
        await uploadTaskAttachment(task.id, file);
      }
    } catch (err) {
      console.error('Failed to upload task attachment:', err);
    } finally {
      setIsUploadingAttachment(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCommentFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newItems = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      isImage: file.type.startsWith('image/'),
    }));
    setSelectedFiles((prev) => [...prev, ...newItems]);
    if (commentFileInputRef.current) commentFileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* 1. Scrollable Main Content */}
      <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
        {/* Task Title */}
        <div>
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#18181B] leading-snug break-words">
            {task.title}
          </h2>
        </div>

        {/* 2. Compact Properties Section */}
        <div className="space-y-2 text-[12.5px] border-b border-[#E5E7EB] pb-6">
          {/* Status Row */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 min-h-[34px]">
            <span className="text-[#71717A] font-medium">Status</span>
            <div className="relative" ref={statusMenuRef}>
              {hasMyPendingRequest ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-semibold bg-amber-50 text-[#D97706] border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Completion Requested</span>
                </span>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsStatusMenuOpen((prev) => !prev)}
                    className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B] transition-colors cursor-pointer w-full max-w-[280px]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                      <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
                  </button>

                  {isStatusMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsStatusMenuOpen(false);
                          updateTaskStatus(task.id, 'pending');
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[12px] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#71717A]" />
                        <span>Pending</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsStatusMenuOpen(false);
                          updateTaskStatus(task.id, 'in_progress');
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[12px] text-[#2563EB] hover:bg-blue-50 cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                        <span>In Progress</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsStatusMenuOpen(false);
                          if (permissions.mustRequestCompletion) {
                            requestTaskCompletion(task.id);
                          } else {
                            updateTaskStatus(task.id, 'completed');
                          }
                        }}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[12px] text-[#059669] hover:bg-emerald-50 cursor-pointer"
                      >
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                        <span>{permissions.mustRequestCompletion ? 'Request Complete' : 'Completed'}</span>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Priority Row */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 min-h-[34px]">
            <span className="text-[#71717A] font-medium">Priority</span>
            <div className="relative" ref={priorityMenuRef}>
              {permissions.canEdit ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsPriorityMenuOpen((prev) => !prev)}
                    className="inline-flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] text-[#18181B] transition-colors cursor-pointer w-full max-w-[280px]"
                  >
                    <div className="flex items-center gap-2">
                      <Flag className={`w-3.5 h-3.5 ${priorityInfo.iconColor}`} />
                      <span className={`font-medium ${priorityInfo.color}`}>{priorityInfo.label}</span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
                  </button>

                  {isPriorityMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5">
                      {['urgent', 'high', 'medium', 'low'].map((p) => {
                        const pInf = getPriorityInfo(p);
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => {
                              setIsPriorityMenuOpen(false);
                              updateTask(task.id, { priority: p });
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer hover:bg-[#F5F6F8] ${
                              task.priority === p ? 'bg-[#F4F4F5] font-semibold' : 'text-[#52525B]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Flag className={`w-3.5 h-3.5 ${pInf.iconColor}`} />
                              <span className={pInf.color}>{pInf.label}</span>
                            </div>
                            {task.priority === p && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 py-1.5">
                  <Flag className={`w-3.5 h-3.5 ${priorityInfo.iconColor}`} />
                  <span className={`font-medium ${priorityInfo.color}`}>{priorityInfo.label}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignee Row */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 min-h-[34px]">
            <span className="text-[#71717A] font-medium">Assignee</span>
            <div className="flex items-center gap-2 py-1">
              {assignees.length === 0 ? (
                <span className="text-[#8B8B95]">Unassigned</span>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1.5">
                    {assignees.slice(0, 3).map((a) => (
                      <Avatar
                        key={a.id}
                        src={a.avatar_url}
                        name={a.full_name}
                        size="xs"
                        className="border-2 border-white ring-1 ring-slate-100"
                      />
                    ))}
                  </div>
                  <span className="font-medium text-[#18181B]">
                    {assignees.map((a) => a.full_name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Assistants Row */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 min-h-[34px]">
            <span className="text-[#71717A] font-medium">Assistants</span>
            <div className="flex items-center gap-2 py-1">
              {assistants.length === 0 ? (
                <span className="text-[#8B8B95]">—</span>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center -space-x-1.5">
                    {assistants.slice(0, 3).map((ast) => (
                      <Avatar
                        key={ast.id}
                        src={ast.avatar_url}
                        name={ast.full_name}
                        size="xs"
                        className="border-2 border-white ring-1 ring-slate-100"
                      />
                    ))}
                  </div>
                  <span className="font-medium text-[#18181B]">
                    {assistants.map((ast) => ast.full_name).join(' + ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Department Row */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 min-h-[34px]">
            <span className="text-[#71717A] font-medium">Department</span>
            <div className="flex items-center gap-1.5 text-[#18181B] font-medium py-1">
              <Building2 className="w-3.5 h-3.5 text-[#8B8B95]" />
              <span>
                {Array.isArray(deptInfo) && deptInfo.length > 0
                  ? deptInfo.map((d) => d.name).join(', ')
                  : 'General'}
              </span>
            </div>
          </div>

          {/* Due Date Row */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 min-h-[34px]">
            <span className="text-[#71717A] font-medium">Due Date</span>
            <div className="flex items-center gap-1.5 text-[#18181B] font-medium py-1">
              <CalendarDays className="w-3.5 h-3.5 text-[#8B8B95]" />
              <span>{formattedDueDate}</span>
            </div>
          </div>

          {/* Created By Row */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 min-h-[34px]">
            <span className="text-[#71717A] font-medium">Created By</span>
            <div className="flex items-center gap-2 py-1">
              <Avatar
                src={creator?.avatar_url}
                name={creatorName}
                size="xs"
                className="border-2 border-white ring-1 ring-slate-100 flex-shrink-0"
              />
              <span className="font-medium text-[#18181B]">{creatorName}</span>
            </div>
          </div>

          {/* Created Date Row */}
          <div className="grid grid-cols-[120px_1fr] items-center gap-2 min-h-[34px]">
            <span className="text-[#71717A] font-medium">Created</span>
            <div className="flex items-center gap-1.5 text-[#18181B] font-medium">
              <CalendarDays className="w-3.5 h-3.5 text-[#8B8B95]" />
              <span>{formattedCreatedDate}</span>
            </div>
          </div>
        </div>

        {/* 3. Description Section */}
        <div className="space-y-2 border-b border-[#E5E7EB] pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11.5px] font-bold text-[#18181B] uppercase tracking-wider">
              Description
            </h3>
            {permissions.canEdit && (
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="p-1 rounded-[6px] text-[#8B8B95] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
                title="Edit task description"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[13px] text-[#52525B] leading-relaxed whitespace-pre-wrap">
            {cleanTaskDescription(task.description) || (
              <span className="italic text-[#8B8B95]">No description provided.</span>
            )}
          </div>
        </div>

        {/* 4. Attachments Section */}
        <div className="space-y-3 border-b border-[#E5E7EB] pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[11.5px] font-bold text-[#18181B] uppercase tracking-wider">
                Attachments
              </h3>
              <span className="px-1.5 py-0.2 rounded-full text-[10.5px] font-bold bg-[#F4F4F5] text-[#52525B]">
                {task.attachments?.length || 0}
              </span>
            </div>

            {permissions.canEdit && (
              <div>
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleAttachmentUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAttachment}
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-[#059669] hover:underline cursor-pointer"
                >
                  {isUploadingAttachment ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Add attachment</span>
                </button>
              </div>
            )}
          </div>

          {/* Attachments List */}
          {task.attachments && task.attachments.length > 0 ? (
            <div className="space-y-2">
              {task.attachments.map((att, idx) => {
                const isImg = att.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(att.name || att.url || '');
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-[6px] bg-[#F4F4F5] flex items-center justify-center flex-shrink-0 text-[#71717A]">
                        {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold text-[#18181B] truncate">
                          {att.name || 'Attachment'}
                        </p>
                        <p className="text-[10.5px] text-[#8B8B95]">
                          {att.size ? `${(att.size / 1024 / 1024).toFixed(1)} MB` : ''}
                          {att.created_at ? ` · ${formatDate(att.created_at)}` : ''}
                        </p>
                      </div>
                    </div>

                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[12px] text-[#8B8B95] italic">No files attached to this deliverable.</p>
          )}
        </div>

        {/* 5. Comments & Activity Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-6 border-b border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setActiveTab('comments')}
              className={`pb-2.5 text-[13px] font-semibold transition-all relative cursor-pointer ${
                activeTab === 'comments'
                  ? 'text-[#059669]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <span>Comments</span>
              {activeTab === 'comments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#059669] rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`pb-2.5 text-[13px] font-semibold transition-all relative cursor-pointer ${
                activeTab === 'activity'
                  ? 'text-[#059669]'
                  : 'text-[#71717A] hover:text-[#18181B]'
              }`}
            >
              <span>Activity</span>
              {activeTab === 'activity' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#059669] rounded-full" />
              )}
            </button>
          </div>

          {/* Comments Feed */}
          {activeTab === 'comments' ? (
            <div className="space-y-4 pt-1">
              {allUpdates.length > 0 ? (
                allUpdates.map((upd) => {
                  const author = userMap[upd.user_id];
                  const authorName = author?.full_name || upd.user_name || 'Team Member';
                  const isOwn = upd.user_id === currentUser?.id;

                  const formattedTime = (() => {
                    if (!upd.created_at) return '';
                    try {
                      return format(new Date(upd.created_at), 'p');
                    } catch {
                      return '';
                    }
                  })();

                  return (
                    <div key={upd.id || upd.created_at} className="flex items-start gap-3 text-left">
                      <Avatar
                        src={author?.avatar_url || upd.user_avatar}
                        name={authorName}
                        size="sm"
                        className="flex-shrink-0 mt-0.5"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#18181B]">
                            {authorName}
                          </span>
                          <span className="text-[11px] text-[#8B8B95]">
                            {formattedTime}
                          </span>
                        </div>
                        <div className="text-[12.5px] text-[#52525B] dark:text-[#D4D4D8] leading-relaxed whitespace-pre-wrap break-words">
                          {renderFormattedCommentText(upd.text)}
                        </div>

                        {/* Comment Attachments */}
                        {upd.attachments && upd.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1.5">
                            {upd.attachments.map((att, i) => (
                              <a
                                key={i}
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-[#F4F4F5] dark:bg-[#27272A] hover:bg-[#E4E4E7] dark:hover:bg-[#3F3F46] border border-[#E5E7EB] dark:border-[#3F3F46] text-[11px] font-medium text-[#18181B] dark:text-white"
                              >
                                <FileText className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                                <span className="truncate max-w-[140px]">{att.name || 'File'}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-[#8B8B95] dark:text-[#71717A] text-[12.5px]">
                  No comments yet. Start the conversation below.
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>
          ) : (
            /* Activity Feed */
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2.5 text-[12px] text-[#52525B] dark:text-[#A1A1AA]">
                <Clock className="w-3.5 h-3.5 text-[#8B8B95] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-[#18181B] dark:text-white">{creatorName}</span> created this deliverable.
                  <span className="text-[11px] text-[#8B8B95] ml-1.5">{formattedCreatedDate}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Sticky Bottom Comment Composer */}
      <div className="border-t border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] p-3.5 flex-shrink-0 relative">
        {/* Stakeholder @ Mentions Dropdown Popover */}
        {showMentionPopup && (
          <div
            ref={mentionPopupRef}
            className="absolute bottom-full left-3.5 right-3.5 sm:right-auto sm:w-80 mb-2 bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] shadow-2xl overflow-hidden z-50 animate-scale-up select-none divide-y divide-[#F4F4F5] dark:divide-[#27272A]"
          >
            <div className="px-3 py-2 bg-[#FAFAFA] dark:bg-[#121214] border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#71717A] dark:text-[#A1A1AA] uppercase tracking-wider">
                <AtSign className="w-3.5 h-3.5 text-[#059669]" />
                <span>Task Stakeholders</span>
              </div>
              <span className="text-[10.5px] text-[#8B8B95] font-mono">
                {filteredStakeholders.length} available
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
              {filteredStakeholders.length === 0 ? (
                <div className="p-3 text-center text-[12px] text-[#71717A] dark:text-[#A1A1AA]">
                  No matching task stakeholders found
                </div>
              ) : (
                filteredStakeholders.map((u, idx) => {
                  const isHighlighted = idx === mentionIndex;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onMouseEnter={() => setMentionIndex(idx)}
                      onClick={() => handleSelectStakeholder(u)}
                      className={`w-full px-2.5 py-2 text-left rounded-[7px] flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-[#18181B] dark:text-white'
                          : 'hover:bg-[#F4F4F5] dark:hover:bg-[#202023] text-[#52525B] dark:text-[#D4D4D8]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar src={u.avatar_url} name={u.full_name} size="xs" className="w-6 h-6 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-[#18181B] dark:text-white truncate">
                            {u.full_name}
                          </p>
                          <p className="text-[10.5px] text-[#71717A] dark:text-[#A1A1AA] truncate">
                            {u.designation || u.email}
                          </p>
                        </div>
                      </div>

                      {/* Stakeholder Role Badges */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {(u.stakeholderRoles || ['Stakeholder']).map((roleName) => {
                          const isCreator = roleName === 'Creator';
                          const isAssignee = roleName === 'Assignee';
                          const badgeClass = isCreator
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : isAssignee
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800';

                          return (
                            <span
                              key={roleName}
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-[4px] border ${badgeClass}`}
                            >
                              {roleName}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-3 py-1.5 bg-[#FAFAFA] dark:bg-[#121214] text-[10.5px] text-[#8B8B95] flex items-center justify-between">
              <span>Use ↑↓ to navigate</span>
              <span>Enter to select • Esc to dismiss</span>
            </div>
          </div>
        )}

        {selectedFiles.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2 px-1">
            {selectedFiles.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#F4F4F5] dark:bg-[#202023] border border-[#E5E7EB] dark:border-[#27272A] text-[11px] text-[#18181B] dark:text-white"
              >
                <Paperclip className="w-3 h-3 text-[#71717A] dark:text-[#A1A1AA]" />
                <span className="truncate max-w-[120px]">{f.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-[#8B8B95] hover:text-[#DC2626]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <form onSubmit={handleSendComment} className="flex items-center gap-2.5">
          <Avatar
            src={currentUser?.avatar_url}
            name={currentUser?.full_name}
            size="sm"
            className="flex-shrink-0"
          />

          <div className="relative flex-1">
            <input
              ref={commentInputRef}
              type="text"
              value={newCommentText}
              onChange={handleCommentInputChange}
              onKeyDown={handleCommentKeyDown}
              placeholder="Write a comment... (type @ to mention, / for link)"
              className="w-full h-9 pl-3 pr-24 bg-white dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#3F3F46] hover:border-[#D4D4D8] focus:border-[#059669] dark:focus:border-[#059669] focus:ring-1 focus:ring-[#059669] rounded-[8px] text-[12.5px] text-[#18181B] dark:text-white placeholder:text-[#8B8B95] transition-all outline-none"
            />
            <input
              type="file"
              multiple
              ref={commentFileInputRef}
              onChange={handleCommentFileSelect}
              className="hidden"
            />
            
            {/* Quick Actions inside input (Mention @, Link /, Attach) */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[#8B8B95]">
              <button
                type="button"
                onClick={() => {
                  setShowMentionPopup(true);
                  setMentionQuery('');
                  setMentionIndex(0);
                  setMentionCursorPos(newCommentText.length);
                  setNewCommentText((prev) => prev + (prev.endsWith(' ') || !prev ? '@' : ' @'));
                  setTimeout(() => commentInputRef.current?.focus(), 20);
                }}
                className="p-1 hover:text-[#059669] dark:hover:text-emerald-400 hover:bg-[#F4F4F5] dark:hover:bg-[#202023] rounded transition-colors cursor-pointer"
                title="Mention Stakeholder (@)"
              >
                <AtSign className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsLinkModalOpen(true);
                  setLinkUrl('');
                  setLinkTitle('');
                  setLinkError('');
                }}
                className="p-1 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-[#F4F4F5] dark:hover:bg-[#202023] rounded transition-colors cursor-pointer"
                title="Insert Link (/)"
              >
                <Link2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => commentFileInputRef.current?.click()}
                className="p-1 hover:text-[#18181B] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#202023] rounded transition-colors cursor-pointer"
                title="Attach file"
              >
                <Paperclip className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={(!newCommentText.trim() && selectedFiles.length === 0) || isSubmittingComment}
            className="h-9 px-4 bg-[#059669] hover:bg-[#047857] disabled:bg-[#D4D4D8] dark:disabled:bg-[#27272A] text-white disabled:text-[#8B8B95] rounded-[8px] text-[12.5px] font-semibold transition-colors flex items-center justify-center cursor-pointer flex-shrink-0 disabled:cursor-not-allowed shadow-2xs"
          >
            {isSubmittingComment ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Send</span>
            )}
          </button>
        </form>
      </div>

      {/* 3. Sub-Modals */}
      <EditTaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        task={task}
      />

      <AddTaskTeamModal
        isOpen={isAddTeamModalOpen}
        onClose={() => setIsAddTeamModalOpen(false)}
        task={task}
      />

      <RequestDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        task={task}
      />

      {/* 4. Insert Link Dialog Modal */}
      <Modal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setLinkError('');
        }}
        title="Insert Link / URL"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleInsertLink} className="space-y-4 font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-[8px] flex items-start gap-2.5 text-blue-900 dark:text-blue-300 text-[12px]">
            <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Interactive Blue Links</p>
              <p className="mt-0.5 text-blue-800 dark:text-blue-300/80">
                Links are rendered in blue and will open directly in a new tab when clicked.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
              URL / Web Link <span className="text-rose-500">*</span>
            </label>
            <input
              ref={linkUrlInputRef}
              type="text"
              required
              autoFocus
              value={linkUrl}
              onChange={(e) => {
                setLinkUrl(e.target.value);
                if (linkError) setLinkError('');
              }}
              placeholder="https://example.com, figma link, google docs..."
              className="w-full px-3 py-2 text-[12.5px] bg-[#FAFAFA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#18181B] dark:text-white rounded-[7px] focus:outline-none focus:border-[#059669] focus:bg-white dark:focus:bg-[#18181B] transition-colors placeholder-[#8B8B95]"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
              Display Text / Title <span className="text-[#8B8B95] font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="e.g. Figma Design, Pull Request, Meeting Notes..."
              className="w-full px-3 py-2 text-[12.5px] bg-[#FAFAFA] dark:bg-[#121214] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#18181B] dark:text-white rounded-[7px] focus:outline-none focus:border-[#059669] focus:bg-white dark:focus:bg-[#18181B] transition-colors placeholder-[#8B8B95]"
            />
          </div>

          {linkError && (
            <p className="text-[11.5px] text-[#DC2626] font-medium">{linkError}</p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#27272A]">
            <button
              type="button"
              onClick={() => {
                setIsLinkModalOpen(false);
                setLinkError('');
              }}
              className="px-3.5 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12.5px] font-medium text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!linkUrl.trim()}
              className="px-4 py-2 rounded-[7px] bg-[#059669] hover:bg-[#047857] text-white text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Insert Link</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
