/**
 * Utilities for Monthly Targets & KPIs
 */

/**
 * Calculates the exact last calendar day of a given year and month.
 * @param {number} year - Full year (e.g., 2026)
 * @param {number} month - 1-indexed month (1 = January, 12 = December)
 * @returns {string} ISO Date string YYYY-MM-DD
 */
export function calculateMonthEndDate(year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${mm}-${String(lastDay).padStart(2, '0')}`;
  }

  // Passing day 0 to Date constructor returns the last day of the previous month.
  // So year, m, 0 gives the last day of month m.
  const lastDay = new Date(y, m, 0).getDate();
  const monthStr = String(m).padStart(2, '0');
  const dayStr = String(lastDay).padStart(2, '0');

  return `${y}-${monthStr}-${dayStr}`;
}

/**
 * Formats a month and year into a human-readable title (e.g., "September 2026")
 */
export function formatMonthYear(year, month) {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const mIndex = parseInt(month, 10) - 1;
  const validMonth = monthNames[mIndex] || 'Month';
  return `${validMonth} ${year}`;
}

/**
 * Formats a short month name (e.g., "Sep")
 */
export function formatShortMonth(month) {
  const shortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const mIndex = parseInt(month, 10) - 1;
  return shortNames[mIndex] || '';
}

/**
 * Formats a date string (YYYY-MM-DD) into readable format (e.g., "Sep 30, 2026")
 */
export function formatDueDateDisplay(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const shortMonth = formatShortMonth(month);
  return `${shortMonth} ${day}, ${year}`;
}

/**
 * Returns current year and month
 */
export function getCurrentYearMonth() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return {
    year,
    month,
    key: `${year}-${String(month).padStart(2, '0')}`,
  };
}

/**
 * Computes adjacent month by delta (-1 for previous, +1 for next)
 */
export function getAdjacentMonth(year, month, delta = 1) {
  let y = parseInt(year, 10);
  let m = parseInt(month, 10) + delta;

  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }

  return {
    year: y,
    month: m,
    key: `${y}-${String(m).padStart(2, '0')}`,
  };
}

/**
 * Generates an array of available months for selection (e.g. 6 months past to 6 months future)
 */
export function getAvailableMonthOptions(centerYear, centerMonth, range = 6) {
  const options = [];
  for (let i = -range; i <= range; i++) {
    const adj = getAdjacentMonth(centerYear, centerMonth, i);
    options.push({
      year: adj.year,
      month: adj.month,
      key: adj.key,
      label: formatMonthYear(adj.year, adj.month),
    });
  }
  return options;
}

/**
 * Checks if a monthly target is overdue.
 * Condition: status is not completed and current date > target due_date.
 */
export function isTargetOverdue(target) {
  if (!target || target.status === 'completed' || !target.due_date) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return todayStr > target.due_date;
}
