import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppData, cleanTaskDescription } from '../../../contexts/AppDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Avatar } from '../../common/Avatar';
import { getTaskPermissions } from '../../../utils/taskPermissions';
import { getTaskAssigneeIds, getTaskAssistantIds } from '../../../utils/taskDepartmentUtils';
import {
  Building2,
  Search,
  Check,
  ChevronDown,
  X,
  Paperclip,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Video,
  FileSpreadsheet,
  File,
  Flag,
  Loader2,
  AlertCircle,
  Download,
  Plus,
  Trash2,
  ShieldAlert,
} from 'lucide-react';

export function EditTaskForm({
  task,
  onSuccess,
  onCancel,
  isDrawer = false,
  onDirtyChange,
  formRef,
  hideActions = false,
  isSubmittingExternal = false,
}) {
  const { departments = [], updateTask, updateTaskStatus, uploadTaskAttachment } = useAppData();
  const { currentUser, users = [] } = useAuth();

  // 1. Permission Check
  const permissions = useMemo(() => {
    return task ? getTaskPermissions(task, currentUser) : {};
  }, [task, currentUser]);

  const canEdit = permissions.canEdit ?? false;
  const mustRequestCompletion = permissions.mustRequestCompletion ?? true;

  const role = currentUser?.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHod = role === 'hod';
  const isTeamMember = !isAdmin && !isHod;

  // HOD Assignment Mode
  const [hodAssignMode, setHodAssignMode] = useState('internal');
  // Team Member Assignment Mode
  const [memberAssignMode, setMemberAssignMode] = useState('self');

  // Compute assignable users
  const assignableUsers = useMemo(() => {
    const activeUsers = (users || []).filter(
      (u) =>
        u.is_active &&
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    );

    if (isAdmin) return activeUsers;

    if (isHod) {
      if (hodAssignMode === 'internal') {
        return activeUsers.filter(
          (u) =>
            u.id === currentUser?.id ||
            (u.department_id === currentUser?.department_id && u.role === 'team_member')
        );
      } else {
        return activeUsers.filter(
          (u) =>
            u.role === 'admin' ||
            (u.role === 'hod' && u.department_id !== currentUser?.department_id)
        );
      }
    }

    if (isTeamMember) {
      if (memberAssignMode === 'self') {
        return activeUsers.filter((u) => u.id === currentUser?.id);
      } else {
        return activeUsers.filter((u) => u.role === 'hod');
      }
    }

    return activeUsers.filter((u) => u.id === currentUser?.id);
  }, [users, isAdmin, isHod, isTeamMember, hodAssignMode, memberAssignMode, currentUser]);

  // Compute assignable assistants
  const assignableAssistantsForMember = useMemo(() => {
    if (!isTeamMember) return [];
    const activeUsers = (users || []).filter(
      (u) =>
        u.is_active &&
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    );
    return activeUsers.filter(
      (u) =>
        u.id !== currentUser?.id &&
        u.department_id === currentUser?.department_id &&
        (u.role === 'team_member' || u.role === 'hod')
    );
  }, [users, isTeamMember, currentUser]);

  // Helper to format dates as YYYY-MM-DD
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFutureDateString = (daysAhead = 7) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 2. Initial Form State from Task
  const initialValues = useMemo(() => {
    if (!task) return null;

    const rawAssigneeIds = getTaskAssigneeIds(task);
    const resolvedAssignees = rawAssigneeIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean);

    const rawAssistantIds = getTaskAssistantIds(task);
    const resolvedAssistants = rawAssistantIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean);

    return {
      title: task.title || '',
      description: cleanTaskDescription(task.description || ''),
      departmentId: task.department_id || '',
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      startDate: task.start_date || getTodayDateString(),
      dueDate: task.due_date || getFutureDateString(7),
      selectedUsers: resolvedAssignees,
      selectedAssistants: resolvedAssistants,
      attachments: Array.isArray(task.attachments) ? task.attachments : [],
    };
  }, [task, users]);

  // Form Fields State
  const [title, setTitle] = useState(() => initialValues?.title || '');
  const [description, setDescription] = useState(() => initialValues?.description || '');
  const [departmentId, setDepartmentId] = useState(() => initialValues?.departmentId || '');
  const [startDate, setStartDate] = useState(() => initialValues?.startDate || getTodayDateString());
  const [dueDate, setDueDate] = useState(() => initialValues?.dueDate || getFutureDateString(7));
  const [priority, setPriority] = useState(() => initialValues?.priority || 'medium');
  const [status, setStatus] = useState(() => initialValues?.status || 'pending');
  const [selectedUsers, setSelectedUsers] = useState(() => initialValues?.selectedUsers || []);
  const [selectedAssistants, setSelectedAssistants] = useState(
    () => initialValues?.selectedAssistants || []
  );
  const [attachments, setAttachments] = useState(() => initialValues?.attachments || []);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Auto-sync department when assignee is selected
  useEffect(() => {
    if (selectedUsers && selectedUsers.length > 0) {
      const primaryUser = selectedUsers[0];
      if (primaryUser?.department_id) {
        setDepartmentId(primaryUser.department_id);
      }
    } else if (currentUser?.department_id) {
      setDepartmentId(currentUser.department_id);
    }
  }, [selectedUsers, currentUser]);

  // Sync state when task prop changes (e.g. switching task ID)
  const prevTaskIdRef = useRef(task?.id);
  useEffect(() => {
    if (task && task.id !== prevTaskIdRef.current && initialValues) {
      prevTaskIdRef.current = task.id;
      setTitle(initialValues.title);
      setDescription(initialValues.description);
      setDepartmentId(initialValues.departmentId);
      setStartDate(initialValues.startDate);
      setDueDate(initialValues.dueDate);
      setPriority(initialValues.priority);
      setStatus(initialValues.status);
      setSelectedUsers(initialValues.selectedUsers);
      setSelectedAssistants(initialValues.selectedAssistants);
      setAttachments(initialValues.attachments);
    }
  }, [task, initialValues]);

  // Dropdown States
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [assistantSearch, setAssistantSearch] = useState('');
  const [isAssistantDropdownOpen, setIsAssistantDropdownOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // UI state
  const [error, setError] = useState('');
  const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);

  // Refs
  const titleInputRef = useRef(null);
  const userSearchRef = useRef(null);
  const assistantSearchRef = useRef(null);
  const deptRef = useRef(null);
  const priorityRef = useRef(null);
  const statusRef = useRef(null);
  const fileInputRef = useRef(null);

  const isSubmitting = isSubmittingExternal || isSubmittingInternal;

  // Focus title on mount
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (userSearchRef.current && !userSearchRef.current.contains(e.target)) {
        setIsUserDropdownOpen(false);
      }
      if (assistantSearchRef.current && !assistantSearchRef.current.contains(e.target)) {
        setIsAssistantDropdownOpen(false);
      }
      if (deptRef.current && !deptRef.current.contains(e.target)) {
        setIsDeptDropdownOpen(false);
      }
      if (priorityRef.current && !priorityRef.current.contains(e.target)) {
        setIsPriorityDropdownOpen(false);
      }
      if (statusRef.current && !statusRef.current.contains(e.target)) {
        setIsStatusDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3. Normalized Dirty-State Detection
  const isDirty = useMemo(() => {
    if (!initialValues) return false;

    const titleChanged = title.trim() !== initialValues.title.trim();
    const descChanged = description.trim() !== initialValues.description.trim();
    const deptChanged = departmentId !== initialValues.departmentId;
    const startChanged = startDate !== initialValues.startDate;
    const dueChanged = dueDate !== initialValues.dueDate;
    const priorityChanged = priority !== initialValues.priority;
    const statusChanged = status !== initialValues.status;

    // Compare assignee IDs as sorted sets
    const currentAssigneeIds = selectedUsers.map((u) => u.id).sort().join(',');
    const initialAssigneeIds = initialValues.selectedUsers.map((u) => u.id).sort().join(',');
    const assigneesChanged = currentAssigneeIds !== initialAssigneeIds;

    // Compare assistant IDs as sorted sets
    const currentAssistantIds = selectedAssistants.map((u) => u.id).sort().join(',');
    const initialAssistantIds = initialValues.selectedAssistants.map((u) => u.id).sort().join(',');
    const assistantsChanged = currentAssistantIds !== initialAssistantIds;

    // Compare attachments IDs
    const currentAttIds = (attachments || []).map((a) => a.id || a.url).sort().join(',');
    const initialAttIds = (initialValues.attachments || []).map((a) => a.id || a.url).sort().join(',');
    const attachmentsChanged = currentAttIds !== initialAttIds;

    return (
      titleChanged ||
      descChanged ||
      deptChanged ||
      startChanged ||
      dueChanged ||
      priorityChanged ||
      statusChanged ||
      assigneesChanged ||
      assistantsChanged ||
      attachmentsChanged
    );
  }, [
    initialValues,
    title,
    description,
    departmentId,
    startDate,
    dueDate,
    priority,
    status,
    selectedUsers,
    selectedAssistants,
    attachments,
  ]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Allowed Departments
  const allowedDepartments = useMemo(() => {
    if (isAdmin) return departments;
    if (isHod) {
      if (hodAssignMode === 'internal') {
        return departments.filter((d) => d.id === currentUser?.department_id);
      }
      return departments;
    }
    return departments;
  }, [departments, isAdmin, isHod, hodAssignMode, currentUser]);

  // Assistants Pool
  const assistantPool = useMemo(() => {
    if (isTeamMember) return assignableAssistantsForMember;
    return assignableUsers;
  }, [isTeamMember, assignableAssistantsForMember, assignableUsers]);

  const filteredAssistants = useMemo(() => {
    const assignedIds = new Set(selectedUsers.map((u) => u.id));
    return assistantPool.filter((u) => {
      if (assignedIds.has(u.id)) return false;
      const q = assistantSearch.toLowerCase().trim();
      if (!q) return true;
      const dept = departments.find((d) => d.id === u.department_id);
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.designation?.toLowerCase().includes(q) ||
        dept?.name?.toLowerCase().includes(q)
      );
    });
  }, [assistantPool, selectedUsers, assistantSearch, departments]);

  const filteredUsers = useMemo(() => {
    const assistantIds = new Set(selectedAssistants.map((u) => u.id));
    return assignableUsers.filter((u) => {
      if (assistantIds.has(u.id)) return false;
      const q = userSearch.toLowerCase().trim();
      if (!q) return true;
      const dept = departments.find((d) => d.id === u.department_id);
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.designation?.toLowerCase().includes(q) ||
        dept?.name?.toLowerCase().includes(q)
      );
    });
  }, [assignableUsers, selectedAssistants, userSearch, departments]);

  const handleToggleUser = (user) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
      setSelectedAssistants((prev) => prev.filter((a) => a.id !== user.id));
      if (user.department_id && !departmentId) {
        setDepartmentId(user.department_id);
      }
    }
    setUserSearch('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleToggleAssistant = (user) => {
    if (selectedAssistants.some((u) => u.id === user.id)) {
      setSelectedAssistants(selectedAssistants.filter((u) => u.id !== user.id));
    } else {
      setSelectedAssistants([...selectedAssistants, user]);
      setSelectedUsers((prev) => prev.filter((a) => a.id !== user.id));
    }
    setAssistantSearch('');
  };

  const handleRemoveAssistant = (userId) => {
    setSelectedAssistants((prev) => prev.filter((u) => u.id !== userId));
  };

  // Attachment Actions
  const handleAddFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError(`File "${file.name}" exceeds the 10 MB limit.`);
      return;
    }

    try {
      setIsUploadingFile(true);
      setError('');
      const uploaded = await uploadTaskAttachment(file);
      if (uploaded) {
        setAttachments((prev) => [...prev, uploaded]);
      }
    } catch (uploadErr) {
      setError(`Failed to upload attachment: ${uploadErr?.message || 'Error'}`);
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (idToRemove) => {
    setAttachments((prev) => prev.filter((a) => (a.id || a.url) !== idToRemove));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (type = '', name = '') => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (type === 'image' || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return <ImageIcon className="w-3.5 h-3.5 text-[#059669]" />;
    }
    if (type === 'video' || ['mp4', 'webm', 'mov'].includes(ext)) {
      return <Video className="w-3.5 h-3.5 text-[#7C3AED]" />;
    }
    if (type === 'pdf' || ext === 'pdf') {
      return <FileText className="w-3.5 h-3.5 text-[#DC2626]" />;
    }
    if (type === 'csv' || ['csv', 'xlsx', 'xls'].includes(ext)) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />;
    }
    return <File className="w-3.5 h-3.5 text-[#2563EB]" />;
  };

  // 4. Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!task) return;
    setError('');

    if (!canEdit) {
      setError('You do not have permission to edit this task.');
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Task title is required.');
      titleInputRef.current?.focus();
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one assignee for this task.');
      return;
    }

    if (!startDate) {
      setError('Start date is required. Please select a start date.');
      return;
    }

    if (!dueDate) {
      setError('Due date is required. Please select a due date.');
      return;
    }

    if (new Date(dueDate) < new Date(startDate)) {
      setError('Due date cannot be earlier than start date.');
      return;
    }

    // Workflow protection for status
    if (status === 'completed' && mustRequestCompletion && task.status !== 'completed') {
      setError('You cannot directly mark this task as Completed. Please use "Request Completion".');
      return;
    }

    const assignedIds = Array.from(new Set(selectedUsers.map((u) => u.id)));
    const assistantIds = selectedAssistants.map((u) => u.id);

    try {
      setIsSubmittingInternal(true);

      // 1. Update status if changed
      if (status !== task.status && updateTaskStatus) {
        await updateTaskStatus(task.id, status);
      }

      // 2. Update task fields
      const updatedPayload = {
        title: trimmedTitle,
        description: description.trim(),
        department_id: selectedUsers[0]?.department_id || departmentId || currentUser?.department_id || null,
        assigned_to: assignedIds[0] || null,
        assigned_to_ids: assignedIds,
        assisted_by: assistantIds[0] || null,
        assisted_by_ids: assistantIds,
        attachments,
        start_date: startDate,
        due_date: dueDate,
        priority,
        status,
      };

      await updateTask(task.id, updatedPayload);

      onSuccess?.({ ...task, ...updatedPayload });
    } catch (err) {
      setError(err?.message || 'Failed to save task changes. Please try again.');
    } finally {
      setIsSubmittingInternal(false);
    }
  };

  const getPriorityDisplay = (p) => {
    switch (p) {
      case 'urgent':
        return { label: 'Urgent', color: 'text-[#DC2626]', iconColor: 'text-[#DC2626]' };
      case 'high':
        return { label: 'High', color: 'text-[#EA580C]', iconColor: 'text-[#EA580C]' };
      case 'low':
        return { label: 'Low', color: 'text-[#71717A]', iconColor: 'text-[#71717A]' };
      case 'medium':
      default:
        return { label: 'Medium', color: 'text-[#2563EB]', iconColor: 'text-[#2563EB]' };
    }
  };

  const priorityInfo = getPriorityDisplay(priority);

  // If user cannot edit, show restricted banner
  if (!canEdit) {
    return (
      <div className="p-5 bg-[#F9FAFB] rounded-[10px] border border-[#E5E7EB] text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[13px] font-semibold text-[#18181B]">Editing Restricted</h4>
          <p className="text-[12px] text-[#71717A] mt-1 max-w-sm mx-auto">
            You do not have permission to edit this task directly. Only the Task Creator, Assignees, HOD, or Admin can make modifications.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-[6px] bg-white border border-[#E5E7EB] text-[12px] font-medium text-[#18181B] hover:bg-[#F4F4F5] transition-colors cursor-pointer"
          >
            Back to Details
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-4 text-[12.5px] font-['Inter']"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Error Alert */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[8px] flex items-center gap-2 text-[#DC2626] text-[12px] font-medium animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="p-1 hover:bg-red-100 rounded text-red-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Task Title */}
      <div className="space-y-1.5">
        <label htmlFor="edit-task-title-input" className="block text-[12px] font-semibold text-[#18181B]">
          Task title <span className="text-[#DC2626]">*</span>
        </label>
        <input
          id="edit-task-title-input"
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          className="w-full h-10 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] text-[#18181B] placeholder-[#8B8B95] text-[13px] transition-colors outline-none"
        />
      </div>

      {/* 2. Description */}
      <div className="space-y-1.5">
        <label htmlFor="edit-task-description-input" className="block text-[12px] font-semibold text-[#18181B]">
          Description
        </label>
        <textarea
          id="edit-task-description-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Update task description..."
          className="w-full min-h-[78px] p-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] text-[#18181B] placeholder-[#8B8B95] text-[12.5px] transition-colors outline-none resize-y"
        />
      </div>

      {/* Role-Specific Assignment Mode Pill (HOD / Team Member) */}
      {isHod && (
        <div className="flex items-center gap-2 p-2 bg-[#F5F6F8] rounded-[8px] border border-[#E5E7EB]">
          <span className="text-[11.5px] font-medium text-[#71717A]">Assignment Scope:</span>
          <button
            type="button"
            onClick={() => setHodAssignMode('internal')}
            className={`px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium transition-colors cursor-pointer ${
              hodAssignMode === 'internal'
                ? 'bg-white text-[#18181B] shadow-2xs font-semibold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            My Department
          </button>
          <button
            type="button"
            onClick={() => setHodAssignMode('cross_hod')}
            className={`px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium transition-colors cursor-pointer ${
              hodAssignMode === 'cross_hod'
                ? 'bg-white text-[#18181B] shadow-2xs font-semibold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Cross-Department / Admin
          </button>
        </div>
      )}

      {/* 3. 2-Column Property Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Row 1 Left: Assignee Field (Multi-user Combobox) */}
        <div className="space-y-1.5" ref={userSearchRef}>
          <label className="block text-[12px] font-semibold text-[#18181B]">
            Assignee <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <div
              onClick={() => setIsUserDropdownOpen(true)}
              className="min-h-10 px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] flex items-center flex-wrap gap-1.5 transition-colors cursor-pointer"
            >
              {selectedUsers.length === 0 ? (
                <span className="text-[#8B8B95] text-[12.5px] pl-1">Search assignee...</span>
              ) : (
                selectedUsers.map((u) => (
                  <span
                    key={u.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#F4F4F5] border border-[#E5E7EB] text-[12px] font-medium text-[#18181B]"
                  >
                    <Avatar src={u.avatar_url} name={u.full_name} size="xs" />
                    <span className="max-w-[120px] truncate">{u.full_name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveUser(u.id);
                      }}
                      className="text-[#8B8B95] hover:text-[#DC2626] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {isUserDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-1 text-left">
                <div className="flex items-center gap-2 px-2 py-1 bg-[#F5F6F8] rounded-[6px] border border-[#E5E7EB]">
                  <Search className="w-3.5 h-3.5 text-[#8B8B95]" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search people..."
                    className="w-full bg-transparent text-[12px] text-[#18181B] placeholder-[#8B8B95] outline-none"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 pt-1">
                  {filteredUsers.length === 0 ? (
                    <p className="text-[11.5px] text-[#8B8B95] text-center py-2">No matching users</p>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUsers.some((sel) => sel.id === u.id);
                      const userDept = departments.find((d) => d.id === u.department_id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleToggleUser(u)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer hover:bg-[#F5F6F8] ${
                            isSelected ? 'bg-[#ECFDF5] text-[#059669] font-medium' : 'text-[#18181B]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar src={u.avatar_url} name={u.full_name} size="xs" />
                            <div className="text-left min-w-0">
                              <p className="font-medium truncate">{u.full_name}</p>
                              <p className="text-[10.5px] text-[#71717A] truncate">
                                {userDept?.name || u.designation || u.role}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 1 Right: Assistant Users Field (Multi-user Combobox) */}
        <div className="space-y-1.5" ref={assistantSearchRef}>
          <label className="block text-[12px] font-semibold text-[#18181B]">
            Assistant Users
          </label>
          <div className="relative">
            <div
              onClick={() => setIsAssistantDropdownOpen(true)}
              className="min-h-10 px-2.5 py-1.5 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] flex items-center flex-wrap gap-1.5 transition-colors cursor-pointer"
            >
              {selectedAssistants.length === 0 ? (
                <span className="text-[#8B8B95] text-[12.5px] pl-1">Search team members...</span>
              ) : (
                selectedAssistants.map((ast) => (
                  <span
                    key={ast.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#F4F4F5] border border-[#E5E7EB] text-[12px] font-medium text-[#18181B]"
                  >
                    <Avatar src={ast.avatar_url} name={ast.full_name} size="xs" />
                    <span className="max-w-[120px] truncate">{ast.full_name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAssistant(ast.id);
                      }}
                      className="text-[#8B8B95] hover:text-[#DC2626] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {isAssistantDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1.5 z-50 animate-fade-in space-y-1 text-left">
                <div className="flex items-center gap-2 px-2 py-1 bg-[#F5F6F8] rounded-[6px] border border-[#E5E7EB]">
                  <Search className="w-3.5 h-3.5 text-[#8B8B95]" />
                  <input
                    type="text"
                    value={assistantSearch}
                    onChange={(e) => setAssistantSearch(e.target.value)}
                    placeholder="Search assistants..."
                    className="w-full bg-transparent text-[12px] text-[#18181B] placeholder-[#8B8B95] outline-none"
                    autoFocus
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-0.5 pt-1">
                  {filteredAssistants.length === 0 ? (
                    <p className="text-[11.5px] text-[#8B8B95] text-center py-2">No matching users</p>
                  ) : (
                    filteredAssistants.map((u) => {
                      const isSelected = selectedAssistants.some((sel) => sel.id === u.id);
                      const userDept = departments.find((d) => d.id === u.department_id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleToggleAssistant(u)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer hover:bg-[#F5F6F8] ${
                            isSelected ? 'bg-[#ECFDF5] text-[#059669] font-medium' : 'text-[#18181B]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Avatar src={u.avatar_url} name={u.full_name} size="xs" />
                            <div className="text-left min-w-0">
                              <p className="font-medium truncate">{u.full_name}</p>
                              <p className="text-[10.5px] text-[#71717A] truncate">
                                {userDept?.name || u.designation || u.role}
                              </p>
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Row 2 Left: Priority Field */}
        <div className="space-y-1.5" ref={priorityRef}>
          <label className="block text-[12px] font-semibold text-[#18181B]">
            Priority
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPriorityDropdownOpen((prev) => !prev)}
              className="w-full h-10 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] flex items-center justify-between text-[#18181B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Flag className={`w-3.5 h-3.5 ${priorityInfo.iconColor}`} />
                <span className={`font-medium ${priorityInfo.color}`}>{priorityInfo.label}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {isPriorityDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5 text-left">
                {['urgent', 'high', 'medium', 'low'].map((p) => {
                  const pInf = getPriorityDisplay(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setPriority(p);
                        setIsPriorityDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer hover:bg-[#F5F6F8] ${
                        priority === p ? 'bg-[#F4F4F5] font-semibold' : 'text-[#52525B]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Flag className={`w-3.5 h-3.5 ${pInf.iconColor}`} />
                        <span className={pInf.color}>{pInf.label}</span>
                      </div>
                      {priority === p && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Row 2 Right: Status Field */}
        <div className="space-y-1.5" ref={statusRef}>
          <label className="block text-[12px] font-semibold text-[#18181B]">
            Status
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
              className="w-full h-10 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] flex items-center justify-between text-[#18181B] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    status === 'completed'
                      ? 'bg-[#10B981]'
                      : status === 'in_progress'
                      ? 'bg-[#2563EB]'
                      : 'bg-[#71717A]'
                  }`}
                />
                <span className="font-medium text-[#18181B]">
                  {status === 'completed'
                    ? 'Completed'
                    : status === 'in_progress'
                    ? 'In Progress'
                    : 'Pending'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#8B8B95]" />
            </button>

            {isStatusDropdownOpen && (
              <div className="absolute left-0 top-full mt-1 w-full bg-white rounded-[8px] border border-[#E5E7EB] shadow-xl p-1 z-50 animate-fade-in space-y-0.5 text-left">
                <button
                  type="button"
                  onClick={() => {
                    setStatus('pending');
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer hover:bg-[#F5F6F8] ${
                    status === 'pending' ? 'bg-[#F4F4F5] font-semibold text-[#18181B]' : 'text-[#52525B]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#71717A]" />
                    <span>Pending</span>
                  </div>
                  {status === 'pending' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStatus('in_progress');
                    setIsStatusDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer hover:bg-[#F5F6F8] ${
                    status === 'in_progress' ? 'bg-[#F4F4F5] font-semibold text-[#18181B]' : 'text-[#52525B]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                    <span>In Progress</span>
                  </div>
                  {status === 'in_progress' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                </button>

                {(!mustRequestCompletion || task.status === 'completed') && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('completed');
                      setIsStatusDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12px] cursor-pointer hover:bg-[#F5F6F8] ${
                      status === 'completed' ? 'bg-[#F4F4F5] font-semibold text-[#18181B]' : 'text-[#52525B]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                      <span>Completed</span>
                    </div>
                    {status === 'completed' && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 3 Left: Start Date Field */}
        <div className="space-y-1.5">
          <label htmlFor="edit-task-start-date-input" className="block text-[12px] font-semibold text-[#18181B]">
            Start Date <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <input
              id="edit-task-start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] text-[#18181B] text-[12.5px] transition-colors outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Row 3 Right: Due Date Field */}
        <div className="space-y-1.5">
          <label htmlFor="edit-task-due-date-input" className="block text-[12px] font-semibold text-[#18181B]">
            Due Date <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <input
              id="edit-task-due-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-10 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] text-[#18181B] text-[12.5px] transition-colors outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. Attachments Section (Existing list + Add attachment) */}
      <div className="space-y-2 pt-1">
        <label className="block text-[12px] font-semibold text-[#18181B]">
          Attachments
        </label>

        {/* Existing Attachments List */}
        {attachments.length > 0 && (
          <div className="space-y-1.5">
            {attachments.map((att) => {
              const attId = att.id || att.url;
              return (
                <div
                  key={attId}
                  className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-[#F8F9FA] border border-[#E5E7EB] hover:bg-[#F4F4F5] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    {getFileIcon(att.type, att.name)}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-[#18181B] truncate">
                        {att.name || 'Attachment'}
                      </p>
                      {att.size && (
                        <p className="text-[10.5px] text-[#71717A] font-mono">
                          {formatFileSize(att.size)}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {att.url && (
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.name || 'attachment'}
                        className="p-1 text-[#71717A] hover:text-[#18181B] hover:bg-white rounded cursor-pointer"
                        title="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(attId)}
                      className="p-1 text-[#71717A] hover:text-[#DC2626] hover:bg-white rounded cursor-pointer"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Attachment Button */}
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAddFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={isUploadingFile}
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 border border-dashed border-[#D4D4D8] hover:border-[#059669] hover:bg-[#ECFDF5]/30 rounded-[8px] flex items-center justify-center gap-1.5 text-[12px] font-medium text-[#52525B] hover:text-[#059669] transition-all cursor-pointer disabled:opacity-60"
          >
            {isUploadingFile ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Add attachment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6. Action Buttons (Full-Page mode only) */}
      {!hideActions && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-[8px] bg-white border border-[#E5E7EB] hover:bg-[#F5F6F8] text-[12.5px] font-medium text-[#18181B] transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="px-4 py-2 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-[12.5px] font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
