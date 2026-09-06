import Papa from 'papaparse';

/**
 * UPCOMM Task Manager - Canonical CSV Column Headers
 */
export const CANONICAL_CSV_HEADERS = [
  'Task title*',
  'Description',
  'Assignee*',
  'Assistant Users',
  'Priority',
  'Status',
  'Start Date*',
  'Due Date',
  'Attachments',
];

/**
 * Generate CSV template string
 */
export function generateCsvTemplate() {
  const headers = CANONICAL_CSV_HEADERS.join(',');
  const row1 = '"Redesign homepage","Update mobile and desktop UI","Ahmed|Ahsan","Hamza","High","In Progress","2026-09-05","2026-09-15","https://example.com/brief.pdf|https://example.com/mockup.png"';
  const row2 = '"Research suppliers","","Zeeshan","","Medium","Pending","2026-09-06","",""';
  return `${headers}\n${row1}\n${row2}`;
}

/**
 * Download CSV Template file in the browser
 */
export function downloadCsvTemplate(filename = 'upcomm_tasks_template.csv') {
  const csvContent = '\uFEFF' + generateCsvTemplate(); // Prepend UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Normalize header string for tolerant matching
 */
export function normalizeHeaderKey(key = '') {
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/\*/g, '')
    .replace(/[\s_-]+/g, '');
}

/**
 * Map of normalized key to canonical header name
 */
const HEADER_KEY_MAP = {
  tasktitle: 'title',
  title: 'title',
  task: 'title',
  taskname: 'title',
  description: 'description',
  desc: 'description',
  assignee: 'assignee',
  assignees: 'assignee',
  assigneeemail: 'assignee',
  assigneeemails: 'assignee',
  assignedto: 'assignee',
  assignedmembers: 'assignee',
  email: 'assignee',
  emails: 'assignee',
  user: 'assignee',
  users: 'assignee',
  member: 'assignee',
  members: 'assignee',
  assistantusers: 'assistants',
  assistant: 'assistants',
  assistants: 'assistants',
  assistantemail: 'assistants',
  assistantemails: 'assistants',
  assistedby: 'assistants',
  priority: 'priority',
  status: 'status',
  startdate: 'startDate',
  start: 'startDate',
  startingdate: 'startDate',
  startday: 'startDate',
  duedate: 'dueDate',
  due: 'dueDate',
  deadline: 'dueDate',
  enddate: 'dueDate',
  end: 'dueDate',
  completiondate: 'dueDate',
  attachments: 'attachments',
  attachment: 'attachments',
  links: 'attachments',
};

/**
 * Month names mapping for textual dates
 */
const MONTH_NAME_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

/**
 * Clean raw date input by stripping invisible Unicode characters, quotes, and whitespace
 */
export function cleanDateInput(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u00A0\u202F]/g, '')
    .replace(/^["']+|["']+$/g, '')
    .replace(/\s*([/.\-])\s*/g, '$1')
    .trim();
}

/**
 * Validate calendar date and format as canonical YYYY-MM-DD
 */
function validateAndFormatDate(year, month, day) {
  if (!year || !month || !day) return null;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  if (y < 1970 || y > 2100) return null;
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  const dateObj = new Date(y, m - 1, d);
  if (
    dateObj.getFullYear() !== y ||
    dateObj.getMonth() !== m - 1 ||
    dateObj.getDate() !== d
  ) {
    return null;
  }

  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/**
 * Parse date string flexibly and universally, normalizing to YYYY-MM-DD.
 * Automatically handles:
 * - Google Sheets / Excel M/D/YYYY (e.g. 9/5/2026, 9/15/2026)
 * - Standard DD-MM-YYYY, DD/MM/YYYY, DD.MM.YYYY (e.g. 05-09-2026, 25/09/2026)
 * - ISO YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD (e.g. 2026-09-05)
 * - 2-digit years (e.g. 9/5/26, 05-09-26 -> 2026-09-05)
 * - Textual dates (05-Sep-2026, Sep 05 2026, 5 Sep 2026, September 5 2026)
 * - Timestamps and ISO strings (2026-09-05T00:00:00.000Z, 9/5/2026 12:00:00 AM, 05-09-2026 14:30:00)
 * - Excel serial numbers (45540)
 * - Date objects
 */
export function parseStrictDateString(val) {
  if (val === null || val === undefined) return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return validateAndFormatDate(val.getFullYear(), val.getMonth() + 1, val.getDate());
  }

  let str = cleanDateInput(val);
  if (!str) return null;

  // Handle Excel Serial Number (e.g. 45540)
  if (/^\d{5}$/.test(str)) {
    const num = Number(str);
    if (num >= 25000 && num <= 75000) {
      const utcMs = (num - 25569) * 86400 * 1000;
      const d = new Date(utcMs);
      if (!isNaN(d.getTime())) {
        return validateAndFormatDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
      }
    }
  }

  // Strip trailing time e.g. " 00:00:00", " 12:00:00 AM", "T00:00:00.000Z", " 14:30"
  const cleanStr = str
    .replace(/[T\s]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:\s*[AP]M)?(?:Z|[+-]\d{2}(?::?\d{2})?)?$/i, '')
    .trim();

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD (Year first)
  const ymdMatch = cleanStr.match(/^(\d{4})[-/. ](\d{1,2})[-/. ](\d{1,2})$/);
  if (ymdMatch) {
    const res = validateAndFormatDate(ymdMatch[1], ymdMatch[2], ymdMatch[3]);
    if (res) return res;
  }

  // Pattern 2: D/M/Y or M/D/Y with slash, dash, dot, or space (e.g. 9/5/2026, 05-09-2026)
  const dmyMatch = cleanStr.match(/^(\d{1,2})([-/. ])(\d{1,2})\2(\d{2,4})$/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    const sep = dmyMatch[2];
    let p2 = parseInt(dmyMatch[3], 10);
    let rawYear = parseInt(dmyMatch[4], 10);

    if (rawYear < 100) {
      rawYear += rawYear < 70 ? 2000 : 1900;
    }

    let year = rawYear;
    let month = null;
    let day = null;

    if (p1 > 12 && p2 <= 12) {
      // p1 must be day, p2 must be month (e.g. 25/9/2026)
      day = p1;
      month = p2;
    } else if (p2 > 12 && p1 <= 12) {
      // p2 must be day, p1 must be month (e.g. 9/25/2026)
      month = p1;
      day = p2;
    } else {
      // Both <= 12 (e.g. 9/5/2026 or 05-09-2026)
      // Slashes '/' are standard Google Sheets / US format (M/D/YYYY)
      // Dashes '-' or dots '.' are standard DD-MM-YYYY format
      if (sep === '/') {
        month = p1;
        day = p2;
      } else {
        day = p1;
        month = p2;
      }
    }

    const res = validateAndFormatDate(year, month, day);
    if (res) return res;
  }

  // Pattern 3a: Day MonthName Year (e.g. "05 Sep 2026", "5-September-2026", "5th September 2026")
  const textDmyMatch = cleanStr.match(/^(\d{1,2})(?:st|nd|rd|th)?[-/\s.,]+([a-zA-Z]+)[-/\s.,]+(\d{2,4})$/);
  if (textDmyMatch) {
    const day = parseInt(textDmyMatch[1], 10);
    const monthKey = textDmyMatch[2].toLowerCase();
    const month = MONTH_NAME_MAP[monthKey];
    let year = parseInt(textDmyMatch[3], 10);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    if (month) {
      const res = validateAndFormatDate(year, month, day);
      if (res) return res;
    }
  }

  // Pattern 3b: MonthName Day Year (e.g. "Sep 05, 2026", "September 5 2026", "Sep-05-2026")
  const textMdyMatch = cleanStr.match(/^([a-zA-Z]+)[-/\s.,]+(\d{1,2})(?:st|nd|rd|th)?(?:[-/\s.,]+|,?\s+)(\d{2,4})$/);
  if (textMdyMatch) {
    const monthKey = textMdyMatch[1].toLowerCase();
    const month = MONTH_NAME_MAP[monthKey];
    const day = parseInt(textMdyMatch[2], 10);
    let year = parseInt(textMdyMatch[3], 10);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    if (month) {
      const res = validateAndFormatDate(year, month, day);
      if (res) return res;
    }
  }

  // Pattern 3c: Year MonthName Day (e.g. "2026-Sep-05", "2026 Sep 5")
  const textYmdMatch = cleanStr.match(/^(\d{4})[-/\s.,]+([a-zA-Z]+)[-/\s.,]+(\d{1,2})(?:st|nd|rd|th)?$/);
  if (textYmdMatch) {
    const year = parseInt(textYmdMatch[1], 10);
    const monthKey = textYmdMatch[2].toLowerCase();
    const month = MONTH_NAME_MAP[monthKey];
    const day = parseInt(textYmdMatch[3], 10);
    if (month) {
      const res = validateAndFormatDate(year, month, day);
      if (res) return res;
    }
  }

  // Fallback: Native Date Parse
  const parsedFallback = new Date(str);
  if (!isNaN(parsedFallback.getTime())) {
    const y = parsedFallback.getFullYear();
    const m = parsedFallback.getMonth() + 1;
    const d = parsedFallback.getDate();
    return validateAndFormatDate(y, m, d);
  }

  return null;
}

/**
 * Detect file type / ext from URL
 */
function detectUrlTypeAndExt(url) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname || '';
    const ext = pathname.split('.').pop()?.toLowerCase() || '';
    let category = 'link';

    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) {
      category = 'image';
    } else if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) {
      category = 'video';
    } else if (['pdf'].includes(ext)) {
      category = 'pdf';
    } else if (['csv', 'xls', 'xlsx'].includes(ext)) {
      category = 'csv';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      category = 'doc';
    }

    const name = pathname.split('/').filter(Boolean).pop() || parsed.hostname;
    return {
      name: decodeURIComponent(name),
      type: category,
      ext: ext ? ext.toUpperCase() : 'LINK',
    };
  } catch (e) {
    return {
      name: 'External Link',
      type: 'link',
      ext: 'LINK',
    };
  }
}

/**
 * Check if current user has permission to assign the target user
 */
export function checkUserAssignmentPermission(targetUser, currentUser, isAssistant = false) {
  if (!currentUser || !targetUser) return false;

  const role = currentUser.role || 'team_member';
  const isAdmin = role === 'admin' || role === 'it_support_admin';
  const isHod = role === 'hod';
  const isTeamMember = !isAdmin && !isHod;

  // Admins can assign to anyone active
  if (isAdmin) return true;

  // HOD can assign:
  // - Self
  // - Members in own department (team_member)
  // - Other HODs (cross-department)
  // - Admins
  if (isHod) {
    if (targetUser.id === currentUser.id) return true;
    if (targetUser.department_id === currentUser.department_id && targetUser.role === 'team_member') return true;
    if (targetUser.role === 'admin' || targetUser.role === 'it_support_admin') return true;
    if (targetUser.role === 'hod') return true;
    return false;
  }

  // Team Member can:
  // - Self-assign
  // - Assign to any HOD
  // Assistants:
  // - Can assign team_members or hod in same department
  if (isTeamMember) {
    if (isAssistant) {
      return (
        targetUser.id !== currentUser.id &&
        targetUser.department_id === currentUser.department_id &&
        (targetUser.role === 'team_member' || targetUser.role === 'hod')
      );
    }
    if (targetUser.id === currentUser.id) return true;
    if (targetUser.role === 'hod') return true;
    return false;
  }

  return targetUser.id === currentUser.id;
}

/**
 * Resolve a user token (Custom ID, User ID, Email, or Full Name) against active directory users
 */
export function resolveUserToken(token, activeUsers = []) {
  if (!token) return { user: null, error: null };
  const cleaned = String(token).trim();
  if (!cleaned) return { user: null, error: null };

  const lower = cleaned.toLowerCase();

  // 1. Priority: Exact Custom User ID / Employee ID match (case-insensitive, e.g. UP-013, HOD-10, 101)
  const customIdMatch = activeUsers.find(
    (u) => u.custom_id && String(u.custom_id).trim().toLowerCase() === lower
  );
  if (customIdMatch) {
    return { user: customIdMatch, error: null };
  }

  // 2. Exact internal user ID match (e.g. usr-1786...)
  const idMatch = activeUsers.find(
    (u) => u.id && String(u.id).trim().toLowerCase() === lower
  );
  if (idMatch) {
    return { user: idMatch, error: null };
  }

  // 3. Exact email match (case-insensitive)
  const emailMatch = activeUsers.find(
    (u) => (u.email || '').trim().toLowerCase() === lower
  );
  if (emailMatch) {
    return { user: emailMatch, error: null };
  }

  // 4. Exact full-name match fallback
  const nameMatches = activeUsers.filter(
    (u) => (u.full_name || '').trim().toLowerCase() === lower
  );

  if (nameMatches.length === 1) {
    return { user: nameMatches[0], error: null };
  }

  if (nameMatches.length > 1) {
    return {
      user: null,
      error: `Ambiguous user "${cleaned}". Multiple team members share this name. Use their Custom ID (e.g. UP-013) or email address instead.`,
    };
  }

  return {
    user: null,
    error: `User "${cleaned}" was not found or is inactive. You can use their Custom ID (e.g. UP-013) or work email.`,
  };
}

/**
 * Validate and parse a raw CSV data row
 */
export function validateCsvRow(rowObject, rowNumber, users = [], currentUser = null, departments = []) {
  const errors = [];
  const warnings = [];

  // Filter only active, selectable directory users
  const activeUsers = (users || []).filter(
    (u) =>
      u.is_active &&
      !u.exclude_from_directory &&
      !u.is_system_account &&
      u.role !== 'it_support_admin' &&
      u.role !== 'it_support'
  );

  // 1. Task Title (Required)
  const rawTitle = rowObject.title || '';
  const title = String(rawTitle).trim();
  if (!title) {
    errors.push('Task title is required.');
  }

  // 2. Description (Optional)
  const description = String(rowObject.description || '').trim();

  // 3. Assignees (Required, Pipe-separated)
  const rawAssignees = String(rowObject.assignee || '').trim();
  const resolvedAssignees = [];
  const assignedUserIds = new Set();

  if (!rawAssignees) {
    errors.push('Assignee is required.');
  } else {
    const tokens = rawAssignees
      .split('|')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      errors.push('Assignee is required.');
    } else {
      for (const token of tokens) {
        const { user, error } = resolveUserToken(token, activeUsers);
        if (error) {
          errors.push(error);
        } else if (user) {
          if (assignedUserIds.has(user.id)) {
            warnings.push(`Duplicate assignee "${user.full_name}" in row was normalized.`);
          } else {
            // Check assignment RBAC permission
            const hasPermission = checkUserAssignmentPermission(user, currentUser, false);
            if (!hasPermission) {
              errors.push(
                `You don't have permission to assign tasks to "${user.full_name || user.email}" based on your role.`
              );
            } else {
              assignedUserIds.add(user.id);
              resolvedAssignees.push(user);
            }
          }
        }
      }
    }
  }

  // 4. Assistant Users (Optional, Pipe-separated)
  const rawAssistants = String(rowObject.assistants || '').trim();
  const resolvedAssistants = [];
  const assistantUserIds = new Set();

  if (rawAssistants) {
    const tokens = rawAssistants
      .split('|')
      .map((t) => t.trim())
      .filter(Boolean);

    for (const token of tokens) {
      const { user, error } = resolveUserToken(token, activeUsers);
      if (error) {
        // Unknown optional assistant is treated as blocking error so wrong workflows aren't silently created
        errors.push(`Assistant error: ${error}`);
      } else if (user) {
        if (assignedUserIds.has(user.id)) {
          errors.push(`User "${user.full_name}" cannot be both an Assignee and an Assistant on the same task.`);
        } else if (assistantUserIds.has(user.id)) {
          warnings.push(`Duplicate assistant "${user.full_name}" was normalized.`);
        } else {
          // Check assistant RBAC permission
          const hasPermission = checkUserAssignmentPermission(user, currentUser, true);
          if (!hasPermission) {
            errors.push(
              `You don't have permission to assign "${user.full_name || user.email}" as an Assistant.`
            );
          } else {
            assistantUserIds.add(user.id);
            resolvedAssistants.push(user);
          }
        }
      }
    }
  }

  // 5. Priority (Optional, defaults to 'medium')
  const rawPriority = String(rowObject.priority || '').trim();
  let priority = 'medium';
  if (rawPriority) {
    const lowerP = rawPriority.toLowerCase();
    if (['urgent', 'high', 'medium', 'low'].includes(lowerP)) {
      priority = lowerP;
    } else {
      errors.push(`Invalid Priority "${rawPriority}". Use Urgent, High, Medium, or Low.`);
    }
  }

  // 6. Status (Optional, defaults to 'pending')
  const rawStatus = String(rowObject.status || '').trim();
  let status = 'pending';
  if (rawStatus) {
    const lowerS = rawStatus.toLowerCase().replace(/[\s-]+/g, '_');
    if (lowerS === 'pending') {
      status = 'pending';
    } else if (lowerS === 'in_progress' || lowerS === 'inprogress') {
      status = 'in_progress';
    } else if (lowerS === 'completed') {
      errors.push('Cannot import tasks with Completed status. Tasks must be created as Pending or In Progress.');
    } else {
      errors.push(`Invalid Status "${rawStatus}". Use Pending or In Progress.`);
    }
  }

  // 7. Start Date (Required, YYYY-MM-DD or DD-MM-YYYY)
  const rawStartDate = String(rowObject.startDate || '').trim();
  let startDate = '';
  if (!rawStartDate) {
    errors.push('Start Date is required.');
  } else {
    startDate = parseStrictDateString(rawStartDate);
    if (!startDate) {
      errors.push(`Invalid Start Date "${rawStartDate}". Use YYYY-MM-DD or DD-MM-YYYY format (e.g. 2026-09-05 or 05-09-2026).`);
    }
  }

  // 8. Due Date (Optional, YYYY-MM-DD or DD-MM-YYYY)
  const rawDueDate = String(rowObject.dueDate || '').trim();
  let dueDate = null;
  if (rawDueDate) {
    dueDate = parseStrictDateString(rawDueDate);
    if (!dueDate) {
      errors.push(`Invalid Due Date "${rawDueDate}". Use YYYY-MM-DD or DD-MM-YYYY format (e.g. 2026-09-15 or 15-09-2026).`);
    } else if (startDate && new Date(dueDate) < new Date(startDate)) {
      errors.push(`Due Date (${dueDate}) cannot be earlier than Start Date (${startDate}).`);
    }
  }

  // 9. Attachments (Optional, Pipe-separated HTTPS URLs)
  const rawAttachments = String(rowObject.attachments || '').trim();
  const parsedAttachments = [];
  if (rawAttachments) {
    const tokens = rawAttachments
      .split('|')
      .map((t) => t.trim())
      .filter(Boolean);

    for (const token of tokens) {
      if (/^https:\/\/[^\s]+$/i.test(token)) {
        const info = detectUrlTypeAndExt(token);
        parsedAttachments.push({
          id: `att-csv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: info.name,
          url: token,
          size: 0,
          type: info.type,
          ext: info.ext,
          is_external: true,
        });
      } else {
        warnings.push(`Non-HTTPS or invalid link "${token}" was ignored.`);
      }
    }
  }

  // 10. Department Resolution (Derived from primary assignee or current user)
  const primaryAssignee = resolvedAssignees[0];
  let resolvedDepartmentId = null;
  if (primaryAssignee && primaryAssignee.department_id) {
    resolvedDepartmentId = primaryAssignee.department_id;
  } else if (currentUser?.department_id) {
    resolvedDepartmentId = currentUser.department_id;
  }

  const isValid = errors.length === 0;

  return {
    rowNumber,
    isValid,
    hasWarnings: warnings.length > 0,
    errors,
    warnings,
    raw: rowObject,
    taskData: {
      title,
      description,
      department_id: resolvedDepartmentId,
      assigned_to: Array.from(assignedUserIds),
      assisted_by: Array.from(assistantUserIds),
      attachments: parsedAttachments,
      start_date: startDate,
      due_date: dueDate,
      priority,
      status,
    },
    resolvedAssignees,
    resolvedAssistants,
  };
}

/**
 * Parse an uploaded CSV File and validate all rows
 */
export function parseAndValidateCsvFile(file, users = [], currentUser = null, departments = []) {
  return new Promise((resolve) => {
    if (!file) {
      return resolve({
        fileError: 'No file provided.',
        rows: [],
        totalRows: 0,
        readyCount: 0,
        errorCount: 0,
        warningCount: 0,
      });
    }

    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
      return resolve({
        fileError: 'Invalid file format. Please upload a .csv file.',
        rows: [],
        totalRows: 0,
        readyCount: 0,
        errorCount: 0,
        warningCount: 0,
      });
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => {
        const normalized = normalizeHeaderKey(header);
        return HEADER_KEY_MAP[normalized] || header.trim();
      },
      complete: (results) => {
        const { data, meta, errors: parseErrors } = results;

        if (parseErrors && parseErrors.length > 0) {
          const firstError = parseErrors[0];
          return resolve({
            fileError: `CSV parse error at row ${firstError.row || 1}: ${firstError.message}`,
            rows: [],
            totalRows: 0,
            readyCount: 0,
            errorCount: 0,
            warningCount: 0,
          });
        }

        const headers = (meta.fields || []).map((h) => normalizeHeaderKey(h));

        // Check required columns: tasktitle, assignee, startdate
        const hasTitle = headers.some((h) => ['tasktitle', 'title'].includes(h));
        const hasAssignee = headers.some((h) => ['assignee', 'assignees', 'assignedto', 'assignedmembers'].includes(h));
        const hasStartDate = headers.some((h) => ['startdate', 'start'].includes(h));

        const missingRequired = [];
        if (!hasTitle) missingRequired.push('Task title*');
        if (!hasAssignee) missingRequired.push('Assignee*');
        if (!hasStartDate) missingRequired.push('Start Date*');

        if (missingRequired.length > 0) {
          return resolve({
            fileError: `Required column(s) missing: ${missingRequired.join(', ')}`,
            rows: [],
            totalRows: 0,
            readyCount: 0,
            errorCount: 0,
            warningCount: 0,
          });
        }

        if (!data || data.length === 0) {
          return resolve({
            fileError: 'The uploaded CSV file contains no data rows.',
            rows: [],
            totalRows: 0,
            readyCount: 0,
            errorCount: 0,
            warningCount: 0,
          });
        }

        const rows = data.map((rawRow, idx) => {
          const rowNumber = idx + 2; // Row 1 is header
          return validateCsvRow(rawRow, rowNumber, users, currentUser, departments);
        });

        const readyCount = rows.filter((r) => r.isValid).length;
        const errorCount = rows.filter((r) => !r.isValid).length;
        const warningCount = rows.filter((r) => r.hasWarnings).length;

        resolve({
          fileError: null,
          rows,
          totalRows: rows.length,
          readyCount,
          errorCount,
          warningCount,
        });
      },
      error: (err) => {
        resolve({
          fileError: `Failed to read CSV file: ${err.message || 'Unknown error'}`,
          rows: [],
          totalRows: 0,
          readyCount: 0,
          errorCount: 0,
          warningCount: 0,
        });
      },
    });
  });
}
