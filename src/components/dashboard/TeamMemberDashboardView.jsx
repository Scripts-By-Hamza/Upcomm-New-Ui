import React, { useMemo } from 'react';
import { useAppData } from '../../contexts/AppDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { isTaskOverdue } from '../../utils/dateUtils';
import { getTaskAssigneeIds, getTaskAssistantIds } from '../../utils/taskDepartmentUtils';
import { MemberDashboardHeader } from './MemberDashboardHeader';
import { MemberDashboardKpis } from './MemberDashboardKpis';
import { MemberTodayTasks } from './MemberTodayTasks';
import { MemberUpcomingTasks } from './MemberUpcomingTasks';
import { MemberRecentlyAssigned } from './MemberRecentlyAssigned';
import { MemberRecentMessages } from './MemberRecentMessages';
import { MemberCompletedThisWeek } from './MemberCompletedThisWeek';

export function TeamMemberDashboardView() {
  const { tasks = [] } = useAppData();
  const { currentUser, users = [] } = useAuth();
  const currentUserId = currentUser?.id;

  // Local calendar today string (YYYY-MM-DD)
  const todayStr = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Current local week boundaries (Monday to Sunday)
  const { weekStart, weekEnd } = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { weekStart: start, weekEnd: end };
  }, []);

  // Helper to check if current user is directly assigned or an assistant on the task
  const isDirectParticipant = useMemo(() => {
    return (task) => {
      if (!currentUserId || !task) return false;
      const assignees = getTaskAssigneeIds(task);
      const assistants = getTaskAssistantIds(task);
      return assignees.includes(currentUserId) || assistants.includes(currentUserId);
    };
  }, [currentUserId]);

  // Tasks the user has direct personal work responsibility for (assigned or assistant)
  const myWorkTasks = useMemo(() => {
    return (tasks || []).filter((t) => !t.is_deleted && isDirectParticipant(t));
  }, [tasks, isDirectParticipant]);

  // Tasks accessible to the user (including self-created tasks)
  const memberAccessibleTasks = useMemo(() => {
    return (tasks || []).filter(
      (t) => !t.is_deleted && (isDirectParticipant(t) || t.created_by === currentUserId)
    );
  }, [tasks, isDirectParticipant, currentUserId]);

  // 1. Due Today Tasks
  const dueTodayTasks = useMemo(() => {
    return myWorkTasks.filter((t) => {
      if (t.status === 'completed' || !t.due_date) return false;
      return t.due_date.split('T')[0] === todayStr;
    });
  }, [myWorkTasks, todayStr]);

  // 2. Overdue Tasks
  const overdueTasks = useMemo(() => {
    return myWorkTasks.filter((t) => isTaskOverdue(t.due_date, t.status));
  }, [myWorkTasks]);

  // 3. Upcoming Tasks (future active tasks sorted by due_date ascending)
  const upcomingTasks = useMemo(() => {
    const priorityWeights = { urgent: 4, high: 3, medium: 2, low: 1 };

    return myWorkTasks
      .filter((t) => {
        if (t.status === 'completed' || !t.due_date) return false;
        return t.due_date.split('T')[0] > todayStr;
      })
      .sort((a, b) => {
        const dateA = new Date(a.due_date);
        const dateB = new Date(b.due_date);
        if (dateA - dateB !== 0) return dateA - dateB;

        const pA = priorityWeights[a.priority?.toLowerCase()] || 0;
        const pB = priorityWeights[b.priority?.toLowerCase()] || 0;
        return pB - pA;
      });
  }, [myWorkTasks, todayStr]);

  // 4. Completed This Week Tasks
  const completedThisWeekTasks = useMemo(() => {
    return myWorkTasks.filter((t) => {
      if (t.status !== 'completed') return false;
      const completedDate = new Date(t.completed_at || t.updated_at || 0);
      return completedDate >= weekStart && completedDate <= weekEnd;
    });
  }, [myWorkTasks, weekStart, weekEnd]);

  // 5. Recently Assigned Tasks (newest active work tasks)
  const recentlyAssignedTasks = useMemo(() => {
    return myWorkTasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [myWorkTasks]);

  return (
    <div className="space-y-6 max-w-full">
      {/* 1. Header with dynamic greeting and date */}
      <MemberDashboardHeader userName={currentUser?.full_name} />

      {/* 2. Four Personal KPI Cards */}
      <MemberDashboardKpis
        dueTodayCount={dueTodayTasks.length}
        overdueCount={overdueTasks.length}
        upcomingCount={upcomingTasks.length}
        completedThisWeekCount={completedThisWeekTasks.length}
      />

      {/* 3. Main Two-Column Balanced Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Column: Today's Tasks & Upcoming */}
        <div className="space-y-5">
          <MemberTodayTasks tasks={dueTodayTasks} />
          <MemberUpcomingTasks tasks={upcomingTasks} />
        </div>

        {/* Right Column: Recently Assigned & Recent Messages */}
        <div className="space-y-5">
          <MemberRecentlyAssigned tasks={recentlyAssignedTasks} users={users} />
          <MemberRecentMessages
            accessibleTasks={memberAccessibleTasks}
            users={users}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* 4. Full-Width Bottom Section: Completed This Week */}
      <MemberCompletedThisWeek
        tasks={completedThisWeekTasks}
        users={users}
      />
    </div>
  );
}
