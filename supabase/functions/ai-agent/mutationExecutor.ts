/**
 * UPCOMM AI Assistant - Canonical Mutation Executor
 * 
 * Executes pending actions idempotently upon explicit Admin confirmation.
 * Enforces replay protection, expiry checks, global activity logging, and AI audit trail.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedUser } from './auth.ts';

export async function executePendingAction(
  supabaseAdmin: SupabaseClient,
  user: AuthenticatedUser,
  pendingActionId: string
) {
  if (!pendingActionId) {
    throw new Error('pendingActionId is required for confirmation.');
  }

  // 1. Load authoritative pending action from DB
  const { data: actionRecord, error: loadErr } = await supabaseAdmin
    .from('ai_agent_pending_actions')
    .select('*')
    .eq('id', pendingActionId)
    .maybeSingle();

  if (loadErr || !actionRecord) {
    throw new Error('Pending action not found.');
  }

  // 2. Idempotency Check: if already executed, return cached result immediately
  if (actionRecord.status === 'executed') {
    return {
      success: true,
      idempotent: true,
      message: 'Action already confirmed and executed.',
      result: actionRecord.result,
    };
  }

  if (actionRecord.status === 'cancelled') {
    throw new Error('This action was cancelled.');
  }

  // 3. Expiry Check
  const now = new Date();
  const expiresAt = new Date(actionRecord.expires_at);
  if (now > expiresAt || actionRecord.status === 'expired') {
    await supabaseAdmin
      .from('ai_agent_pending_actions')
      .update({ status: 'expired' })
      .eq('id', pendingActionId);

    throw new Error('This action has expired. Please ask the AI Assistant to prepare it again.');
  }

  if (actionRecord.status !== 'pending') {
    throw new Error(`Action is in invalid status: ${actionRecord.status}`);
  }

  // 4. Atomic Transition: mark 'executing'
  const { error: lockErr } = await supabaseAdmin
    .from('ai_agent_pending_actions')
    .update({ status: 'executing', confirmed_at: now.toISOString() })
    .eq('id', pendingActionId)
    .eq('status', 'pending');

  if (lockErr) {
    throw new Error('Concurrent execution conflict. Please retry.');
  }

  const normalized = actionRecord.normalized_args || {};
  const toolName = actionRecord.tool_name;
  let finalResult: Record<string, any> = {};

  try {
    if (toolName === 'create_task') {
      const nowIso = new Date().toISOString();
      const assignees: string[] = normalized.assigned_to_ids || [normalized.assigned_to || user.id];
      const assistants: string[] = normalized.assisted_by_ids || (normalized.assisted_by ? [normalized.assisted_by] : []);

      // Clean & format description with metadata tags
      let finalDescription = normalized.description || '';
      if (assignees.length > 1) {
        finalDescription = `${finalDescription}\n<!--assignees:${JSON.stringify(assignees)}-->`.trim();
      }
      if (assistants.length > 0) {
        finalDescription = `${finalDescription}\n<!--assisted_by:${JSON.stringify(assistants)}-->`.trim();
      }

      // Generate task number and ID
      let taskNumber = '';
      let taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Attempt using atomic database sequence / function
      const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc('create_company_task_atomic', {
        p_title: normalized.title,
        p_description: finalDescription,
        p_department_id: normalized.department_id,
        p_created_by: user.id,
        p_assigned_by: user.id,
        p_assigned_to: assignees[0] || user.id,
        p_assisted_by: assistants[0] || null,
        p_start_date: normalized.start_date || nowIso.split('T')[0],
        p_due_date: normalized.due_date || null,
        p_priority: normalized.priority || 'medium',
        p_status: normalized.status || 'pending',
        p_task_origin: normalized.task_origin || 'admin_to_hod',
      });

      if (!rpcErr && rpcRes) {
        taskId = rpcRes.id;
        taskNumber = rpcRes.task_number;
      } else {
        // Fallback standard insert with task number count
        const { count } = await supabaseAdmin
          .from('tasks')
          .select('id', { count: 'exact', head: true });

        const nextNum = (count || 0) + 1;
        taskNumber = `TM-${String(nextNum).padStart(4, '0')}`;

        const insertPayload = {
          id: taskId,
          task_number: taskNumber,
          title: normalized.title,
          description: finalDescription,
          department_id: normalized.department_id,
          created_by: user.id,
          assigned_by: user.id,
          assigned_to: assignees[0] || user.id,
          assisted_by: assistants[0] || null,
          task_origin: normalized.task_origin || 'admin_to_hod',
          start_date: normalized.start_date || nowIso.split('T')[0],
          due_date: normalized.due_date || null,
          priority: normalized.priority || 'medium',
          status: normalized.status || 'pending',
          is_deleted: false,
          created_at: nowIso,
          updated_at: nowIso,
        };

        const { error: insErr } = await supabaseAdmin.from('tasks').insert(insertPayload);
        if (insErr) throw insErr;
      }

      // 5. Global Activity Log
      await supabaseAdmin.from('activity_logs').insert({
        user_id: user.id,
        action: 'TASK_CREATED',
        entity_type: 'task',
        entity_id: taskId,
        metadata: {
          task_number: taskNumber,
          title: normalized.title,
          department_id: normalized.department_id,
          assigned_to: assignees[0],
          assigned_to_ids: assignees,
          assisted_by_ids: assistants,
          created_by: user.id,
          source: 'ai_assistant',
        },
      });

      // 6. AI Action Log
      await supabaseAdmin.from('ai_agent_action_logs').insert({
        conversation_id: actionRecord.conversation_id,
        user_id: user.id,
        pending_action_id: pendingActionId,
        tool_name: 'create_task',
        sanitized_arguments: normalized,
        result_entity_type: 'task',
        result_entity_id: taskNumber,
        status: 'success',
        completed_at: new Date().toISOString(),
      });

      finalResult = {
        task_id: taskId,
        task_number: taskNumber,
        title: normalized.title,
        status: normalized.status || 'pending',
        priority: normalized.priority || 'medium',
        department_name: normalized.department_name || 'General',
        assignees: normalized.assignee_names || [],
        assistants: normalized.assistant_names || [],
        start_date: normalized.start_date,
        due_date: normalized.due_date,
      };
    } else if (toolName === 'update_task') {
      const nowIso = new Date().toISOString();
      const taskId = normalized.task_id;
      const updates = normalized.updates || {};

      const dbUpdates: Record<string, any> = {
        updated_at: nowIso,
        ...updates,
      };

      const { error: updErr } = await supabaseAdmin
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId);

      if (updErr) throw updErr;

      // Activity & AI audit
      await supabaseAdmin.from('activity_logs').insert({
        user_id: user.id,
        action: 'TASK_UPDATED',
        entity_type: 'task',
        entity_id: taskId,
        metadata: {
          task_number: normalized.task_number,
          updates,
          source: 'ai_assistant',
        },
      });

      await supabaseAdmin.from('ai_agent_action_logs').insert({
        conversation_id: actionRecord.conversation_id,
        user_id: user.id,
        pending_action_id: pendingActionId,
        tool_name: 'update_task',
        sanitized_arguments: normalized,
        result_entity_type: 'task',
        result_entity_id: normalized.task_number,
        status: 'success',
        completed_at: new Date().toISOString(),
      });

      finalResult = {
        task_id: taskId,
        task_number: normalized.task_number,
        updates,
      };
    }

    // 7. Mark action executed
    await supabaseAdmin
      .from('ai_agent_pending_actions')
      .update({
        status: 'executed',
        executed_at: new Date().toISOString(),
        result: finalResult,
      })
      .eq('id', pendingActionId);

    return {
      success: true,
      message: `Task ${finalResult.task_number || 'action'} executed successfully.`,
      result: finalResult,
    };
  } catch (err: any) {
    // Record failure in action log
    await supabaseAdmin.from('ai_agent_action_logs').insert({
      conversation_id: actionRecord.conversation_id,
      user_id: user.id,
      pending_action_id: pendingActionId,
      tool_name: toolName,
      sanitized_arguments: normalized,
      status: 'failed',
      error_code: err.message || 'Execution error',
      completed_at: new Date().toISOString(),
    });

    await supabaseAdmin
      .from('ai_agent_pending_actions')
      .update({ status: 'failed' })
      .eq('id', pendingActionId);

    throw new Error(`Execution failed: ${err.message}`);
  }
}

export async function cancelPendingAction(
  supabaseAdmin: SupabaseClient,
  user: AuthenticatedUser,
  pendingActionId: string
) {
  const { data: actionRecord, error } = await supabaseAdmin
    .from('ai_agent_pending_actions')
    .select('*')
    .eq('id', pendingActionId)
    .maybeSingle();

  if (error || !actionRecord) throw new Error('Pending action not found.');

  if (actionRecord.status === 'executed') {
    throw new Error('Cannot cancel an already executed action.');
  }

  await supabaseAdmin
    .from('ai_agent_pending_actions')
    .update({ status: 'cancelled' })
    .eq('id', pendingActionId);

  return { success: true, message: 'Action cancelled.' };
}
