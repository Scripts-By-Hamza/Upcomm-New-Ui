import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../common/Avatar';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { getTaskAssigneeIds, getTaskAssistantIds } from '../../utils/taskDepartmentUtils';

export function MemberCompletedThisWeek({ tasks = [], users = [] }) {
  const navigate = useNavigate();

  const userMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u && u.id) map[u.id] = u;
    });
    return map;
  }, [users]);

  const formatCompletedDate = (dateStr) => {
    if (!dateStr) return 'Completed';
    const d = new Date(dateStr);
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
    return `Completed ${dayOfWeek}`;
  };

  const displayedTasks = (tasks || []).slice(0, 3);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] sm:text-[16px] font-semibold text-[#18181B]">
          Completed This Week
        </h2>
        {tasks.length > 3 && (
          <button
            type="button"
            onClick={() => navigate('/tasks/completed')}
            className="text-[12px] font-medium text-[#059669] hover:text-[#047857] flex items-center gap-1 cursor-pointer"
          >
            <span>View all ({tasks.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {displayedTasks.length === 0 ? (
        <div className="py-7 text-center text-[#8B8B95] space-y-1">
          <CheckCircle2 className="w-6 h-6 text-[#059669] mx-auto mb-1 opacity-75" />
          <p className="text-[13px] font-medium text-[#18181B]">No tasks completed this week</p>
          <p className="text-[11.5px] text-[#71717A]">
            Tasks you complete during this week will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedTasks.map((task) => {
            const assigneeIds = getTaskAssigneeIds(task);
            const assistantIds = getTaskAssistantIds(task);
            const allParticipantIds = Array.from(new Set([...assigneeIds, ...assistantIds]));
            const participants = allParticipantIds.map((id) => userMap[id]).filter(Boolean);

            const completedTimestamp = task.completed_at || task.updated_at;

            return (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="p-3.5 rounded-[8px] border border-[#E5E7EB] hover:border-[#D4D4D8] bg-white hover:bg-[#F7F8FA] transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                {/* Left: Checkmark icon + Task Info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10.5px] text-[#71717A] flex-shrink-0">
                        {task.task_number || 'TM-0000'}
                      </span>
                      <span className="text-[13px] font-semibold text-[#18181B] group-hover:text-[#059669] transition-colors truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="text-[11.5px] text-[#71717A] mt-0.5">
                      {formatCompletedDate(completedTimestamp)}
                    </div>
                  </div>
                </div>

                {/* Right: Overlapping Participant Avatars */}
                <div className="flex items-center -space-x-1.5 flex-shrink-0">
                  {participants.slice(0, 3).map((participant) => (
                    <Avatar
                      key={participant.id}
                      src={participant.avatar_url}
                      name={participant.full_name}
                      size="xs"
                      className="border-2 border-white"
                    />
                  ))}
                  {participants.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-[#F4F4F5] border-2 border-white flex items-center justify-center text-[9px] font-bold text-[#71717A]">
                      +{participants.length - 3}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
