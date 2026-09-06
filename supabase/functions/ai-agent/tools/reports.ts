/**
 * Tool: get_department_report & get_employee_workload
 * Deterministic calculation of metrics matching reportAnalyticsUtils.js & employeeWorkloadUtils.js
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { parseTaskMetadata } from './tasks.ts';

export async function getDepartmentReport(
  supabaseAdmin: SupabaseClient,
  args: { department_id?: string; department_name?: string; period?: '7d' | '30d' | '90d' | 'this_month' | 'last_month' | 'all' }
) {
  const period = args.period || 'this_month';
  const now = new Date();
  let startDate: Date;
  let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === '7d') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === '30d') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === '90d') {
    startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  } else if (period === 'last_month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (period === 'this_month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    startDate = new Date(2020, 0, 1);
  }

  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();
  const todayStr = now.toISOString().split('T')[0];

  // Resolve department if query provided
  let deptId = args.department_id;
  let deptName = args.department_name || 'All Departments';

  if (!deptId && args.department_name) {
    const { data: matchedDepts } = await supabaseAdmin
      .from('departments')
      .select('id, name')
      .ilike('name', `%${args.department_name.trim()}%`)
      .limit(1);

    if (matchedDepts && matchedDepts.length > 0) {
      deptId = matchedDepts[0].id;
      deptName = matchedDepts[0].name;
    }
  } else if (deptId && deptId !== 'all') {
    const { data: dRow } = await supabaseAdmin
      .from('departments')
      .select('name')
      .eq('id', deptId)
      .maybeSingle();
    if (dRow) deptName = dRow.name;
  }

  // Query company tasks (exclude soft-deleted and personal tasks)
  let query = supabaseAdmin
    .from('tasks')
    .select('*')
    .eq('is_deleted', false)
    .neq('task_origin', 'personal');

  if (deptId && deptId !== 'all') {
    query = query.eq('department_id', deptId);
  }

  const { data: rawTasks, error } = await query;
  if (error) throw new Error(`Report query error: ${error.message}`);

  const [{ data: users }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name, designation, department_id, is_active'),
  ]);

  const userList = users || [];
  const userMap: Record<string, string> = {};
  userList.forEach((u: any) => { userMap[u.id] = u.full_name; });

  const tasks = rawTasks || [];

  // 1. Period Metrics
  const createdInPeriod = tasks.filter((t: any) => {
    if (!t.created_at) return false;
    const d = new Date(t.created_at);
    return d >= startDate && d <= endDate;
  });

  const completedInPeriod = tasks.filter((t: any) => {
    if (t.status !== 'completed') return false;
    const compDate = t.completed_at || t.updated_at || t.created_at;
    if (!compDate) return false;
    const d = new Date(compDate);
    return d >= startDate && d <= endDate;
  });

  const activeTasks = tasks.filter((t: any) => t.status !== 'completed');
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
  const inProgressTasks = tasks.filter((t: any) => t.status === 'in_progress' || t.status === 'review');

  const overdueTasks = activeTasks.filter((t: any) => {
    if (!t.due_date) return false;
    return t.due_date < todayStr;
  });

  let completionRate = 0;
  if (createdInPeriod.length > 0) {
    completionRate = Math.min(100, Math.round((completedInPeriod.length / createdInPeriod.length) * 100));
  } else if (tasks.length > 0) {
    const totalComp = tasks.filter((t: any) => t.status === 'completed').length;
    completionRate = Math.round((totalComp / tasks.length) * 100);
  }

  const overdueRate = activeTasks.length > 0 ? Math.round((overdueTasks.length / activeTasks.length) * 100) : 0;

  // 2. Workload per Department Employee
  const deptEmployees = (deptId && deptId !== 'all')
    ? userList.filter((u: any) => u.department_id === deptId && u.is_active !== false)
    : userList.filter((u: any) => u.is_active !== false).slice(0, 10);

  const teamWorkload = deptEmployees.map((emp: any) => {
    const empUid = String(emp.id);
    const empTasks = tasks.filter((t: any) => {
      const { assigneeIds, assistantIds } = parseTaskMetadata(t);
      return assigneeIds.includes(empUid) || assistantIds.includes(empUid);
    });

    const empActive = empTasks.filter((t: any) => t.status !== 'completed');
    const empOverdue = empActive.filter((t: any) => t.due_date && t.due_date < todayStr);
    const empCompleted = empTasks.filter((t: any) => t.status === 'completed');
    const empCompRate = empTasks.length > 0 ? Math.round((empCompleted.length / empTasks.length) * 100) : 0;

    return {
      employee_id: emp.id,
      employee_name: emp.full_name,
      designation: emp.designation,
      active_tasks: empActive.length,
      overdue_tasks: empOverdue.length,
      completed_tasks: empCompleted.length,
      total_tasks: empTasks.length,
      completion_rate: empCompRate,
    };
  }).sort((a: any, b: any) => b.active_tasks - a.active_tasks);

  // 3. Overdue Task Details
  const overdueRefs = overdueTasks.map((t: any) => {
    const { assigneeIds } = parseTaskMetadata(t);
    return {
      task_number: t.task_number || `TM-${t.id}`,
      title: t.title,
      priority: t.priority,
      due_date: t.due_date,
      assignees: assigneeIds.map((id) => userMap[id] || id).join(', '),
    };
  });

  return {
    department: deptName,
    department_id: deptId || 'all',
    period: {
      key: period,
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    },
    metrics: {
      total_scoped_tasks: tasks.length,
      tasks_created_in_period: createdInPeriod.length,
      tasks_completed_in_period: completedInPeriod.length,
      active_tasks: activeTasks.length,
      pending_tasks: pendingTasks.length,
      in_progress_tasks: inProgressTasks.length,
      overdue_tasks: overdueTasks.length,
      completion_rate_percentage: completionRate,
      overdue_rate_percentage: overdueRate,
    },
    team_workload: teamWorkload,
    overdue_task_refs: overdueRefs,
  };
}

export async function getEmployeeWorkload(
  supabaseAdmin: SupabaseClient,
  args: { employee_id?: string; employee_name?: string }
) {
  let empId = args.employee_id;
  let empName = args.employee_name || '';

  if (!empId && args.employee_name) {
    const { data: matched } = await supabaseAdmin
      .from('users')
      .select('id, full_name, designation, department_id')
      .ilike('full_name', `%${args.employee_name.trim()}%`)
      .limit(1);

    if (matched && matched.length > 0) {
      empId = matched[0].id;
      empName = matched[0].full_name;
    }
  }

  if (!empId) {
    throw new Error('Employee not found. Please provide a valid employee name or ID.');
  }

  const [{ data: userRow }, { data: rawTasks }, { data: depts }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name, designation, department_id, email').eq('id', empId).maybeSingle(),
    supabaseAdmin.from('tasks').select('*').eq('is_deleted', false).neq('task_origin', 'personal'),
    supabaseAdmin.from('departments').select('id, name'),
  ]);

  if (!userRow) throw new Error(`Employee with ID '${empId}' not found.`);

  const deptMap: Record<string, string> = {};
  (depts || []).forEach((d: any) => { deptMap[d.id] = d.name; });

  const targetUid = String(empId);
  const todayStr = new Date().toISOString().split('T')[0];

  const assignedTasks = (rawTasks || []).filter((t: any) => {
    const { assigneeIds, assistantIds } = parseTaskMetadata(t);
    return assigneeIds.includes(targetUid) || assistantIds.includes(targetUid);
  });

  const active = assignedTasks.filter((t: any) => t.status !== 'completed');
  const overdue = active.filter((t: any) => t.due_date && t.due_date < todayStr);
  const completed = assignedTasks.filter((t: any) => t.status === 'completed');
  const inProgress = active.filter((t: any) => t.status === 'in_progress');
  const pending = active.filter((t: any) => t.status === 'pending');

  const completionRate = assignedTasks.length > 0 ? Math.round((completed.length / assignedTasks.length) * 100) : 0;

  return {
    employee: {
      id: userRow.id,
      full_name: userRow.full_name,
      email: userRow.email,
      designation: userRow.designation,
      department_name: deptMap[userRow.department_id] || 'General',
    },
    workload: {
      total_tasks: assignedTasks.length,
      active_tasks: active.length,
      pending_tasks: pending.length,
      in_progress_tasks: inProgress.length,
      overdue_tasks: overdue.length,
      completed_tasks: completed.length,
      completion_rate_percentage: completionRate,
    },
    active_task_list: active.slice(0, 10).map((t: any) => ({
      task_number: t.task_number || `TM-${t.id}`,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date || 'No due date',
      is_overdue: Boolean(t.due_date && t.due_date < todayStr),
    })),
  };
}
