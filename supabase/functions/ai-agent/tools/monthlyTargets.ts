/**
 * Tool: get_monthly_targets_summary
 * Read-only tool for monthly targets & KPIs (strictly isolated from normal tasks).
 */

import { SupabaseClient } from '@supabase/supabase-js';

export async function getMonthlyTargetsSummary(
  supabaseAdmin: SupabaseClient,
  args: { department_id?: string; month?: string }
) {
  let query = supabaseAdmin
    .from('monthly_targets')
    .select('*')
    .order('created_at', { ascending: false });

  if (args.department_id && args.department_id !== 'all') {
    query = query.eq('department_id', args.department_id);
  }

  const { data: rawTargets, error } = await query;
  if (error) console.warn('Monthly targets query warning:', error);

  const [{ data: users }, { data: depts }] = await Promise.all([
    supabaseAdmin.from('users').select('id, full_name'),
    supabaseAdmin.from('departments').select('id, name'),
  ]);

  const userMap: Record<string, string> = {};
  (users || []).forEach((u: any) => { userMap[u.id] = u.full_name; });

  const deptMap: Record<string, string> = {};
  (depts || []).forEach((d: any) => { deptMap[d.id] = d.name; });

  let targets = (rawTargets || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    target_value: t.target_value,
    current_value: t.current_value,
    unit: t.unit || '',
    status: t.status,
    department_name: deptMap[t.department_id] || 'General',
    assigned_to_name: userMap[t.assigned_to] || 'Team',
    start_date: t.start_date,
    end_date: t.end_date,
  }));

  const achievedCount = targets.filter((t) => t.status === 'achieved' || t.status === 'completed').length;
  const inProgressCount = targets.filter((t) => t.status === 'in_progress').length;

  return {
    total_targets: targets.length,
    achieved_count: achievedCount,
    in_progress_count: inProgressCount,
    targets: targets.slice(0, 15),
  };
}
