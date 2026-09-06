import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import {
  canViewUsers,
  canManagePermissions,
  canViewReports,
  canViewDepartments,
  canUserViewCompletionRequest,
  canReviewCompletionRequest,
  canReviewDeleteRequest,
  canUserViewTask,
  canUseAiAssistant,
} from '../../utils/rbac/permissionManager';
import { canViewMonthlyTarget } from '../../utils/monthlyTargets/monthlyTargetPermissions';
import { canStartDirectMessage } from '../../utils/messages/messagePermissions';
import { getTotalUnreadMessagesCount } from '../../utils/messages/messageSelectors';
import { UnreadBadge } from '../common/UnreadBadge';
import { getViewUnreadCounts } from '../../utils/comments/unreadCommentSelectors';
import { Avatar } from '../common/Avatar';
import {
  Home,
  CheckSquare,
  User,
  ListTodo,
  Building2,
  Users,
  FolderGit2,
  Inbox,
  BarChart3,
  Activity,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  LogOut,
  UserCheck,
  PlusCircle,
  ShieldCheck,
  Shield,
  Target,
  MessageSquare,
  Sparkles,
  Settings,
} from 'lucide-react';

export function Sidebar({ className = '', isCollapsed = false, onToggleCollapse, onNavItemClick, onOpenCommandPalette }) {
  const { currentUser, users = [], logout } = useAuth();
  const {
    settings,
    deleteRequests = [],
    completionRequests = [],
    tasks = [],
    readChatIds = [],
    departments = [],
    monthlyTargets = [],
    monthlyTargetComments = [],
    conversations = [],
    conversationParticipants = [],
    messages = [],
  } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);

  const userMenuRef = useRef(null);

  const role = currentUser?.role || 'team_member';
  const userId = currentUser?.id;
  const deptId = currentUser?.department_id;
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const adminName = currentUser?.full_name?.split(' ')[0] || 'Admin';

  // Permission Checks for Navigation
  const canSeeTeam = canViewUsers(currentUser) || canManagePermissions(currentUser);
  const canSeePermissionsSubnav = canManagePermissions(currentUser);
  const canSeeReports = canViewReports(currentUser);
  const canSeeDepartments = canViewDepartments(currentUser);
  const canSeeAiAssistant = canUseAiAssistant(currentUser);

  // Scoped Tasks for Unread Badges Calculation
  const scopedTasks = useMemo(() => {
    const activeTasks = (tasks || []).filter((t) => !t.is_deleted);
    return activeTasks.filter((t) => canUserViewTask(currentUser, t, users, departments));
  }, [tasks, currentUser, users, departments]);

  const viewUnreadCounts = useMemo(() => {
    return getViewUnreadCounts({
      scopedTasks,
      currentUserId: userId,
      readChatIds,
      isAdmin,
      users,
    });
  }, [scopedTasks, userId, readChatIds, isAdmin, users]);

  // Scoped Monthly Targets for Unread Comments Calculation
  const monthlyTargetsUnreadCount = useMemo(() => {
    if (!currentUser || !Array.isArray(monthlyTargets) || !Array.isArray(monthlyTargetComments)) {
      return 0;
    }

    const authorizedTargetIds = new Set(
      monthlyTargets
        .filter((t) => canViewMonthlyTarget(currentUser, t, users, departments))
        .map((t) => t.id)
    );

    let unreadCount = 0;
    monthlyTargetComments.forEach((c) => {
      if (!c || !c.target_id) return;
      if (!authorizedTargetIds.has(c.target_id)) return;
      if (c.user_id && String(c.user_id) === String(currentUser.id)) return;
      if (c.id && readChatIds.some((id) => String(id) === String(c.id))) return;
      unreadCount++;
    });

    return unreadCount;
  }, [monthlyTargets, monthlyTargetComments, currentUser, users, departments, readChatIds]);

  // Scoped Delete Requests Count (Admin only)
  const pendingDeleteCount = useMemo(() => {
    if (!canReviewDeleteRequest(currentUser)) return 0;
    return deleteRequests.filter((r) => r.status === 'pending').length;
  }, [deleteRequests, currentUser]);

  // Scoped Pending Completion Requests Count (Actionable for Task Owner)
  const pendingCompletionCount = useMemo(() => {
    if (!completionRequests || !currentUser) return 0;
    return completionRequests.filter((req) => {
      if (req.status !== 'pending') return false;
      const task = tasks.find((t) => t.id === req.task_id);
      return canReviewCompletionRequest(currentUser, req, task, users);
    }).length;
  }, [completionRequests, tasks, currentUser, users]);

  const totalInboxCount = pendingDeleteCount + pendingCompletionCount;

  // Scoped Messaging Unread Count
  const messagesUnreadCount = useMemo(() => {
    if (!userId) return 0;
    return getTotalUnreadMessagesCount(userId, conversations, conversationParticipants, messages);
  }, [userId, conversations, conversationParticipants, messages]);

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleDisplayName = (r) => {
    if (r === 'admin') return 'Administrator';
    if (r === 'it_support_admin') return 'IT Support Admin';
    if (r === 'hod') return 'Department HOD';
    return 'Team Member';
  };

  const currentSearch = new URLSearchParams(location.search);
  const isMyTasksActive =
    location.pathname === '/tasks' && currentSearch.get('scope') === 'my';

  const isAllTasksActive =
    location.pathname.startsWith('/tasks') &&
    !isMyTasksActive &&
    location.pathname !== '/tasks/create';

  const isTeamActive =
    location.pathname.startsWith('/team') ||
    location.pathname.startsWith('/users');

  // Automatically keep Groups open when active
  useEffect(() => {
    if (isAllTasksActive && !isCollapsed) {
      setIsTasksOpen(true);
    }
  }, [isAllTasksActive, isCollapsed]);

  useEffect(() => {
    if (isTeamActive && !isCollapsed) {
      setIsTeamOpen(true);
    }
  }, [isTeamActive, isCollapsed]);

  // Nav Item component for consistent clean styling
  const NavItem = ({ to, label, icon: Icon, badge, badgeColor, end = false, isActive: customIsActive }) => (
    <NavLink
      to={to}
      end={end}
      onClick={onNavItemClick}
      title={isCollapsed ? label : ''}
      className={({ isActive: routerIsActive }) => {
        const active = customIsActive !== undefined ? customIsActive : routerIsActive;
        return `relative flex items-center ${
          isCollapsed ? 'justify-center px-2' : 'px-3 justify-between'
        } h-[38px] rounded-[7px] text-[13.5px] font-medium transition-colors group select-none ${
          active
            ? 'bg-[#F1F3F5] text-[#18181B] font-semibold'
            : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
        }`;
      }}
    >
      {({ isActive: routerIsActive }) => {
        const active = customIsActive !== undefined ? customIsActive : routerIsActive;
        return (
          <>
            {/* Item Content */}

            <div className="flex items-center gap-2.5 min-w-0">
              <Icon
                className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                  active ? 'text-[#059669]' : 'text-[#71717A] group-hover:text-[#18181B]'
                }`}
              />
              {!isCollapsed && <span className="truncate">{label}</span>}
            </div>

            {!isCollapsed && badge !== undefined && badge !== null && badge > 0 && (
              <span
                className={`px-1.5 py-0.5 text-[11px] font-semibold rounded-full min-w-[18px] text-center leading-none ${
                  badgeColor || 'bg-[#F4F4F5] text-[#52525B]'
                }`}
              >
                {badge}
              </span>
            )}

            {isCollapsed && badge !== undefined && badge !== null && badge > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#DC2626]" />
            )}
          </>
        );
      }}
    </NavLink>
  );

  return (
    <aside
      className={`bg-white border-r border-[#E5E7EB] flex flex-col h-screen select-none transition-all duration-200 z-30 flex-shrink-0 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      } ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#E5E7EB] flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={settings?.sidebar_logo_url || '/logo.png'}
            alt={settings?.portal_name || 'UPCOMM'}
            className="w-7 h-7 object-contain flex-shrink-0 rounded-[6px]"
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
          />
          {!isCollapsed && (
            <span className="font-bold text-[15px] tracking-tight text-[#18181B] truncate">
              {settings?.portal_name || 'UPCOMM'}
            </span>
          )}
        </div>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-[6px] text-[#71717A] hover:text-[#18181B] hover:bg-[#F1F3F5] transition-colors cursor-pointer ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navigation Groups Container */}
      <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-4">
        {/* GROUP 1: MY WORK */}
        <div>
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8B8B95]">
              My Work
            </div>
          )}
          <div className="space-y-0.5">
            <NavItem to="/dashboard" label="Home" icon={Home} end />
            <NavItem
              to="/tasks?scope=my"
              label="My Tasks"
              icon={CheckSquare}
              isActive={isMyTasksActive}
            />
            <NavItem to="/personal-tasks" label="Personal Tasks" icon={User} />
            <NavItem
              to="/messages"
              label="Messages"
              icon={MessageSquare}
              badge={messagesUnreadCount > 0 ? messagesUnreadCount : null}
              badgeColor="bg-[#2563EB] text-white font-bold"
              isActive={location.pathname === '/messages' || location.pathname.startsWith('/messages/')}
            />
          </div>
        </div>

        {/* GROUP 2: WORKSPACE */}
        <div>
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8B8B95]">
              Workspace
            </div>
          )}
          <div className="space-y-0.5">
            {/* All Tasks (expandable dropdown across all roles: Admin, HOD, Team Member) */}
            <div>
              <div
                className={`relative flex items-center ${
                  isCollapsed ? 'justify-center px-2' : 'px-3 justify-between'
                } h-[38px] rounded-[7px] text-[13.5px] font-medium transition-colors group select-none cursor-pointer ${
                  isAllTasksActive
                    ? 'bg-[#F1F3F5] text-[#18181B] font-semibold'
                    : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                }`}
                onClick={() => {
                  if (isCollapsed && onToggleCollapse) {
                    onToggleCollapse();
                    setIsTasksOpen(true);
                  } else {
                    setIsTasksOpen(!isTasksOpen);
                  }
                }}
              >

                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    <ListTodo className="w-[18px] h-[18px] text-[#71717A] group-hover:text-[#18181B]" />
                    {isCollapsed && viewUnreadCounts.totalUnique > 0 && (
                      <UnreadBadge
                        count={viewUnreadCounts.totalUnique}
                        size="dot"
                        className="absolute -top-0.5 -right-0.5"
                      />
                    )}
                  </div>
                  {!isCollapsed && <span className="truncate">All Tasks</span>}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    {/* Collapsed Parent Unread Badge (immediately before chevron) */}
                    {!isTasksOpen && viewUnreadCounts.totalUnique > 0 && (
                      <UnreadBadge count={viewUnreadCounts.totalUnique} />
                    )}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#8B8B95] transition-transform duration-200 ${
                        isTasksOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                )}
              </div>

              {!isCollapsed && isTasksOpen && (
                <div className="ml-5 pl-2.5 border-l border-[#E5E7EB] space-y-0.5 mt-0.5 py-0.5">
                  <NavLink
                    to="/tasks"
                    end
                    onClick={onNavItemClick}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors ${
                        isActive
                          ? 'text-[#059669] font-semibold bg-[#ECFDF5]'
                          : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                      }`
                    }
                  >
                    <span>All Tasks</span>
                  </NavLink>
                  <NavLink
                    to="/tasks/pending-in-progress"
                    onClick={onNavItemClick}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors ${
                        isActive
                          ? 'text-[#059669] font-semibold bg-[#ECFDF5]'
                          : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                      }`
                    }
                  >
                    <span>Pending & in Progress</span>
                    <UnreadBadge count={viewUnreadCounts.pending_in_progress} size="sm" />
                  </NavLink>
                  <NavLink
                    to="/tasks/overdue"
                    onClick={onNavItemClick}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors ${
                        isActive
                          ? 'text-[#DC2626] font-semibold bg-red-50'
                          : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                      }`
                    }
                  >
                    <span>Overdue</span>
                    <UnreadBadge count={viewUnreadCounts.overdue} size="sm" />
                  </NavLink>
                  <NavLink
                    to="/tasks/completed"
                    onClick={onNavItemClick}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors ${
                        isActive
                          ? 'text-[#059669] font-semibold bg-emerald-50'
                          : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                      }`
                    }
                  >
                    <span>Completed</span>
                    <UnreadBadge count={viewUnreadCounts.completed} size="sm" />
                  </NavLink>
                  {isAdmin ? (
                    <NavLink
                      to="/tasks/assigned-by-admin"
                      onClick={onNavItemClick}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors ${
                          isActive
                            ? 'text-[#059669] font-semibold bg-emerald-50'
                            : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                        }`
                      }
                    >
                      <span>Assigned by Admin</span>
                      <UnreadBadge count={viewUnreadCounts.assigned_by_admin} size="sm" />
                    </NavLink>
                  ) : (
                    <NavLink
                      to="/tasks/assigned-to-admin"
                      onClick={onNavItemClick}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors ${
                          isActive
                            ? 'text-[#059669] font-semibold bg-emerald-50'
                            : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                        }`
                      }
                    >
                      <span>Assigned to Admin</span>
                      <UnreadBadge count={viewUnreadCounts.assigned_to_admin} size="sm" />
                    </NavLink>
                  )}
                </div>
              )}
            </div>

            {/* Departments */}
            {canSeeDepartments && (
              <NavItem to="/departments" label="Departments" icon={Building2} />
            )}

            {/* Team Dropdown Workspace */}
            {canSeeTeam && (
              <div>
                <div
                  className={`relative flex items-center ${
                    isCollapsed ? 'justify-center px-2' : 'px-3 justify-between'
                  } h-[38px] rounded-[7px] text-[13.5px] font-medium transition-colors group select-none cursor-pointer ${
                    isTeamActive
                      ? 'bg-[#F1F3F5] text-[#18181B] font-semibold'
                      : 'text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8]'
                  }`}
                  onClick={() => {
                    if (isCollapsed && onToggleCollapse) {
                      onToggleCollapse();
                      setIsTeamOpen(true);
                    } else {
                      setIsTeamOpen(!isTeamOpen);
                    }
                  }}
                >

                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users
                      className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
                        isTeamActive ? 'text-[#059669]' : 'text-[#71717A] group-hover:text-[#18181B]'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">Team</span>}
                  </div>
                  {!isCollapsed && (
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#8B8B95] transition-transform duration-200 ${
                        isTeamOpen ? 'rotate-180' : ''
                      }`}
                    />
                  )}
                </div>

                {!isCollapsed && isTeamOpen && (
                  <div className="ml-5 pl-2.5 border-l border-[#E5E7EB] space-y-0.5 mt-0.5 py-0.5">
                    <NavLink
                      to="/team/users"
                      onClick={onNavItemClick}
                      className={({ isActive }) => {
                        const active = isActive || location.pathname === '/team';
                        return `flex items-center px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors ${
                          active
                            ? 'text-[#059669] font-semibold bg-[#ECFDF5]'
                            : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                        }`;
                      }}
                    >
                      Users
                    </NavLink>

                    {canSeePermissionsSubnav && (
                      <NavLink
                        to="/team/permissions"
                        onClick={onNavItemClick}
                        className={({ isActive }) =>
                          `flex items-center px-2.5 py-1.5 rounded-[6px] text-[12.5px] transition-colors ${
                            isActive
                              ? 'text-[#059669] font-semibold bg-[#ECFDF5]'
                              : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                          }`
                        }
                      >
                        User Permissions
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* GROUP 3: MANAGEMENT */}
        <div>
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8B8B95]">
              Management
            </div>
          )}
          <div className="space-y-0.5">
            {/* Unified Management Requests */}
            <NavItem
              to="/inbox"
              label="Requests"
              icon={Inbox}
              badge={totalInboxCount > 0 ? totalInboxCount : null}
              isActive={
                location.pathname === '/inbox' ||
                location.pathname === '/requests' ||
                location.pathname === '/completion-requests' ||
                location.pathname === '/delete-requests'
              }
            />

            {canSeeReports && (
              <NavItem to="/reports" label="Reports" icon={BarChart3} />
            )}
            {canSeeAiAssistant && (
              <NavItem to="/ai-assistant" label="AI Assistant" icon={Sparkles} />
            )}
            <NavItem to="/activity" label="Activity" icon={Activity} />
          </div>
        </div>

        {/* GROUP 4: PERFORMANCE */}
        <div>
          {!isCollapsed && (
            <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#8B8B95]">
              Performance
            </div>
          )}
          <div className="space-y-0.5">
            <NavItem
              to="/monthly-targets"
              label="Monthly Targets & KPIs"
              icon={Target}
              badge={monthlyTargetsUnreadCount > 0 ? monthlyTargetsUnreadCount : null}
              badgeColor="bg-[#2563EB] text-white font-bold"
              isActive={
                location.pathname === '/monthly-targets' ||
                location.pathname.startsWith('/monthly-targets/') ||
                location.pathname === '/performance/monthly-targets'
              }
            />
          </div>
        </div>
      </div>

      {/* Bottom User Area */}
      <div className="p-3 border-t border-[#E5E7EB] mt-auto relative" ref={userMenuRef}>
        <div
          className={`flex items-center gap-3 p-2 rounded-[8px] hover:bg-[#F5F6F8] transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}
          onClick={() => setUserMenuOpen(!userMenuOpen)}
        >
          <Avatar
            src={currentUser?.avatar_url}
            name={currentUser?.full_name || 'Admin'}
            size="sm"
            className="flex-shrink-0"
          />

          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <h4 className="text-[13.5px] font-semibold text-[#18181B] truncate leading-tight">
                {currentUser?.full_name || 'Hasan Ali'}
              </h4>
              <p className="text-[11px] text-[#71717A] truncate mt-0.5">
                {getRoleDisplayName(role)}
              </p>
            </div>
          )}

          {!isCollapsed && (
            <button
              type="button"
              className="p-1 text-[#8B8B95] hover:text-[#18181B] rounded-[4px]"
              aria-label="User menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Popover Action Menu */}
        {userMenuOpen && (
          <div
            className={`absolute bottom-full mb-2 ${
              isCollapsed ? 'left-14 w-48' : 'left-3 right-3'
            } bg-white rounded-[10px] border border-[#E5E7EB] shadow-lg py-1.5 z-50 animate-fade-in`}
          >
            <div className="px-3 py-1.5 border-b border-[#F4F4F5]">
              <p className="text-xs font-semibold text-[#18181B] truncate">
                {currentUser?.full_name || 'Admin'}
              </p>
              <p className="text-[11px] text-[#71717A] truncate font-mono">
                {currentUser?.email || ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer text-left"
            >
              <UserCheck className="w-3.5 h-3.5 text-[#71717A]" />
              <span>My Profile</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setUserMenuOpen(false);
                navigate('/settings');
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#52525B] hover:text-[#18181B] hover:bg-[#F5F6F8] transition-colors cursor-pointer text-left"
            >
              <Settings className="w-3.5 h-3.5 text-[#71717A]" />
              <span>Settings</span>
            </button>

            <div className="my-1 border-t border-[#F4F4F5]" />

            <button
              type="button"
              onClick={async () => {
                setUserMenuOpen(false);
                await logout();
                if (onNavItemClick) onNavItemClick();
                navigate('/login', { replace: true });
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-[12.5px] text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer text-left font-medium"
            >
              <LogOut className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
