import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { HODDashboard } from './HODDashboard';
import { TeamDashboard } from './TeamDashboard';
import { ITSupportDashboard } from './ITSupportDashboard';

export function DashboardHub() {
  const { currentUser } = useAuth();
  const role = currentUser?.role || 'team_member';

  if (role === 'admin') {
    return <AdminDashboard />;
  }
  if (role === 'it_support_admin') {
    return <ITSupportDashboard />;
  }
  if (role === 'hod') {
    return <HODDashboard />;
  }
  return <TeamDashboard />;
}
