/**
 * Normalizes text for search matching:
 * trimmed, lowercased, and collapsed consecutive whitespace.
 */
export function normalizeSearchText(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Normalizes task numbers for resilient matching (e.g., 'TM-0145', 'tm0145', '0145').
 */
export function normalizeTaskNumber(numStr) {
  if (!numStr || typeof numStr !== 'string') return '';
  return numStr.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Calculates a match score for a target string against search query.
 */
export function calculateMatchScore(target, query, baseWeight = 100) {
  const normTarget = normalizeSearchText(target);
  const normQuery = normalizeSearchText(query);

  if (!normTarget || !normQuery) return 0;
  if (normTarget === normQuery) return baseWeight * 10;
  if (normTarget.startsWith(normQuery)) return baseWeight * 8;

  // Word boundary check (e.g. query matches start of a word in target)
  const words = normTarget.split(' ');
  for (const w of words) {
    if (w.startsWith(normQuery)) return baseWeight * 6.5;
  }

  if (normTarget.includes(normQuery)) return baseWeight * 4.5;

  // Token-based matching
  const queryTokens = normQuery.split(' ').filter(Boolean);
  if (queryTokens.length > 1) {
    const allTokensMatch = queryTokens.every((token) => normTarget.includes(token));
    if (allTokensMatch) return baseWeight * 3.5;
  }

  return 0;
}

/**
 * Searches across all entity collections, calculates ranking scores, and groups results.
 */
export function searchCommandPalette({
  query = '',
  scopedTasks = [],
  accessibleDepartments = [],
  accessibleUsers = [],
  navigationItems = [],
  quickActions = [],
  departmentsMap = {},
  maxTotalResults = 12,
}) {
  const normQuery = normalizeSearchText(query);
  if (!normQuery) {
    return {
      groupedResults: [],
      flatResults: [],
      totalCount: 0,
    };
  }

  const rawTaskNumQuery = normalizeTaskNumber(normQuery);
  const matchedActions = [];
  const matchedTasks = [];
  const matchedUsers = [];
  const matchedDepartments = [];
  const matchedNavigation = [];

  // 1. Match Quick Actions
  for (const action of quickActions) {
    let score = calculateMatchScore(action.label, normQuery, 120);
    if (action.keywords && Array.isArray(action.keywords)) {
      for (const kw of action.keywords) {
        const kwScore = calculateMatchScore(kw, normQuery, 100);
        if (kwScore > score) score = kwScore;
      }
    }
    if (score > 0) {
      matchedActions.push({
        ...action,
        group: 'ACTIONS',
        score,
      });
    }
  }

  // 2. Match Tasks
  for (const task of scopedTasks) {
    if (task.is_deleted) continue;

    let score = 0;
    const normTaskNum = normalizeTaskNumber(task.task_number || '');

    // High priority for Task Number match
    if (normTaskNum && rawTaskNumQuery) {
      if (normTaskNum === rawTaskNumQuery) {
        score += 1500;
      } else if (normTaskNum.includes(rawTaskNumQuery)) {
        score += 1000;
      }
    }

    // Title match
    const titleScore = calculateMatchScore(task.title, normQuery, 110);
    score += titleScore;

    // Department match
    const dept = departmentsMap[task.department_id];
    if (dept) {
      const deptScore = calculateMatchScore(dept.name, normQuery, 60);
      score += deptScore;
    }

    if (score > 0) {
      const deptName = dept?.name || null;
      const statusLabel = task.status ? task.status.replace('_', ' ') : null;

      matchedTasks.push({
        id: `task-${task.id}`,
        type: 'task',
        rawEntity: task,
        group: 'TASKS',
        title: `${task.task_number ? `${task.task_number} ` : ''}${task.title}`,
        secondary: [statusLabel, deptName].filter(Boolean).join(' • '),
        score,
      });
    }
  }

  // 3. Match People (Users)
  for (const user of accessibleUsers) {
    if (user.exclude_from_directory || user.is_system_account || user.is_active === false) {
      continue;
    }

    let score = calculateMatchScore(user.full_name, normQuery, 100);

    if (user.designation) {
      const desScore = calculateMatchScore(user.designation, normQuery, 60);
      if (desScore > score) score = desScore;
    }

    const dept = departmentsMap[user.department_id];
    if (dept) {
      const deptScore = calculateMatchScore(dept.name, normQuery, 50);
      score = Math.max(score, deptScore);
    }

    if (score > 0) {
      const deptName = dept?.name || null;
      matchedUsers.push({
        id: `user-${user.id}`,
        type: 'user',
        rawEntity: user,
        group: 'PEOPLE',
        title: user.full_name,
        secondary: [user.designation || 'Team Member', deptName].filter(Boolean).join(' • '),
        score,
      });
    }
  }

  // 4. Match Departments
  for (const dept of accessibleDepartments) {
    let score = calculateMatchScore(dept.name, normQuery, 100);
    if (dept.description) {
      const descScore = calculateMatchScore(dept.description, normQuery, 40);
      score = Math.max(score, descScore);
    }

    if (score > 0) {
      matchedDepartments.push({
        id: `dept-${dept.id}`,
        type: 'department',
        rawEntity: dept,
        group: 'DEPARTMENTS',
        title: dept.name,
        secondary: 'Department',
        score,
      });
    }
  }

  // 5. Match Navigation
  for (const nav of navigationItems) {
    let score = calculateMatchScore(nav.label, normQuery, 90);
    if (nav.keywords && Array.isArray(nav.keywords)) {
      for (const kw of nav.keywords) {
        const kwScore = calculateMatchScore(kw, normQuery, 75);
        if (kwScore > score) score = kwScore;
      }
    }

    if (score > 0) {
      matchedNavigation.push({
        id: `nav-${nav.id || nav.to}`,
        type: 'nav',
        rawEntity: nav,
        group: 'NAVIGATION',
        title: nav.label,
        secondary: nav.section ? `${nav.section} Navigation` : 'Navigation',
        score,
      });
    }
  }

  // Sort each group by score descending
  const sortByScore = (a, b) => b.score - a.score;
  matchedActions.sort(sortByScore);
  matchedTasks.sort(sortByScore);
  matchedUsers.sort(sortByScore);
  matchedDepartments.sort(sortByScore);
  matchedNavigation.sort(sortByScore);

  // Assemble grouped structure with priority order
  const groupOrder = [
    { key: 'ACTIONS', label: 'ACTIONS', items: matchedActions },
    { key: 'TASKS', label: 'TASKS', items: matchedTasks },
    { key: 'PEOPLE', label: 'PEOPLE', items: matchedUsers },
    { key: 'DEPARTMENTS', label: 'DEPARTMENTS', items: matchedDepartments },
    { key: 'NAVIGATION', label: 'NAVIGATION', items: matchedNavigation },
  ];

  const groupedResults = [];
  const flatResults = [];
  let collected = 0;

  for (const grp of groupOrder) {
    if (grp.items.length > 0 && collected < maxTotalResults) {
      const remainingQuota = maxTotalResults - collected;
      const takeItems = grp.items.slice(0, remainingQuota);
      groupedResults.push({
        key: grp.key,
        label: grp.label,
        items: takeItems,
      });
      flatResults.push(...takeItems);
      collected += takeItems.length;
    }
  }

  return {
    groupedResults,
    flatResults,
    totalCount:
      matchedActions.length +
      matchedTasks.length +
      matchedUsers.length +
      matchedDepartments.length +
      matchedNavigation.length,
  };
}
