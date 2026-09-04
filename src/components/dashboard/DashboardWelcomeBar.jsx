import React from 'react';
import { Plus, Calendar, ShieldCheck, Building2, UserCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';

export function DashboardWelcomeBar({
  currentUser,
  userDept,
  role = 'team_member',
}) {
  const navigate = useNavigate();

  const fullName = currentUser?.full_name || 'Member';

  // Role display label
  const roleLabel =
    role === 'admin' || role === 'it_support_admin'
      ? 'Administrator Portal'
      : role === 'hod'
      ? `${userDept?.name || 'Department'} HOD Portal`
      : `${userDept?.name || 'Department'} Team Member Portal`;

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-['Inter']"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Left: Avatar + "Welcome Back, {Name}" + Role Tag */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
        <Avatar
          src={currentUser?.avatar_url}
          name={fullName}
          size="lg"
          showRoleBadge
          role={role}
          className="ring-2 ring-emerald-500/20 shadow-xs flex-shrink-0 mt-0.5 sm:mt-0"
        />

        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200/80 max-w-full">
              {role === 'hod' ? (
                <Building2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              ) : role === 'admin' ? (
                <ShieldCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              ) : (
                <UserCheck className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              )}
              <span className="truncate">{roleLabel}</span>
            </span>

            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 flex-shrink-0">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{todayFormatted}</span>
            </span>
          </div>

          <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-snug break-words sm:truncate">
            Welcome Back, {fullName}
          </h1>
          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 sm:line-clamp-1">
            Overview of department assignments, active deliverables, and performance metrics.
          </p>
        </div>
      </div>

      {/* Right: Create Task CTA */}
      <div className="w-full sm:w-auto flex-shrink-0 pt-1 sm:pt-0">
        <button
          type="button"
          onClick={() => navigate('/tasks/create')}
          className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white stroke-[2.5]" />
          <span>Create Task</span>
        </button>
      </div>
    </div>
  );
}
