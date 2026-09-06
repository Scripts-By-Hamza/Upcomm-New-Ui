/**
 * Tool: writePrepare.ts
 * Prepares validated pending actions server-side. Writes NEVER mutate immediately.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedUser } from '../auth.ts';

export async function prepareCreateTask(
  supabaseAdmin: SupabaseClient,
  user: AuthenticatedUser,
  conversationId: string,
  args: {
    title: string;
    description?: string;
    department_id?: string;
    department_name?: string;
    assignee_ids?: string[];
    assignee_names?: string[];
    assistant_ids?: string[];
    assistant_names?: string[];
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'pending' | 'in_progress';
    start_date?: string;
    due_date?: string;
  }
) {
  if (!args.title || !args.title.trim()) {
    throw new Error('Task title is required.');
  }

  const [{ data: allUsers }, { data: allDepts }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name, designation, department_id, is_active'),
    supabaseAdmin.from('departments').select('id, name'),
  ]);

  const userList = allUsers || [];
  const deptList = allDepts || [];

  const userMap: Record<string, string> = {};
  userList.forEach((u: any) => { userMap[u.id] = u.full_name; });

  const deptMap: Record<string, string> = {};
  deptList.forEach((d: any) => { deptMap[d.id] = d.name; });

  // 1. Resolve Assignees
  const resolvedAssigneeIds: string[] = [];
  if (Array.isArray(args.assignee_ids)) {
    args.assignee_ids.forEach((id) => {
      if (userList.some((u: any) => String(u.id) === String(id))) {
        resolvedAssigneeIds.push(String(id));
      }
    });
  }

  if (Array.isArray(args.assignee_names)) {
    args.assignee_names.forEach((name) => {
      const q = name.toLowerCase().trim();
      const matched = userList.filter((u: any) => u.full_name.toLowerCase().includes(q));
      if (matched.length === 1) {
        resolvedAssigneeIds.push(String(matched[0].id));
      }
    });
  }

  // Default to creator if no assignees resolved
  if (resolvedAssigneeIds.length === 0) {
    resolvedAssigneeIds.push(user.id);
  }

  // 2. Resolve Assistants
  const resolvedAssistantIds: string[] = [];
  if (Array.isArray(args.assistant_ids)) {
    args.assistant_ids.forEach((id) => {
      if (userList.some((u: any) => String(u.id) === String(id))) {
        resolvedAssistantIds.push(String(id));
      }
    });
  }

  if (Array.isArray(args.assistant_names)) {
    args.assistant_names.forEach((name) => {
      const q = name.toLowerCase().trim();
      const matched = userList.filter((u: any) => u.full_name.toLowerCase().includes(q));
      if (matched.length === 1) {
        resolvedAssistantIds.push(String(matched[0].id));
      }
    });
  }

  // Mutual exclusion: Assistants cannot be assignees
  const finalAssistantIds = resolvedAssistantIds.filter((id) => !resolvedAssigneeIds.includes(id));

  // 3. Resolve Department
  let resolvedDeptId = args.department_id || null;
  if (!resolvedDeptId && args.department_name) {
    const q = args.department_name.toLowerCase().trim();
    const matchedDept = deptList.find((d: any) => d.name.toLowerCase().includes(q));
    if (matchedDept) resolvedDeptId = matchedDept.id;
  }

  if (!resolvedDeptId && resolvedAssigneeIds.length > 0) {
    const firstAssignee = userList.find((u: any) => String(u.id) === resolvedAssigneeIds[0]);
    if (firstAssignee?.department_id) resolvedDeptId = firstAssignee.department_id;
  }

  if (!resolvedDeptId && deptList.length > 0) {
    resolvedDeptId = deptList[0].id;
  }

  // 4. Validate Priority & Status
  const priority = ['low', 'medium', 'high', 'urgent'].includes(args.priority || '')
    ? args.priority!
    : 'medium';

  let status: 'pending' | 'in_progress' = 'pending';
  if (args.status === 'in_progress') {
    status = 'in_progress';
  }

  // 5. Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const startDate = args.start_date || todayStr;
  const dueDate = args.due_date || null;

  // Normalized Payload
  const normalizedArgs = {
    title: args.title.trim(),
    description: (args.description || '').trim(),
    department_id: resolvedDeptId,
    department_name: deptMap[resolvedDeptId || ''] || 'General',
    created_by: user.id,
    assigned_by: user.id,
    assigned_to: resolvedAssigneeIds[0],
    assigned_to_ids: resolvedAssigneeIds,
    assignee_names: resolvedAssigneeIds.map((id) => userMap[id] || id),
    assisted_by: finalAssistantIds[0] || null,
    assisted_by_ids: finalAssistantIds,
    assistant_names: finalAssistantIds.map((id) => userMap[id] || id),
    priority,
    status,
    start_date: startDate,
    due_date: dueDate,
    task_origin: 'admin_to_hod',
  };

  // 6. Save Authoritative Pending Action in DB with 30m expiry
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const { data: pendingRecord, error: insertError } = await supabaseAdmin
    .from('ai_agent_pending_actions')
    .insert({
      conversation_id: conversationId,
      created_by: user.id,
      tool_name: 'create_task',
      normalized_args: normalizedArgs,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Failed to create pending action: ${insertError.message}`);
  }

  return {
    action_type: 'create_task',
    pending_action_id: pendingRecord.id,
    status: 'pending_confirmation',
    expires_at: expiresAt,
    confirmation_card: {
      title: normalizedArgs.title,
      description: normalizedArgs.description,
      department_name: normalizedArgs.department_name,
      assignees: normalizedArgs.assignee_names,
      assistants: normalizedArgs.assistant_names,
      priority: normalizedArgs.priority,
      status: normalizedArgs.status,
      start_date: normalizedArgs.start_date,
      due_date: normalizedArgs.due_date || 'No due date set',
    },
    message: `I have prepared the task "${normalizedArgs.title}". Please review the confirmation card below and click "Create Task" to confirm.`,
  };
}

export async function prepareUpdateTask(
  supabaseAdmin: SupabaseClient,
  user: AuthenticatedUser,
  conversationId: string,
  args: {
    task_identifier: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    status?: 'pending' | 'in_progress';
    due_date?: string;
    add_assignee_ids?: string[];
    add_assistant_ids?: string[];
  }
) {
  const identifier = (args.task_identifier || '').trim();
  if (!identifier) throw new Error('task_identifier is required.');

  const { data: rawTasks } = await supabaseAdmin
    .from('tasks')
    .select('*')
    .or(`id.eq.${identifier},task_number.ilike.${identifier}`)
    .eq('is_deleted', false)
    .limit(1);

  if (!rawTasks || rawTasks.length === 0) {
    throw new Error(`Task '${identifier}' not found.`);
  }

  const task = rawTasks[0];
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  const normalizedArgs = {
    task_id: task.id,
    task_number: task.task_number,
    title: task.title,
    updates: {
      ...(args.priority ? { priority: args.priority } : {}),
      ...(args.status ? { status: args.status } : {}),
      ...(args.due_date !== undefined ? { due_date: args.due_date } : {}),
      ...(args.add_assignee_ids ? { add_assignee_ids: args.add_assignee_ids } : {}),
      ...(args.add_assistant_ids ? { add_assistant_ids: args.add_assistant_ids } : {}),
    },
  };

  const { data: pendingRecord, error } = await supabaseAdmin
    .from('ai_agent_pending_actions')
    .insert({
      conversation_id: conversationId,
      created_by: user.id,
      tool_name: 'update_task',
      normalized_args: normalizedArgs,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create update pending action: ${error.message}`);

  return {
    action_type: 'update_task',
    pending_action_id: pendingRecord.id,
    status: 'pending_confirmation',
    expires_at: expiresAt,
    confirmation_card: {
      task_number: task.task_number,
      title: task.title,
      proposed_changes: normalizedArgs.updates,
    },
    message: `I have prepared the update for task ${task.task_number}. Please confirm below to apply the changes.`,
  };
}
