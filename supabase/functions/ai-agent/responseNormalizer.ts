/**
 * UPCOMM AI Assistant - Response Normalizer
 * 
 * Formats model responses and tool results into rich, structured UI blocks.
 */

export interface ResponseBlock {
  type: 'TEXT' | 'REPORT' | 'TASK_LIST' | 'USER_LIST' | 'ACTION_CONFIRMATION' | 'ACTION_RESULT' | 'CLARIFICATION' | 'ERROR';
  data: Record<string, any>;
}

export function normalizeAgentResponse(params: {
  conversationId: string;
  assistantContent: string | null;
  toolOutputs: Array<{ name: string; output: any }>;
  pendingAction?: any;
}) {
  const { conversationId, assistantContent, toolOutputs, pendingAction } = params;
  const blocks: ResponseBlock[] = [];

  // 1. Process Tool Outputs to generate structured UI blocks
  for (const { name, output } of toolOutputs) {
    if (name === 'get_department_report' && output?.metrics) {
      blocks.push({
        type: 'REPORT',
        data: output,
      });
    } else if (name === 'get_employee_workload' && output?.workload) {
      blocks.push({
        type: 'REPORT',
        data: {
          report_type: 'employee_workload',
          ...output,
        },
      });
    } else if ((name === 'search_tasks' || name === 'get_overdue_tasks' || name === 'get_due_soon_tasks') && Array.isArray(output?.tasks)) {
      if (output.tasks.length > 0) {
        blocks.push({
          type: 'TASK_LIST',
          data: {
            title: name === 'get_overdue_tasks' ? 'Overdue Tasks' : (name === 'get_due_soon_tasks' ? 'Tasks Due Soon' : 'Matching Tasks'),
            count: output.count || output.tasks.length,
            tasks: output.tasks,
          },
        });
      }
    } else if (name === 'search_users' && Array.isArray(output?.users)) {
      if (output.users.length > 1 && !pendingAction) {
        blocks.push({
          type: 'USER_LIST',
          data: {
            users: output.users,
          },
        });
      }
    }
  }

  // 2. Pending Action Confirmation Card
  if (pendingAction && pendingAction.confirmation_card) {
    blocks.push({
      type: 'ACTION_CONFIRMATION',
      data: {
        pending_action_id: pendingAction.pending_action_id,
        action_type: pendingAction.action_type,
        expires_at: pendingAction.expires_at,
        card: pendingAction.confirmation_card,
      },
    });
  }

  // 3. Assistant text narrative
  if (assistantContent && assistantContent.trim()) {
    // Check if assistant content is a clarification question
    const isClarification = assistantContent.includes('Which one') || assistantContent.includes('Did you mean') || assistantContent.includes('Could you clarify');
    blocks.push({
      type: isClarification ? 'CLARIFICATION' : 'TEXT',
      data: {
        text: assistantContent.trim(),
      },
    });
  }

  return {
    conversationId,
    assistant: {
      role: 'assistant',
      content: assistantContent,
    },
    blocks,
    pendingAction: pendingAction || null,
  };
}
