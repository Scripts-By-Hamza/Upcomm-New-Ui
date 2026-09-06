/**
 * Tool: get_request_summary
 * Aggregates pending completion requests and deletion requests for Admin overview.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export async function getRequestSummary(
  supabaseAdmin: SupabaseClient,
  args: { type?: 'completion' | 'delete' | 'all'; status?: string }
) {
  const reqType = args.type || 'all';
  const reqStatus = args.status || 'pending';

  const [
    { data: completionReqs, error: compErr },
    { data: deleteReqs, error: delErr },
    { data: users },
    { data: tasks },
  ] = await Promise.all([
    supabaseAdmin.from('task_completion_requests').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('delete_requests').select('*').order('created_at', { ascending: false }),
    supabaseAdmin.from('users').select('id, full_name'),
    supabaseAdmin.from('tasks').select('id, task_number, title'),
  ]);

  if (compErr) console.warn('Completion requests query warning:', compErr);
  if (delErr) console.warn('Delete requests query warning:', delErr);

  const userMap: Record<string, string> = {};
  (users || []).forEach((u: any) => { userMap[u.id] = u.full_name; });

  const taskMap: Record<string, { task_number: string; title: string }> = {};
  (tasks || []).forEach((t: any) => {
    taskMap[t.id] = { task_number: t.task_number || t.id, title: t.title };
  });

  let compList = (completionReqs || []).map((r: any) => ({
    id: r.id,
    type: 'completion',
    task_id: r.task_id,
    task_number: taskMap[r.task_id]?.task_number || r.task_id,
    task_title: taskMap[r.task_id]?.title || 'Task',
    requested_by_name: userMap[r.requested_by] || r.requested_by,
    status: r.status,
    created_at: r.created_at,
  }));

  let delList = (deleteReqs || []).map((r: any) => ({
    id: r.id,
    type: 'delete',
    task_id: r.task_id,
    task_number: taskMap[r.task_id]?.task_number || r.task_id,
    task_title: taskMap[r.task_id]?.title || 'Task',
    requested_by_name: userMap[r.requested_by] || r.requested_by,
    reason: r.reason || '',
    status: r.status,
    created_at: r.created_at,
  }));

  if (reqStatus !== 'all') {
    compList = compList.filter((r) => r.status === reqStatus);
    delList = delList.filter((r) => r.status === reqStatus);
  }

  let combined: any[] = [];
  if (reqType === 'completion' || reqType === 'all') combined = combined.concat(compList);
  if (reqType === 'delete' || reqType === 'all') combined = combined.concat(delList);

  return {
    total_pending: compList.filter((r) => r.status === 'pending').length + delList.filter((r) => r.status === 'pending').length,
    pending_completion_requests_count: compList.filter((r) => r.status === 'pending').length,
    pending_delete_requests_count: delList.filter((r) => r.status === 'pending').length,
    requests: combined.slice(0, 20),
  };
}
