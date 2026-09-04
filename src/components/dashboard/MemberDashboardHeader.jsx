import React, { useMemo } from 'react';

export function MemberDashboardHeader({ userName = 'Team Member' }) {
  const firstName = useMemo(() => {
    if (!userName) return 'Team Member';
    return userName.trim().split(' ')[0] || 'Team Member';
  }, [userName]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const formattedDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 select-none">
      <div>
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#18181B] tracking-tight">
          {greeting}, {firstName}
        </h1>
        <p className="text-[13.5px] text-[#71717A] mt-0.5">
          Here’s your work for today.
        </p>
      </div>

      <div className="text-[13.5px] font-medium text-[#71717A] self-start sm:self-auto">
        {formattedDate}
      </div>
    </div>
  );
}
