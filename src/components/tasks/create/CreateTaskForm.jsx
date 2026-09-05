import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppData } from '../../../contexts/AppDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Avatar } from '../../common/Avatar';
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
} from 'lucide-react';

export function CreateTaskForm({
  onSuccess,
  onCancel,
  isDrawer = false,
  initialDepartmentId = '',
  initialStatus = 'pending',
  onDirtyChange,
  formRef,
  hideActions = false,
  isSubmittingExternal = false,
}) {
  const { departments = [], createTask, uploadTaskAttachment } = useAppData();
  const { currentUser, users = [] } = useAuth();

  const role = currentUser?.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHod = role === 'hod';
  const isTeamMember = !isAdmin && !isHod;

  // HOD Assignment Mode: 'internal' or 'cross_hod'
  const [hodAssignMode, setHodAssignMode] = useState('internal');
  // Team Member Assignment Mode: 'self' or 'cross_hod'
  const [memberAssignMode, setMemberAssignMode] = useState('self');

  // Compute active assignable users
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

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(() => {
    if (initialDepartmentId && departments.some((d) => d.id === initialDepartmentId)) {
      return initialDepartmentId;
    }
    if (currentUser?.department_id) {
      return currentUser.department_id;
    }
    return '';
  });

  // Start date (auto today) and Due date (auto today + 7 days), both fully editable
  const [startDate, setStartDate] = useState(() => getTodayDateString());
  const [dueDate, setDueDate] = useState(() => getFutureDateString(7));
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState(() =>
    initialStatus === 'in_progress' ? 'in_progress' : 'pending'
  );

  // Multi-Selected Assignees
  const [selectedUsers, setSelectedUsers] = useState(() => {
    if (isAdmin || isHod) return [];
    return currentUser ? [currentUser] : [];
  });

  // Multi-Selected Assistants
  const [selectedAssistants, setSelectedAssistants] = useState([]);

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

  // Staged Attachments (Files to upload on create)
  const [stagedFiles, setStagedFiles] = useState([]);

  // Dropdown / Popover UI States
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [assistantSearch, setAssistantSearch] = useState('');
  const [isAssistantDropdownOpen, setIsAssistantDropdownOpen] = useState(false);
  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Form UI states
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

  // Track dirty state
  const isDirty = useMemo(() => {
    const hasTitle = Boolean(title.trim());
    const hasDesc = Boolean(description.trim());
    const hasStartDate = Boolean(startDate);
    const hasDueDate = Boolean(dueDate);
    const hasFiles = stagedFiles.length > 0;
    const hasAssistants = selectedAssistants.length > 0;
    const hasCustomAssignees = isAdmin || isHod ? selectedUsers.length > 0 : selectedUsers.length > 1;
    return hasTitle || hasDesc || hasStartDate || hasDueDate || hasFiles || hasAssistants || hasCustomAssignees;
  }, [title, description, startDate, dueDate, stagedFiles, selectedAssistants, selectedUsers, isAdmin, isHod]);

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Allowed Departments based on user role
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

  // Source pool for assistants
  const assistantPool = useMemo(() => {
    if (isTeamMember) return assignableAssistantsForMember;
    return assignableUsers;
  }, [isTeamMember, assignableAssistantsForMember, assignableUsers]);

  // Filtered assistants search list
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

  // Filtered users for Assignee search list
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

  // Handlers for Assignee selection
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
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Handlers for Assistant selection
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

  // File Staging Handlers
  const handleFilesAdded = (filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    const validNewFiles = [];
    let fileError = '';

    files.forEach((file) => {
      // 10 MB limit check
      if (file.size > 10 * 1024 * 1024) {
        fileError = `File "${file.name}" exceeds the 10 MB limit.`;
        return;
      }
      validNewFiles.push({
        id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
      });
    });

    if (fileError) {
      setError(fileError);
    }
    if (validNewFiles.length > 0) {
      setStagedFiles((prev) => [...prev, ...validNewFiles]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleRemoveStagedFile = (id) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType = '', name = '') => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return <ImageIcon className="w-3.5 h-3.5 text-[#059669]" />;
    }
    if (mimeType.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext)) {
      return <Video className="w-3.5 h-3.5 text-[#7C3AED]" />;
    }
    if (mimeType.includes('pdf') || ext === 'pdf') {
      return <FileText className="w-3.5 h-3.5 text-[#DC2626]" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || ['csv', 'xlsx', 'xls'].includes(ext)) {
      return <FileSpreadsheet className="w-3.5 h-3.5 text-[#059669]" />;
    }
    return <File className="w-3.5 h-3.5 text-[#2563EB]" />;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');

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

    const assignedIds = Array.from(new Set(selectedUsers.map((u) => u.id)));
    const isFirstAssigneeAdminWithoutDept =
      selectedUsers[0] &&
      (selectedUsers[0].role === 'admin' || selectedUsers[0].role === 'it_support_admin') &&
      !selectedUsers[0].department_id;

    const primaryDeptId = isFirstAssigneeAdminWithoutDept
      ? null
      : selectedUsers[0]?.department_id || departmentId || null;

    try {
      setIsSubmittingInternal(true);
      const assistantIds = selectedAssistants.map((u) => u.id);

      // Upload staged attachments
      let uploadedAttachments = [];
      if (stagedFiles.length > 0 && uploadTaskAttachment) {
        for (const staged of stagedFiles) {
          try {
            const uploaded = await uploadTaskAttachment(staged.file);
            if (uploaded) {
              uploadedAttachments.push(uploaded);
            }
          } catch (uploadErr) {
            console.warn('Failed to upload file:', staged.name, uploadErr);
          }
        }
      }

      const created = await createTask({
        title: trimmedTitle,
        description: description.trim(),
        department_id: primaryDeptId,
        assigned_to: assignedIds,
        assisted_by: assistantIds,
        attachments: uploadedAttachments,
        start_date: startDate,
        due_date: dueDate,
        priority,
        status: status === 'in_progress' ? 'in_progress' : 'pending',
      });

      onSuccess?.(created);
    } catch (err) {
      setError(err?.message || 'Failed to create task in database. Please try again.');
    } finally {
      setIsSubmittingInternal(false);
    }
  };

  const selectedDeptObj = departments.find((d) => d.id === departmentId);

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
        <label htmlFor="task-title-input" className="block text-[12px] font-semibold text-[#18181B]">
          Task title <span className="text-[#DC2626]">*</span>
        </label>
        <input
          id="task-title-input"
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
        <label htmlFor="task-description-input" className="block text-[12px] font-semibold text-[#18181B]">
          Description
        </label>
        <textarea
          id="task-description-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add task description..."
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

      {isTeamMember && (
        <div className="flex items-center gap-2 p-2 bg-[#F5F6F8] rounded-[8px] border border-[#E5E7EB]">
          <span className="text-[11.5px] font-medium text-[#71717A]">Assignment Scope:</span>
          <button
            type="button"
            onClick={() => setMemberAssignMode('self')}
            className={`px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium transition-colors cursor-pointer ${
              memberAssignMode === 'self'
                ? 'bg-white text-[#18181B] shadow-2xs font-semibold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Self
          </button>
          <button
            type="button"
            onClick={() => setMemberAssignMode('cross_hod')}
            className={`px-2.5 py-1 rounded-[6px] text-[11.5px] font-medium transition-colors cursor-pointer ${
              memberAssignMode === 'cross_hod'
                ? 'bg-white text-[#18181B] shadow-2xs font-semibold'
                : 'text-[#71717A] hover:text-[#18181B]'
            }`}
          >
            Assign to HOD
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
                    placeholder="Search team members..."
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
                    status === 'in_progress' ? 'bg-[#2563EB]' : 'bg-[#71717A]'
                  }`}
                />
                <span className="font-medium text-[#18181B]">
                  {status === 'in_progress' ? 'In Progress' : 'Pending'}
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
              </div>
            )}
          </div>
        </div>

        {/* Row 3 Left: Start Date Field (Visible outside and required) */}
        <div className="space-y-1.5">
          <label htmlFor="task-start-date-input" className="block text-[12px] font-semibold text-[#18181B]">
            Start Date <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <input
              id="task-start-date-input"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] text-[#18181B] text-[12.5px] transition-colors outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Row 3 Right: Due Date Field (Visible outside and required) */}
        <div className="space-y-1.5">
          <label htmlFor="task-due-date-input" className="block text-[12px] font-semibold text-[#18181B]">
            Due Date <span className="text-[#DC2626]">*</span>
          </label>
          <div className="relative">
            <input
              id="task-due-date-input"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-10 px-3 rounded-[8px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] focus:border-[#059669] focus:ring-1 focus:ring-[#059669] text-[#18181B] text-[12.5px] transition-colors outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. Attachments Drag/Drop Zone */}
      <div className="space-y-1.5 pt-1">
        <label className="block text-[12px] font-semibold text-[#18181B]">
          Attachments
        </label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[10px] p-5 text-center transition-all cursor-pointer select-none ${
            isDragging
              ? 'border-[#059669] bg-[#ECFDF5]/50'
              : 'border-[#E5E7EB] hover:border-[#D4D4D8] bg-white'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFilesAdded(e.target.files)}
            multiple
            className="hidden"
          />
          <UploadCloud className="w-6 h-6 text-[#71717A] mx-auto mb-1.5" />
          <p className="text-[12.5px] text-[#18181B] font-medium">
            Drop files here or <span className="text-[#059669] hover:underline">browse</span>
          </p>
          <p className="text-[11px] text-[#8B8B95] mt-0.5">
            PNG, JPG, PDF, DOC, CSV up to 10 MB
          </p>
        </div>

        {/* Staged Files List */}
        {stagedFiles.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {stagedFiles.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between px-3 py-1.5 rounded-[8px] bg-[#F8F9FA] border border-[#E5E7EB]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {getFileIcon(f.type, f.name)}
                  <span className="text-[12px] font-medium text-[#18181B] truncate">
                    {f.name}
                  </span>
                  <span className="text-[11px] text-[#71717A] font-mono flex-shrink-0">
                    ({formatFileSize(f.size)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveStagedFile(f.id);
                  }}
                  className="p-1 text-[#8B8B95] hover:text-[#DC2626] rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Action Buttons */}
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
            disabled={isSubmitting}
            className="px-4 py-2 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-[12.5px] font-medium text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-none disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Task</span>
            )}
          </button>
        </div>
      )}
    </form>
  );
}
