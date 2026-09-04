import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Users,
  UserPlus,
  Check,
  Building2,
  ShieldCheck,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../common/Avatar';
import { Badge } from '../common/Badge';

export function AddTaskTeamModal({ isOpen, onClose, task }) {
  const { users, currentUser } = useAuth();
  const { updateTask, addTaskUpdate, departments } = useAppData();

  if (!isOpen || !task) return null;

  const currentAssigneeIds = Array.isArray(task.assigned_to_ids)
    ? task.assigned_to_ids
    : task.assigned_to
    ? [task.assigned_to]
    : [];

  const currentAssistantIds = Array.isArray(task.assisted_by_ids)
    ? task.assisted_by_ids
    : Array.isArray(task.assisted_by)
    ? task.assisted_by
    : task.assisted_by
    ? [task.assisted_by]
    : [];

  const role = currentUser?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'it_support_admin';

  // Local selection state (initialized with current task stakeholders)
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState(currentAssigneeIds);
  const [selectedAssistantIds, setSelectedAssistantIds] = useState(currentAssistantIds);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState(() => {
    return isAdmin ? 'all' : currentUser?.department_id || 'all';
  });
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Department map for fast lookup
  const deptMap = useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      map[d.id] = d;
    });
    return map;
  }, [departments]);

  const userDeptName = deptMap[currentUser?.department_id]?.name || 'My Department';

  // Filtered available users: Strictly ONLY regular team members (No HODs, No Admins)
  const filteredUsers = useMemo(() => {
    return (users || []).filter((u) => {
      // Strictly exclude Admins and HODs from the team members list
      const userRole = u.role?.toLowerCase();
      if (userRole === 'admin' || userRole === 'it_support_admin' || userRole === 'hod') {
        return false;
      }

      // Strict rule: Non-admin users (e.g. HODs) can ONLY see and add members from their own department
      if (!isAdmin) {
        if (currentUser?.department_id && u.department_id !== currentUser.department_id) {
          return false;
        }
      } else {
        if (deptFilter !== 'all' && u.department_id !== deptFilter) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.full_name?.toLowerCase().includes(q);
        const matchesDesignation = u.designation?.toLowerCase().includes(q);
        const userDept = deptMap[u.department_id];
        const matchesDept = userDept?.name?.toLowerCase().includes(q);
        return matchesName || matchesDesignation || matchesDept;
      }
      return true;
    });
  }, [users, isAdmin, currentUser?.department_id, deptFilter, searchQuery, deptMap]);

  // Track newly added members compared to original task
  const newlyAddedAssignees = useMemo(() => {
    return selectedAssigneeIds.filter((id) => !currentAssigneeIds.includes(id));
  }, [selectedAssigneeIds, currentAssigneeIds]);

  const newlyAddedAssistants = useMemo(() => {
    return selectedAssistantIds.filter((id) => !currentAssistantIds.includes(id));
  }, [selectedAssistantIds, currentAssistantIds]);

  const totalNewAdded = newlyAddedAssignees.length + newlyAddedAssistants.length;

  const handleToggleAssignee = (userId) => {
    if (selectedAssigneeIds.includes(userId)) {
      setSelectedAssigneeIds((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedAssigneeIds((prev) => [...prev, userId]);
      // Remove from assistants if selected as assignee
      setSelectedAssistantIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleToggleAssistant = (userId) => {
    if (selectedAssistantIds.includes(userId)) {
      setSelectedAssistantIds((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedAssistantIds((prev) => [...prev, userId]);
      // Remove from assignees if selected as assistant
      setSelectedAssigneeIds((prev) => prev.filter((id) => id !== userId));
    }
  };

  const handleSaveTeam = async () => {
    if (selectedAssigneeIds.length === 0) {
      alert('Please assign at least one team member to this task.');
      return;
    }

    try {
      setIsSaving(true);

      // 1. Update task in Cloud Database with merged assignees & assistants
      await updateTask(task.id, {
        assigned_to_ids: selectedAssigneeIds,
        assigned_to: selectedAssigneeIds[0],
        assisted_by_ids: selectedAssistantIds,
        assisted_by: selectedAssistantIds[0] || null,
      });

      // 2. If new members were added, post a live feed notification log in task_updates
      if (totalNewAdded > 0 && addTaskUpdate) {
        const addedNames = [];
        newlyAddedAssignees.forEach((id) => {
          const u = users.find((user) => user.id === id);
          if (u) addedNames.push(`${u.full_name} (Assigned)`);
        });
        newlyAddedAssistants.forEach((id) => {
          const u = users.find((user) => user.id === id);
          if (u) addedNames.push(`${u.full_name} (Assistant)`);
        });

        if (addedNames.length > 0) {
          const actorName = currentUser?.full_name || 'Team Lead';
          await addTaskUpdate(
            task.id,
            `👥 ${actorName} added team members to this task: ${addedNames.join(', ')}.`,
            task.status,
            [],
            false
          );
        }
      }

      setSuccessMessage('Team members added & synchronized to cloud database!');
      setTimeout(() => {
        setIsSaving(false);
        setSuccessMessage('');
        onClose();
      }, 700);
    } catch (err) {
      console.error('Failed to update task team members:', err);
      alert('Error updating team members. Please check connection and try again.');
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in font-['Inter']"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Add Team Members to Task
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-mono font-bold text-[10px]">
                  {task.task_number}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium truncate max-w-sm sm:max-w-md">
                {task.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls (Search + Department Tabs) */}
        <div className="p-4 border-b border-slate-100 bg-white space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team members by name or designation..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Department Filter Pills (Admins see all depts, HODs see their own department info) */}
          {isAdmin ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 overflow-x-auto pb-1 max-h-24">
              <button
                type="button"
                onClick={() => setDeptFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  deptFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Departments
              </button>

              {currentUser?.department_id && deptMap[currentUser.department_id] && (
                <button
                  type="button"
                  onClick={() => setDeptFilter(currentUser.department_id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    deptFilter === currentUser.department_id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <Building2 className="w-3 h-3" />
                  <span>My Team ({deptMap[currentUser.department_id]?.name})</span>
                </button>
              )}

              {departments
                ?.filter((d) => d.id !== currentUser?.department_id)
                .map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() => setDeptFilter(dept.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      deptFilter === dept.id
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold">
                <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Department: {userDeptName}</span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                (HOD team allocation for {userDeptName})
              </span>
            </div>
          )}
        </div>

        {/* Member Selection List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-medium">
              No matching team members found.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isAssigned = selectedAssigneeIds.includes(user.id);
              const isAssistant = selectedAssistantIds.includes(user.id);
              const userDept = deptMap[user.department_id];

              return (
                <div
                  key={user.id}
                  className={`p-3 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isAssigned
                      ? 'bg-emerald-50/70 border border-emerald-200'
                      : isAssistant
                      ? 'bg-teal-50/70 border border-teal-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  {/* User Profile Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar
                      src={user.avatar_url}
                      name={user.full_name}
                      size="md"
                      showRoleBadge
                      role={user.role}
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                          {user.full_name}
                        </h4>
                        {user.role === 'hod' && (
                          <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] font-extrabold uppercase rounded">
                            HOD
                          </span>
                        )}
                        {user.role === 'admin' && (
                          <span className="px-1.5 py-0.2 bg-purple-100 text-purple-800 text-[9px] font-extrabold uppercase rounded">
                            Admin
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <span className="truncate">{user.designation || 'Team Member'}</span>
                        {userDept && (
                          <>
                            <span>•</span>
                            <span
                              className="font-bold truncate"
                              style={{ color: userDept.color || '#059669' }}
                            >
                              {userDept.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Assignee / Assistant Action Toggles */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                    {/* Add as Assignee Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAssignee(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isAssigned
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Assigned</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Assign</span>
                        </>
                      )}
                    </button>

                    {/* Add as Assistant Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleAssistant(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isAssistant
                          ? 'bg-teal-600 text-white hover:bg-teal-700'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isAssistant ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Assistant</span>
                        </>
                      ) : (
                        <>
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          <span>Assistant</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer Summary & Submit */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 space-y-0.5">
            <p className="font-bold text-slate-900">
              Total Roster: {selectedAssigneeIds.length} Assigned • {selectedAssistantIds.length} Assistants
            </p>
            {totalNewAdded > 0 && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {totalNewAdded} new {totalNewAdded === 1 ? 'member' : 'members'} ready to add
                </span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveTeam}
              disabled={isSaving || selectedAssigneeIds.length === 0}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Syncing Database...</span>
                </>
              ) : successMessage ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Save & Update Team</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
