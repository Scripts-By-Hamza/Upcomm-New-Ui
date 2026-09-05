import React, { useState, useEffect, useMemo } from 'react';
import { Avatar } from '../common/Avatar';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Building2,
  User,
  ListTodo,
  Inbox,
  Activity,
  BarChart3,
  Users as UsersIcon,
  Lock,
  Info,
  MessageSquare,
} from 'lucide-react';
import {
  ROLE_DEFINITIONS,
  ROLE_DEFAULTS,
  getEffectivePermissions,
  getUserAccessLevel,
} from '../../utils/rbac/permissionManager';

export function UserPermissionDrawer({
  isOpen,
  user,
  department,
  departments = [],
  onClose,
  onSave,
}) {
  const [overrides, setOverrides] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize overrides state when drawer opens or user changes
  useEffect(() => {
    if (user) {
      setOverrides(user.permission_overrides ? { ...user.permission_overrides } : {});
    } else {
      setOverrides({});
    }
  }, [user, isOpen]);

  const role = (user?.role || 'team_member').toLowerCase();
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const roleInfo = ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.team_member;
  const baseDefaults = ROLE_DEFAULTS[role] || ROLE_DEFAULTS.team_member;

  // Build a synthetic user with the currently staged overrides
  const stagedUser = useMemo(() => {
    if (!user) return null;
    return {
      ...user,
      permission_overrides: overrides,
    };
  }, [user, overrides]);

  const effectivePermissions = useMemo(() => {
    return getEffectivePermissions(stagedUser);
  }, [stagedUser]);

  const hasOverrides = useMemo(() => {
    return Object.keys(overrides).length > 0;
  }, [overrides]);

  if (!isOpen || !user) return null;

  const handleToggleBoolean = (key) => {
    if (isAdmin) return;
    const currentVal = effectivePermissions[key];
    const defaultVal = baseDefaults[key];
    const nextVal = !currentVal;

    setOverrides((prev) => {
      const next = { ...prev };
      if (nextVal === defaultVal) {
        delete next[key];
      } else {
        next[key] = nextVal;
      }
      return next;
    });
  };

  const handleSetScope = (categoryKey, newScope) => {
    if (isAdmin) return;
    const defaultVal = baseDefaults[`${categoryKey}.view_scope`];

    setOverrides((prev) => {
      const next = { ...prev };
      if (newScope === defaultVal) {
        delete next[`${categoryKey}.view_scope`];
      } else {
        next[`${categoryKey}.view_scope`] = newScope;
      }
      return next;
    });
  };

  const handleResetToDefaults = () => {
    setOverrides({});
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onSave(user.id, overrides);
      onClose();
    } catch (err) {
      console.error('Failed to save permissions:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isOverridden = (key) => {
    return overrides[key] !== undefined;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-[650px] bg-white dark:bg-[#18181B] dark:border-l dark:border-[#27272A] shadow-2xl flex flex-col h-full z-10 animate-slide-left overflow-hidden">
        {/* 1. Header */}
        <div className="px-6 py-4 border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between bg-white dark:bg-[#18181B] flex-shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar
              src={user.avatar_url}
              name={user.full_name}
              size="lg"
              className="w-11 h-11 flex-shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[#18181B] dark:text-[#F4F4F5] truncate">
                  {user.full_name}
                </h2>
                <span
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-full border"
                  style={{
                    backgroundColor: `${roleInfo.color}15`,
                    color: roleInfo.color,
                    borderColor: `${roleInfo.color}30`,
                  }}
                >
                  {roleInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5 truncate">
                <span>{user.email}</span>
                {department && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {department.name}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[6px] hover:bg-[#F1F3F5] dark:hover:bg-[#27272A] text-[#71717A] dark:text-[#A1A1AA] hover:text-[#18181B] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none bg-[#FAFAFA] dark:bg-[#121214]">
          {/* Admin Protected Shield Notice */}
          {isAdmin ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-[10px] space-y-1.5">
              <div className="flex items-center gap-2 text-[#059669] dark:text-emerald-400 font-bold text-[13.5px]">
                <ShieldCheck className="w-4 h-4" />
                <span>Full Portal Access (Protected Administrator)</span>
              </div>
              <p className="text-[12px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                Administrators have permanent company-wide authority across all tasks, departments, requests, users, and reports. Core administrative controls are locked to prevent accidental system lockouts.
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] flex items-start gap-3 shadow-2xs">
              <Info className="w-4 h-4 text-[#3B82F6] flex-shrink-0 mt-0.5" />
              <div className="text-[12px] text-[#52525B] dark:text-[#A1A1AA] leading-relaxed">
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                  Role Defaults: {roleInfo.label}
                </span>
                . Permissions inherit from the selected role template unless customized below. Overrides take precedence immediately.
              </div>
            </div>
          )}

          {/* Group 1: Task Visibility Scope */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-[#059669]" />
                <h3 className="text-[13.5px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Task Visibility & Scoping
                </h3>
              </div>
              {isOverridden('tasks.view_scope') ? (
                <span className="px-2 py-0.5 text-[10.5px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                  Custom Override
                </span>
              ) : (
                <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Inherited ({roleInfo.label})
                </span>
              )}
            </div>

            <p className="text-[12px] text-[#71717A] dark:text-[#A1A1AA]">
              Controls which tasks this employee can view in All Tasks, Task Lists, and search results.
            </p>

            <div className="space-y-2 pt-1">
              {[
                {
                  id: 'own',
                  title: 'Own / Assigned Tasks Only',
                  desc: 'Can only view tasks directly assigned to them, where they assist, or tasks they created.',
                },
                {
                  id: 'department',
                  title: 'Department Tasks',
                  desc: `Can view all tasks belonging to their department (${department ? department.name : 'assigned department'}).`,
                },
                {
                  id: 'company',
                  title: 'All Company Tasks',
                  desc: 'Unrestricted visibility into all tasks across all departments.',
                  disabled: !isAdmin && role !== 'admin',
                },
              ].map((opt) => {
                const isSelected = effectivePermissions['tasks.view_scope'] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-[8px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#059669] bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-700'
                        : 'border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F9FAFB] dark:hover:bg-[#202023]'
                    } ${isAdmin ? 'pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="tasks_scope"
                      value={opt.id}
                      checked={isSelected}
                      disabled={isAdmin}
                      onChange={() => handleSetScope('tasks', opt.id)}
                      className="mt-0.5 text-[#059669] focus:ring-[#059669] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                        {opt.title}
                      </div>
                      <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Group 2: Requests & Approvals */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#3B82F6]" />
                <h3 className="text-[13.5px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Requests & Approvals
                </h3>
              </div>
              {isOverridden('requests.completion_review_scope') ? (
                <span className="px-2 py-0.5 text-[10.5px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                  Custom Override
                </span>
              ) : (
                <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Inherited ({roleInfo.label})
                </span>
              )}
            </div>

            <div className="divide-y divide-[#F4F4F5] dark:divide-[#27272A]">
              {/* Submitted completion requests */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    View Submitted Completion Requests
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Can see the approval status of completion requests they submitted.
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 text-[#059669] rounded cursor-not-allowed opacity-60"
                  />
                </div>
              </div>

              {/* Review own created task requests */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    Review Completion on Own Created Tasks
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Approve or reject completion requests for tasks they authored.
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 text-[#059669] rounded cursor-not-allowed opacity-60"
                  />
                </div>
              </div>

              {/* Review department completion requests */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    Review Department Completion Requests
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Approve or reject completion requests across their entire department.
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={effectivePermissions['requests.completion_review_scope'] === 'department' || effectivePermissions['requests.completion_review_scope'] === 'all'}
                    disabled={isAdmin}
                    onChange={() => {
                      const current = effectivePermissions['requests.completion_review_scope'];
                      handleSetScope('requests.completion_review', current === 'department' ? 'own' : 'department');
                    }}
                    className="w-4 h-4 text-[#059669] rounded cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Delete Request Approval (Strictly Admin Only) */}
              <div className="py-2.5 flex items-center justify-between gap-3 bg-[#FAFBFB] dark:bg-[#1E1E22] p-2.5 rounded-[8px]">
                <div>
                  <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    <Lock className="w-3.5 h-3.5 text-[#DC2626]" />
                    <span>Approve Task Deletions</span>
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Permanently delete or approve task deletion requests (Admin only).
                  </div>
                </div>
                <span className="px-2 py-0.5 text-[10.5px] font-bold bg-rose-50 text-[#DC2626] dark:bg-rose-950/40 dark:text-rose-300 rounded border border-rose-200 dark:border-rose-900">
                  {isAdmin ? 'Enabled (Admin)' : 'Admin Only'}
                </span>
              </div>
            </div>
          </div>

          {/* Group 3: Activity Feed Scope */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-[13.5px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Activity Log Visibility
                </h3>
              </div>
              {isOverridden('activity.view_scope') ? (
                <span className="px-2 py-0.5 text-[10.5px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                  Custom Override
                </span>
              ) : (
                <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Inherited ({roleInfo.label})
                </span>
              )}
            </div>

            <p className="text-[12px] text-[#71717A] dark:text-[#A1A1AA]">
              Determines what audit trails, status changes, and task activity this employee can see.
            </p>

            <div className="space-y-2 pt-1">
              {[
                {
                  id: 'own',
                  title: 'Own Task Activity Only',
                  desc: 'Only events and comments for tasks they are assigned to or authored.',
                },
                {
                  id: 'department',
                  title: 'Department Activity',
                  desc: 'All activity on tasks and deliverables belonging to their department.',
                },
                {
                  id: 'company',
                  title: 'Company-Wide Activity',
                  desc: 'Full audit feed across all company departments.',
                  disabled: !isAdmin,
                },
              ].map((opt) => {
                const isSelected = effectivePermissions['activity.view_scope'] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-[8px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#059669] bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-700'
                        : 'border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F9FAFB] dark:hover:bg-[#202023]'
                    } ${isAdmin ? 'pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="activity_scope"
                      value={opt.id}
                      checked={isSelected}
                      disabled={isAdmin}
                      onChange={() => handleSetScope('activity', opt.id)}
                      className="mt-0.5 text-[#059669] focus:ring-[#059669] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                        {opt.title}
                      </div>
                      <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Group 4: Team & Permissions Management */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-4 h-4 text-[#6366F1]" />
                <h3 className="text-[13.5px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Team Management & Access
                </h3>
              </div>
              {isOverridden('users.view') || isOverridden('users.manage') ? (
                <span className="px-2 py-0.5 text-[10.5px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                  Custom Override
                </span>
              ) : (
                <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Inherited ({roleInfo.label})
                </span>
              )}
            </div>

            <div className="divide-y divide-[#F4F4F5] dark:divide-[#27272A]">
              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    View Team Directory
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Access the Team page and view company employee directory.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={effectivePermissions['users.view']}
                  disabled={isAdmin}
                  onChange={() => handleToggleBoolean('users.view')}
                  className="w-4 h-4 text-[#059669] rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    Manage Users & Role Assignment
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Create, edit employee accounts and change role designations.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={effectivePermissions['users.manage']}
                  disabled={isAdmin}
                  onChange={() => handleToggleBoolean('users.manage')}
                  className="w-4 h-4 text-[#059669] rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    Manage User Permissions
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Access the User Permissions sub-page and customize permissions.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={effectivePermissions['permissions.manage']}
                  disabled={isAdmin}
                  onChange={() => handleToggleBoolean('permissions.manage')}
                  className="w-4 h-4 text-[#059669] rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Group 5: Reports & Analytics */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#8B5CF6]" />
                <h3 className="text-[13.5px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Reports & Analytics
                </h3>
              </div>
              {isOverridden('reports.view_scope') ? (
                <span className="px-2 py-0.5 text-[10.5px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 rounded border border-purple-200 dark:border-purple-800">
                  Custom Override
                </span>
              ) : (
                <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                  Inherited ({roleInfo.label})
                </span>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {[
                {
                  id: 'none',
                  title: 'No Reports Access',
                  desc: 'Reports section is hidden from navigation.',
                },
                {
                  id: 'department',
                  title: 'Department Analytics Only',
                  desc: 'Access productivity charts and KPI metrics for their department only.',
                },
                {
                  id: 'company',
                  title: 'Company-Wide Reports',
                  desc: 'Full company executive reports and performance benchmarks.',
                  disabled: !isAdmin,
                },
              ].map((opt) => {
                const isSelected = effectivePermissions['reports.view_scope'] === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-[8px] border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#059669] bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-700'
                        : 'border-[#E5E7EB] dark:border-[#27272A] hover:bg-[#F9FAFB] dark:hover:bg-[#202023]'
                    } ${isAdmin ? 'pointer-events-none' : ''}`}
                  >
                    <input
                      type="radio"
                      name="reports_scope"
                      value={opt.id}
                      checked={isSelected}
                      disabled={isAdmin}
                      onChange={() => handleSetScope('reports', opt.id)}
                      className="mt-0.5 text-[#059669] focus:ring-[#059669] cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                        {opt.title}
                      </div>
                      <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA] mt-0.5">
                        {opt.desc}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Group 6: Private Messaging & Moderation */}
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#059669]" />
                <h3 className="text-[13.5px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
                  Private Messaging & Moderation
                </h3>
              </div>
              <span className="text-[11px] text-[#71717A] dark:text-[#A1A1AA]">
                {roleInfo.label} Permissions
              </span>
            </div>

            <div className="divide-y divide-[#F4F4F5] dark:divide-[#27272A] pt-1">
              <div className="py-2.5 flex items-center justify-between gap-3 first:pt-0">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    Send Direct Messages
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Allow starting 1-on-1 private conversations with colleagues.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={effectivePermissions['messages.send_direct']}
                  disabled={isAdmin}
                  onChange={() => handleToggleBoolean('messages.send_direct')}
                  className="w-4 h-4 text-[#059669] rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    Create Group Conversations
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Allow creating multi-user private group chats.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={effectivePermissions['messages.create_group']}
                  disabled={isAdmin}
                  onChange={() => handleToggleBoolean('messages.create_group')}
                  className="w-4 h-4 text-[#059669] rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    Send Broadcast Messages
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Send a private broadcast message simultaneously to multiple recipients.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={effectivePermissions['messages.send_broadcast']}
                  disabled={isAdmin}
                  onChange={() => handleToggleBoolean('messages.send_broadcast')}
                  className="w-4 h-4 text-[#059669] rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12.5px] font-semibold text-[#18181B] dark:text-[#F4F4F5]">
                    Cross-Department Messaging
                  </div>
                  <div className="text-[11.5px] text-[#71717A] dark:text-[#A1A1AA]">
                    Allow messaging colleagues in other departments.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={effectivePermissions['messages.cross_department']}
                  disabled={isAdmin}
                  onChange={() => handleToggleBoolean('messages.cross_department')}
                  className="w-4 h-4 text-[#059669] rounded cursor-pointer disabled:cursor-not-allowed"
                />
              </div>

            </div>
          </div>

          {/* Effective Access Summary Preview */}
          <div className="bg-[#F1F3F5] dark:bg-[#1C1C20] rounded-[10px] p-4 space-y-2.5">
            <h4 className="text-[12.5px] font-bold text-[#18181B] dark:text-[#F4F4F5] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>Effective Access Summary</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11.5px]">
              <div className="p-2 bg-white dark:bg-[#18181B] rounded-[6px] border border-[#E5E7EB] dark:border-[#27272A]">
                <span className="text-[#71717A] block">Dashboard:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] capitalize">
                  {effectivePermissions['dashboard.type']} Dashboard
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-[#18181B] rounded-[6px] border border-[#E5E7EB] dark:border-[#27272A]">
                <span className="text-[#71717A] block">Task Visibility:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] capitalize">
                  {effectivePermissions['tasks.view_scope']}
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-[#18181B] rounded-[6px] border border-[#E5E7EB] dark:border-[#27272A]">
                <span className="text-[#71717A] block">Completion Review:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] capitalize">
                  {effectivePermissions['requests.completion_review_scope']} Scope
                </span>
              </div>
              <div className="p-2 bg-white dark:bg-[#18181B] rounded-[6px] border border-[#E5E7EB] dark:border-[#27272A]">
                <span className="text-[#71717A] block">Activity Scope:</span>
                <span className="font-semibold text-[#18181B] dark:text-[#F4F4F5] capitalize">
                  {effectivePermissions['activity.view_scope']}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] flex items-center justify-between flex-shrink-0">
          <div>
            {!isAdmin && hasOverrides && (
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-medium text-[#71717A] hover:text-[#18181B] dark:text-[#A1A1AA] dark:hover:text-white hover:bg-[#F1F3F5] dark:hover:bg-[#27272A] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to {roleInfo.label} defaults</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[8px] bg-white dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] text-[#52525B] dark:text-[#D4D4D8] hover:bg-[#F5F6F8] dark:hover:bg-[#323238] text-[13px] font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isAdmin}
              className="px-4 py-2 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : 'Save Permissions'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
