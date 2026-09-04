import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { getAuthorizedNavigationItems } from '../../config/navigationConfig';
import { isTaskInDepartment, getTaskAssigneeIds, getTaskAssistantIds } from '../../utils/taskDepartmentUtils';
import {
  canUserViewTask,
  canViewDepartments,
  canViewUsers,
} from '../../utils/rbac/permissionManager';
import { getStoredRecentItems, addRecentItem, resolveRecentItems } from '../../utils/recentItems';
import { searchCommandPalette } from '../../utils/commandSearch';
import { CommandSearchInput } from './CommandSearchInput';
import { CommandSection } from './CommandSection';
import { CommandResultRow } from './CommandResultRow';
import { CommandEmptyState } from './CommandEmptyState';
import {
  PlusSquare,
  UserRoundPlus,
  CornerDownLeft,
  ArrowUpDown,
} from 'lucide-react';

export function CommandPalette({
  isOpen,
  onClose,
  onOpenTask,
  onOpenCreateTask,
  onOpenCreatePersonalTask,
}) {
  const { currentUser, users = [] } = useAuth();
  const { tasks = [], departments = [] } = useAppData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [storedRecents, setStoredRecents] = useState([]);

  const inputRef = useRef(null);
  const previousActiveElementRef = useRef(null);

  const currentUserId = currentUser?.id;

  // 1. Scoped Tasks according to unified RBAC permissions
  const scopedTasks = useMemo(() => {
    const nonDeleted = (tasks || []).filter((t) => !t.is_deleted);
    return nonDeleted.filter((t) => canUserViewTask(currentUser, t, users, departments));
  }, [tasks, currentUser, users, departments]);

  // 2. Accessible Departments
  const accessibleDepartments = useMemo(() => {
    if (canViewDepartments(currentUser)) {
      return departments || [];
    }
    return [];
  }, [departments, currentUser]);

  // 3. Accessible Directory Users (exclude hidden/system/inactive accounts)
  const accessibleUsers = useMemo(() => {
    if (!canViewUsers(currentUser)) return [];
    return (users || []).filter(
      (u) =>
        u &&
        !u.exclude_from_directory &&
        !u.is_system_account &&
        u.is_active !== false
    );
  }, [users, currentUser]);

  // 4. Departments Map for O(1) lookups
  const departmentsMap = useMemo(() => {
    const map = {};
    (departments || []).forEach((d) => {
      if (d?.id) {
        map[d.id] = d;
        map[String(d.id)] = d;
      }
    });
    return map;
  }, [departments]);

  // 5. Authorized Navigation Items
  const navigationItems = useMemo(() => {
    return getAuthorizedNavigationItems(currentUser);
  }, [currentUser]);

  // 6. Quick Actions (based on permissions)
  const quickActions = useMemo(() => {
    const actions = [];

    // Create Task: available to Admin, IT Support, HOD, or users permitted to assign tasks
    actions.push({
      id: 'action-create-task',
      type: 'action',
      label: 'Create Task',
      title: 'Create Task',
      secondary: 'Assign and track a new company task',
      icon: PlusSquare,
      keywords: ['create task', 'new task', 'add task', 'make task', 'assign task'],
      action: () => {
        if (onOpenCreateTask) {
          onOpenCreateTask();
        } else {
          navigate('/tasks/create');
        }
      },
    });

    // Create Personal Task: available for personal work
    actions.push({
      id: 'action-create-personal',
      type: 'action',
      label: 'Create Personal Task',
      title: 'Create Personal Task',
      secondary: 'Quick private task for your personal checklist',
      icon: UserRoundPlus,
      keywords: ['create personal task', 'personal task', 'private note', 'todo', 'personal'],
      action: () => {
        if (onOpenCreatePersonalTask) {
          onOpenCreatePersonalTask();
        } else {
          navigate('/personal-tasks');
        }
      },
    });

    return actions;
  }, [onOpenCreateTask, onOpenCreatePersonalTask, navigate]);

  // 7. Load & Resolve Recents when palette opens
  useEffect(() => {
    if (isOpen) {
      const recents = getStoredRecentItems(currentUserId);
      setStoredRecents(recents);
    }
  }, [isOpen, currentUserId]);

  const resolvedRecents = useMemo(() => {
    return resolveRecentItems(
      storedRecents,
      { scopedTasks, accessibleDepartments, accessibleUsers },
      5
    );
  }, [storedRecents, scopedTasks, accessibleDepartments, accessibleUsers]);

  // 8. Determine Active Results (Empty Default vs Search Mode)
  const isSearching = Boolean(searchQuery.trim());

  const searchResults = useMemo(() => {
    if (!isSearching) {
      return { groupedResults: [], flatResults: [], totalCount: 0 };
    }
    return searchCommandPalette({
      query: searchQuery,
      scopedTasks,
      accessibleDepartments,
      accessibleUsers,
      navigationItems,
      quickActions,
      departmentsMap,
      maxTotalResults: 12,
    });
  }, [
    isSearching,
    searchQuery,
    scopedTasks,
    accessibleDepartments,
    accessibleUsers,
    navigationItems,
    quickActions,
    departmentsMap,
  ]);

  // 9. Flat List of Selectable Items for Keyboard Traversal
  const flatItems = useMemo(() => {
    if (isSearching) {
      return searchResults.flatResults;
    }

    const defaultItems = [];

    // Quick Actions
    quickActions.forEach((act) => {
      defaultItems.push({
        ...act,
        groupKey: 'QUICK ACTIONS',
      });
    });

    // Default Navigation items (Home, All Tasks, My Tasks, Departments, Team, Inbox, Reports)
    const primaryNavIds = [
      'nav-home',
      'nav-all-tasks',
      'nav-my-tasks',
      'nav-departments',
      'nav-team',
      'nav-inbox',
      'nav-reports',
    ];
    navigationItems
      .filter((n) => primaryNavIds.includes(n.id))
      .forEach((nav) => {
        defaultItems.push({
          id: nav.id,
          type: 'nav',
          rawEntity: nav,
          title: nav.label,
          icon: nav.icon,
          groupKey: 'NAVIGATION',
          to: nav.to,
        });
      });

    // Recents
    resolvedRecents.forEach((rec) => {
      defaultItems.push({
        ...rec,
        groupKey: 'RECENT',
      });
    });

    return defaultItems;
  }, [isSearching, searchResults.flatResults, quickActions, navigationItems, resolvedRecents]);

  // 10. Reset selection when query changes or on open
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, isOpen]);

  // 11. Focus trapping, body scroll locking, and restoring focus on close
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      // Small timeout to guarantee DOM node readiness
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    } else {
      document.body.style.overflow = 'unset';
      setSearchQuery('');
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // 12. Execute Item Action Handler
  const executeItem = useCallback(
    (item) => {
      if (!item) return;

      onClose();

      if (item.type === 'action') {
        if (typeof item.action === 'function') {
          item.action();
        }
      } else if (item.type === 'task') {
        if (item.rawEntity?.id) {
          addRecentItem({ type: 'task', id: item.rawEntity.id }, currentUserId);
          if (onOpenTask) {
            onOpenTask(item.rawEntity.id);
          } else {
            navigate(`/tasks/${item.rawEntity.id}`);
          }
        }
      } else if (item.type === 'department') {
        if (item.rawEntity?.id) {
          addRecentItem({ type: 'department', id: item.rawEntity.id }, currentUserId);
          navigate(`/departments/${item.rawEntity.id}`);
        }
      } else if (item.type === 'user') {
        if (item.rawEntity?.id) {
          addRecentItem({ type: 'user', id: item.rawEntity.id }, currentUserId);
          if (item.rawEntity.id === currentUserId) {
            navigate('/profile');
          } else {
            navigate(`/team?search=${encodeURIComponent(item.rawEntity.full_name || '')}`);
          }
        }
      } else if (item.type === 'nav') {
        const dest = item.rawEntity?.to || item.to;
        if (dest) {
          navigate(dest);
        }
      }
    },
    [onClose, currentUserId, onOpenTask, navigate]
  );

  // 13. Keyboard event handler for search input
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % flatItems.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (flatItems.length > 0 && selectedIndex >= 0 && selectedIndex < flatItems.length) {
        executeItem(flatItems[selectedIndex]);
      }
    }
  };

  if (!isOpen) return null;

  const selectedItemId = flatItems[selectedIndex]?.id || null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/15 backdrop-blur-[0.5px] z-[60] flex justify-center items-start pt-[12vh] sm:pt-[15vh] px-3 animate-fade-in font-['Inter']"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Command Palette"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Command Palette Modal Box */}
      <div
        className="w-full max-w-[620px] max-h-[min(640px,78vh)] bg-white rounded-[12px] border border-[#E5E7EB] shadow-[0_18px_50px_rgba(24,24,27,0.16)] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <CommandSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          onKeyDown={handleKeyDown}
          onClose={onClose}
          inputRef={inputRef}
        />

        {/* Scrollable Results Container */}
        <div
          id="command-palette-results"
          role="listbox"
          aria-label="Search suggestions"
          className="flex-1 overflow-y-auto p-2 divide-y divide-[#F4F4F5]"
        >
          {isSearching ? (
            // SEARCH RESULTS MODE
            searchResults.groupedResults.length === 0 ? (
              <CommandEmptyState query={searchQuery} />
            ) : (
              searchResults.groupedResults.map((group) => (
                <CommandSection key={group.key} label={group.label}>
                  {group.items.map((item) => {
                    const isSelected = item.id === selectedItemId;
                    return (
                      <CommandResultRow
                        key={item.id}
                        item={item}
                        isSelected={isSelected}
                        onSelect={() => executeItem(item)}
                        onMouseEnter={() => {
                          const idx = flatItems.findIndex((f) => f.id === item.id);
                          if (idx !== -1) setSelectedIndex(idx);
                        }}
                      />
                    );
                  })}
                </CommandSection>
              ))
            )
          ) : (
            // DEFAULT / EMPTY QUERY MODE
            <>
              {/* 1. QUICK ACTIONS */}
              {quickActions.length > 0 && (
                <CommandSection label="QUICK ACTIONS">
                  {quickActions.map((act) => {
                    const isSelected = act.id === selectedItemId;
                    return (
                      <CommandResultRow
                        key={act.id}
                        item={act}
                        isSelected={isSelected}
                        onSelect={() => executeItem(act)}
                        onMouseEnter={() => {
                          const idx = flatItems.findIndex((f) => f.id === act.id);
                          if (idx !== -1) setSelectedIndex(idx);
                        }}
                      />
                    );
                  })}
                </CommandSection>
              )}

              {/* 2. NAVIGATION */}
              <CommandSection label="NAVIGATION">
                {flatItems
                  .filter((f) => f.groupKey === 'NAVIGATION')
                  .map((nav) => {
                    const isSelected = nav.id === selectedItemId;
                    return (
                      <CommandResultRow
                        key={nav.id}
                        item={nav}
                        isSelected={isSelected}
                        onSelect={() => executeItem(nav)}
                        onMouseEnter={() => {
                          const idx = flatItems.findIndex((f) => f.id === nav.id);
                          if (idx !== -1) setSelectedIndex(idx);
                        }}
                      />
                    );
                  })}
              </CommandSection>

              {/* 3. RECENT */}
              {resolvedRecents.length > 0 && (
                <CommandSection label="RECENT">
                  {resolvedRecents.map((rec) => {
                    const isSelected = rec.id === selectedItemId;
                    return (
                      <CommandResultRow
                        key={rec.id}
                        item={rec}
                        isSelected={isSelected}
                        onSelect={() => executeItem(rec)}
                        onMouseEnter={() => {
                          const idx = flatItems.findIndex((f) => f.id === rec.id);
                          if (idx !== -1) setSelectedIndex(idx);
                        }}
                      />
                    );
                  })}
                </CommandSection>
              )}
            </>
          )}
        </div>

        {/* Footer Key Hints */}
        <div className="h-9 px-4 border-t border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between text-[11px] text-[#71717A] flex-shrink-0 select-none hidden sm:flex">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-[#8B8B95]" />
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.2 bg-white border border-[#E5E7EB] rounded-[3px] text-[9.5px] font-mono shadow-2xs">
                ↵
              </kbd>
              <span>Open</span>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <kbd className="px-1 py-0.2 bg-white border border-[#E5E7EB] rounded-[3px] text-[9.5px] font-mono shadow-2xs">
              ESC
            </kbd>
            <span>Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
