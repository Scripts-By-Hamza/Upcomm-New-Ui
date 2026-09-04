import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasPermission } from '../utils/rbac/permissionManager';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function ProtectedRoute({ children, allowedRoles = [], requiredPermission = null }) {
  const { currentUser, authLoading } = useAuth();
  const navigate = useNavigate();

  if (authLoading && !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4F6FA] dark:bg-[#121214] font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#059669] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Loading UPCOMM Portal...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!currentUser.is_active) {
    return (
      <div className="p-8 text-center bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-900 m-8 max-w-lg mx-auto">
        <h3 className="text-lg font-bold">Account Deactivated</h3>
        <p className="text-xs mt-1">Your portal access has been disabled by Admin.</p>
      </div>
    );
  }

  const role = (currentUser.role || 'team_member').toLowerCase();
  const isAdmin = role === 'admin' || role === 'it_support_admin';

  // Role check
  const passesRoleCheck = allowedRoles.length === 0 || allowedRoles.includes(role) || isAdmin;

  // Permission check
  const passesPermissionCheck = !requiredPermission || hasPermission(currentUser, requiredPermission) || isAdmin;

  if (!passesRoleCheck || !passesPermissionCheck) {
    return (
      <div className="p-10 text-center max-w-md mx-auto my-16 bg-white dark:bg-[#18181B] rounded-[12px] border border-[#E5E7EB] dark:border-[#27272A] shadow-lg space-y-4 font-['Inter'] select-none">
        <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-[17px] font-bold text-[#18181B] dark:text-[#F4F4F5]">
            Access Denied
          </h3>
          <p className="text-[12.5px] text-[#71717A] dark:text-[#A1A1AA] leading-relaxed">
            You don't have permission to access this area of the UPCOMM portal.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#059669] hover:bg-[#047857] text-white text-[13px] font-semibold transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
}

export default ProtectedRoute;
