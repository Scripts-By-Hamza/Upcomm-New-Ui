import { format, isBefore, isAfter, addDays, startOfDay } from 'date-fns';

function safeParseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  
  // Try standard parse
  let d = new Date(dateInput);
  if (!isNaN(d.getTime())) return d;

  // If Postgres format e.g. "2026-08-16 00:51:42.763+00"
  if (typeof dateInput === 'string') {
    const fixed = dateInput.trim().replace(' ', 'T');
    d = new Date(fixed);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export function getDateFormatString(prefFormat) {
  switch (prefFormat) {
    case 'MMM DD, YYYY':
      return 'MMM dd, yyyy';
    case 'DD/MM/YYYY':
      return 'dd/MM/yyyy';
    case 'MM/DD/YYYY':
      return 'MM/dd/yyyy';
    case 'YYYY-MM-DD':
      return 'yyyy-MM-dd';
    case 'DD MMM YYYY':
    default:
      return 'dd MMM yyyy';
  }
}

export function formatDate(dateString, formatStr = 'dd MMM yyyy') {
  if (!dateString) return '-';
  try {
    const date = safeParseDate(dateString);
    if (!date) return String(dateString);
    return format(date, formatStr);
  } catch (e) {
    return String(dateString);
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '-';
  try {
    const date = safeParseDate(dateString);
    if (!date) return String(dateString);
    return format(date, 'dd MMM yyyy, hh:mm a');
  } catch (e) {
    return String(dateString);
  }
}

export function isTaskOverdue(dueDateStr, status) {
  if (!dueDateStr || status === 'completed') return false;
  try {
    const due = safeParseDate(dueDateStr);
    if (!due) return false;
    const today = startOfDay(new Date());
    return isBefore(startOfDay(due), today);
  } catch (e) {
    return false;
  }
}

export function isTaskDueSoon(dueDateStr, status, dueSoonDays = 3) {
  if (!dueDateStr || status === 'completed') return false;
  try {
    const due = safeParseDate(dueDateStr);
    if (!due) return false;
    const today = startOfDay(new Date());
    const limit = addDays(today, dueSoonDays);
    const startOfDue = startOfDay(due);
    return (isAfter(startOfDue, today) || startOfDue.getTime() === today.getTime()) && isBefore(startOfDue, limit);
  } catch (e) {
    return false;
  }
}

/**
 * Timezone-safe parser for task due dates.
 * If given YYYY-MM-DD, parses as local calendar year, month, day.
 */
export function parseTaskDueDateLocal(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  
  if (typeof dateInput === 'string') {
    const match = dateInput.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
  }

  return safeParseDate(dateInput);
}

/**
 * Formats a Date object as a local YYYY-MM-DD key without UTC shifts.
 */
export function toLocalDateKey(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : parseTaskDueDateLocal(date);
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

