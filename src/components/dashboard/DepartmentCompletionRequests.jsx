import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { ClipboardCheck, ArrowRight } from 'lucide-react';

export function DepartmentCompletionRequests({ requests = [], users = [], tasks = [] }) {
  const navigate = useNavigate();

  const userMap = React.useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  const taskMap = React.useMemo(() => {
    const map = {};
    (tasks || []).forEach((t) => {
      if (t && t.id) map[t.id] = t;
    });
    return map;
  }, [tasks]);

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

  const displayedRequests = requests.slice(0, 3);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
            Completion Requests
          </h2>
          {requests.length > 3 && (
            <button
              type="button"
              onClick={() => navigate('/inbox?type=completion')}
              className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
            >
              <span>View all ({requests.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {displayedRequests.length === 0 ? (
          <div className="py-6 text-center text-[#8B8B95] space-y-1">
            <ClipboardCheck className="w-6 h-6 text-[#059669] mx-auto mb-1 opacity-75" />
            <p className="text-[13px] font-medium text-[#18181B]">No completion requests</p>
            <p className="text-[11.5px] text-[#71717A]">
              No completion requests waiting for your review.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F4F4F5]">
            {displayedRequests.map((req) => {
              const requester = userMap[req.requested_by];
              const taskObj = taskMap[req.task_id];
              const requesterName = requester?.full_name || 'Team Member';
              const taskTitle = taskObj?.title || req.task_title || 'Task Completion';

              return (
                <div
                  key={req.id}
                  className="py-3 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Avatar
                      src={requester?.avatar_url}
                      name={requesterName}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <h4
                        onClick={() => navigate(taskObj ? `/tasks/${taskObj.id}` : '/inbox?type=completion')}
                        className="text-[13px] font-semibold text-[#18181B] hover:text-[#059669] transition-colors truncate cursor-pointer"
                      >
                        {taskTitle}
                      </h4>
                      <p className="text-[11.5px] text-[#71717A] truncate mt-0.5">
                        {requesterName} • {formatTimeAgo(req.created_at)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/inbox?type=completion')}
                    className="px-3 py-1.5 bg-white hover:bg-[#F5F6F8] border border-[#E5E7EB] text-[#18181B] text-[12.5px] font-medium rounded-[7px] transition-colors cursor-pointer flex-shrink-0 shadow-none"
                  >
                    Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
