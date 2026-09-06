import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileDrawer } from './MobileDrawer';
import { ChangePasswordAlert } from '../auth/ChangePasswordAlert';
import { MobileNotificationEnableBanner } from '../notifications/MobileNotificationEnableBanner';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { CommandPalette } from '../command/CommandPalette';
import { TaskDetailDrawer } from '../tasks/detail/TaskDetailDrawer';
import { EditTaskDrawer } from '../tasks/edit/EditTaskDrawer';
import { CreateTaskDrawer } from '../tasks/create/CreateTaskDrawer';
import { CreatePersonalTaskModal } from '../kanban/CreatePersonalTaskModal';
import { MobileFloatingActionButton } from './MobileFloatingActionButton';
import { useAppData } from '../../contexts/AppDataContext';
import { registerUpcommServiceWorker } from '../../lib/pwa/serviceWorkerRegistration';
import { initPushNavigationListener } from '../../lib/pwa/pushNavigation';

export function AppLayout() {
  const { createPersonalTask } = useAppData();
  const location = useLocation();
  const navigate = useNavigate();
  const isMessagesPage = location.pathname === '/messages';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Global Command Palette & Overlay Drawers State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [globalDetailTaskId, setGlobalDetailTaskId] = useState(null);
  const [globalEditTaskId, setGlobalEditTaskId] = useState(null);
  const [globalCreateTaskOpen, setGlobalCreateTaskOpen] = useState(false);
  const [globalCreatePersonalTaskOpen, setGlobalCreatePersonalTaskOpen] = useState(false);

  // Global Ctrl + K / Cmd + K Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Do not trigger if inside IME composition
      if (e.isComposing) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Service Worker & Push Deep-Linking Navigation
  useEffect(() => {
    registerUpcommServiceWorker();
    const cleanupNav = initPushNavigationListener(navigate);
    return () => {
      if (cleanupNav) cleanupNav();
    };
  }, [navigate]);

  return (
    <div className="h-screen w-full max-w-full overflow-hidden bg-[#F7F8FA] dark:bg-[#111315] flex font-sans">
      {/* Desktop Left Sidebar */}
      <Sidebar
        className="hidden lg:flex"
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Right Pane (Header + Content) */}
      <div
        className={`flex-1 flex flex-col min-w-0 h-screen bg-[#F7F8FA] dark:bg-[#111315] ${
          isMessagesPage ? 'overflow-hidden' : 'overflow-y-auto'
        }`}
      >
        {/* Sticky Top Header */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenTaskDetail={(taskId) => {
            if (typeof window !== 'undefined' && window.innerWidth < 768) {
              navigate(`/tasks/${taskId}`);
            } else {
              setGlobalDetailTaskId(taskId);
            }
          }}
        />

        {/* Page Content Body */}
        <main
          className={`flex-1 w-full max-w-full animate-fade-in flex flex-col ${
            isMessagesPage
              ? 'p-0 sm:px-6 sm:pt-3 sm:pb-3 overflow-hidden min-h-0'
              : 'px-4 sm:px-7 py-5 sm:py-6 overflow-x-hidden'
          }`}
        >
          <div className={`flex-1 ${isMessagesPage ? 'flex flex-col min-h-0' : 'space-y-6'}`}>
            <MobileNotificationEnableBanner />
            {!isMessagesPage && <ChangePasswordAlert />}
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenTask={(taskId) => {
          if (typeof window !== 'undefined' && window.innerWidth < 768) {
            navigate(`/tasks/${taskId}`);
          } else {
            setGlobalDetailTaskId(taskId);
          }
        }}
        onOpenCreateTask={() => {
          setGlobalCreateTaskOpen(true);
        }}
        onOpenCreatePersonalTask={() => {
          setGlobalCreatePersonalTaskOpen(true);
        }}
      />

      {/* Global Task Detail Drawer (Preserves underlying workspace context) */}
      {globalDetailTaskId && (
        <TaskDetailDrawer
          taskId={globalDetailTaskId}
          onClose={() => setGlobalDetailTaskId(null)}
          onEditTask={(taskId) => {
            setGlobalDetailTaskId(null);
            setGlobalEditTaskId(taskId);
          }}
        />
      )}

      {/* Global Edit Task Drawer */}
      {globalEditTaskId && (
        <EditTaskDrawer
          taskId={globalEditTaskId}
          isOpen={Boolean(globalEditTaskId)}
          onClose={(savedTask) => {
            setGlobalEditTaskId(null);
            if (savedTask?.id) {
              setGlobalDetailTaskId(savedTask.id);
            }
          }}
        />
      )}

      {/* Global Create Task Drawer */}
      {globalCreateTaskOpen && (
        <CreateTaskDrawer
          isOpen={globalCreateTaskOpen}
          onClose={() => setGlobalCreateTaskOpen(false)}
        />
      )}

      {/* Global Create Personal Task Modal */}
      {globalCreatePersonalTaskOpen && (
        <CreatePersonalTaskModal
          isOpen={globalCreatePersonalTaskOpen}
          onClose={() => setGlobalCreatePersonalTaskOpen(false)}
          onCreate={createPersonalTask}
        />
      )}

      {/* Mobile Floating Action Button (FAB) with 90° Radial Fan-Out Menu */}
      {!isMessagesPage && location.pathname !== '/tasks/create' && (
        <MobileFloatingActionButton
          onOpenCreatePersonalTask={() => setGlobalCreatePersonalTaskOpen(true)}
        />
      )}
    </div>
  );
}
