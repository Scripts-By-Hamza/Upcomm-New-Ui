import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { INITIAL_DEPARTMENTS } from '../data/dummyDepartments';
import { INITIAL_TASKS } from '../data/dummyTasks';
import { INITIAL_DELETE_REQUESTS } from '../data/dummyDeleteRequests';
import { INITIAL_ACTIVITY_LOGS, INITIAL_SETTINGS, INITIAL_PERMISSIONS, INITIAL_INTEGRATIONS } from '../data/dummyActivityLogs';
import { INITIAL_REPORTS } from '../data/dummyReports';
import { INITIAL_PERSONAL_TASKS } from '../data/dummyPersonalTasks';
import { INITIAL_MONTHLY_TARGETS, INITIAL_MONTHLY_TARGET_COMMENTS } from '../data/dummyMonthlyTargets';
import {
  INITIAL_CONVERSATIONS,
  INITIAL_CONVERSATION_PARTICIPANTS,
  INITIAL_MESSAGES,
  INITIAL_MESSAGE_REACTIONS,
  INITIAL_PINNED_MESSAGES,
} from '../data/dummyMessages';
import { calculateMonthEndDate } from '../utils/monthlyTargets/monthlyTargetUtils';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { canReviewCompletionRequest, canReviewDeleteRequest } from '../utils/rbac/permissionManager';
import {
  playNotificationSound,
  preloadNotificationSound,
  initNotificationAudioUnlock,
  resetNotificationAudioState,
  SOUND_ENABLED_EVENT_TYPES,
  playNotificationChime,
} from '../utils/audio/notificationSound';

const AppDataContext = createContext(null);

// Helper function to extract and parse multi-assignees and attachments from task
export function parseTaskAssignees(task) {
  if (!task) return task;
  let assigned_to_ids = task.assigned_to_ids;
  let attachments = task.attachments || [];

  if (!assigned_to_ids || !Array.isArray(assigned_to_ids) || assigned_to_ids.length === 0) {
    assigned_to_ids = [task.assigned_to].filter(Boolean);
    if (task.description && task.description.includes('<!--assignees:')) {
      const match = task.description.match(/<!--assignees:(.*?)-->/);
      if (match && match[1]) {
        try {
          const parsed = JSON.parse(match[1]);
          if (Array.isArray(parsed) && parsed.length > 0) {
            assigned_to_ids = parsed;
          }
        } catch (e) {}
      }
    }
  }

  if ((!attachments || attachments.length === 0) && task.description && task.description.includes('<!--attachments:')) {
    const match = task.description.match(/<!--attachments:(.*?)-->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          attachments = parsed;
        }
      } catch (e) {}
    }
  }

  let assisted_by = task.assisted_by || null;
  let assisted_by_ids = Array.isArray(task.assisted_by_ids)
    ? task.assisted_by_ids
    : task.assisted_by
    ? (Array.isArray(task.assisted_by) ? task.assisted_by : [task.assisted_by])
    : [];

  if (task.description && task.description.includes('<!--assisted_by:')) {
    const match = task.description.match(/<!--assisted_by:(.*?)-->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          assisted_by_ids = parsed;
          assisted_by = parsed[0];
        } else if (typeof parsed === 'string') {
          assisted_by_ids = [parsed];
          assisted_by = parsed;
        }
      } catch (e) {
        assisted_by = match[1].trim();
        assisted_by_ids = [match[1].trim()];
      }
    }
  }

  // Mutual exclusion enforcement on parse: assistants are never duplicated as assignees
  if (assisted_by_ids.length > 0 && assigned_to_ids.length > 0) {
    const assistantSet = new Set(assisted_by_ids);
    const deduplicatedAssignees = assigned_to_ids.filter((id) => !assistantSet.has(id));
    if (deduplicatedAssignees.length > 0) {
      assigned_to_ids = deduplicatedAssignees;
    }
  }

  return { ...task, assigned_to_ids, attachments, assisted_by, assisted_by_ids };
}

export function cleanTaskDescription(description) {
  if (!description) return '';
  return description
    .replace(/<!--assignees:.*?-->/g, '')
    .replace(/<!--attachments:.*?-->/g, '')
    .replace(/<!--assisted_by:.*?-->/g, '')
    .trim();
}

export function AppDataProvider({ children }) {
  const { currentUser, users, setUsers } = useAuth();
  const currentUserRef = useRef(currentUser);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [deleteRequests, setDeleteRequests] = useState(INITIAL_DELETE_REQUESTS);
  const [completionRequests, setCompletionRequests] = useState([]);
  const [activityLogs, setActivityLogs] = useState(INITIAL_ACTIVITY_LOGS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [personalTasks, setPersonalTasks] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
  const [integrations, setIntegrations] = useState(INITIAL_INTEGRATIONS);

  // Dedicated state for Monthly Targets & KPIs (isolated from normal company tasks)
  const [monthlyTargets, setMonthlyTargets] = useState(() => {
    try {
      const saved = localStorage.getItem('upcomm_monthly_targets');
      return saved ? JSON.parse(saved) : INITIAL_MONTHLY_TARGETS;
    } catch (e) {
      return INITIAL_MONTHLY_TARGETS;
    }
  });

  const [monthlyTargetComments, setMonthlyTargetComments] = useState(() => {
    try {
      const saved = localStorage.getItem('upcomm_monthly_target_comments');
      return saved ? JSON.parse(saved) : INITIAL_MONTHLY_TARGET_COMMENTS;
    } catch (e) {
      return INITIAL_MONTHLY_TARGET_COMMENTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('upcomm_monthly_targets', JSON.stringify(monthlyTargets));
    } catch (e) {}
  }, [monthlyTargets]);

  useEffect(() => {
    try {
      localStorage.setItem('upcomm_monthly_target_comments', JSON.stringify(monthlyTargetComments));
    } catch (e) {}
  }, [monthlyTargetComments]);

  // Dedicated state for Private Messaging, Groups, Broadcast & Moderation
  const [conversations, setConversations] = useState(() => {
    try {
      const saved = localStorage.getItem('upcomm_conversations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_CONVERSATIONS;
    } catch (e) {
      return INITIAL_CONVERSATIONS;
    }
  });

  const [conversationParticipants, setConversationParticipants] = useState(() => {
    try {
      const saved = localStorage.getItem('upcomm_conversation_participants');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_CONVERSATION_PARTICIPANTS;
    } catch (e) {
      return INITIAL_CONVERSATION_PARTICIPANTS;
    }
  });

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('upcomm_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_MESSAGES;
    } catch (e) {
      return INITIAL_MESSAGES;
    }
  });

  const [messageReactions, setMessageReactions] = useState(() => {
    try {
      const saved = localStorage.getItem('upcomm_message_reactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_MESSAGE_REACTIONS || [];
    } catch (e) {
      return INITIAL_MESSAGE_REACTIONS || [];
    }
  });

  const [pinnedMessages, setPinnedMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('upcomm_pinned_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return INITIAL_PINNED_MESSAGES || [];
    } catch (e) {
      return INITIAL_PINNED_MESSAGES || [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('upcomm_conversations', JSON.stringify(conversations));
    } catch (e) {}
  }, [conversations]);

  useEffect(() => {
    try {
      localStorage.setItem('upcomm_conversation_participants', JSON.stringify(conversationParticipants));
    } catch (e) {}
  }, [conversationParticipants]);

  useEffect(() => {
    try {
      localStorage.setItem('upcomm_messages', JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem('upcomm_message_reactions', JSON.stringify(messageReactions));
    } catch (e) {}
  }, [messageReactions]);

  useEffect(() => {
    try {
      localStorage.setItem('upcomm_pinned_messages', JSON.stringify(pinnedMessages));
    } catch (e) {}
  }, [pinnedMessages]);

  // Synchronized refs for realtime listeners & sound evaluations
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const conversationParticipantsRef = useRef(conversationParticipants);
  useEffect(() => {
    conversationParticipantsRef.current = conversationParticipants;
  }, [conversationParticipants]);

  const realtimeReadyRef = useRef(false);

  // Initialize centralized notification audio preload & unlock on authentication
  useEffect(() => {
    if (!currentUser) {
      resetNotificationAudioState();
      realtimeReadyRef.current = false;
    } else {
      initNotificationAudioUnlock();
      preloadNotificationSound();
    }
  }, [currentUser?.id]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Helper to parse update rows and extract seen_receipts metadata
  const parseUpdateRow = (u) => {
    if (!u) return u;
    const rawAtts = Array.isArray(u.attachments) ? u.attachments : [];
    const realAtts = rawAtts.filter((a) => a && a.__type !== 'seen_receipts');
    const seenMeta = rawAtts.find((a) => a && a.__type === 'seen_receipts');
    const dbSeen = Array.isArray(seenMeta?.seen_by) ? seenMeta.seen_by : [];
    const directSeen = Array.isArray(u.seen_by) ? u.seen_by : [];
    const mergedSeen = Array.from(new Set([u.user_id, ...dbSeen, ...directSeen].filter(Boolean)));
    return {
      ...u,
      attachments: realAtts,
      seen_by: mergedSeen,
    };
  };

  // Global Portal Refresh Function (fetches latest cloud database records)
  const refreshAllData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setIsRefreshing(true);

    try {
      const fetchPromises = [
        supabase.from('departments').select('*'),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('task_updates').select('*').order('created_at', { ascending: false }),
        supabase.from('delete_requests').select('*'),
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(150),
        supabase.from('task_completion_requests').select('*').order('created_at', { ascending: false }),
        supabase.from('monthly_targets').select('*').order('created_at', { ascending: false }),
        supabase.from('monthly_target_comments').select('*').order('created_at', { ascending: true }),
        supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
        supabase.from('conversation_participants').select('*'),
        supabase.from('messages').select('*').order('created_at', { ascending: true }),
      ];

      if (currentUser?.id) {
        fetchPromises.push(
          supabase
            .from('personal_tasks')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false })
        );
        fetchPromises.push(
          supabase
            .from('user_read_states')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle()
        );
      }

      const results = await Promise.all(fetchPromises);
      const [
        deptsRes,
        tasksRes,
        taskUpdatesRes,
        delReqsRes,
        reportsRes,
        activityRes,
        compReqsRes,
        monthlyTargetsRes,
        monthlyCommentsRes,
        conversationsRes,
        participantsRes,
        messagesRes,
        pTasksRes,
        readStateRes,
      ] = results;

      if (!deptsRes.error && deptsRes.data && deptsRes.data.length > 0) setDepartments(deptsRes.data);
      if (!tasksRes.error && tasksRes.data) {
        const rawUpdates = (!taskUpdatesRes.error && taskUpdatesRes.data) ? taskUpdatesRes.data : [];
        setTasks(
          tasksRes.data.map((t) => {
            const parsed = parseTaskAssignees(t);
            const updatesForTask = rawUpdates
              .filter((u) => u.task_id === t.id)
              .map(parseUpdateRow);
            return { ...parsed, task_updates: updatesForTask };
          })
        );
      }
      if (!delReqsRes.error && delReqsRes.data) setDeleteRequests(delReqsRes.data);
      if (!compReqsRes.error && compReqsRes.data) setCompletionRequests(compReqsRes.data);
      if (!reportsRes.error && reportsRes.data) setReports(reportsRes.data);
      if (!activityRes.error && activityRes.data && activityRes.data.length > 0) setActivityLogs(activityRes.data);
      if (monthlyTargetsRes && !monthlyTargetsRes.error && monthlyTargetsRes.data && monthlyTargetsRes.data.length > 0) {
        setMonthlyTargets(monthlyTargetsRes.data);
      }
      if (monthlyCommentsRes && !monthlyCommentsRes.error && monthlyCommentsRes.data && monthlyCommentsRes.data.length > 0) {
        setMonthlyTargetComments(monthlyCommentsRes.data);
      }
      if (conversationsRes && !conversationsRes.error && conversationsRes.data) {
        setConversations(conversationsRes.data);
      }
      if (participantsRes && !participantsRes.error && participantsRes.data) {
        setConversationParticipants(participantsRes.data);
      }
      if (messagesRes && !messagesRes.error && messagesRes.data) {
        setMessages(messagesRes.data);
      }
      if (pTasksRes && !pTasksRes.error && pTasksRes.data) {
        setPersonalTasks(pTasksRes.data);
      } else if (!pTasksRes || pTasksRes.error) {
        setPersonalTasks([]);
      }
      if (readStateRes && !readStateRes.error && readStateRes.data) {
        const serverNotifs = Array.isArray(readStateRes.data.read_notifications)
          ? readStateRes.data.read_notifications
          : [];
        const serverChats = Array.isArray(readStateRes.data.read_chats)
          ? readStateRes.data.read_chats
          : [];

        setReadNotificationIds((prev) => {
          const merged = Array.from(new Set([...prev, ...serverNotifs]));
          try {
            if (currentUser?.id) {
              localStorage.setItem(`upcomm_read_notifs_${currentUser.id}`, JSON.stringify(merged));
            }
          } catch (e) {}
          return merged;
        });

        setReadChatIds((prev) => {
          const merged = Array.from(new Set([...prev, ...serverChats]));
          try {
            if (currentUser?.id) {
              localStorage.setItem(`upcomm_read_chats_${currentUser.id}`, JSON.stringify(merged));
            }
          } catch (e) {}
          return merged;
        });
      }

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.warn('Background auto-refresh error:', err);
    } finally {
      setIsRefreshing(false);
      realtimeReadyRef.current = true;
    }
  }, [currentUser?.id]);

  // Load personal tasks whenever active user changes
  useEffect(() => {
    if (!currentUser?.id) {
      setPersonalTasks([]);
      return;
    }
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('personal_tasks')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setPersonalTasks(data);
          } else {
            setPersonalTasks([]);
          }
        });
    }
  }, [currentUser?.id]);

  // 1. Load on initial startup
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // 2. Real-time Supabase Subscription for instant sync across all users
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('tasks-live-portal-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = { ...parseTaskAssignees(payload.new), task_updates: [] };
            setTasks((prev) => {
              if (prev.some((t) => t.id === newTask.id)) return prev;
              return [newTask, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = parseTaskAssignees(payload.new);
            setTasks((prev) =>
              prev.map((t) => (t.id === updatedTask.id ? { ...t, ...updatedTask, task_updates: t.task_updates || [] } : t))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTasks((prev) => prev.filter((t) => t.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_updates' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newUpd = parseUpdateRow(payload.new);

            // Centralized notification sound for authorized task comments
            if (realtimeReadyRef.current && currentUserRef.current?.id) {
              const currentUid = String(currentUserRef.current.id);
              const actorUid = newUpd.user_id ? String(newUpd.user_id) : null;
              const hasText = Boolean(
                (newUpd.text && newUpd.text.trim()) ||
                (newUpd.update_text && newUpd.update_text.trim())
              );
              const hasAttachments = Array.isArray(newUpd.attachments) && newUpd.attachments.length > 0;

              if ((hasText || hasAttachments) && actorUid && actorUid !== currentUid) {
                const currentRole = currentUserRef.current.role || 'team_member';
                const isAdmin = currentRole === 'admin' || currentRole === 'it_support_admin';
                const isHOD = currentRole === 'hod';
                const deptId = currentUserRef.current.department_id;

                const targetTask = (tasksRef.current || []).find(
                  (t) => String(t.id) === String(newUpd.task_id)
                );

                let isAuthorized = false;
                if (!targetTask) {
                  isAuthorized = isAdmin;
                } else {
                  const isPersonal = targetTask.task_origin === 'personal';
                  if (isPersonal && String(targetTask.created_by) !== currentUid && !isAdmin) {
                    isAuthorized = false;
                  } else {
                    const isAssigned =
                      String(targetTask.assigned_to) === currentUid ||
                      (Array.isArray(targetTask.assigned_to_ids) &&
                        targetTask.assigned_to_ids.map(String).includes(currentUid));
                    const isAssisted =
                      String(targetTask.assisted_by) === currentUid ||
                      (Array.isArray(targetTask.assisted_by_ids) &&
                        targetTask.assisted_by_ids.map(String).includes(currentUid));
                    const isCreator = String(targetTask.created_by) === currentUid;
                    const isDeptHOD = isHOD && targetTask.department_id === deptId;

                    isAuthorized = isAssigned || isAssisted || isCreator || isDeptHOD || isAdmin;
                  }
                }

                if (isAuthorized) {
                  playNotificationSound({
                    eventId: `comment-${newUpd.id || `${newUpd.task_id}-${newUpd.created_at || Date.now()}`}`,
                    eventType: SOUND_ENABLED_EVENT_TYPES.TASK_COMMENT,
                    actorUserId: actorUid,
                    currentUser: currentUserRef.current,
                  });
                }
              }
            }

            setTasks((prev) =>
              prev.map((t) => {
                if (t.id === newUpd.task_id) {
                  const existing = t.task_updates || [];
                  if (existing.some((u) => u.id === newUpd.id)) return t;
                  return {
                    ...t,
                    status: newUpd.status || t.status,
                    task_updates: [newUpd, ...existing],
                  };
                }
                return t;
              })
            );
          } else if (payload.eventType === 'UPDATE') {
            const updatedUpd = parseUpdateRow(payload.new);
            setTasks((prev) =>
              prev.map((t) => {
                if (t.id === updatedUpd.task_id) {
                  const existing = t.task_updates || [];
                  return {
                    ...t,
                    task_updates: existing.map((u) => (u.id === updatedUpd.id ? { ...u, ...updatedUpd } : u)),
                  };
                }
                return t;
              })
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setTasks((prev) =>
              prev.map((t) => {
                const existing = t.task_updates || [];
                return {
                  ...t,
                  task_updates: existing.filter((u) => u.id !== deletedId),
                };
              })
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delete_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new;
            setDeleteRequests((prev) => {
              if (prev.some((r) => r.id === newReq.id)) return prev;
              return [newReq, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedReq = payload.new;
            setDeleteRequests((prev) =>
              prev.map((r) => (r.id === updatedReq.id ? { ...r, ...updatedReq } : r))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_completion_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new;
            setCompletionRequests((prev) => {
              if (prev.some((r) => r.id === newReq.id)) return prev;
              return [newReq, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedReq = payload.new;
            setCompletionRequests((prev) =>
              prev.map((r) => (r.id === updatedReq.id ? { ...r, ...updatedReq } : r))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new;

            // Centralized notification sound for incoming private messages
            if (realtimeReadyRef.current && currentUserRef.current?.id) {
              const currentUid = String(currentUserRef.current.id);
              const senderUid = newMsg.sender_id ? String(newMsg.sender_id) : null;

              if (senderUid && senderUid !== currentUid) {
                const convId = String(newMsg.conversation_id);
                const isParticipant = (conversationParticipantsRef.current || []).some(
                  (p) => String(p.conversation_id) === convId && String(p.user_id) === currentUid
                );
                const targetConv = (conversationsRef.current || []).find((c) => String(c.id) === convId);

                if (isParticipant || targetConv) {
                  let eventType = SOUND_ENABLED_EVENT_TYPES.DIRECT_MESSAGE;
                  if (newMsg.source_type === 'broadcast') {
                    eventType = SOUND_ENABLED_EVENT_TYPES.BROADCAST_MESSAGE;
                  } else if (targetConv?.type === 'group') {
                    eventType = SOUND_ENABLED_EVENT_TYPES.GROUP_MESSAGE;
                  }

                  playNotificationSound({
                    eventId: `msg-${newMsg.id}`,
                    eventType,
                    actorUserId: senderUid,
                    currentUser: currentUserRef.current,
                  });
                }
              }
            }

            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? { ...m, ...updatedMsg } : m))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setMessages((prev) => prev.filter((m) => m.id !== deletedId));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newConv = payload.new;
            setConversations((prev) => {
              if (prev.some((c) => c.id === newConv.id)) return prev;
              return [newConv, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedConv = payload.new;
            setConversations((prev) =>
              prev.map((c) => (c.id === updatedConv.id ? { ...c, ...updatedConv } : c))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_participants' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const row = payload.new;
            setConversationParticipants((prev) => {
              const idx = prev.findIndex(
                (p) => p.conversation_id === row.conversation_id && p.user_id === row.user_id
              );
              if (idx !== -1) {
                return prev.map((p, i) => (i === idx ? { ...p, ...row } : p));
              }
              return [...prev, row];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            setMessageReactions((prev) => {
              const existingIdx = prev.findIndex(
                (r) => r.id === row.id || (r.message_id === row.message_id && r.user_id === row.user_id)
              );
              if (existingIdx !== -1) {
                return prev.map((r, i) => (i === existingIdx ? { ...r, ...row } : r));
              }
              return [...prev, row];
            });
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new;
            setMessageReactions((prev) =>
              prev.map((r) => (r.id === row.id ? { ...r, ...row } : r))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            const deletedMsgId = payload.old.message_id;
            const deletedUserId = payload.old.user_id;
            setMessageReactions((prev) =>
              prev.filter(
                (r) =>
                  !(
                    r.id === deletedId ||
                    (deletedMsgId && deletedUserId && r.message_id === deletedMsgId && r.user_id === deletedUserId)
                  )
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversation_pinned_messages' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new;
            setPinnedMessages((prev) => {
              const existingIdx = prev.findIndex(
                (p) => p.id === row.id || (p.conversation_id === row.conversation_id && p.message_id === row.message_id)
              );
              if (existingIdx !== -1) {
                return prev.map((p, i) => (i === existingIdx ? { ...p, ...row } : p));
              }
              return [...prev, row];
            });
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new;
            setPinnedMessages((prev) =>
              prev.map((p) => (p.id === row.id ? { ...p, ...row } : p))
            );
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            const deletedConvId = payload.old.conversation_id;
            const deletedMsgId = payload.old.message_id;
            setPinnedMessages((prev) =>
              prev.filter(
                (p) =>
                  !(
                    p.id === deletedId ||
                    (deletedConvId && deletedMsgId && p.conversation_id === deletedConvId && p.message_id === deletedMsgId)
                  )
              )
            );
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setTimeout(() => {
            realtimeReadyRef.current = true;
          }, 500);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 3. Global Portal Auto-Refresh: every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAllData();
    }, 10 * 1000); // 10 seconds

    return () => clearInterval(interval);
  }, [refreshAllData]);

  // 4. Dedicated fast-poll for task_updates (chat) — every 5 seconds
  // This is a targeted lightweight poll specifically to make chat feel instant
  // even if the Supabase realtime subscription has a delay on this table.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const chatPoll = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('task_updates')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(200);

        if (error || !data) return;

        setTasks((prev) =>
          prev.map((t) => {
            const updatesForTask = data
              .filter((u) => u.task_id === t.id)
              .map(parseUpdateRow);
            if (updatesForTask.length === 0) return t;

            // Merge: keep any local-only items, update existing ones
            const existingIds = new Set((t.task_updates || []).map((u) => u.id));
            const freshIds = new Set(updatesForTask.map((u) => u.id));
            const localOnly = (t.task_updates || []).filter((u) => !freshIds.has(u.id));
            const merged = [...updatesForTask, ...localOnly];

            // Only trigger re-render if something actually changed
            const hasNew = updatesForTask.some((u) => !existingIds.has(u.id));
            if (!hasNew) return t;

            return { ...t, task_updates: merged };
          })
        );
      } catch (err) {
        // silent — this is a background poll
      }
    }, 5 * 1000); // every 5 seconds

    return () => clearInterval(chatPoll);
  }, []);

  // 5. Dedicated fast-poll for Private Messages, Conversations & Participants — every 4 seconds
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) return;

    const messagingPoll = setInterval(async () => {
      try {
        const [convsRes, partsRes, msgsRes, reactsRes, pinsRes] = await Promise.all([
          supabase.from('conversations').select('*').order('updated_at', { ascending: false }),
          supabase.from('conversation_participants').select('*'),
          supabase.from('messages').select('*').order('created_at', { ascending: true }),
          supabase.from('message_reactions').select('*'),
          supabase.from('conversation_pinned_messages').select('*'),
        ]);

        if (convsRes.data && !convsRes.error) {
          setConversations((prev) => {
            const serverIds = new Set(convsRes.data.map((c) => c.id));
            const localOnly = prev.filter((c) => !serverIds.has(c.id));
            return [...convsRes.data, ...localOnly];
          });
        }

        if (partsRes.data && !partsRes.error) {
          setConversationParticipants((prev) => {
            const keySet = new Set(partsRes.data.map((p) => `${p.conversation_id}_${p.user_id}`));
            const localOnly = prev.filter((p) => !keySet.has(`${p.conversation_id}_${p.user_id}`));
            return [...partsRes.data, ...localOnly];
          });
        }

        if (msgsRes.data && !msgsRes.error) {
          setMessages((prev) => {
            const serverIds = new Set(msgsRes.data.map((m) => m.id));
            const localOnly = prev.filter((m) => !serverIds.has(m.id));
            const merged = [...msgsRes.data, ...localOnly];
            // Sort chronologically
            return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        }

        if (reactsRes.data && !reactsRes.error) {
          setMessageReactions((prev) => {
            const serverIds = new Set(reactsRes.data.map((r) => r.id));
            const localOnly = prev.filter((r) => !serverIds.has(r.id));
            return [...reactsRes.data, ...localOnly];
          });
        }

        if (pinsRes.data && !pinsRes.error) {
          setPinnedMessages((prev) => {
            const serverIds = new Set(pinsRes.data.map((p) => p.id));
            const localOnly = prev.filter((p) => !serverIds.has(p.id));
            return [...pinsRes.data, ...localOnly];
          });
        }
      } catch (err) {
        // background silent poll
      }
    }, 4 * 1000); // every 4 seconds

    return () => clearInterval(messagingPoll);
  }, [currentUser?.id]);

  // Helper for logging activity (Enforces IT Support suppression rule & persists to Supabase)
  const logActivity = async (action, entityType, entityId, metadata = {}) => {
    if (currentUser?.suppress_activity_logging || currentUser?.role === 'it_support_admin') {
      return;
    }

    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: currentUser?.id || 'usr-admin-1',
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    setActivityLogs((prev) => [newLog, ...prev]);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('activity_logs').insert(newLog);
        if (error) {
          console.warn('Supabase activity log insert error:', error);
        }
      } catch (err) {
        console.warn('Supabase activity log insert exception:', err);
      }
    }
  };

  // --- TASK ACTIONS (SAVED & SYNCED DIRECTLY TO SUPABASE) ---
  const createTask = async (taskData) => {
    const taskCount = tasks.length + 1;
    const taskNumber = `TM-${String(taskCount).padStart(4, '0')}`;

    let rawAssignees = Array.isArray(taskData.assigned_to)
      ? taskData.assigned_to
      : [taskData.assigned_to];
    let assignees = rawAssignees.filter(Boolean);
    if (assignees.length === 0) {
      assignees = [currentUser?.id || 'usr-admin-1'];
    }

    const primaryAssignee = assignees[0];

    let taskOrigin = 'personal'; // 'admin_to_hod' | 'hod_to_member' | 'personal'
    if (currentUser?.role === 'admin' || currentUser?.role === 'it_support_admin') {
      taskOrigin = 'admin_to_hod';
    } else if (currentUser?.role === 'hod') {
      if (primaryAssignee && primaryAssignee !== currentUser.id) {
        taskOrigin = 'hod_to_member';
      } else {
        taskOrigin = 'personal';
      }
    } else {
      taskOrigin = 'personal';
    }

    // Embed all assignees & attachments into description metadata
    let finalDescription = taskData.description || '';
    if (assignees.length > 1) {
      finalDescription = `${cleanTaskDescription(finalDescription)}\n<!--assignees:${JSON.stringify(assignees)}-->`.trim();
    }
    if (taskData.attachments && taskData.attachments.length > 0) {
      finalDescription = `${finalDescription}\n<!--attachments:${JSON.stringify(taskData.attachments)}-->`.trim();
    }

    const assistantIds = Array.isArray(taskData.assisted_by)
      ? taskData.assisted_by
      : Array.isArray(taskData.assisted_by_ids)
      ? taskData.assisted_by_ids
      : taskData.assisted_by
      ? [taskData.assisted_by]
      : [];

    if (assistantIds.length > 0) {
      finalDescription = `${finalDescription}\n<!--assisted_by:${JSON.stringify(assistantIds)}-->`.trim();
    }

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      task_number: taskNumber,
      title: taskData.title,
      description: finalDescription,
      department_id: taskData.department_id,
      created_by: currentUser?.id || 'usr-admin-1',
      assigned_by: currentUser?.id || 'usr-admin-1',
      assigned_to: primaryAssignee,
      assigned_to_ids: assignees,
      assisted_by: assistantIds[0] || null,
      assisted_by_ids: assistantIds,
      attachments: taskData.attachments || [],
      parent_task_id: taskData.parent_task_id || null,
      task_origin: taskOrigin,
      start_date: taskData.start_date || new Date().toISOString().split('T')[0],
      due_date: taskData.due_date,
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      completed_at: null,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Update local state immediately
    setTasks((prev) => [newTask, ...prev]);

    logActivity('TASK_CREATED', 'task', newTask.id, {
      task_number: newTask.task_number,
      title: newTask.title,
      department_id: newTask.department_id,
      assigned_to: newTask.assigned_to,
      assigned_to_ids: assignees,
      assisted_by_ids: assistantIds,
      created_by: currentUser?.id,
    });

    // Save directly to Supabase cloud database
    if (isSupabaseConfigured && supabase) {
      try {
        // Save to Supabase cloud database
        let { assigned_to_ids, assisted_by_ids, attachments, ...dbPayload } = newTask;
        let { data, error } = await supabase.from('tasks').insert([dbPayload]).select();

        // If the Supabase PostgREST schema cache has not yet picked up assisted_by, retry safely
        if (error && error.message && error.message.includes('assisted_by')) {
          const { assisted_by, ...fallbackPayload } = dbPayload;
          const retry = await supabase.from('tasks').insert([fallbackPayload]).select();
          data = retry.data;
          error = retry.error;
        }

        if (error) {
          console.error('Supabase task insert error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
        if (data && data.length > 0) {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === newTask.id
                ? {
                    ...parseTaskAssignees(data[0]),
                    assigned_to_ids: assignees,
                    assisted_by: newTask.assisted_by,
                    assisted_by_ids: assistantIds,
                    attachments: newTask.attachments,
                  }
                : t
            )
          );
        }
      } catch (err) {
        console.error('Supabase task insert exception:', err);
        throw err;
      }
    }

    return newTask;
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    const isCompleted = newStatus === 'completed';
    const nowIso = new Date().toISOString();

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = {
            ...t,
            status: newStatus,
            completed_at: isCompleted ? (t.completed_at || nowIso) : null,
            updated_at: nowIso,
          };
          logActivity('TASK_STATUS_UPDATED', 'task', taskId, {
            task_number: t.task_number,
            old_status: t.status,
            new_status: newStatus,
          });
          return updated;
        }
        return t;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            status: newStatus,
            completed_at: isCompleted ? nowIso : null,
            updated_at: nowIso,
          })
          .eq('id', taskId);
        if (error) {
          console.error('Supabase task status update error:', error);
        }
      } catch (err) {
        console.error('Supabase task status update exception:', err);
      }
    }
  };

  const addTaskUpdate = async (taskId, textOrPayload, newStatus, attachments = [], updateGlobalTaskStatus = false) => {
    let text = typeof textOrPayload === 'object' && textOrPayload !== null ? textOrPayload.text : textOrPayload;
    let actualAttachments = typeof textOrPayload === 'object' && textOrPayload !== null && Array.isArray(textOrPayload.attachments) ? textOrPayload.attachments : attachments;
    let actualNewStatus = typeof textOrPayload === 'object' && textOrPayload !== null ? (textOrPayload.newStatus || textOrPayload.status || newStatus) : newStatus;
    let actualUpdateGlobal = typeof textOrPayload === 'object' && textOrPayload !== null && typeof textOrPayload.updateGlobalTaskStatus === 'boolean' ? textOrPayload.updateGlobalTaskStatus : updateGlobalTaskStatus;

    if (!taskId || (!text?.trim() && (!actualAttachments || actualAttachments.length === 0))) return;
    const nowIso = new Date().toISOString();
    const currentTask = tasks.find((t) => t.id === taskId);
    const oldStatus = currentTask?.status || 'pending';
    const status = actualNewStatus || oldStatus;
    const isCompleted = status === 'completed';

    const newUpdateObj = {
      id: `upd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      task_id: taskId,
      user_id: currentUser?.id || 'usr-admin-1',
      user_name: currentUser?.full_name || currentUser?.name || 'Team Member',
      user_role: currentUser?.role || 'team_member',
      user_avatar: currentUser?.avatar_url || null,
      old_status: oldStatus,
      status: status,
      text: text?.trim() || '',
      attachments: Array.isArray(actualAttachments) ? actualAttachments : [],
      seen_by: [currentUser?.id || 'usr-admin-1'],
      created_at: nowIso,
    };

    // 1. Update local state immediately
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const existingUpdates = t.task_updates || [];
          const nextStatus = updateGlobalTaskStatus ? status : t.status;
          const nextIsCompleted = nextStatus === 'completed';
          return {
            ...t,
            status: nextStatus,
            completed_at: nextIsCompleted ? (t.completed_at || nowIso) : (nextStatus !== 'completed' ? null : t.completed_at),
            updated_at: nowIso,
            task_updates: [newUpdateObj, ...existingUpdates.filter((u) => u.id !== newUpdateObj.id)],
          };
        }
        return t;
      })
    );

    logActivity('TASK_UPDATE_POSTED', 'task', taskId, {
      task_number: currentTask?.task_number,
      text: text?.trim() || '',
      old_status: oldStatus,
      status: status,
      updated_global_status: updateGlobalTaskStatus,
      attachments_count: attachments?.length || 0,
      user_name: currentUser?.full_name || 'Team Member',
    });

    // 2. Persist to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const cleanAttachments = (Array.isArray(attachments) ? attachments : []).filter(
          (a) => a && a.__type !== 'seen_receipts'
        );
        const dbAttachments = [
          ...cleanAttachments,
          { __type: 'seen_receipts', seen_by: [currentUser?.id || 'usr-admin-1'] },
        ];
        const { seen_by: _sb, ...dbObj } = {
          ...newUpdateObj,
          attachments: dbAttachments,
        };

        let { error: updError } = await supabase.from('task_updates').insert(dbObj);

        // If error might be due to missing attachments column in Supabase, retry without attachments column
        if (updError && (updError.message?.toLowerCase().includes('attachments') || updError.code === 'PGRST204' || updError.code === '42703')) {
          const { attachments: _att, ...fallbackObj } = dbObj;
          const retry = await supabase.from('task_updates').insert(fallbackObj);
          updError = retry.error;
        }

        if (updError) {
          console.warn('Supabase task_updates insert warning:', updError);
        }

        // Only update global task status if updateGlobalTaskStatus is true
        if (updateGlobalTaskStatus && (status !== oldStatus || (isCompleted && !currentTask?.completed_at))) {
          const { error: taskError } = await supabase
            .from('tasks')
            .update({
              status: status,
              completed_at: isCompleted ? nowIso : null,
              updated_at: nowIso,
            })
            .eq('id', taskId);
          if (taskError) {
            console.error('Supabase task status update error:', taskError);
          }
        }
      } catch (err) {
        console.error('Supabase task update exception:', err);
      }
    }

    return newUpdateObj;
  };

  const updateTask = async (taskId, updates) => {
    const nowIso = new Date().toISOString();
    const currentTask = tasks.find((t) => t.id === taskId);
    if (!currentTask) return;

    let finalDescription = updates.description !== undefined ? updates.description : currentTask.description || '';
    const assignees = updates.assigned_to_ids !== undefined ? updates.assigned_to_ids : currentTask.assigned_to_ids || (currentTask.assigned_to ? [currentTask.assigned_to] : []);
    const attachments = updates.attachments !== undefined ? updates.attachments : currentTask.attachments || [];

    const assistantIds = updates.assisted_by_ids !== undefined
      ? updates.assisted_by_ids
      : Array.isArray(updates.assisted_by)
      ? updates.assisted_by
      : updates.assisted_by
      ? [updates.assisted_by]
      : currentTask.assisted_by_ids || (currentTask.assisted_by ? [currentTask.assisted_by] : []);

    finalDescription = cleanTaskDescription(finalDescription);
    if (assignees.length > 1) {
      finalDescription = `${finalDescription}\n<!--assignees:${JSON.stringify(assignees)}-->`.trim();
    }
    if (attachments.length > 0) {
      finalDescription = `${finalDescription}\n<!--attachments:${JSON.stringify(attachments)}-->`.trim();
    }
    if (assistantIds.length > 0) {
      finalDescription = `${finalDescription}\n<!--assisted_by:${JSON.stringify(assistantIds)}-->`.trim();
    }

    const merged = {
      ...currentTask,
      ...updates,
      description: finalDescription,
      assigned_to: assignees[0] || currentTask.assigned_to || null,
      assigned_to_ids: assignees,
      attachments: attachments,
      assisted_by: assistantIds[0] || null,
      assisted_by_ids: assistantIds,
      updated_at: nowIso,
    };

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? merged : t))
    );

    logActivity('TASK_UPDATED', 'task', taskId, { task_number: currentTask.task_number, updates });

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          title: merged.title,
          description: merged.description,
          department_id: merged.department_id || null,
          assigned_to: merged.assigned_to || null,
          assisted_by: merged.assisted_by || null,
          priority: merged.priority,
          status: merged.status,
          start_date: merged.start_date,
          due_date: merged.due_date,
          completed_at: merged.completed_at || (merged.status === 'completed' ? nowIso : null),
          updated_at: nowIso,
        };

        let { error } = await supabase
          .from('tasks')
          .update(dbPayload)
          .eq('id', taskId);

        if (
          error &&
          (
            error.message?.toLowerCase().includes('assisted_by') ||
            error.details?.toLowerCase().includes('assisted_by') ||
            error.hint?.toLowerCase().includes('assisted_by') ||
            error.code === 'PGRST204' ||
            error.code === '42703'
          )
        ) {
          const { assisted_by, ...fallbackPayload } = dbPayload;
          const retry = await supabase.from('tasks').update(fallbackPayload).eq('id', taskId);
          error = retry.error;
        }

        if (error) {
          console.error('Supabase task update error:', error);
          throw new Error(`Database error: ${error.message}`);
        }
      } catch (err) {
        console.error('Supabase task update exception:', err);
        throw err;
      }
    }
  };

  const softDeleteTask = async (taskId, deletedByUserId) => {
    const nowIso = new Date().toISOString();
    const deletedBy = deletedByUserId || currentUser?.id || 'usr-admin-1';

    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = {
            ...t,
            is_deleted: true,
            deleted_at: nowIso,
            deleted_by: deletedBy,
            updated_at: nowIso,
          };
          logActivity('TASK_SOFT_DELETED', 'task', taskId, { task_number: t.task_number });
          return updated;
        }
        return t;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('tasks')
          .update({
            is_deleted: true,
            deleted_at: nowIso,
            deleted_by: deletedBy,
            updated_at: nowIso,
          })
          .eq('id', taskId);
        if (error) {
          console.error('Supabase task soft-delete error:', error);
        }
      } catch (err) {
        console.error('Supabase task soft-delete exception:', err);
      }
    }
  };

  // --- DELETE REQUEST WORKFLOW (SYNCED TO SUPABASE) ---
  const requestTaskDeletion = async (taskId, reason) => {
    const task = tasks.find((t) => t.id === taskId) || allTasks?.find((t) => t.id === taskId);
    if (!task) return;

    const newRequest = {
      id: `del-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      task_id: taskId,
      requested_by: currentUser?.id || 'usr-member-1',
      reason: reason || '',
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      created_at: new Date().toISOString(),
    };

    setDeleteRequests((prev) => [newRequest, ...prev]);
    logActivity('DELETE_REQUESTED', 'task_delete_request', newRequest.id, {
      task_number: task.task_number,
      reason,
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          id: newRequest.id,
          task_id: newRequest.task_id,
          requested_by: newRequest.requested_by,
          reason: newRequest.reason,
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          created_at: newRequest.created_at,
        };
        const { error } = await supabase.from('delete_requests').insert([dbPayload]);
        if (error) {
          console.error('Supabase delete request insert error:', error);
        }
      } catch (err) {
        console.error('Supabase delete request insert exception:', err);
      }
    }
  };

  // --- COMPLETION REQUEST WORKFLOW (mirrors delete request pattern) ---

  const requestTaskCompletion = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Prevent duplicate pending requests
    const existing = completionRequests.find(
      (r) => r.task_id === taskId && r.status === 'pending'
    );
    if (existing) return existing;

    const requesterRole = currentUser?.role || 'team_member';
    const nowIso = new Date().toISOString();

    const newRequest = {
      id: `comp-req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      task_id: taskId,
      task_creator_id: task.created_by || task.assigned_by,
      requested_by: currentUser?.id,
      requested_by_role: requesterRole,
      status: 'pending',
      reviewed_by: null,
      reviewed_at: null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    setCompletionRequests((prev) => [newRequest, ...prev]);

    logActivity('COMPLETION_REQUESTED', 'task_completion_request', newRequest.id, {
      task_id: taskId,
      task_number: task.task_number,
      task_title: task.title,
    });

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('task_completion_requests')
          .insert([newRequest]);
        if (error) console.error('Supabase completion request insert error:', error);
      } catch (err) {
        console.error('Supabase completion request insert exception:', err);
      }
    }

    // Post a live activity update to the task chat
    if (addTaskUpdate) {
      try {
        const actorName = currentUser?.full_name || 'A team member';
        await addTaskUpdate(
          taskId,
          `✅ ${actorName} requested to mark this task as Completed. Awaiting creator approval.`,
          task.status,
          [],
          false
        );
      } catch (_) {}
    }

    return newRequest;
  };

  const reviewCompletionRequest = async (requestId, approved) => {
    const request = completionRequests.find((r) => r.id === requestId);
    if (!request) return;

    const relatedTask = tasks.find((t) => t.id === request.task_id) || allTasks?.find((t) => t.id === request.task_id);
    const isAuthorized = canReviewCompletionRequest(currentUser, request, relatedTask, users);
    if (!isAuthorized) {
      console.warn('Unauthorized: Only the task owner/creator can approve or reject this completion request.');
      return;
    }

    const newStatus = approved ? 'approved' : 'rejected';
    const nowIso = new Date().toISOString();

    setCompletionRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: newStatus, reviewed_by: currentUser?.id, reviewed_at: nowIso, updated_at: nowIso }
          : r
      )
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('task_completion_requests')
          .update({ status: newStatus, reviewed_by: currentUser?.id, reviewed_at: nowIso, updated_at: nowIso })
          .eq('id', requestId);
        if (error) console.error('Supabase review completion request error:', error);
      } catch (err) {
        console.error('Supabase review completion request exception:', err);
      }
    }

    if (approved && relatedTask) {
      await updateTaskStatus(request.task_id, 'completed');
      logActivity('COMPLETION_REQUEST_APPROVED', 'task_completion_request', requestId, { task_id: request.task_id });

      if (addTaskUpdate) {
        try {
          const reviewerName = currentUser?.full_name || 'Task Creator';
          await addTaskUpdate(
            request.task_id,
            `🎉 Task completion approved by ${reviewerName}. Task is now Completed.`,
            'completed',
            [],
            false
          );
        } catch (_) {}
      }
    } else {
      logActivity('COMPLETION_REQUEST_REJECTED', 'task_completion_request', requestId, { task_id: request.task_id });

      if (addTaskUpdate && relatedTask) {
        try {
          const reviewerName = currentUser?.full_name || 'Task Creator';
          await addTaskUpdate(
            request.task_id,
            `❌ Task completion request rejected by ${reviewerName}. Task remains in progress.`,
            relatedTask.status,
            [],
            false
          );
        } catch (_) {}
      }
    }
  };

  const reviewDeleteRequest = async (requestId, approved) => {
    const request = deleteRequests.find((r) => r.id === requestId);
    if (!request) return;

    // Strict security: Delete request review is ADMIN ONLY
    if (!canReviewDeleteRequest(currentUser)) {
      console.warn('Unauthorized: only Administrator accounts can review delete requests.');
      return;
    }

    const newStatus = approved ? 'approved' : 'rejected';
    const nowIso = new Date().toISOString();

    setDeleteRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: newStatus,
              reviewed_by: currentUser?.id || 'usr-admin-1',
              reviewed_at: nowIso,
            }
          : r
      )
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('delete_requests')
          .update({
            status: newStatus,
            reviewed_by: currentUser?.id || 'usr-admin-1',
            reviewed_at: nowIso,
          })
          .eq('id', requestId);
        if (error) {
          console.error('Supabase review delete request error:', error);
        }
      } catch (err) {
        console.error('Supabase review delete request exception:', err);
      }
    }

    if (approved) {
      await softDeleteTask(request.task_id, currentUser?.id);
      logActivity('DELETE_REQUEST_APPROVED', 'task_delete_request', requestId, { task_id: request.task_id });
    } else {
      logActivity('DELETE_REQUEST_REJECTED', 'task_delete_request', requestId, { task_id: request.task_id });
    }
  };

  // --- DEPARTMENT ACTIONS (SYNCED TO SUPABASE) ---
  const createDepartment = async (deptData) => {
    const newDept = {
      id: `dept-${Date.now()}`,
      name: deptData.name,
      description: deptData.description || '',
      color: deptData.color || '#6366F1',
      icon: deptData.icon || 'Briefcase',
      hod_id: deptData.hod_id || null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setDepartments((prev) => [...prev, newDept]);
    setPermissions((prev) => ({
      ...prev,
      [newDept.id]: {
        view_dashboard: true,
        view_department_tasks: true,
        create_team_tasks: true,
        edit_department_tasks: true,
        request_delete: true,
        view_department_stats: true,
        view_team_workload: true,
      },
    }));

    logActivity('DEPARTMENT_CREATED', 'department', newDept.id, { name: newDept.name });

    if (newDept.hod_id) {
      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === newDept.hod_id
            ? { ...u, role: 'hod', department_id: newDept.id }
            : u
        )
      );
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('departments').insert([newDept]);
        if (error) {
          console.error('Supabase department insert error:', error);
        }
      } catch (err) {
        console.error('Supabase department insert exception:', err);
      }
    }

    return newDept;
  };

  const updateDepartment = async (deptId, updates) => {
    setDepartments((prev) =>
      prev.map((d) => {
        if (d.id === deptId) {
          const updated = { ...d, ...updates, updated_at: new Date().toISOString() };
          logActivity('DEPARTMENT_UPDATED', 'department', deptId, { updates });

          if (updates.hod_id && updates.hod_id !== d.hod_id) {
            setUsers((prevUsers) =>
              prevUsers.map((u) => {
                if (u.id === updates.hod_id) {
                  return { ...u, role: 'hod', department_id: deptId };
                }
                return u;
              })
            );
          }

          return updated;
        }
        return d;
      })
    );

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('departments').update(updates).eq('id', deptId);
        if (error) {
          console.error('Supabase department update error:', error);
        }
      } catch (err) {
        console.error('Supabase department update exception:', err);
      }
    }
  };

  const deleteDepartment = async (deptId) => {
    const deptToDelete = departments.find((d) => d.id === deptId);
    if (!deptToDelete) return;

    setDepartments((prev) => prev.filter((d) => d.id !== deptId));
    setPermissions((prev) => {
      const copy = { ...prev };
      delete copy[deptId];
      return copy;
    });

    // Unassign users from this department (without deleting users)
    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.department_id === deptId
          ? { ...u, department_id: null, role: u.role === 'hod' ? 'team_member' : u.role }
          : u
      )
    );

    // Unassign department_id from tasks (without deleting tasks)
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.department_id === deptId
          ? { ...t, department_id: null }
          : t
      )
    );

    logActivity('DEPARTMENT_DELETED', 'department', deptId, { name: deptToDelete.name });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').update({ department_id: null }).eq('department_id', deptId);
        await supabase.from('tasks').update({ department_id: null }).eq('department_id', deptId);
        const { error } = await supabase.from('departments').delete().eq('id', deptId);
        if (error) {
          console.error('Supabase department delete error:', error);
        }
      } catch (err) {
        console.error('Supabase department delete exception:', err);
      }
    }
  };

  // --- USER CREATION ACTION (SYNCED DIRECTLY TO SUPABASE BACKEND) ---
  const createNewUser = async (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      email: userData.email.trim().toLowerCase(),
      password: userData.password || '123456',
      full_name: userData.full_name.trim(),
      designation: userData.designation?.trim() || 'Team Member Specialist',
      role: userData.role || 'team_member',
      department_id: userData.department_id || null,
      avatar_url:
        userData.avatar_url ||
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250`,
      is_active: true,
      must_change_password: true,
      can_chat_with_ceo: true,
      is_system_account: false,
      exclude_from_directory: false,
      suppress_activity_logging: false,
      created_at: new Date().toISOString(),
    };

    setUsers((prev) => [newUser, ...prev]);

    logActivity('USER_CREATED', 'profile', newUser.id, {
      email: newUser.email,
      name: newUser.full_name,
      role: newUser.role,
    });

    // If assigned as HOD, update department reference
    if (newUser.role === 'hod' && newUser.department_id) {
      setDepartments((prevDepts) =>
        prevDepts.map((d) =>
          d.id === newUser.department_id ? { ...d, hod_id: newUser.id } : d
        )
      );
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('users').insert(newUser);
        if (error) {
          console.error('Supabase user insert error:', error);
        }

        // If HOD, also sync department hod_id in Supabase
        if (newUser.role === 'hod' && newUser.department_id) {
          await supabase
            .from('departments')
            .update({ hod_id: newUser.id })
            .eq('id', newUser.department_id);
        }
      } catch (err) {
        console.error('Supabase user insert exception:', err);
      }
    }

    return newUser;
  };

  const updateUserProfile = async (userId, updates) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates };
          return updated;
        }
        return u;
      })
    );

    logActivity('USER_UPDATED', 'profile', userId, { updates });

    // Sync HOD if role changed
    if (updates.role === 'hod' && updates.department_id) {
      setDepartments((prevDepts) =>
        prevDepts.map((d) =>
          d.id === updates.department_id ? { ...d, hod_id: userId } : d
        )
      );
    }

    if (isSupabaseConfigured && supabase && userId) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ ...updates })
          .eq('id', userId);
        if (error) {
          console.error('Supabase user update error:', error);
        }

        if (updates.role === 'hod' && updates.department_id) {
          await supabase
            .from('departments')
            .update({ hod_id: userId })
            .eq('id', updates.department_id);
        }
      } catch (err) {
        console.error('Supabase user update exception:', err);
      }
    }
  };

  const togglePermission = (deptId, permissionKey) => {
    setPermissions((prev) => {
      const deptPerms = prev[deptId] || {};
      const updated = {
        ...prev,
        [deptId]: {
          ...deptPerms,
          [permissionKey]: !deptPerms[permissionKey],
        },
      };
      logActivity('PERMISSION_TOGGLED', 'department_permission', deptId, {
        permission_key: permissionKey,
        new_state: !deptPerms[permissionKey],
      });
      return updated;
    });
  };

  const updateSettings = (newSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      logActivity('SETTINGS_UPDATED', 'app_settings', 'global', { newSettings });
      return updated;
    });
  };

  const toggleIntegration = (intId) => {
    setIntegrations((prev) =>
      prev.map((i) => {
        if (i.id === intId) {
          const newStatus = i.status === 'connected' ? 'disconnected' : 'connected';
          logActivity('INTEGRATION_TOGGLED', 'integration', intId, { provider: i.provider, newStatus });
          return { ...i, status: newStatus };
        }
        return i;
      })
    );
  };

  // Persist read notifications per user across page refreshes & devices
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const storageKey = currentUser?.id
        ? `upcomm_read_notifs_${currentUser.id}`
        : 'upcomm_read_notifs_guest';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Persist read chat logs per user across page refreshes & devices
  const [readChatIds, setReadChatIds] = useState(() => {
    try {
      const storageKey = currentUser?.id
        ? `upcomm_read_chats_${currentUser.id}`
        : 'upcomm_read_chats_guest';
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Keep refs to avoid stale closures in debounced sync and background saves
  const readNotifsRef = useRef(readNotificationIds);
  const readChatsRef = useRef(readChatIds);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    readNotifsRef.current = readNotificationIds;
  }, [readNotificationIds]);

  useEffect(() => {
    readChatsRef.current = readChatIds;
  }, [readChatIds]);

  // Debounced helper to persist user read states (notifications + chats) to Supabase
  const syncReadStateToSupabase = useCallback((nextNotifs, nextChats) => {
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await supabase.from('user_read_states').upsert(
          {
            user_id: currentUser.id,
            read_notifications: nextNotifs,
            read_chats: nextChats,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } catch (err) {
        console.warn('Supabase user_read_states upsert warning:', err);
      }
    }, 200);
  }, [currentUser?.id]);

  // Reload and merge read IDs from Supabase and localStorage when active user changes
  useEffect(() => {
    if (!currentUser?.id) {
      setReadNotificationIds([]);
      setReadChatIds([]);
      return;
    }

    const notifKey = `upcomm_read_notifs_${currentUser.id}`;
    const chatKey = `upcomm_read_chats_${currentUser.id}`;

    let localNotifs = [];
    let localChats = [];
    try {
      const savedNotifs = localStorage.getItem(notifKey);
      if (savedNotifs) localNotifs = JSON.parse(savedNotifs);
      const savedChats = localStorage.getItem(chatKey);
      if (savedChats) localChats = JSON.parse(savedChats);
    } catch (e) {}

    setReadNotificationIds(localNotifs);
    setReadChatIds(localChats);

    // Fetch live state from Supabase to synchronize across devices
    if (isSupabaseConfigured && supabase) {
      supabase
        .from('user_read_states')
        .select('*')
        .eq('user_id', currentUser.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data) {
            const serverNotifs = Array.isArray(data.read_notifications) ? data.read_notifications : [];
            const serverChats = Array.isArray(data.read_chats) ? data.read_chats : [];

            const mergedNotifs = Array.from(new Set([...localNotifs, ...serverNotifs]));
            const mergedChats = Array.from(new Set([...localChats, ...serverChats]));

            setReadNotificationIds(mergedNotifs);
            setReadChatIds(mergedChats);

            try {
              localStorage.setItem(notifKey, JSON.stringify(mergedNotifs));
              localStorage.setItem(chatKey, JSON.stringify(mergedChats));
            } catch (e) {}

            // If local had unsynced read items, push merged list to server
            if (
              mergedNotifs.length !== serverNotifs.length ||
              mergedChats.length !== serverChats.length
            ) {
              syncReadStateToSupabase(mergedNotifs, mergedChats);
            }
          }
        })
        .catch((err) => console.warn('Fetch user_read_states error:', err));
    }
  }, [currentUser?.id, syncReadStateToSupabase]);

  // Real-time Supabase Subscription for instant cross-device sync of read status
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !currentUser?.id) return;

    const channel = supabase
      .channel(`user-read-states-${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_read_states',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          if (payload.new) {
            const serverNotifs = Array.isArray(payload.new.read_notifications)
              ? payload.new.read_notifications
              : [];
            const serverChats = Array.isArray(payload.new.read_chats)
              ? payload.new.read_chats
              : [];

            setReadNotificationIds((prev) => {
              const merged = Array.from(new Set([...prev, ...serverNotifs]));
              try {
                localStorage.setItem(`upcomm_read_notifs_${currentUser.id}`, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });

            setReadChatIds((prev) => {
              const merged = Array.from(new Set([...prev, ...serverChats]));
              try {
                localStorage.setItem(`upcomm_read_chats_${currentUser.id}`, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const markAllAsRead = (idsToMark) => {
    if (!idsToMark || idsToMark.length === 0) return;
    setReadNotificationIds((prev) => {
      const updated = Array.from(new Set([...prev, ...idsToMark]));
      try {
        const storageKey = currentUser?.id
          ? `upcomm_read_notifs_${currentUser.id}`
          : 'upcomm_read_notifs_guest';
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      syncReadStateToSupabase(updated, readChatsRef.current);
      return updated;
    });
  };

  const markNotificationAsRead = (id) => {
    if (!id) return;
    setReadNotificationIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        const storageKey = currentUser?.id
          ? `upcomm_read_notifs_${currentUser.id}`
          : 'upcomm_read_notifs_guest';
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      syncReadStateToSupabase(updated, readChatsRef.current);
      return updated;
    });
  };

  const markAllChatsAsRead = (chatIdsToMark) => {
    if (!chatIdsToMark || chatIdsToMark.length === 0) return;
    setReadChatIds((prev) => {
      const updated = Array.from(new Set([...prev, ...chatIdsToMark]));
      try {
        const storageKey = currentUser?.id
          ? `upcomm_read_chats_${currentUser.id}`
          : 'upcomm_read_chats_guest';
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      syncReadStateToSupabase(readNotifsRef.current, updated);
      return updated;
    });
  };

  const markChatAsRead = (id) => {
    if (!id) return;
    setReadChatIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      try {
        const storageKey = currentUser?.id
          ? `upcomm_read_chats_${currentUser.id}`
          : 'upcomm_read_chats_guest';
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      syncReadStateToSupabase(readNotifsRef.current, updated);
      return updated;
    });
  };

  // Mark all updates in a task as seen by a specific user (for double/blue tick read receipts)
  const markTaskUpdatesAsSeen = useCallback(async (taskId, userId) => {
    if (!taskId || !userId) return;

    let updatesToSync = [];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const currentUpdates = t.task_updates || [];
          let hasChanges = false;
          const updatedUpdates = currentUpdates.map((u) => {
            const currentSeen = Array.isArray(u.seen_by) ? u.seen_by : [];
            if (!currentSeen.includes(userId)) {
              hasChanges = true;
              const nextSeen = Array.from(new Set([u.user_id, ...currentSeen, userId].filter(Boolean)));
              const cleanAtts = (u.attachments || []).filter((a) => a && a.__type !== 'seen_receipts');
              const dbAtts = [...cleanAtts, { __type: 'seen_receipts', seen_by: nextSeen }];
              updatesToSync.push({ id: u.id, attachments: dbAtts });
              return { ...u, attachments: cleanAtts, seen_by: nextSeen };
            }
            return u;
          });
          if (hasChanges) {
            return { ...t, task_updates: updatedUpdates };
          }
        }
        return t;
      })
    );

    // Save to local seen cache
    try {
      const cached = JSON.parse(localStorage.getItem('upcomm_seen_updates_map') || '{}');
      updatesToSync.forEach((item) => {
        const seenMeta = item.attachments.find((a) => a && a.__type === 'seen_receipts');
        if (seenMeta) cached[item.id] = seenMeta.seen_by;
      });
      localStorage.setItem('upcomm_seen_updates_map', JSON.stringify(cached));
    } catch (e) {}

    // Persist to Supabase if available so other users receive real-time seen receipt updates
    if (isSupabaseConfigured && supabase && updatesToSync.length > 0) {
      try {
        for (const item of updatesToSync) {
          await supabase
            .from('task_updates')
            .update({ attachments: item.attachments })
            .eq('id', item.id);
        }
      } catch (err) {
        console.warn('Supabase markTaskUpdatesAsSeen sync error:', err);
      }
    }
  }, []);

  // Mark all comments/updates in a task as read for the current user
  const markTaskCommentsRead = useCallback((taskId) => {
    if (!taskId || !currentUser?.id) return;
    const userId = currentUser.id;

    // 1. Mark updates as seen in task state & sync to DB
    markTaskUpdatesAsSeen(taskId, userId);

    // 2. Mark chat update IDs as read
    const targetTask = tasks.find((t) => t.id === taskId);
    const updates = targetTask?.task_updates || [];
    const chatIds = updates.map((u) => u.id).filter(Boolean);

    // 3. Mark matching notification IDs as read
    const notifIds = updates.flatMap((u, idx) => [
      `notif-comment-${taskId}-${u.id || u.created_at || idx}`,
      `notif-att-${taskId}-${u.id || u.created_at || idx}`,
    ]);

    setReadChatIds((prevChats) => {
      const updatedChats = Array.from(new Set([...prevChats, ...chatIds]));
      setReadNotificationIds((prevNotifs) => {
        const updatedNotifs = Array.from(new Set([...prevNotifs, ...notifIds]));
        try {
          localStorage.setItem(`upcomm_read_chats_${userId}`, JSON.stringify(updatedChats));
          localStorage.setItem(`upcomm_read_notifs_${userId}`, JSON.stringify(updatedNotifs));
        } catch (e) {}
        syncReadStateToSupabase(updatedNotifs, updatedChats);
        return updatedNotifs;
      });
      return updatedChats;
    });
  }, [currentUser?.id, tasks, markTaskUpdatesAsSeen, syncReadStateToSupabase]);

  // --- REPORT ACTIONS ---
  const uploadReportFile = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop() || 'dat';
    const fileName = file.name;
    const fileSize = file.size;
    const fileType = fileExt.toUpperCase();
    const storagePath = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: uploadError } = await supabase.storage
          .from('reports')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('reports')
            .getPublicUrl(storagePath);

          if (publicData?.publicUrl) {
            return {
              file_url: publicData.publicUrl,
              file_name: fileName,
              file_type: fileType,
              file_size: fileSize,
            };
          }
        } else {
          console.warn('Supabase reports bucket upload warning:', uploadError.message);
        }
      } catch (err) {
        console.warn('Supabase reports bucket upload exception:', err);
      }
    }

    // Local data URL fallback
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          file_url: reader.result,
          file_name: fileName,
          file_type: fileType,
          file_size: fileSize,
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // --- TASK ATTACHMENT UPLOAD (IMAGE, VIDEO, CSV, PDF, DOC) ---
  const uploadTaskAttachment = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = file.name;
    const fileSize = file.size;
    const storagePath = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Categorize attachment
    let category = 'doc';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(fileExt)) {
      category = 'image';
    } else if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(fileExt)) {
      category = 'video';
    } else if (['pdf'].includes(fileExt)) {
      category = 'pdf';
    } else if (['csv', 'xls', 'xlsx'].includes(fileExt)) {
      category = 'csv';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(fileExt)) {
      category = 'doc';
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error: uploadError } = await supabase.storage
          .from('task-attachments')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from('task-attachments')
            .getPublicUrl(storagePath);

          if (publicData?.publicUrl) {
            return {
              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: fileName,
              url: publicData.publicUrl,
              size: fileSize,
              type: category,
              ext: fileExt.toUpperCase(),
            };
          }
        } else {
          console.warn('Supabase storage task-attachments error:', uploadError.message);
        }
      } catch (err) {
        console.warn('Supabase storage task-attachments exception:', err);
      }
    }

    // Fallback data URL for local storage
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: fileName,
          url: reader.result,
          size: fileSize,
          type: category,
          ext: fileExt.toUpperCase(),
        });
      };
      reader.readAsDataURL(file);
    });
  };

  // --- MESSAGE ATTACHMENT UPLOAD (IMAGE, VIDEO, PDF, DOC, AUDIO, ARCHIVE) ---
  const uploadMessageAttachment = async (file) => {
    if (!file) return null;

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const fileName = file.name;
    const fileSize = file.size;
    const storagePath = `conv-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Categorize attachment
    let category = 'doc';
    if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(fileExt)) {
      category = 'image';
    } else if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(fileExt)) {
      category = 'video';
    } else if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExt)) {
      category = 'audio';
    } else if (['pdf'].includes(fileExt)) {
      category = 'pdf';
    } else if (['csv', 'xls', 'xlsx'].includes(fileExt)) {
      category = 'csv';
    } else if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileExt)) {
      category = 'archive';
    } else if (['doc', 'docx', 'txt', 'rtf'].includes(fileExt)) {
      category = 'doc';
    }

    if (isSupabaseConfigured && supabase) {
      try {
        // Try 'message-attachments' bucket first, fallback to 'task-attachments' if needed
        let bucketName = 'message-attachments';
        let { data, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError && uploadError.message?.toLowerCase().includes('bucket not found')) {
          bucketName = 'task-attachments';
          const retry = await supabase.storage
            .from(bucketName)
            .upload(storagePath, file, {
              cacheControl: '3600',
              upsert: true,
            });
          data = retry.data;
          uploadError = retry.error;
        }

        if (!uploadError) {
          const { data: publicData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(storagePath);

          if (publicData?.publicUrl) {
            return {
              id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: fileName,
              url: publicData.publicUrl,
              size: fileSize,
              type: category,
              ext: fileExt.toUpperCase(),
            };
          }
        } else {
          console.warn('Supabase storage message-attachments error:', uploadError.message);
        }
      } catch (err) {
        console.warn('Supabase storage message-attachments exception:', err);
      }
    }

    // Fallback data URL for offline / local preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: fileName,
          url: reader.result,
          size: fileSize,
          type: category,
          ext: fileExt.toUpperCase(),
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const submitReport = async (reportData) => {
    const newReport = {
      id: `rep-${Date.now()}`,
      title: reportData.title,
      description: reportData.description || '',
      department_id: reportData.department_id || null,
      submitted_by: currentUser?.id || 'usr-admin-1',
      author_name: currentUser?.full_name || 'Department Author',
      author_role: currentUser?.role || 'hod',
      file_url: reportData.file_url,
      file_name: reportData.file_name,
      file_type: reportData.file_type,
      file_size: reportData.file_size || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setReports((prev) => [newReport, ...prev]);

    logActivity('REPORT_SUBMITTED', 'report', newReport.id, {
      title: newReport.title,
      author: newReport.author_name,
      file_name: newReport.file_name,
    });

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('reports').insert([newReport]);
      } catch (err) {
        console.warn('Failed to insert report in Supabase:', err);
      }
    }

    return newReport;
  };

  const deleteReport = async (reportId) => {
    setReports((prev) => prev.filter((r) => r.id !== reportId));

    logActivity('REPORT_DELETED', 'report', reportId, {});

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('reports').delete().eq('id', reportId);
      } catch (err) {
        console.warn('Failed to delete report from Supabase:', err);
      }
    }
  };

  // --- PERSONAL TASKS KANBAN ACTIONS (RLS PROTECTED) ---
  const createPersonalTask = async (taskData) => {
    if (!currentUser?.id) {
      throw new Error('You must be logged in to create a personal task.');
    }
    const userId = currentUser.id;
    const nowIso = new Date().toISOString();
    const newTask = {
      id: `pt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      user_id: userId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      priority: taskData.priority || 'medium',
      status: taskData.status || 'pending',
      category: taskData.category?.trim() || 'General',
      due_date: taskData.due_date || null,
      due_time: taskData.due_time || null,
      is_completed: taskData.status === 'completed',
      completed_at: taskData.status === 'completed' ? nowIso : null,
      sort_order: personalTasks.filter((t) => t.status === (taskData.status || 'pending')).length,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('personal_tasks')
        .insert([newTask])
        .select()
        .single();

      if (error) {
        console.error('Supabase personal_tasks insert error:', error);
        throw new Error(`Failed to save task to Supabase: ${error.message}`);
      }

      const savedTask = data || newTask;
      setPersonalTasks((prev) => [savedTask, ...prev.filter((t) => t.id !== savedTask.id)]);
      return savedTask;
    } else {
      setPersonalTasks((prev) => [newTask, ...prev]);
      return newTask;
    }
  };

  const updatePersonalTaskStatus = async (taskId, newStatus, newSortOrder = 0) => {
    const prevTasks = [...personalTasks];
    const targetTask = personalTasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    const isCompleted = newStatus === 'completed';
    const nowIso = new Date().toISOString();

    const updatedTask = {
      ...targetTask,
      status: newStatus,
      is_completed: isCompleted,
      completed_at: isCompleted ? nowIso : null,
      sort_order: newSortOrder,
      updated_at: nowIso,
    };

    // Optimistic UI Update
    setPersonalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? updatedTask : t))
    );

    if (isSupabaseConfigured && supabase && currentUser?.id) {
      try {
        const { error } = await supabase
          .from('personal_tasks')
          .update({
            status: newStatus,
            is_completed: isCompleted,
            completed_at: isCompleted ? nowIso : null,
            sort_order: newSortOrder,
            updated_at: nowIso,
          })
          .eq('id', taskId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.error('Supabase personal task status update failed:', error);
          // Rollback on failure!
          setPersonalTasks(prevTasks);
          throw new Error('Unable to update task status in database. Rolled back.');
        }
      } catch (err) {
        // Rollback
        setPersonalTasks(prevTasks);
        throw err;
      }
    }
  };

  const updatePersonalTask = async (taskId, updates) => {
    const nowIso = new Date().toISOString();
    const isCompleted = updates.status
      ? updates.status === 'completed'
      : undefined;

    setPersonalTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            ...updates,
            ...(isCompleted !== undefined
              ? {
                  is_completed: isCompleted,
                  completed_at: isCompleted ? (t.completed_at || nowIso) : null,
                }
              : {}),
            updated_at: nowIso,
          };
        }
        return t;
      })
    );

    if (isSupabaseConfigured && supabase && currentUser?.id) {
      try {
        const updatePayload = {
          ...updates,
          updated_at: nowIso,
        };
        if (isCompleted !== undefined) {
          updatePayload.is_completed = isCompleted;
          updatePayload.completed_at = isCompleted ? nowIso : null;
        }

        const { error } = await supabase
          .from('personal_tasks')
          .update(updatePayload)
          .eq('id', taskId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.warn('Failed to update personal task in Supabase:', error);
          throw error;
        }
      } catch (err) {
        console.warn('Personal task update exception:', err);
        throw err;
      }
    }
  };

  const deletePersonalTask = async (taskId) => {
    setPersonalTasks((prev) => prev.filter((t) => t.id !== taskId));

    if (isSupabaseConfigured && supabase && currentUser?.id) {
      try {
        const { error } = await supabase
          .from('personal_tasks')
          .delete()
          .eq('id', taskId)
          .eq('user_id', currentUser.id);

        if (error) {
          console.warn('Failed to delete personal task from Supabase:', error);
        }
      } catch (err) {
        console.warn('Personal task delete exception:', err);
      }
    }
  };

  const reorderPersonalTasks = async (newOrderedTasks) => {
    setPersonalTasks(newOrderedTasks);

    if (isSupabaseConfigured && supabase && currentUser?.id) {
      try {
        for (let i = 0; i < newOrderedTasks.length; i++) {
          const t = newOrderedTasks[i];
          await supabase
            .from('personal_tasks')
            .update({ sort_order: i, updated_at: new Date().toISOString() })
            .eq('id', t.id)
            .eq('user_id', currentUser.id);
        }
      } catch (err) {
        console.warn('Reorder tasks sync warning:', err);
      }
    }
  };

  // ==========================================
  // MONTHLY TARGETS & KPIs (SEPARATE DOMAIN)
  // ==========================================

  const createMonthlyTarget = async (targetData) => {
    const nowIso = new Date().toISOString();
    const newId = `mt-${Date.now()}`;
    const year = parseInt(targetData.year, 10) || new Date().getFullYear();
    const month = parseInt(targetData.month, 10) || (new Date().getMonth() + 1);
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const dueDate = targetData.due_date || calculateMonthEndDate(year, month);

    const newTarget = {
      id: newId,
      title: targetData.title?.trim() || 'Untitled Monthly Target',
      description: targetData.description?.trim() || '',
      month,
      year,
      target_month: monthKey,
      due_date: dueDate,
      status: targetData.status || 'not_started',
      priority: targetData.priority || 'medium',
      type: targetData.type || 'target', // 'target' | 'kpi'
      progress: targetData.status === 'completed' ? 100 : (targetData.progress || 0),
      kpi_target_value: targetData.kpi_target_value !== undefined && targetData.kpi_target_value !== '' ? Number(targetData.kpi_target_value) : null,
      kpi_current_value: targetData.kpi_current_value !== undefined && targetData.kpi_current_value !== '' ? Number(targetData.kpi_current_value) : (targetData.type === 'kpi' ? 0 : null),
      kpi_unit: targetData.kpi_unit?.trim() || null,
      owner_user_id: targetData.owner_user_id || currentUser?.id,
      department_id: targetData.department_id || currentUser?.department_id || null,
      created_by: currentUser?.id,
      created_at: nowIso,
      updated_at: nowIso,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('monthly_targets')
          .insert([newTarget])
          .select()
          .single();

        if (!error && data) {
          setMonthlyTargets((prev) => [data, ...prev.filter((t) => t.id !== data.id)]);
          return data;
        }
      } catch (err) {
        console.warn('Supabase monthly_targets insert fallback:', err);
      }
    }

    setMonthlyTargets((prev) => [newTarget, ...prev]);
    return newTarget;
  };

  const updateMonthlyTarget = async (targetId, updateData) => {
    const nowIso = new Date().toISOString();
    let updatedObj = null;

    setMonthlyTargets((prev) =>
      prev.map((target) => {
        if (target.id === targetId) {
          const year = updateData.year !== undefined ? parseInt(updateData.year, 10) : target.year;
          const month = updateData.month !== undefined ? parseInt(updateData.month, 10) : target.month;
          const monthKey = `${year}-${String(month).padStart(2, '0')}`;
          const dueDate = updateData.due_date || (updateData.month || updateData.year ? calculateMonthEndDate(year, month) : target.due_date);

          let progress = target.progress;
          if (updateData.status === 'completed') {
            progress = 100;
          } else if (updateData.progress !== undefined) {
            progress = updateData.progress;
          }

          updatedObj = {
            ...target,
            ...updateData,
            progress,
            year,
            month,
            target_month: monthKey,
            due_date: dueDate,
            updated_at: nowIso,
          };
          return updatedObj;
        }
        return target;
      })
    );

    if (isSupabaseConfigured && supabase && updatedObj) {
      try {
        await supabase
          .from('monthly_targets')
          .update(updatedObj)
          .eq('id', targetId);
      } catch (err) {
        console.warn('Supabase monthly target update error:', err);
      }
    }

    return updatedObj;
  };

  const updateMonthlyTargetStatus = async (targetId, newStatus, newProgress = null) => {
    const nowIso = new Date().toISOString();
    let updatedObj = null;

    setMonthlyTargets((prev) =>
      prev.map((target) => {
        if (target.id === targetId) {
          const progress =
            newProgress !== null
              ? newProgress
              : newStatus === 'completed'
              ? 100
              : target.progress;

          updatedObj = {
            ...target,
            status: newStatus,
            progress,
            updated_at: nowIso,
          };
          return updatedObj;
        }
        return target;
      })
    );

    if (isSupabaseConfigured && supabase && updatedObj) {
      try {
        await supabase
          .from('monthly_targets')
          .update({ status: newStatus, progress: updatedObj.progress, updated_at: nowIso })
          .eq('id', targetId);
      } catch (err) {
        console.warn('Supabase monthly target status update error:', err);
      }
    }

    return updatedObj;
  };

  const deleteMonthlyTarget = async (targetId) => {
    setMonthlyTargets((prev) => prev.filter((t) => t.id !== targetId));
    setMonthlyTargetComments((prev) => prev.filter((c) => c.target_id !== targetId));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('monthly_targets').delete().eq('id', targetId);
        await supabase.from('monthly_target_comments').delete().eq('target_id', targetId);
      } catch (err) {
        console.warn('Supabase monthly target delete error:', err);
      }
    }
  };

  const addMonthlyTargetComment = async (targetId, commentData) => {
    const nowIso = new Date().toISOString();
    const newComment = {
      id: `mtc-${Date.now()}`,
      target_id: targetId,
      user_id: currentUser?.id || 'usr-admin-1',
      user_name: currentUser?.full_name || 'Team Member',
      user_avatar: currentUser?.avatar_url || '',
      user_role: currentUser?.role || 'team_member',
      text: commentData.text?.trim() || '',
      attachments: commentData.attachments || [],
      created_at: nowIso,
    };

    setMonthlyTargetComments((prev) => [...prev, newComment]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('monthly_target_comments').insert([newComment]);
      } catch (err) {
        console.warn('Supabase monthly target comment insert error:', err);
      }
    }

    return newComment;
  };

  // =========================================================================
  // PRIVATE MESSAGING, GROUPS, BROADCAST & MODERATION (DOMAIN SEPARATION)
  // =========================================================================

  const getOrCreateDirectConversation = useCallback(
    async ({ recipientId }) => {
      if (!currentUser?.id || !recipientId) return null;
      const currentUid = String(currentUser.id);
      const targetUid = String(recipientId);
      const nowIso = new Date().toISOString();

      // 1. Check if a 1-to-1 direct conversation already exists in memory
      let directConv = conversations.find((c) => {
        if (c.type !== 'direct') return false;
        const parts = (conversationParticipants || []).filter(
          (p) => String(p.conversation_id) === String(c.id)
        );
        const userIds = parts.map((p) => String(p.user_id));
        return userIds.includes(currentUid) && userIds.includes(targetUid);
      });

      if (directConv) {
        return directConv;
      }

      // 2. Check Supabase to prevent duplicate creation if not in local cache yet
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: dbParts } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id')
            .in('user_id', [currentUid, targetUid]);

          if (dbParts && dbParts.length > 0) {
            const counts = {};
            dbParts.forEach((p) => {
              counts[p.conversation_id] = (counts[p.conversation_id] || 0) + 1;
            });
            const existingId = Object.keys(counts).find((k) => counts[k] >= 2);
            if (existingId) {
              const { data: existingConv } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', existingId)
                .maybeSingle();

              if (existingConv && existingConv.type === 'direct') {
                setConversations((prev) =>
                  prev.some((c) => c.id === existingConv.id) ? prev : [existingConv, ...prev]
                );
                return existingConv;
              }
            }
          }
        } catch (err) {
          console.warn('Supabase direct conversation query error:', err);
        }
      }

      const convId = `conv-dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      directConv = {
        id: convId,
        type: 'direct',
        name: null,
        created_by: currentUid,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const p1 = {
        conversation_id: convId,
        user_id: currentUid,
        joined_at: nowIso,
        last_read_at: nowIso,
      };
      const p2 = {
        conversation_id: convId,
        user_id: targetUid,
        joined_at: nowIso,
        last_read_at: null,
      };

      setConversations((prev) => [directConv, ...prev]);
      setConversationParticipants((prev) => [...prev, p1, p2]);

      if (isSupabaseConfigured && supabase) {
        try {
          const { error: convErr } = await supabase.from('conversations').insert([directConv]);
          if (convErr) console.warn('Supabase direct conversation insert notice:', convErr.message);
          const { error: partErr } = await supabase.from('conversation_participants').insert([p1, p2]);
          if (partErr) console.warn('Supabase direct participant insert notice:', partErr.message);
        } catch (e) {
          console.warn('Supabase direct conversation create fallback:', e);
        }
      }

      return directConv;
    },
    [currentUser?.id, conversations, conversationParticipants]
  );

  const sendDirectMessage = useCallback(
    async ({ recipientId, body, replyToId = null }) => {
      if (!currentUser?.id || !recipientId || !body?.trim()) return null;
      const currentUid = String(currentUser.id);
      const targetUid = String(recipientId);
      const nowIso = new Date().toISOString();

      // Find or create direct conversation
      const directConv = await getOrCreateDirectConversation({ recipientId: targetUid });
      if (!directConv) return null;

      // Update existing conversation timestamp
      setConversations((prev) =>
        prev.map((c) => (c.id === directConv.id ? { ...c, updated_at: nowIso } : c))
      );

      // Create the message
      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conversation_id: directConv.id,
        sender_id: currentUid,
        body: body.trim(),
        reply_to_message_id: replyToId || null,
        source_type: 'direct',
        broadcast_id: null,
        created_at: nowIso,
        updated_at: nowIso,
        deleted_at: null,
      };

      setMessages((prev) => [...prev, newMsg]);

      // Update sender's last_read_at
      setConversationParticipants((prev) =>
        prev.map((p) =>
          String(p.conversation_id) === String(directConv.id) && String(p.user_id) === currentUid
            ? { ...p, last_read_at: nowIso }
            : p
        )
      );

      if (isSupabaseConfigured && supabase) {
        try {
          const { error: msgErr } = await supabase.from('messages').insert([newMsg]);
          if (msgErr) console.warn('Supabase message insert notice:', msgErr.message);
          await supabase
            .from('conversations')
            .update({ updated_at: nowIso })
            .eq('id', directConv.id);
          await supabase
            .from('conversation_participants')
            .update({ last_read_at: nowIso })
            .match({ conversation_id: directConv.id, user_id: currentUid });
        } catch (e) {
          console.warn('Supabase message insert fallback:', e);
        }
      }

      return { conversation: directConv, message: newMsg };
    },
    [currentUser?.id, getOrCreateDirectConversation]
  );

  const createGroupConversation = useCallback(
    async ({ name = null, participantIds = [], initialMessage = '' }) => {
      if (!currentUser?.id) return null;
      const currentUid = String(currentUser.id);
      const nowIso = new Date().toISOString();
      const convId = `conv-grp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

      const allMemberIds = Array.from(new Set([currentUid, ...participantIds.map(String)]));

      const newGroup = {
        id: convId,
        type: 'group',
        name: name?.trim() || null,
        created_by: currentUid,
        created_at: nowIso,
        updated_at: nowIso,
      };

      const newParticipants = allMemberIds.map((uid) => ({
        conversation_id: convId,
        user_id: uid,
        joined_at: nowIso,
        last_read_at: uid === currentUid ? nowIso : null,
      }));

      setConversations((prev) => [newGroup, ...prev]);
      setConversationParticipants((prev) => [...prev, ...newParticipants]);

      let createdMsg = null;
      if (initialMessage && initialMessage.trim()) {
        createdMsg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          conversation_id: convId,
          sender_id: currentUid,
          body: initialMessage.trim(),
          reply_to_message_id: null,
          source_type: 'group',
          broadcast_id: null,
          created_at: nowIso,
          updated_at: nowIso,
          deleted_at: null,
        };
        setMessages((prev) => [...prev, createdMsg]);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          const { error: gErr } = await supabase.from('conversations').insert([newGroup]);
          if (gErr) console.warn('Supabase group insert notice:', gErr.message);
          const { error: pErr } = await supabase.from('conversation_participants').insert(newParticipants);
          if (pErr) console.warn('Supabase group participants insert notice:', pErr.message);
          if (createdMsg) {
            const { error: mErr } = await supabase.from('messages').insert([createdMsg]);
            if (mErr) console.warn('Supabase group initial msg insert notice:', mErr.message);
          }
        } catch (e) {
          console.warn('Supabase group create fallback:', e);
        }
      }

      return { conversation: newGroup, message: createdMsg, id: newGroup.id };
    },
    [currentUser?.id]
  );

  const sendBroadcastMessage = useCallback(
    async ({ recipientIds = [], body = '' }) => {
      if (!currentUser?.id || !Array.isArray(recipientIds) || recipientIds.length === 0 || !body?.trim()) {
        return null;
      }

      const currentUid = String(currentUser.id);
      const nowIso = new Date().toISOString();
      const broadcastId = `bcast-${Date.now()}`;
      const generatedMessages = [];
      const newConversations = [];
      const newParticipants = [];

      for (const rawRecipientId of recipientIds) {
        const recipientId = String(rawRecipientId);
        if (!recipientId || recipientId === currentUid) continue;

        // Find or create direct conversation with this specific recipient
        let directConv = conversations.find((c) => {
          if (c.type !== 'direct') return false;
          const parts = (conversationParticipants || []).filter(
            (p) => String(p.conversation_id) === String(c.id)
          );
          const userIds = parts.map((p) => String(p.user_id));
          return userIds.includes(currentUid) && userIds.includes(recipientId);
        });

        if (!directConv) {
          const convId = `conv-dm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          directConv = {
            id: convId,
            type: 'direct',
            name: null,
            created_by: currentUid,
            created_at: nowIso,
            updated_at: nowIso,
          };

          const p1 = {
            conversation_id: convId,
            user_id: currentUid,
            joined_at: nowIso,
            last_read_at: nowIso,
          };
          const p2 = {
            conversation_id: convId,
            user_id: recipientId,
            joined_at: nowIso,
            last_read_at: null,
          };

          newConversations.push(directConv);
          newParticipants.push(p1, p2);
        }

        const msg = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          conversation_id: directConv.id,
          sender_id: currentUid,
          body: body.trim(),
          reply_to_message_id: null,
          source_type: 'broadcast',
          broadcast_id: broadcastId,
          created_at: nowIso,
          updated_at: nowIso,
          deleted_at: null,
        };

        generatedMessages.push(msg);
      }

      if (newConversations.length > 0) {
        setConversations((prev) => [...newConversations, ...prev]);
        setConversationParticipants((prev) => [...prev, ...newParticipants]);
      }

      if (generatedMessages.length > 0) {
        setMessages((prev) => [...prev, ...generatedMessages]);
      }

      if (isSupabaseConfigured && supabase) {
        try {
          if (newConversations.length > 0) {
            await supabase.from('conversations').insert(newConversations);
            await supabase.from('conversation_participants').insert(newParticipants);
          }
          if (generatedMessages.length > 0) {
            const { error: bErr } = await supabase.from('messages').insert(generatedMessages);
            if (bErr) console.warn('Supabase broadcast insert notice:', bErr.message);
          }
        } catch (e) {
          console.warn('Supabase broadcast insert fallback:', e);
        }
      }

      return { broadcastId, count: generatedMessages.length };
    },
    [currentUser?.id, conversations, conversationParticipants]
  );

  const sendMessage = useCallback(
    async ({ conversationId, body = '', replyToId = null, attachments = [] }) => {
      const hasBody = typeof body === 'string' && body.trim().length > 0;
      const hasAttachments = Array.isArray(attachments) && attachments.length > 0;

      if (!currentUser?.id || !conversationId || (!hasBody && !hasAttachments)) {
        return null;
      }

      const currentUid = String(currentUser.id);
      const convId = String(conversationId);
      const nowIso = new Date().toISOString();

      const targetConv = conversations.find((c) => String(c.id) === convId);
      const sourceType = targetConv?.type || 'direct';

      const newMsg = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conversation_id: convId,
        sender_id: currentUid,
        body: (body || '').trim(),
        reply_to_message_id: replyToId || null,
        source_type: sourceType,
        broadcast_id: null,
        attachments: Array.isArray(attachments) ? attachments : [],
        created_at: nowIso,
        updated_at: nowIso,
        deleted_at: null,
      };

      setMessages((prev) => [...prev, newMsg]);

      // Update conversation updated_at
      setConversations((prev) =>
        prev.map((c) => (String(c.id) === convId ? { ...c, updated_at: nowIso } : c))
      );

      // Update sender's last_read_at
      setConversationParticipants((prev) => {
        const exists = prev.some(
          (p) => String(p.conversation_id) === convId && String(p.user_id) === currentUid
        );
        if (exists) {
          return prev.map((p) =>
            String(p.conversation_id) === convId && String(p.user_id) === currentUid
              ? { ...p, last_read_at: nowIso }
              : p
          );
        }
        return [
          ...prev,
          {
            conversation_id: convId,
            user_id: currentUid,
            joined_at: nowIso,
            last_read_at: nowIso,
          },
        ];
      });

      if (isSupabaseConfigured && supabase) {
        try {
          const { error: mErr } = await supabase.from('messages').insert([newMsg]);
          if (mErr) {
            console.warn('Supabase send message notice:', mErr.message);
            // If attachments column is missing in older schema, fallback insert without attachments field
            if (mErr.message?.includes('attachments')) {
              const { attachments: _att, ...msgWithoutAtt } = newMsg;
              await supabase.from('messages').insert([msgWithoutAtt]);
            }
          }
          await supabase
            .from('conversations')
            .update({ updated_at: nowIso })
            .eq('id', convId);
          await supabase
            .from('conversation_participants')
            .update({ last_read_at: nowIso })
            .match({ conversation_id: convId, user_id: currentUid });
        } catch (e) {
          console.warn('Supabase send message fallback:', e);
        }
      }

      return newMsg;
    },
    [currentUser?.id, conversations]
  );

  const markConversationAsRead = useCallback(
    (conversationId) => {
      if (!currentUser?.id || !conversationId) return;
      const currentUid = String(currentUser.id);
      const convId = String(conversationId);
      const nowIso = new Date().toISOString();

      setConversationParticipants((prev) => {
        const exists = prev.some(
          (p) => String(p.conversation_id) === convId && String(p.user_id) === currentUid
        );
        if (exists) {
          return prev.map((p) =>
            String(p.conversation_id) === convId && String(p.user_id) === currentUid
              ? { ...p, last_read_at: nowIso }
              : p
          );
        }
        return [
          ...prev,
          {
            conversation_id: convId,
            user_id: currentUid,
            joined_at: nowIso,
            last_read_at: nowIso,
          },
        ];
      });

      if (isSupabaseConfigured && supabase) {
        supabase
          .from('conversation_participants')
          .update({ last_read_at: nowIso })
          .match({ conversation_id: convId, user_id: currentUid })
          .then(({ error }) => {
            if (error) {
              // Try upsert if row did not exist yet
              supabase
                .from('conversation_participants')
                .upsert(
                  {
                    conversation_id: convId,
                    user_id: currentUid,
                    last_read_at: nowIso,
                  },
                  { onConflict: 'conversation_id,user_id' }
                )
                .then(() => {})
                .catch(() => {});
            }
          })
          .catch(() => {});
      }
    },
    [currentUser?.id]
  );

  const toggleMessageReaction = useCallback(
    async ({ messageId, emoji }) => {
      if (!currentUser?.id || !messageId || !emoji) return null;
      const currentUid = String(currentUser.id);
      const msgId = String(messageId);
      const nowIso = new Date().toISOString();

      const existing = (messageReactions || []).find(
        (r) => String(r.message_id) === msgId && String(r.user_id) === currentUid
      );

      if (existing) {
        if (existing.emoji === emoji) {
          // Toggle off: remove
          setMessageReactions((prev) =>
            prev.filter(
              (r) => !(String(r.message_id) === msgId && String(r.user_id) === currentUid)
            )
          );

          if (isSupabaseConfigured && supabase) {
            try {
              await supabase
                .from('message_reactions')
                .delete()
                .match({ message_id: msgId, user_id: currentUid });
            } catch (e) {
              console.warn('Supabase reaction remove fallback:', e);
            }
          }
          return null;
        } else {
          // Replace with new emoji
          const updated = { ...existing, emoji, created_at: nowIso };
          setMessageReactions((prev) =>
            prev.map((r) =>
              String(r.message_id) === msgId && String(r.user_id) === currentUid ? updated : r
            )
          );

          if (isSupabaseConfigured && supabase) {
            try {
              await supabase
                .from('message_reactions')
                .update({ emoji, created_at: nowIso })
                .match({ message_id: msgId, user_id: currentUid });
            } catch (e) {
              console.warn('Supabase reaction update fallback:', e);
            }
          }
          return updated;
        }
      } else {
        // Add new reaction
        const newReaction = {
          id: `react-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          message_id: msgId,
          user_id: currentUid,
          emoji,
          created_at: nowIso,
        };

        setMessageReactions((prev) => [...prev, newReaction]);

        if (isSupabaseConfigured && supabase) {
          try {
            await supabase.from('message_reactions').insert([newReaction]);
          } catch (e) {
            console.warn('Supabase reaction insert fallback:', e);
          }
        }
        return newReaction;
      }
    },
    [currentUser?.id, messageReactions]
  );

  const pinMessage = useCallback(
    async ({ conversationId, messageId }) => {
      if (!currentUser?.id || !conversationId || !messageId) return null;
      const currentUid = String(currentUser.id);
      const convId = String(conversationId);
      const msgId = String(messageId);
      const nowIso = new Date().toISOString();

      const existing = (pinnedMessages || []).find(
        (p) => String(p.conversation_id) === convId && String(p.message_id) === msgId
      );
      if (existing) return existing;

      const newPin = {
        id: `pin-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        conversation_id: convId,
        message_id: msgId,
        pinned_by: currentUid,
        pinned_at: nowIso,
      };

      setPinnedMessages((prev) => [...prev, newPin]);

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('conversation_pinned_messages').insert([newPin]);
        } catch (e) {
          console.warn('Supabase pin insert fallback:', e);
        }
      }
      return newPin;
    },
    [currentUser?.id, pinnedMessages]
  );

  const unpinMessage = useCallback(
    async ({ conversationId, messageId }) => {
      if (!currentUser?.id || !conversationId || !messageId) return;
      const convId = String(conversationId);
      const msgId = String(messageId);

      setPinnedMessages((prev) =>
        prev.filter(
          (p) => !(String(p.conversation_id) === convId && String(p.message_id) === msgId)
        )
      );

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase
            .from('conversation_pinned_messages')
            .delete()
            .match({ conversation_id: convId, message_id: msgId });
        } catch (e) {
          console.warn('Supabase unpin fallback:', e);
        }
      }
    },
    [currentUser?.id]
  );

  const deleteMessage = useCallback(
    async ({ messageId, conversationId }) => {
      if (!currentUser?.id || !messageId) return null;
      const currentUid = String(currentUser.id);
      const msgId = String(messageId);
      const nowIso = new Date().toISOString();

      const targetMsg = (messages || []).find((m) => String(m.id) === msgId);
      if (!targetMsg) return null;

      // Only allow deleting own messages per requirements
      if (String(targetMsg.sender_id) !== currentUid) {
        console.warn('Cannot delete someone else\'s message');
        return null;
      }

      const updatedMsg = {
        ...targetMsg,
        deleted_at: nowIso,
        deleted_by: currentUid,
      };

      setMessages((prev) =>
        prev.map((m) => (String(m.id) === msgId ? updatedMsg : m))
      );

      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase
            .from('messages')
            .update({
              deleted_at: nowIso,
              deleted_by: currentUid,
            })
            .eq('id', msgId);

          if (error) {
            console.warn('Supabase delete message notice:', error.message);
            if (error.message?.includes('deleted_by')) {
              await supabase
                .from('messages')
                .update({ deleted_at: nowIso })
                .eq('id', msgId);
            }
          }
        } catch (e) {
          console.warn('Supabase delete message fallback:', e);
        }
      }

      return updatedMsg;
    },
    [currentUser?.id, messages]
  );

  const value = {
    departments,
    tasks: tasks.filter((t) => !t.is_deleted), // Non-deleted tasks
    allTasks: tasks, // Including deleted tasks for audit
    deleteRequests,
    completionRequests,
    activityLogs,
    reports,
    personalTasks,
    monthlyTargets,
    monthlyTargetComments,
    settings,
    permissions,
    integrations,
    readNotificationIds,
    markAllAsRead,
    markNotificationAsRead,
    readChatIds,
    markAllChatsAsRead,
    markChatAsRead,
    markTaskUpdatesAsSeen,
    markTaskCommentsRead,
    createTask,
    updateTaskStatus,
    addTaskUpdate,
    updateTask,
    softDeleteTask,
    requestTaskDeletion,
    reviewDeleteRequest,
    requestTaskCompletion,
    reviewCompletionRequest,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    createNewUser,
    updateUserProfile,
    togglePermission,
    updateSettings,
    toggleIntegration,
    logActivity,
    uploadReportFile,
    uploadTaskAttachment,
    uploadMessageAttachment,
    submitReport,
    deleteReport,
    createPersonalTask,
    updatePersonalTaskStatus,
    updatePersonalTask,
    deletePersonalTask,
    reorderPersonalTasks,
    createMonthlyTarget,
    updateMonthlyTarget,
    updateMonthlyTargetStatus,
    deleteMonthlyTarget,
    addMonthlyTargetComment,
    // Messaging state & actions
    conversations,
    conversationParticipants,
    messages,
    messageReactions,
    pinnedMessages,
    getOrCreateDirectConversation,
    sendDirectMessage,
    createGroupConversation,
    sendBroadcastMessage,
    sendMessage,
    markConversationAsRead,
    toggleMessageReaction,
    pinMessage,
    unpinMessage,
    deleteMessage,
    refreshAllData,
    isRefreshing,
    lastRefreshedAt,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}
