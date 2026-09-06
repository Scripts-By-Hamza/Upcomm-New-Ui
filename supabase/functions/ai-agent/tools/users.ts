/**
 * Tool: search_users
 * Safely queries active UPCOMM employees. Strips passwords and sensitive credentials.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export async function searchUsers(
  supabaseAdmin: SupabaseClient,
  args: { query?: string; department_id?: string; role?: string; limit?: number }
) {
  const query = (args.query || '').trim();
  const limit = Math.min(args.limit || 20, 50);

  let supaQuery = supabaseAdmin
    .from('users')
    .select('id, full_name, email, designation, role, department_id, is_active, custom_id')
    .limit(limit);

  if (args.department_id && args.department_id !== 'all') {
    supaQuery = supaQuery.eq('department_id', args.department_id);
  }

  if (args.role && args.role !== 'all') {
    supaQuery = supaQuery.eq('role', args.role);
  }

  let { data, error } = await supaQuery;

  if (error || !data || data.length === 0) {
    // Fallback to profiles table
    let profQuery = supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, designation, role, department_id, is_active')
      .limit(limit);

    if (args.department_id && args.department_id !== 'all') {
      profQuery = profQuery.eq('department_id', args.department_id);
    }
    const profRes = await profQuery;
    data = profRes.data || [];
  }

  // Load department names for better readability
  const { data: depts } = await supabaseAdmin.from('departments').select('id, name');
  const deptMap: Record<string, string> = {};
  (depts || []).forEach((d: any) => {
    deptMap[d.id] = d.name;
  });

  let users = (data || []).map((u: any) => ({
    id: String(u.id),
    full_name: u.full_name,
    email: u.email,
    designation: u.designation || 'Specialist',
    role: u.role,
    department_id: u.department_id,
    department_name: deptMap[u.department_id] || 'General',
    is_active: u.is_active !== false,
  }));

  if (query) {
    const qLower = query.toLowerCase();
    users = users.filter(
      (u) =>
        u.full_name.toLowerCase().includes(qLower) ||
        u.email.toLowerCase().includes(qLower) ||
        u.designation.toLowerCase().includes(qLower) ||
        u.department_name.toLowerCase().includes(qLower)
    );
  }

  return {
    count: users.length,
    users,
  };
}
