import React, { useMemo } from 'react';
import { Activity, ArrowRight, MessageSquare, Clock } from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useNavigate } from 'react-router-dom';

export function DashboardLiveUpdatesCard({
  tasks = [],
  users = [],
  currentUser = null,
  role = 'team_member',
}) {
  const navigate = useNavigate();

  // User map
  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  // Extract task updates scoped by role
  const recentUpdates = useMemo(() => {
    const list = [];
    const isAdmin = role === 'admin' || role === 'it_support_admin';

    (tasks || []).forEach((t) => {
      if (!isAdmin) {
        const isAssigned =
          t.assigned_to === currentUser?.id ||
          (Array.isArray(t.assigned_to_ids) && t.assigned_to_ids.includes(currentUser?.id)) ||
          t.assisted_by === currentUser?.id ||
          (Array.isArray(t.assisted_by_ids) && t.assisted_by_ids.includes(currentUser?.id));
        const isCreator = t.created_by === currentUser?.id;
        const isHODDept = role === 'hod' && t.department_id === currentUser?.department_id;

        if (!isAssigned && !isCreator && !isHODDept) {
          return;
        }
      }

      (t.task_updates || []).forEach((u) => {
        list.push({
          ...u,
          task_id: t.id,
          task_title: t.title,
          task_number: t.task_number,
        });
      });
    });

    return list
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 4);
  }, [tasks, role, currentUser]);

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 2) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div
      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between font-['Inter'] h-full min-h-[380px]"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 flex-shrink-0 shadow-2xs">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Live Status Updates
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {role === 'admin' || role === 'it_support_admin'
                  ? 'All company task tracking updates'
                  : 'Updates from admins & task partners'}
              </p>
            </div>
          </div>
        </div>

        {/* Updates List */}
        <div className="mt-3.5 space-y-2.5">
          {recentUpdates.length === 0 ? (
            <div className="py-12 text-center px-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">No Recent Updates</p>
              <p className="text-[11px] text-slate-400 font-medium">
                Live progress updates on your tasks will appear here.
              </p>
            </div>
          ) : (
            recentUpdates.map((upd) => {
              const member = userMap[upd.user_id];
              const authorName = upd.user_name || member?.full_name || 'Team Member';
              const updateKey = upd.id || `${upd.task_id}_${upd.created_at}`;
              const messageText = upd.text || upd.update_text;

              return (
                <div
                  key={updateKey}
                  onClick={() => navigate(`/tasks/${upd.task_id}`)}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-blue-200 hover:shadow-xs transition-all cursor-pointer group space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        src={member?.avatar_url || upd.user_avatar}
                        name={authorName}
                        size="xs"
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0 flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {authorName}
                        </span>
                        {upd.user_role && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase bg-slate-200/60 text-slate-600">
                            {upd.user_role === 'hod' ? 'HOD' : upd.user_role === 'admin' ? 'Admin' : 'Member'}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 flex-shrink-0">
                      <Clock className="w-3 h-3 text-slate-300" />
                      {formatTimeAgo(upd.created_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className="font-medium text-slate-700 group-hover:text-blue-600 truncate block text-[11px] transition-colors"
                      title={upd.task_title}
                    >
                      <span className="font-mono font-black text-slate-400 mr-1.5 text-[10px]">
                        {upd.task_number}
                      </span>
                      {upd.task_title}
                    </span>
                  </div>

                  {messageText && (
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-1 bg-white/80 px-2.5 py-1 rounded-xl border border-slate-200/60">
                      {messageText}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer link to Task Chat Sub-Page */}
      <button
        type="button"
        onClick={() => navigate('/activity?tab=chats')}
        className="mt-3 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center justify-between pt-2.5 border-t border-slate-100 cursor-pointer transition-colors"
      >
        <span>View All Chats</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
