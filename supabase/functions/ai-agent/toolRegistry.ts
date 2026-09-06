/**
 * UPCOMM AI Assistant - Tool Registry & Dispatcher
 * 
 * Defines the OpenAI/NVIDIA function calling schemas and routes tool executions safely.
 * Strictly enforces an allowlist.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticatedUser } from './auth.ts';
import { ToolDefinition } from './nvidia.ts';
import { searchUsers } from './tools/users.ts';
import { searchDepartments } from './tools/departments.ts';
import { searchTasks, getTask, getOverdueTasks, getDueSoonTasks } from './tools/tasks.ts';
import { getDepartmentReport, getEmployeeWorkload } from './tools/reports.ts';
import { getRequestSummary } from './tools/requests.ts';
import { getMonthlyTargetsSummary } from './tools/monthlyTargets.ts';
import { prepareCreateTask, prepareUpdateTask } from './tools/writePrepare.ts';

export interface ToolExecutionContext {
  supabaseAdmin: SupabaseClient;
  user: AuthenticatedUser;
  conversationId: string;
}

export const REGISTERED_TOOLS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'search_users',
      description: 'Search active UPCOMM employees by name, email, designation, or department. Use this to resolve user IDs for task assignees and assistants.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Name, email or keyword to search' },
          department_id: { type: 'string', description: 'Optional department ID filter' },
          role: { type: 'string', enum: ['admin', 'it_support_admin', 'hod', 'team_member', 'all'], description: 'Role filter' },
          limit: { type: 'number', description: 'Max records to return (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_departments',
      description: 'Search UPCOMM departments to get department IDs, HOD names, and member counts.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Department name keyword' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_tasks',
      description: 'Search company tasks by keyword, department, assignee, status, or priority.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Title, task number, or keyword' },
          department_id: { type: 'string', description: 'Filter by department ID' },
          assignee_id: { type: 'string', description: 'Filter by assignee/assistant user ID' },
          status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'all'] },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent', 'all'] },
          limit: { type: 'number', description: 'Max tasks to return (default 20)' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_task',
      description: 'Retrieve detailed information for a single task using its task number (e.g. TM-0012) or task UUID.',
      parameters: {
        type: 'object',
        properties: {
          task_identifier: { type: 'string', description: 'Task number (e.g. TM-0001) or UUID' },
        },
        required: ['task_identifier'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_overdue_tasks',
      description: 'Get all active incomplete tasks that have passed their due date.',
      parameters: {
        type: 'object',
        properties: {
          department_id: { type: 'string', description: 'Optional department ID filter' },
          employee_id: { type: 'string', description: 'Optional employee ID filter' },
          limit: { type: 'number', description: 'Max tasks to return' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_due_soon_tasks',
      description: 'Get tasks that are due within the upcoming specified number of days (default 3 days).',
      parameters: {
        type: 'object',
        properties: {
          department_id: { type: 'string', description: 'Optional department ID filter' },
          employee_id: { type: 'string', description: 'Optional employee ID filter' },
          days: { type: 'number', description: 'Number of days ahead (default 3)' },
          limit: { type: 'number', description: 'Max tasks to return' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_department_report',
      description: 'Computes deterministic metrics and workload breakdown for a department or the whole company for a given period.',
      parameters: {
        type: 'object',
        properties: {
          department_id: { type: 'string', description: 'Department UUID or "all"' },
          department_name: { type: 'string', description: 'Department name e.g. "Website Development"' },
          period: { type: 'string', enum: ['7d', '30d', '90d', 'this_month', 'last_month', 'all'], description: 'Time range' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_employee_workload',
      description: 'Get workload analytics for a specific employee including active, overdue, and completed tasks.',
      parameters: {
        type: 'object',
        properties: {
          employee_id: { type: 'string', description: 'Employee user ID' },
          employee_name: { type: 'string', description: 'Employee full name' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_request_summary',
      description: 'Get summary of pending task completion requests and deletion requests awaiting review.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['completion', 'delete', 'all'] },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'all'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_targets_summary',
      description: 'Get summary of monthly targets and KPIs (strictly isolated from normal tasks).',
      parameters: {
        type: 'object',
        properties: {
          department_id: { type: 'string', description: 'Optional department ID filter' },
          month: { type: 'string', description: 'Month in YYYY-MM format' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_create_task',
      description: 'Prepare a new company task creation. Validates user assignments and returns a pending confirmation card for Admin approval.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the task' },
          description: { type: 'string', description: 'Optional details/description' },
          department_id: { type: 'string', description: 'Department ID' },
          department_name: { type: 'string', description: 'Department Name e.g. Website Development' },
          assignee_ids: { type: 'array', items: { type: 'string' }, description: 'Resolved User IDs for direct assignees' },
          assignee_names: { type: 'array', items: { type: 'string' }, description: 'Names of assignees to resolve' },
          assistant_ids: { type: 'array', items: { type: 'string' }, description: 'Resolved User IDs for assistants' },
          assistant_names: { type: 'array', items: { type: 'string' }, description: 'Names of assistants to resolve' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], description: 'Task priority (default: medium)' },
          status: { type: 'string', enum: ['pending', 'in_progress'], description: 'Task status (default: pending)' },
          start_date: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
          due_date: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'prepare_update_task',
      description: 'Prepare an update for an existing task (e.g. change priority, status, due date, add assignees). Returns a pending confirmation card.',
      parameters: {
        type: 'object',
        properties: {
          task_identifier: { type: 'string', description: 'Task number (e.g. TM-0012) or UUID' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          status: { type: 'string', enum: ['pending', 'in_progress'] },
          due_date: { type: 'string', description: 'New due date in YYYY-MM-DD format' },
          add_assignee_ids: { type: 'array', items: { type: 'string' } },
          add_assistant_ids: { type: 'array', items: { type: 'string' } },
        },
        required: ['task_identifier'],
      },
    },
  },
];

export async function executeTool(
  toolName: string,
  rawArgs: Record<string, any> | string,
  context: ToolExecutionContext
): Promise<any> {
  const { supabaseAdmin, user, conversationId } = context;

  // Safe JSON argument parsing
  let args: Record<string, any> = {};
  if (typeof rawArgs === 'string') {
    try {
      args = JSON.parse(rawArgs);
    } catch (e) {
      throw new Error(`Malformed JSON arguments for tool ${toolName}: ${e}`);
    }
  } else if (typeof rawArgs === 'object' && rawArgs !== null) {
    args = rawArgs;
  }

  switch (toolName) {
    case 'search_users':
      return await searchUsers(supabaseAdmin, args);

    case 'search_departments':
      return await searchDepartments(supabaseAdmin, args);

    case 'search_tasks':
      return await searchTasks(supabaseAdmin, args);

    case 'get_task':
      return await getTask(supabaseAdmin, args as any);

    case 'get_overdue_tasks':
      return await getOverdueTasks(supabaseAdmin, args);

    case 'get_due_soon_tasks':
      return await getDueSoonTasks(supabaseAdmin, args);

    case 'get_department_report':
      return await getDepartmentReport(supabaseAdmin, args as any);

    case 'get_employee_workload':
      return await getEmployeeWorkload(supabaseAdmin, args as any);

    case 'get_request_summary':
      return await getRequestSummary(supabaseAdmin, args as any);

    case 'get_monthly_targets_summary':
      return await getMonthlyTargetsSummary(supabaseAdmin, args as any);

    case 'prepare_create_task':
      return await prepareCreateTask(supabaseAdmin, user, conversationId, args as any);

    case 'prepare_update_task':
      return await prepareUpdateTask(supabaseAdmin, user, conversationId, args as any);

    default:
      throw new Error(`Tool '${toolName}' is not registered or prohibited in UPCOMM AI Agent.`);
  }
}
