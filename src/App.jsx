import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AppDataProvider } from './contexts/AppDataContext';
import { NetworkStatusProvider, useNetworkStatus } from './contexts/NetworkStatusContext';
import { FocusTimerProvider } from './contexts/FocusTimerContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

import { Login } from './pages/auth/Login';
import { DashboardHub } from './pages/dashboard/DashboardHub';
import { TaskListPage } from './pages/tasks/TaskListPage';
import { CreateTaskPage } from './pages/tasks/CreateTaskPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { EditTaskPage } from './pages/tasks/EditTaskPage';
import { DepartmentListPage } from './pages/departments/DepartmentListPage';
import { DepartmentDetailPage } from './pages/departments/DepartmentDetailPage';
import { TeamDirectoryPage } from './pages/users/TeamDirectoryPage';
import { TeamPage } from './pages/team/TeamPage';
import { UserPermissionsPage } from './pages/team/UserPermissionsPage';
import { DeleteRequestsPage } from './pages/delete-requests/DeleteRequestsPage';
import { ActivityLogPage } from './pages/activity/ActivityLogPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { PersonalTasksPage } from './pages/tasks/PersonalTasksPage';
import { InboxPage } from './pages/inbox/InboxPage';
import { MonthlyTargetsPage } from './pages/performance/MonthlyTargetsPage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { AIAssistantPage } from './pages/ai/AIAssistantPage';
import { NotFoundPage } from './pages/errors/NotFoundPage';
import { OfflinePage } from './pages/errors/OfflinePage';

function AppContent() {
  const { isOnline } = useNetworkStatus();

  if (!isOnline) {
    return <OfflinePage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />

        {/* Authenticated Layout Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardHub />} />
          {/* Tasks Sub-pages (Shared TaskListPage Component) */}
          <Route path="tasks" element={<TaskListPage filterType="all" />} />
          <Route path="tasks/all" element={<Navigate to="/tasks" replace />} />
          <Route path="tasks/pending-in-progress" element={<TaskListPage filterType="pending_in_progress" />} />
          <Route path="tasks/assigned-by-admin" element={<TaskListPage filterType="assigned_by_admin" />} />
          <Route path="tasks/assigned-to-admin" element={<TaskListPage filterType="assigned_to_admin" />} />
          <Route path="tasks/assigned-by-others" element={<TaskListPage filterType="assigned_by_others" />} />
          <Route path="tasks/overdue" element={<TaskListPage filterType="overdue" />} />
          <Route path="tasks/completed" element={<TaskListPage filterType="completed" />} />

          {/* Specific Task Actions */}
          <Route path="tasks/create" element={<CreateTaskPage />} />
          <Route path="tasks/:taskId" element={<TaskDetailPage />} />
          <Route path="tasks/edit/:taskId" element={<EditTaskPage />} />
          <Route path="personal-tasks" element={<PersonalTasksPage />} />

          {/* Admin / IT Support Only Routes */}
          <Route
            path="departments"
            element={
              <ProtectedRoute allowedRoles={['admin', 'it_support_admin']}>
                <DepartmentListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="departments/:departmentId"
            element={
              <ProtectedRoute allowedRoles={['admin', 'it_support_admin']}>
                <DepartmentDetailPage />
              </ProtectedRoute>
            }
          />
          {/* Team Workspace Sub-routes */}
          <Route path="team" element={<Navigate to="/team/users" replace />} />
          <Route
            path="team/users"
            element={
              <ProtectedRoute requiredPermission="users.view">
                <TeamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="team/permissions"
            element={
              <ProtectedRoute requiredPermission="permissions.manage">
                <UserPermissionsPage />
              </ProtectedRoute>
            }
          />
          <Route path="directory" element={<Navigate to="/team/users" replace />} />
          <Route path="users" element={<Navigate to="/team/users" replace />} />
          {/* Performance & Monthly Targets & KPIs */}
          <Route path="monthly-targets" element={<MonthlyTargetsPage />} />
          <Route path="performance/monthly-targets" element={<MonthlyTargetsPage />} />
          <Route path="performance" element={<Navigate to="/monthly-targets" replace />} />

          {/* Private Messaging */}
          <Route path="messages" element={<MessagesPage />} />

          {/* Management Requests & Legacy Request Redirects */}
          <Route path="inbox" element={<InboxPage />} />
          <Route path="requests" element={<InboxPage />} />
          <Route
            path="delete-requests"
            element={
              <ProtectedRoute allowedRoles={['admin', 'it_support_admin']}>
                <Navigate to="/inbox?type=delete" replace />
              </ProtectedRoute>
            }
          />
          <Route path="completion-requests" element={<Navigate to="/inbox?type=completion" replace />} />
          <Route path="activity" element={<ActivityLogPage />} />
          <Route
            path="reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'it_support_admin', 'hod']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          {/* Admin AI Assistant Route */}
          <Route
            path="ai-assistant"
            element={
              <ProtectedRoute allowedRoles={['admin', 'it_support_admin']}>
                <AIAssistantPage />
              </ProtectedRoute>
            }
          />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Inside Layout Catch-all Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Global Fallback Catch-all Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <NetworkStatusProvider>
          <FocusTimerProvider>
            <AppContent />
          </FocusTimerProvider>
        </NetworkStatusProvider>
      </AppDataProvider>
    </AuthProvider>
  );
}
