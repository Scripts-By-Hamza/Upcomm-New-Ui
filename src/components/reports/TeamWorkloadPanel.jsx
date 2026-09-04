import React from 'react';
import { Avatar } from '../common/Avatar';

export function TeamWorkloadPanel({ workloadList = [] }) {
  return (
    <div className="bg-white border border-[#E5E7EB] rounded-[10px] p-5 shadow-none select-none flex flex-col justify-between">
      <div className="mb-3">
        <h3 className="text-[14px] font-semibold text-[#18181B]">
          Team Workload
        </h3>
      </div>

      {workloadList.length === 0 ? (
        <div className="py-8 text-center text-[#8B8B95] text-[12.5px]">
          No active employee workload records in this scope.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead>
              <tr className="border-b border-[#F4F4F5] text-[11px] font-semibold text-[#8B8B95] uppercase tracking-wider h-7">
                <th className="w-6 font-semibold">#</th>
                <th className="font-semibold">Employee</th>
                <th className="text-right font-semibold pr-4">Active Tasks</th>
                <th className="w-28 sm:w-36 font-semibold">Workload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F4F5]">
              {workloadList.map((item, idx) => {
                const user = item.user;
                return (
                  <tr key={user.id} className="h-10 hover:bg-[#F7F8FA] transition-colors">
                    <td className="text-[#8B8B95] font-mono text-[11.5px]">{idx + 1}</td>
                    <td>
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Avatar
                          src={user.avatar_url}
                          name={user.full_name}
                          size="xs"
                          className="w-6 h-6 flex-shrink-0"
                        />
                        <span className="font-medium text-[#18181B] truncate max-w-[130px]">
                          {user.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-mono font-medium text-[#18181B] pr-4">
                      {item.activeTasks}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#F4F4F5] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#059669] transition-all duration-500"
                            style={{ width: `${Math.max(5, item.relativePercentage)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-medium text-[#71717A] w-8 text-right font-mono">
                          {item.relativePercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
