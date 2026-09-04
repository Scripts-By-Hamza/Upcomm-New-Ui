import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppData, cleanTaskDescription } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../common/Avatar';
import {
  X,
  Search,
  Check,
  ChevronDown,
  Users,
  UserCheck,
  Paperclip,
  UploadCloud,
  FileText,
  Trash2,
  AlertCircle,
  Save,
  Loader2,
  Calendar,
  Building2,
  Flag,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function EditTaskModal({ isOpen, onClose, task }) {
  const { departments = [], updateTask, uploadTaskAttachment } = useAppData();
  const { currentUser, users = [] } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('pending');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedAssistants, setSelectedAssistants] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // Combobox Search States
  const [userSearch, setUserSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const userSearchRef = useRef(null);

  const [assistantSearch, setAssistantSearch] = useState('');
  const [isAssistantDropdownOpen, setIsAssistantDropdownOpen] = useState(false);
  const assistantSearchRef = useRef(null);

  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Initialize fields when task opens
  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(cleanTaskDescription(task.description || ''));
      setDepartmentId(task.department_id || '');
      setPriority(task.priority || 'medium');
      setStatus(task.status || 'pending');
      setStartDate(task.start_date || '');
      setDueDate(task.due_date || '');

      const allAssigneeIds = Array.from(
        new Set(task.assigned_to_ids || (task.assigned_to ? [task.assigned_to] : []))
      );
      const initialAssignees = (users || []).filter((u) => allAssigneeIds.includes(u.id));
      setSelectedUsers(initialAssignees);

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
      const initialAssistants = (users || []).filter((u) => allAssistantIds.includes(u.id));
      setSelectedAssistants(initialAssistants);

      setAttachments(task.attachments || []);
      setError('');
    }
  }, [task, isOpen, users]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (userSearchRef.current && !userSearchRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (assistantSearchRef.current && !assistantSearchRef.current.contains(event.target)) {
        setIsAssistantDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const assignableUsers = useMemo(() => {
    return (users || []).filter(
      (u) =>
        !u.is_deleted &&
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.role !== 'it_support_admin' &&
        u.role !== 'it_support'
    );
  }, [users]);

  // Filter Assistants: Exclude any member currently in selectedUsers
  const filteredAssistants = useMemo(() => {
    const assignedIds = new Set(selectedUsers.map((u) => u.id));
    return assignableUsers.filter((u) => {
      if (assignedIds.has(u.id)) return false;

      const q = assistantSearch.toLowerCase().trim();
      if (!q) return true;
      const dept = departments.find((d) => d.id === u.department_id);
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.designation?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        dept?.name?.toLowerCase().includes(q)
      );
    });
  }, [assignableUsers, selectedUsers, assistantSearch, departments]);

  // Filter Assignees: Exclude any member currently in selectedAssistants
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
        u.role?.toLowerCase().includes(q) ||
        dept?.name?.toLowerCase().includes(q)
      );
    });
  }, [assignableUsers, selectedAssistants, userSearch, departments]);

  const handleToggleUser = (user) => {
    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
      // Remove from assistants if present
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
      // Remove from assignees if present
      setSelectedUsers((prev) => prev.filter((a) => a.id !== user.id));
    }
    setAssistantSearch('');
  };

  const handleRemoveAssistant = (userId) => {
    setSelectedAssistants(selectedAssistants.filter((u) => u.id !== userId));
  };

  // File Attachments Handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !uploadTaskAttachment) return;

    try {
      setIsUploadingFiles(true);
      setError('');
      for (const file of files) {
        const uploaded = await uploadTaskAttachment(task.id, file);
        if (uploaded) {
          setAttachments((prev) => [...prev, uploaded]);
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
      setError('Failed to upload some files. Please check connection and retry.');
    } finally {
      setIsUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attIdOrUrl) => {
    setAttachments((prev) => prev.filter((a) => (a.id || a.url) !== attIdOrUrl));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError('');

    if (!title.trim()) {
      setError('Task Title is required.');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please assign at least one member to this task.');
      return;
    }

    if (startDate && dueDate && new Date(dueDate) < new Date(startDate)) {
      setError('Due Date cannot be earlier than Start Date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const assignedIds = selectedUsers.map((u) => u.id);
      const assistantIds = selectedAssistants.map((u) => u.id);

      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        department_id: departmentId || selectedUsers[0]?.department_id || null,
        assigned_to: assignedIds[0] || null,
        assigned_to_ids: assignedIds,
        assisted_by: assistantIds[0] || null,
        assisted_by_ids: assistantIds,
        priority,
        status,
        start_date: startDate || null,
        due_date: dueDate || null,
        attachments,
      });

      onClose();
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err?.message || 'Failed to update task. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-fade-in font-['Inter'] select-none" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* 1. Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between bg-white dark:bg-[#18181B] flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="font-mono text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-[5px]">
              {task.task_number || 'TM-0000'}
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-[#18181B] dark:text-[#F4F4F5] tracking-tight">
                Edit Task
              </h2>
              <p className="text-[12px] text-[#71717A] dark:text-[#A1A1AA]">
                Update task parameters, assignment, priority, and timeline.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white rounded-[6px] hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:px-6 py-4 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-[8px] flex items-center gap-2.5 text-rose-800 dark:text-rose-300 text-[12px]">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter clear, actionable task title..."
              className="w-full px-3 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#121214] text-[13px] text-[#18181B] dark:text-white placeholder-[#8B8B95] focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669] focus:outline-none transition-colors"
            />
          </div>

          {/* Task Description */}
          <div>
            <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide task scope, milestones, or instructions..."
              className="w-full px-3 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#121214] text-[13px] text-[#18181B] dark:text-white placeholder-[#8B8B95] focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669] focus:outline-none transition-colors resize-none"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
              Department
            </label>
            <div className="relative">
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#121214] text-[13px] text-[#18181B] dark:text-white focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669] focus:outline-none cursor-pointer appearance-none"
              >
                <option value="">Select Department (Optional)</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-[#8B8B95] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Assigned Members (Multi-Select) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#059669]" />
                <span>Assigned Members ({selectedUsers.length}) <span className="text-rose-500">*</span></span>
              </label>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                Multi-assignee enabled
              </span>
            </div>

            {/* Selected Assignees Chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#FAFBFB] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A]">
                {selectedUsers.map((u) => (
                  <div
                    key={u.id}
                    className="inline-flex items-center gap-1.5 bg-white dark:bg-[#202023] px-2 py-1 rounded-[6px] border border-[#E5E7EB] dark:border-[#3F3F46] text-[12px] text-[#18181B] dark:text-white shadow-2xs"
                  >
                    <Avatar src={u.avatar_url} name={u.full_name} size="xs" className="w-4 h-4" />
                    <span className="font-medium truncate max-w-[140px]">{u.full_name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(u.id)}
                      className="text-[#71717A] hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Assignee Search Combobox */}
            <div className="relative" ref={userSearchRef}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={userSearch}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Search and add team members..."
                  className="w-full pl-9 pr-8 py-2 text-[12.5px] rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#121214] text-[#18181B] dark:text-white placeholder-[#8B8B95] focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] p-1 cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[8px] shadow-lg max-h-48 overflow-y-auto divide-y divide-[#F4F4F5] dark:divide-[#27272A]">
                  {filteredUsers.length === 0 ? (
                    <div className="p-3 text-center text-[12px] text-[#71717A]">No available members found</div>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelected = selectedUsers.some((sel) => sel.id === u.id);
                      const uDept = departments.find((d) => d.id === u.department_id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleToggleUser(u)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between gap-3 hover:bg-[#F4F4F5] dark:hover:bg-[#202023] transition-colors cursor-pointer ${
                            isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={u.avatar_url} name={u.full_name} size="sm" className="w-6 h-6" />
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-semibold text-[#18181B] dark:text-white truncate">{u.full_name}</p>
                              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {uDept && (
                              <span className="text-[10.5px] font-medium text-[#71717A] bg-[#F4F4F5] dark:bg-[#27272A] px-2 py-0.5 rounded-full">
                                {uDept.name}
                              </span>
                            )}
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#059669]" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Assisted By (Multiple Assistants) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Assists By ({selectedAssistants.length})</span>
              </label>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                Optional • Secondary support
              </span>
            </div>

            {/* Selected Assistants Chips */}
            {selectedAssistants.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-[#FAFBFB] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#27272A]">
                {selectedAssistants.map((u) => (
                  <div
                    key={u.id}
                    className="inline-flex items-center gap-1.5 bg-white dark:bg-[#202023] px-2 py-1 rounded-[6px] border border-[#E5E7EB] dark:border-[#3F3F46] text-[12px] text-[#18181B] dark:text-white shadow-2xs"
                  >
                    <Avatar src={u.avatar_url} name={u.full_name} size="xs" className="w-4 h-4" />
                    <span className="font-medium truncate max-w-[140px]">{u.full_name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssistant(u.id)}
                      className="text-[#71717A] hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Assistant Search Combobox */}
            <div className="relative" ref={assistantSearchRef}>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8B8B95] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={assistantSearch}
                  onFocus={() => setIsAssistantDropdownOpen(true)}
                  onChange={(e) => {
                    setAssistantSearch(e.target.value);
                    setIsAssistantDropdownOpen(true);
                  }}
                  placeholder="Search and add assistants..."
                  className="w-full pl-9 pr-8 py-2 text-[12.5px] rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#121214] text-[#18181B] dark:text-white placeholder-[#8B8B95] focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setIsAssistantDropdownOpen((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B8B95] p-1 cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAssistantDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isAssistantDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[8px] shadow-lg max-h-48 overflow-y-auto divide-y divide-[#F4F4F5] dark:divide-[#27272A]">
                  {filteredAssistants.length === 0 ? (
                    <div className="p-3 text-center text-[12px] text-[#71717A]">No available assistants found</div>
                  ) : (
                    filteredAssistants.map((u) => {
                      const isSelected = selectedAssistants.some((sel) => sel.id === u.id);
                      const uDept = departments.find((d) => d.id === u.department_id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleToggleAssistant(u)}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between gap-3 hover:bg-[#F4F4F5] dark:hover:bg-[#202023] transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={u.avatar_url} name={u.full_name} size="sm" className="w-6 h-6" />
                            <div className="min-w-0">
                              <p className="text-[12.5px] font-semibold text-[#18181B] dark:text-white truncate">{u.full_name}</p>
                              <p className="text-[11px] text-[#71717A] dark:text-[#A1A1AA] truncate">{u.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {uDept && (
                              <span className="text-[10.5px] font-medium text-[#71717A] bg-[#F4F4F5] dark:bg-[#27272A] px-2 py-0.5 rounded-full">
                                {uDept.name}
                              </span>
                            )}
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB]" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Priority & Status Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priority Selector */}
            <div>
              <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-4 gap-1 p-1 bg-[#FAFAFA] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#3F3F46]">
                {[
                  { id: 'low', label: 'Low', activeBg: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200' },
                  { id: 'medium', label: 'Medium', activeBg: 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300' },
                  { id: 'high', label: 'High', activeBg: 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300' },
                  { id: 'urgent', label: 'Urgent', activeBg: 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300' },
                ].map((p) => {
                  const isActive = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`py-1.5 text-[11.5px] font-semibold rounded-[6px] transition-all cursor-pointer text-center ${
                        isActive
                          ? `${p.activeBg} shadow-2xs font-bold`
                          : 'text-[#71717A] hover:text-[#18181B] dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
                Status
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#FAFAFA] dark:bg-[#121214] rounded-[8px] border border-[#E5E7EB] dark:border-[#3F3F46]">
                {[
                  { id: 'pending', label: 'Pending', activeBg: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200' },
                  { id: 'in_progress', label: 'In Progress', activeBg: 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300' },
                  { id: 'completed', label: 'Completed', activeBg: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300' },
                ].map((s) => {
                  const isActive = status === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStatus(s.id)}
                      className={`py-1.5 text-[11.5px] font-semibold rounded-[6px] transition-all cursor-pointer text-center ${
                        isActive
                          ? `${s.activeBg} shadow-2xs font-bold`
                          : 'text-[#71717A] hover:text-[#18181B] dark:hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Schedule / Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#121214] text-[12.5px] text-[#18181B] dark:text-white focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] mb-1.5">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-[#FAFAFA] dark:bg-[#121214] text-[12.5px] text-[#18181B] dark:text-white focus:bg-white dark:focus:bg-[#18181B] focus:border-[#059669] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Attachments & Files */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-semibold text-[#3F3F46] dark:text-[#D4D4D8] flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#059669]" />
                <span>Task Attachments ({attachments.length})</span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFiles}
                className="text-[11.5px] font-semibold text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isUploadingFiles ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />

            {attachments.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {attachments.map((att, i) => (
                  <div
                    key={att.id || i}
                    className="p-2 bg-[#FAFAFA] dark:bg-[#121214] rounded-[7px] border border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between gap-2 text-[12px]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-[#059669] flex-shrink-0" />
                      <span className="font-medium text-[#18181B] dark:text-white truncate">
                        {att.name || 'Attached File'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id || att.url)}
                      className="text-[#71717A] hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* 3. Modal Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#E5E7EB] dark:border-[#27272A] bg-[#FAFBFB] dark:bg-[#121214] flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting || isUploadingFiles}
            className="px-3.5 py-2 rounded-[7px] border border-[#E5E7EB] dark:border-[#3F3F46] bg-white dark:bg-[#18181B] text-[12.5px] font-medium text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F4F4F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingFiles}
            className="px-4 py-2 rounded-[7px] bg-[#059669] hover:bg-[#047857] text-white text-[12.5px] font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-2xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditTaskModal;
