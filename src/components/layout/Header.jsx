import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { Avatar } from '../common/Avatar';
import {
  Menu,
  Search,
  Plus,
  Check,
  RotateCw,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { NotificationBell } from '../notifications/NotificationBell';
import { NotificationPopover } from '../notifications/NotificationPopover';
import { getUserTargetedNotifications } from '../../utils/notifications/formatNotification';
import { handleNotificationClick } from '../../utils/notifications/notificationDestination';

export function Header({
  onOpenMobileMenu,
  onOpenCommandPalette,
  onOpenTaskDetail,
}) {
  const { currentUser, users = [] } = useAuth();
  const {
    tasks = [],
    departments = [],
    activityLogs = [],
    completionRequests = [],
    deleteRequests = [],
    readNotificationIds = [],
    markAllAsRead,
    markNotificationAsRead,
    refreshAllData,
    isRefreshing,
    lastRefreshedAt,
  } = useAppData();
  const navigate = useNavigate();
  const location = useLocation();

  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const notificationMenuRef = useRef(null);

  // Close notifications menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(event.target)
      ) {
        setShowNotificationMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Derive dynamic breadcrumbs based on route location
  const breadcrumbs = useMemo(() => {
    const path = location.pathname;
    if (path === '/dashboard' || path === '/') {
      const isHod = currentUser?.role === 'hod';
      return [
        { label: 'Home', to: '/dashboard' },
        { label: isHod ? 'Department Dashboard' : 'Dashboard' },
      ];
    }
    if (path === '/tasks') {
      const searchParams = new URLSearchParams(location.search);
      if (searchParams.get('scope') === 'my') {
        return [{ label: 'My Work', to: '/dashboard' }, { label: 'My Tasks' }];
      }
      return [{ label: 'Workspace', to: '/tasks' }, { label: 'Tasks' }];
    }
    if (path === '/tasks/create') {
      return [{ label: 'Tasks', to: '/tasks' }, { label: 'Create Task' }];
    }
    if (path === '/tasks/pending-in-progress') {
      return [{ label: 'Tasks', to: '/tasks' }, { label: 'Pending & in Progress' }];
    }
    if (path === '/tasks/overdue') {
      return [{ label: 'Tasks', to: '/tasks' }, { label: 'Overdue' }];
    }
    if (path === '/tasks/completed') {
      return [{ label: 'Tasks', to: '/tasks' }, { label: 'Completed' }];
    }
    if (path === '/tasks/assigned-by-admin') {
      return [{ label: 'Tasks', to: '/tasks' }, { label: 'Assigned by Admin' }];
    }
    if (path === '/tasks/assigned-to-admin') {
      return [{ label: 'My Work', to: '/dashboard' }, { label: 'My Tasks' }];
    }
    if (path.startsWith('/tasks/edit/')) {
      return [{ label: 'Tasks', to: '/tasks' }, { label: 'Edit Task' }];
    }
    if (path.startsWith('/tasks/')) {
      return [{ label: 'Tasks', to: '/tasks' }, { label: 'Task Details' }];
    }
    if (path === '/personal-tasks') {
      return [{ label: 'Home', to: '/dashboard' }, { label: 'Personal Tasks' }];
    }
    if (path.startsWith('/departments/')) {
      const deptId = path.split('/')[2];
      const dept = (departments || []).find((d) => d.id === deptId);
      return [
        { label: 'Departments', to: '/departments' },
        { label: dept?.name || 'Department Details' },
      ];
    }
    if (path === '/departments') {
      return [{ label: 'Workspace', to: '/dashboard' }, { label: 'Departments' }];
    }
    if (path === '/team' || path === '/directory' || path === '/users') {
      return [{ label: 'Workspace', to: '/team' }, { label: 'Team' }];
    }
    if (
      path === '/inbox' ||
      path === '/requests' ||
      path === '/completion-requests' ||
      path === '/delete-requests'
    ) {
      return [{ label: 'Management', to: '/dashboard' }, { label: 'Requests' }];
    }
    if (path === '/reports') {
      return [{ label: 'Management', to: '/dashboard' }, { label: 'Reports' }];
    }
    if (path === '/activity') {
      return [{ label: 'Management', to: '/dashboard' }, { label: 'Activity' }];
    }
    if (path === '/profile') {
      return [{ label: 'Account', to: '/dashboard' }, { label: 'Profile' }];
    }

    return [{ label: 'Home', to: '/dashboard' }, { label: 'Dashboard' }];
  }, [location.pathname, currentUser?.role, departments, location.search]);

  // Normalize user-targeted notifications
  const userNotifications = useMemo(() => {
    return getUserTargetedNotifications({
      tasks,
      activityLogs,
      users,
      currentUser,
      readNotificationIds,
      completionRequests,
      deleteRequests,
    });
  }, [
    tasks,
    activityLogs,
    users,
    currentUser,
    readNotificationIds,
    completionRequests,
    deleteRequests,
  ]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => n.isUnread).length;
  }, [userNotifications]);

  const handleOpenSearchPalette = () => {
    setShowNotificationMenu(false);
    onOpenCommandPalette && onOpenCommandPalette();
  };

  const handleRowClick = (notification) => {
    handleNotificationClick({
      notification,
      onOpenTaskDetail,
      navigate,
      onClosePopover: () => setShowNotificationMenu(false),
      markAsRead: markNotificationAsRead,
    });
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-white border-b border-[#E5E7EB] select-none">
      <div className="h-16 px-4 sm:px-7 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Contextual Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-[7px] text-[#71717A] hover:bg-[#F5F6F8] hover:text-[#18181B] transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleOpenSearchPalette}
            className="md:hidden p-2 rounded-[7px] text-[#71717A] hover:bg-[#F5F6F8] hover:text-[#18181B] transition-colors"
            title="Search (Ctrl + K)"
            aria-label="Open search command palette"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="hidden sm:flex items-center gap-1.5 text-[13px]"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <React.Fragment key={crumb.label}>
                  {idx > 0 && <span className="text-[#A1A1AA] mx-0.5">/</span>}
                  {crumb.to && !isLast ? (
                    <button
                      type="button"
                      onClick={() => navigate(crumb.to)}
                      className="text-[#71717A] hover:text-[#18181B] transition-colors font-medium cursor-pointer"
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span className="text-[#18181B] font-semibold">
                      {crumb.label}
                    </span>
                  )}
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* Center / Center-Left: Global Header Search Trigger */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            type="button"
            id="global-search-input"
            onClick={handleOpenSearchPalette}
            className="w-full relative flex items-center h-[38px] pl-9 pr-14 text-[13px] bg-white border border-[#E5E7EB] hover:border-[#D4D4D8] rounded-[8px] transition-all text-left cursor-pointer group shadow-none"
            aria-label="Search tasks, people, departments"
          >
            <Search className="w-4 h-4 text-[#8B8B95] group-hover:text-[#52525B] absolute left-3 pointer-events-none transition-colors" />
            <span className="text-[#8B8B95] truncate select-none">
              Search tasks, people, departments...
            </span>
            <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-medium text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7] rounded-[4px] pointer-events-none select-none">
              Ctrl K
            </kbd>
          </button>
        </div>

        {/* Right: Synced Status, Bell, + New Task, User Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Synced Status Indicator */}
          <button
            type="button"
            onClick={() => refreshAllData()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[7px] text-[12.5px] text-[#059669] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
            title={
              isRefreshing
                ? 'Syncing data from database...'
                : `Last synced at ${
                    lastRefreshedAt
                      ? new Date(lastRefreshedAt).toLocaleTimeString()
                      : 'now'
                  } • Click to refresh`
            }
          >
            {isRefreshing ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin text-[#059669]" />
            ) : (
              <Check className="w-3.5 h-3.5 text-[#059669] stroke-[2.5]" />
            )}
            <span className="font-medium text-[#059669] hidden sm:inline">
              {isRefreshing ? 'Syncing...' : 'Synced'}
            </span>
          </button>

          {/* Global Notification Bell & Popover Container */}
          <div ref={notificationMenuRef} className="relative">
            <NotificationBell
              unreadCount={unreadCount}
              isOpen={showNotificationMenu}
              onClick={() => setShowNotificationMenu((prev) => !prev)}
            />

            <NotificationPopover
              isOpen={showNotificationMenu}
              onClose={() => setShowNotificationMenu(false)}
              notifications={userNotifications}
              unreadCount={unreadCount}
              onMarkAllAsRead={markAllAsRead}
              onNotificationClick={handleRowClick}
            />
          </div>

          {/* + New Task Button */}
          <button
            type="button"
            onClick={() => navigate('/tasks/create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white rounded-[8px] text-[13px] font-medium transition-colors cursor-pointer shadow-none flex-shrink-0"
          >
            <Plus className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline">New Task</span>
          </button>

          {/* User Profile Avatar */}
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="p-0.5 rounded-full hover:ring-2 hover:ring-[#059669] transition-all cursor-pointer flex-shrink-0"
            title="Profile"
            aria-label="Profile"
          >
            <Avatar
              src={currentUser?.avatar_url}
              name={currentUser?.full_name || 'Admin'}
              size="sm"
            />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
