import { isToday, isYesterday, subDays, startOfDay, isSameMonth } from 'date-fns';
import { isTaskInDepartment } from '../taskDepartmentUtils';

/**
 * Filter activities based on the 6 criteria:
 * Search Query, User (Actor), Department (Entity), Task, Action, Date Range
 */
export function filterActivities(
  activities = [],
  {
    searchQuery = '',
    employeeId = 'all',
    departmentId = 'all',
    taskId = 'all',
    actionType = 'all',
    dateRange = 'all',
    users = [],
  } = {}
) {
  const now = new Date();
  const weekStart = startOfDay(subDays(now, 7));
  const monthStart = startOfDay(subDays(now, 30));
  const cleanSearch = searchQuery.trim().toLowerCase();

  return (activities || []).filter((item) => {
    // 1. Search Query Filter
    if (cleanSearch) {
      const actorName = (item.actor?.full_name || '').toLowerCase();
      const taskNum = (item.taskNumber || item.task?.task_number || '').toLowerCase();
      const taskTitle = (item.taskTitle || item.task?.title || '').toLowerCase();
      const verb = (item.verb || '').toLowerCase();
      const dept = (item.departmentName || '').toLowerCase();
      const secText = (
        item.secondary?.name ||
        item.secondary?.text ||
        item.secondary?.to ||
        item.secondary?.label ||
        ''
      ).toLowerCase();

      const matches =
        actorName.includes(cleanSearch) ||
        taskNum.includes(cleanSearch) ||
        taskTitle.includes(cleanSearch) ||
        verb.includes(cleanSearch) ||
        dept.includes(cleanSearch) ||
        secText.includes(cleanSearch);

      if (!matches) return false;
    }

    // 2. User (Actor who performed the event) Filter
    if (employeeId !== 'all' && String(item.actor?.id) !== String(employeeId)) {
      return false;
    }

    // 3. Department (Affected Entity / Task) Filter
    if (departmentId !== 'all') {
      if (item.task) {
        if (!isTaskInDepartment(item.task, departmentId, users) && item.task.department_id !== departmentId) {
          return false;
        }
      } else if (item.departmentId) {
        if (String(item.departmentId) !== String(departmentId)) {
          return false;
        }
      } else {
        return false;
      }
    }

    // 4. Task Filter
    if (taskId !== 'all') {
      const itemTaskId = item.task?.id || item.rawLog?.entity_id || item.rawLog?.metadata?.task_id;
      if (String(itemTaskId) !== String(taskId)) {
        return false;
      }
    }

    // 5. Action Type Filter
    if (actionType !== 'all') {
      if (actionType === 'task_completed') {
        if (item.actionType !== 'task_completed' && item.actionType !== 'completion_approved') {
          return false;
        }
      } else if (actionType === 'delete_requested') {
        if (item.actionType !== 'delete_requested' && item.actionType !== 'delete_approved') {
          return false;
        }
      } else if (item.actionType !== actionType) {
        return false;
      }
    }

    // 6. Date Range Filter (Local timezone safe)
    if (dateRange !== 'all') {
      const itemDate = new Date(item.timestamp);
      if (isNaN(itemDate.getTime())) return true;

      if (dateRange === 'today') {
        if (!isToday(itemDate)) return false;
      } else if (dateRange === 'yesterday') {
        if (!isYesterday(itemDate)) return false;
      } else if (dateRange === '7d' || dateRange === 'week') {
        if (itemDate < weekStart) return false;
      } else if (dateRange === '30d' || dateRange === 'month') {
        if (itemDate < monthStart) return false;
      } else if (dateRange === 'this_month') {
        if (!isSameMonth(itemDate, now)) return false;
      }
    }

    return true;
  });
}
