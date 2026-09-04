import { format, isToday, isYesterday } from 'date-fns';

/**
 * Groups chronological activities into local date sections (TODAY, YESTERDAY, formatted dates).
 */
export function groupActivitiesByDate(activities = []) {
  const groups = [];
  const groupMap = new Map();

  (activities || []).forEach((item) => {
    if (!item.timestamp) return;
    const dateObj = new Date(item.timestamp);
    if (isNaN(dateObj.getTime())) return;

    let key = '';
    let isTodayGroup = false;
    let isYesterdayGroup = false;

    if (isToday(dateObj)) {
      key = 'TODAY';
      isTodayGroup = true;
    } else if (isYesterday(dateObj)) {
      key = 'YESTERDAY';
      isYesterdayGroup = true;
    } else {
      key = format(dateObj, 'MMMM d').toUpperCase();
      if (dateObj.getFullYear() !== new Date().getFullYear()) {
        key = format(dateObj, 'MMMM d, yyyy').toUpperCase();
      }
    }

    if (!groupMap.has(key)) {
      const newGroup = {
        key,
        label: key,
        isToday: isTodayGroup,
        isYesterday: isYesterdayGroup,
        items: [],
      };
      groupMap.set(key, newGroup);
      groups.push(newGroup);
    }

    groupMap.get(key).items.push(item);
  });

  return groups;
}
