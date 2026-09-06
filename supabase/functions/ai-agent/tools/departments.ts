/**
 * Tool: search_departments
 * Returns UPCOMM departments with HOD details and member counts.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export async function searchDepartments(
  supabaseAdmin: SupabaseClient,
  args: { query?: string }
) {
  const query = (args.query || '').trim().toLowerCase();

  const { data: depts, error } = await supabaseAdmin
    .from('departments')
    .select('id, name, description, color, hod_id, is_active, created_at');

  if (error) {
    throw new Error(`Failed to fetch departments: ${error.message}`);
  }

  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, full_name, department_id');

  const userList = users || [];
  const userMap: Record<string, string> = {};
  const deptCountMap: Record<string, number> = {};

  userList.forEach((u: any) => {
    userMap[u.id] = u.full_name;
    if (u.department_id) {
      deptCountMap[u.department_id] = (deptCountMap[u.department_id] || 0) + 1;
    }
  });

  let departments = (depts || []).map((d: any) => ({
    id: String(d.id),
    name: d.name,
    description: d.description || '',
    color: d.color,
    hod_id: d.hod_id || null,
    hod_name: d.hod_id ? userMap[d.hod_id] || 'Unassigned' : 'Unassigned',
    member_count: deptCountMap[d.id] || 0,
  }));

  if (query) {
    departments = departments.filter(
      (d) =>
        d.name.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query) ||
        d.hod_name.toLowerCase().includes(query)
    );
  }

  return {
    count: departments.length,
    departments,
  };
}
