/**
 * Tool: search_tasks, get_task, get_overdue_tasks, get_due_soon_tasks
 */

import { SupabaseClient } from '@supabase/supabase-js';

// Helpers to extract multi-assignees and assistants from description metadata
export function parseTaskMetadata(task: any) {
  let assigneeIds: string[] = [];
  if (Array.isArray(task.assigned_to_ids) && task.assigned_to_ids.length > 0) {
    assigneeIds = task.assigned_to_ids;
  } else if (task.assigned_to) {
    assigneeIds = [task.assigned_to];
  }

  let assistantIds: string[] = [];
  if (Array.isArray(task.assisted_by_ids) && task.assisted_by_ids.length > 0) {
    assistantIds = task.assisted_by_ids;
  } else if (task.assisted_by) {
    assistantIds = [task.assisted_by];
  }

  if (task.description) {
    const matchAssignees = task.description.match(/<!--assignees:(.*?)-->/);
    if (matchAssignees && matchAssignees[1]) {
      try {
        const parsed = JSON.parse(matchAssignees[1]);
        if (Array.isArray(parsed) && parsed.length > 0) assigneeIds = parsed;
      } catch (_) {}
    }

    const matchAssistants = task.description.match(/<!--assisted_by:(.*?)-->/);
    if (matchAssistants && matchAssistants[1]) {
      try {
        const parsed = JSON.parse(matchAssistants[1]);
        if (Array.isArray(parsed) && parsed.length > 0) assistantIds = parsed;
      } catch (_) {}
    }
  }

  return {
    assigneeIds: Array.from(new Set(assigneeIds.map(String))),
    assistantIds: Array.from(new Set(assistantIds.map(String))),
  };
}

export async function searchTasks(
  supabaseAdmin: SupabaseClient,
  args: {
    query?: string;
    department_id?: string;
    assignee_id?: string;
    status?: string;
    priority?: string;
    limit?: number;
  }
) {
  const limit = Math.min(args.limit || 20, 50);

  let query = supabaseAdmin
    .from('tasks')
    .select('id, task_number, title, description, department_id, created_by, assigned_by, assigned_to, assisted_by, priority, status, start_date, due_date, completed_at, is_deleted, created_at')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (args.status && args.status !== 'all') {
    query = query.eq('status', args.status);
  }
  if (args.priority && args.priority !== 'all') {
    query = query.eq('priority', args.priority);
  }
  if (args.department_id && args.department_id !== 'all') {
    query = query.eq('department_id', args.department_id);
  }

  const { data: rawTasks, error } = await query;
  if (error) throw new Error(`Tasks search error: ${error.message}`);

  // Fetch users and departments for name resolution
  const [{ data: users }, { data: depts }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name'),
    supabaseAdmin.from('departments').select('id, name'),
  ]);

  const userMap: Record<string, string> = {};
  (users || []).forEach((u: any) => { userMap[u.id] = u.full_name; });

  const deptMap: Record<string, string> = {};
  (depts || []).forEach((d: any) => { deptMap[d.id] = d.name; });

  let tasks = (rawTasks || []).map((t: any) => {
    const { assigneeIds, assistantIds } = parseTaskMetadata(t);
    return {
      id: String(t.id),
      task_number: t.task_number || `TM-${t.id}`,
      title: t.title,
      status: t.status,
      priority: t.priority,
      department_id: t.department_id,
      department_name: deptMap[t.department_id] || 'General',
      assignees: assigneeIds.map((id) => ({ id, name: userMap[id] || id })),
      assistants: assistantIds.map((id) => ({ id, name: userMap[id] || id })),
      start_date: t.start_date,
      due_date: t.due_date,
      completed_at: t.completed_at,
    };
  });

  if (args.assignee_id && args.assignee_id !== 'all') {
    const targetUid = String(args.assignee_id);
    tasks = tasks.filter((t) =>
      t.assignees.some((a) => a.id === targetUid) ||
      t.assistants.some((a) => a.id === targetUid)
    );
  }

  if (args.query && args.query.trim()) {
    const q = args.query.toLowerCase().trim();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.task_number.toLowerCase().includes(q) ||
        t.department_name.toLowerCase().includes(q) ||
        t.assignees.some((a) => a.name.toLowerCase().includes(q))
    );
  }

  return {
    count: tasks.length,
    tasks,
  };
}

export async function getTask(
  supabaseAdmin: SupabaseClient,
  args: { task_identifier: string }
) {
  const idOrNumber = (args.task_identifier || '').trim();
  if (!idOrNumber) throw new Error('task_identifier is required.');

  const { data: rawTasks } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .or(`id.eq.${idOrNumber},task_number.ilike.${idOrNumber}`)
    .eq('is_deleted', false)
    .limit(1);

  if (!rawTasks || rawTasks.length === 0) {
    return { found: false, message: `Task '${idOrNumber}' not found.` };
  }

  const t = rawTasks[0];
  const { assigneeIds, assistantIds } = parseTaskMetadata(t);

  const [{ data: users }, { data: depts }, { data: updates }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name'),
    supabaseAdmin.from('departments').select('id, name'),
    supabaseAdmin.from('task_updates').select('id, user_name, text, status, created_at').eq('task_id', t.id).order('created_at', { ascending: false }).limit(5),
  ]);

  const userMap: Record<string, string> = {};
  (users || []).forEach((u: any) => { userMap[u.id] = u.full_name; });

  const deptMap: Record<string, string> = {};
  (depts || []).forEach((d: any) => { deptMap[d.id] = d.name; });

  return {
    found: true,
    task: {
      id: String(t.id),
      task_number: t.task_number,
      title: t.title,
      description: (t.description || '').replace(/<!--.*?-->/g, '').trim(),
      status: t.status,
      priority: t.priority,
      department_name: deptMap[t.department_id] || 'General',
      created_by_name: userMap[t.created_by] || 'Admin',
      assignees: assigneeIds.map((id) => ({ id, name: userMap[id] || id })),
      assistants: assistantIds.map((id) => ({ id, name: userMap[id] || id })),
      start_date: t.start_date,
      due_date: t.due_date,
      completed_at: t.completed_at,
      recent_updates: updates || [],
    },
  };
}

export async function getOverdueTasks(
  supabaseAdmin: SupabaseClient,
  args: { department_id?: string; employee_id?: string; limit?: number }
) {
  const today = new Date().toISOString().split('T')[0];
  const limit = Math.min(args.limit || 20, 50);

  let query = supabaseAdmin
    .from('tasks')
    .select('id, task_number, title, description, department_id, assigned_to, assisted_by, priority, status, start_date, due_date')
    .eq('is_deleted', false)
    .neq('status', 'completed')
    .not('due_date', 'is', null)
    .lt('due_date', today)
    .order('due_date', { ascending: true })
    .limit(limit);

  if (args.department_id && args.department_id !== 'all') {
    query = query.eq('department_id', args.department_id);
  }

  const { data: rawTasks, error } = await query;
  if (error) throw new Error(`Overdue tasks error: ${error.message}`);

  const [{ data: users }, { data: depts }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name'),
    supabaseAdmin.from('departments').select('id, name'),
  ]);

  const userMap: Record<string, string> = {};
  (users || []).forEach((u: any) => { userMap[u.id] = u.full_name; });

  const deptMap: Record<string, string> = {};
  (depts || []).forEach((d: any) => { deptMap[d.id] = d.name; });

  let tasks = (rawTasks || []).map((t: any) => {
    const { assigneeIds, assistantIds } = parseTaskMetadata(t);
    return {
      id: String(t.id),
      task_number: t.task_number,
      title: t.title,
      status: t.status,
      priority: t.priority,
      department_name: deptMap[t.department_id] || 'General',
      assignees: assigneeIds.map((id) => ({ id, name: userMap[id] || id })),
      assistants: assistantIds.map((id) => ({ id, name: userMap[id] || id })),
      due_date: t.due_date,
    };
  });

  if (args.employee_id && args.employee_id !== 'all') {
    const targetUid = String(args.employee_id);
    tasks = tasks.filter((t) =>
      t.assignees.some((a) => a.id === targetUid) ||
      t.assistants.some((a) => a.id === targetUid)
    );
  }

  return {
    overdue_count: tasks.length,
    tasks,
  };
}

export async function getDueSoonTasks(
  supabaseAdmin: SupabaseClient,
  args: { department_id?: string; employee_id?: string; days?: number; limit?: number }
) {
  const daysAhead = args.days || 3;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const targetDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const targetStr = targetDate.toISOString().split('T')[0];
  const limit = Math.min(args.limit || 20, 50);

  let query = supabaseAdmin
    .from('tasks')
    .select('id, task_number, title, description, department_id, assigned_to, assisted_by, priority, status, start_date, due_date')
    .eq('is_deleted', false)
    .neq('status', 'completed')
    .gte('due_date', todayStr)
    .lte('due_date', targetStr)
    .order('due_date', { ascending: true })
    .limit(limit);

  if (args.department_id && args.department_id !== 'all') {
    query = query.eq('department_id', args.department_id);
  }

  const { data: rawTasks, error } = await query;
  if (error) throw new Error(`Due soon tasks error: ${error.message}`);

  const [{ data: users }, { data: depts }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name'),
    supabaseAdmin.from('departments').select('id, name'),
  ]);

  const userMap: Record<string, string> = {};
  (users || []).forEach((u: any) => { userMap[u.id] = u.full_name; });

  const deptMap: Record<string, string> = {};
  (depts || []).forEach((d: any) => { deptMap[d.id] = d.name; });

  const tasks = (rawTasks || []).map((t: any) => {
    const { assigneeIds, assistantIds } = parseTaskMetadata(t);
    return {
      id: String(t.id),
      task_number: t.task_number,
      title: t.title,
      status: t.status,
      priority: t.priority,
      department_name: deptMap[t.department_id] || 'General',
      assignees: assigneeIds.map((id) => ({ id, name: userMap[id] || id })),
      assistants: assistantIds.map((id) => ({ id, name: userMap[id] || id })),
      due_date: t.due_date,
    };
  });

  return {
    due_soon_count: tasks.length,
    window_days: daysAhead,
    tasks,
  };
}
