/**
 * UPCOMM Centralized Notification Sound Service
 * 
 * Canonical audio file: /audio/notification-sound.wav
 * Canonical volume: 0.7
 * 
 * Responsibilities:
 * - Single source of truth for communication audio alerts (Task Comments & Messages).
 * - Silent preloading & graceful browser autoplay unlocking on first user interaction.
 * - Strict event allowlist (TASK_COMMENT, DIRECT_MESSAGE, GROUP_MESSAGE, BROADCAST_MESSAGE, MESSAGE_MENTION).
 * - Self-action suppression (sender/commenter never hears own sound).
 * - Event-ID deduplication with TTL (prevents duplicate sounds from multiple channels/subscriptions).
 * - Rapid burst throttling (300-800ms) to prevent audio storms.
 * - Multi-tab coordination via BroadcastChannel & localStorage storage events.
 * - Per-user notification sound preferences.
 * - Non-blocking, safe promise-based playback.
 */

export const NOTIFICATION_SOUND_URL = '/audio/notification-sound.wav';
export const NOTIFICATION_SOUND_VOLUME = 0.7;
export const THROTTLE_WINDOW_MS = 500;
export const EVENT_DEDUP_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const MULTI_TAB_CHANNEL_NAME = 'upcomm-notification-audio';
export const STORAGE_SYNC_KEY = 'upcomm_audio_played_sync';

export const SOUND_ENABLED_EVENT_TYPES = Object.freeze({
  TASK_COMMENT: 'TASK_COMMENT',
  DIRECT_MESSAGE: 'DIRECT_MESSAGE',
  GROUP_MESSAGE: 'GROUP_MESSAGE',
  BROADCAST_MESSAGE: 'BROADCAST_MESSAGE',
  MESSAGE_MENTION: 'MESSAGE_MENTION',
});

// Reusable single Audio instance
let audioElement = null;
let isAudioUnlocked = false;
let isUnlockListenerAttached = false;
let lastSoundPlayedAt = 0;

// In-memory cache of recently played event IDs: Map<eventId, timestamp>
const playedEventIds = new Map();

// Multi-tab BroadcastChannel
let broadcastChannel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(MULTI_TAB_CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event?.data?.eventId) {
        markEventAsPlayed(event.data.eventId, false);
      }
    };
  }
} catch {
  // BroadcastChannel unavailable
}

// Fallback multi-tab storage listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_SYNC_KEY && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        if (payload?.eventId) {
          markEventAsPlayed(payload.eventId, false);
        }
      } catch {}
    }
  });
}

/**
 * Prunes expired event IDs from the in-memory cache.
 */
function pruneExpiredEvents() {
  const now = Date.now();
  for (const [id, time] of playedEventIds.entries()) {
    if (now - time > EVENT_DEDUP_TTL_MS) {
      playedEventIds.delete(id);
    }
  }
}

/**
 * Marks an event ID as played and optionally broadcasts to other browser tabs.
 */
function markEventAsPlayed(eventId, broadcast = true) {
  if (!eventId) return;
  pruneExpiredEvents();
  playedEventIds.set(String(eventId), Date.now());

  if (broadcast) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({
          eventId: String(eventId),
          timestamp: Date.now(),
        });
      } catch {}
    }
    try {
      localStorage.setItem(
        STORAGE_SYNC_KEY,
        JSON.stringify({ eventId: String(eventId), timestamp: Date.now() })
      );
    } catch {}
  }
}

/**
 * Checks if an event ID was already played.
 */
export function hasEventBeenPlayed(eventId) {
  if (!eventId) return false;
  pruneExpiredEvents();
  return playedEventIds.has(String(eventId));
}

/**
 * Checks if notification sound is enabled for the specified user.
 * Defaults to true.
 */
export function isNotificationSoundEnabled(userId) {
  try {
    if (userId) {
      const userPref = localStorage.getItem(`upcomm_sound_alerts_${userId}`);
      if (userPref !== null) {
        return userPref === 'true';
      }
      const userSettings = localStorage.getItem(`upcomm_notification_settings_${userId}`);
      if (userSettings) {
        const parsed = JSON.parse(userSettings);
        if (parsed && typeof parsed.soundAlerts === 'boolean') {
          return parsed.soundAlerts;
        }
      }
    }

    // Global / fallback keys
    const soundPref = localStorage.getItem('upcomm_sound_alerts');
    if (soundPref !== null) {
      return soundPref === 'true';
    }
    const generalPref = localStorage.getItem('upcomm_notification_settings');
    if (generalPref) {
      const parsed = JSON.parse(generalPref);
      if (parsed && typeof parsed.soundAlerts === 'boolean') {
        return parsed.soundAlerts;
      }
    }
    return true; // default enabled
  } catch {
    return true;
  }
}

export const isSoundEnabled = isNotificationSoundEnabled;

/**
 * Sets notification sound enabled preference for a user.
 */
export function setNotificationSoundEnabled(enabled, userId) {
  try {
    const val = String(Boolean(enabled));
    if (userId) {
      localStorage.setItem(`upcomm_sound_alerts_${userId}`, val);
    }
    localStorage.setItem('upcomm_sound_alerts', val);
  } catch {}
}

/**
 * Preloads the notification sound silently.
 * Does NOT play audible sound.
 */
export function preloadNotificationSound() {
  if (typeof window === 'undefined') return null;

  try {
    if (!audioElement) {
      audioElement = new Audio(NOTIFICATION_SOUND_URL);
      audioElement.preload = 'auto';
      audioElement.volume = NOTIFICATION_SOUND_VOLUME;
      audioElement.loop = false;
    }
    audioElement.load();
    return audioElement;
  } catch (e) {
    console.warn('[NotificationSound] Preload notice:', e);
    return null;
  }
}

/**
 * Initializes browser autoplay unlocking on first user interaction.
 * Prepares audio silently without any audible playback.
 */
export function initNotificationAudioUnlock() {
  if (typeof window === 'undefined' || isAudioUnlocked || isUnlockListenerAttached) return;

  const unlockHandler = () => {
    try {
      if (!audioElement) {
        preloadNotificationSound();
      }
      isAudioUnlocked = true;
    } catch {}

    window.removeEventListener('pointerdown', unlockHandler);
    window.removeEventListener('click', unlockHandler);
    window.removeEventListener('keydown', unlockHandler);
    isUnlockListenerAttached = false;
  };

  isUnlockListenerAttached = true;
  window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
  window.addEventListener('click', unlockHandler, { once: true, passive: true });
  window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
}

/**
 * Core decision logic determining whether notification sound should play.
 */
export function shouldPlayNotificationSound({
  eventId,
  eventType,
  actorUserId,
  currentUser,
}) {
  // 1. Current user must be authenticated
  if (!currentUser?.id) return false;

  const currentUserId = String(currentUser.id);

  // 2. User preference must be enabled
  if (!isNotificationSoundEnabled(currentUserId)) return false;

  // 3. Event type must be in allowlist
  if (!eventType || !Object.values(SOUND_ENABLED_EVENT_TYPES).includes(eventType)) {
    return false;
  }

  // 4. Exclude self-events (actor must not be current user)
  if (actorUserId && String(actorUserId) === currentUserId) {
    return false;
  }

  // 5. Deduplication: must not have already played
  if (eventId && hasEventBeenPlayed(eventId)) {
    return false;
  }

  return true;
}

/**
 * Plays the canonical UPCOMM notification sound.
 * Handles deduplication, throttling, and safe error handling.
 */
export function playNotificationSound(params = {}) {
  const { eventId, eventType, actorUserId, currentUser } = params;

  // Verify business & privacy conditions
  if (!shouldPlayNotificationSound({ eventId, eventType, actorUserId, currentUser })) {
    return false;
  }

  // Mark event as played immediately to prevent re-triggering across duplicate channels
  if (eventId) {
    markEventAsPlayed(eventId, true);
  }

  // Throttle check to avoid audio storm
  const now = Date.now();
  if (now - lastSoundPlayedAt < THROTTLE_WINDOW_MS) {
    return false; // Throttled safely (event remains deduplicated)
  }
  lastSoundPlayedAt = now;

  try {
    if (!audioElement) {
      preloadNotificationSound();
    }
    if (!audioElement) return false;

    audioElement.volume = NOTIFICATION_SOUND_VOLUME;
    audioElement.currentTime = 0;

    const playPromise = audioElement.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Safe silent catch for browser autoplay restrictions or interruptions
        console.debug?.('[NotificationSound] Play blocked or interrupted:', err);
      });
    }
    return true;
  } catch (e) {
    // Graceful fallback
    return false;
  }
}

/**
 * Backwards compatibility alias for existing callers.
 */
export function playNotificationChime(params) {
  if (params && typeof params === 'object' && params.currentUser) {
    return playNotificationSound(params);
  }
  // Legacy call without arguments
  const now = Date.now();
  if (now - lastSoundPlayedAt < THROTTLE_WINDOW_MS) return false;
  lastSoundPlayedAt = now;
  try {
    if (!audioElement) preloadNotificationSound();
    if (audioElement) {
      audioElement.volume = NOTIFICATION_SOUND_VOLUME;
      audioElement.currentTime = 0;
      audioElement.play().catch(() => {});
    }
  } catch {}
  return true;
}

/**
 * Resets in-memory audio and deduplication state (useful on logout / user switch).
 */
export function resetNotificationAudioState() {
  playedEventIds.clear();
  lastSoundPlayedAt = 0;
}
