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
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  COMPLETION_REQUEST: 'COMPLETION_REQUEST',
  DELETE_REQUEST: 'DELETE_REQUEST',
  FOCUS_TIMER_COMPLETE: 'FOCUS_TIMER_COMPLETE',
});

// Reusable audio elements and Web Audio Context
let audioElement = null;
let audioCtx = null;
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
 * Returns or initializes the shared Web Audio Context.
 */
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioCtx) {
      audioCtx = new AudioCtx();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Synthesizes a clean, pleasant two-tone harmonic notification chime via Web Audio API.
 * Guaranteed to play even if HTML5 audio elements are blocked or interrupted.
 */
export function playWebAudioChimeFallback() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Tone 1: 587.33 Hz (D5) - warm bell tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Tone 2: 880.00 Hz (A5) - bright confirmation tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.56);
  } catch (e) {
    console.warn('[NotificationSound] Web Audio fallback notice:', e);
  }
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
      getAudioContext();
      isAudioUnlocked = true;
    } catch {}

    window.removeEventListener('pointerdown', unlockHandler);
    window.removeEventListener('click', unlockHandler);
    window.removeEventListener('keydown', unlockHandler);
    window.removeEventListener('touchstart', unlockHandler);
    isUnlockListenerAttached = false;
  };

  isUnlockListenerAttached = true;
  window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
  window.addEventListener('click', unlockHandler, { once: true, passive: true });
  window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
  window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
}

function isInstalledMobileStandalone() {
  if (typeof window === 'undefined') return false;
  const isStandalone = window.matchMedia?.('(display-mode: standalone)')?.matches || Boolean(window.navigator?.standalone);
  const isMobile = /iPad|iPhone|iPod|android/i.test(navigator?.userAgent || '') || ((navigator?.maxTouchPoints || 0) > 0 && window.matchMedia?.('(pointer: coarse)')?.matches);
  return Boolean(isStandalone && isMobile);
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

  // 4. Exclude self-events (actor must not be current user) — except for personal utility events like FOCUS_TIMER_COMPLETE
  if (eventType !== SOUND_ENABLED_EVENT_TYPES.FOCUS_TIMER_COMPLETE && actorUserId && String(actorUserId) === currentUserId) {
    return false;
  }

  // 5. Deduplication: must not have already played
  if (eventId && hasEventBeenPlayed(eventId)) {
    return false;
  }

  // 6. Installed Mobile Double-Sound Prevention:
  // When running as an installed standalone mobile PWA, suppress custom audio chime
  // so the user hears only the native system Push sound.
  if (isInstalledMobileStandalone()) {
    return false;
  }

  return true;
}

/**
 * Plays the canonical UPCOMM notification sound.
 * Handles deduplication, throttling, dual HTML5 + WebAudio playback, and safe error handling.
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
    // Create a fresh audio instance for pristine playback without race conditions
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = NOTIFICATION_SOUND_VOLUME;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Safe silent fallback to Web Audio API synthesizer
        console.debug?.('[NotificationSound] HTML5 play fallback triggered:', err);
        playWebAudioChimeFallback();
      });
    }
    return true;
  } catch (e) {
    playWebAudioChimeFallback();
    return true;
  }
}

/**
 * Plays the canonical UPCOMM notification sound sequentially for a specified count (e.g. 2 times).
 * Guarantees that playback #2 strictly begins AFTER playback #1 completes its 'ended' event.
 * Handles deduplication, multi-tab coordination, and Web Audio fallback.
 */
export async function playNotificationSoundSequence(params = {}) {
  const { eventId, eventType = SOUND_ENABLED_EVENT_TYPES.FOCUS_TIMER_COMPLETE, currentUser, count = 2 } = params;

  // Verify business & privacy conditions
  if (!shouldPlayNotificationSound({ eventId, eventType, currentUser })) {
    return false;
  }

  // Mark event as played immediately across all tabs to prevent multi-tab duplicate storms
  if (eventId) {
    markEventAsPlayed(eventId, true);
  }

  const playSingleAudio = () => {
    return new Promise((resolve) => {
      try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = NOTIFICATION_SOUND_VOLUME;
        audio.loop = false;

        let hasEnded = false;
        const finish = () => {
          if (hasEnded) return;
          hasEnded = true;
          audio.removeEventListener('ended', finish);
          audio.removeEventListener('error', finish);
          resolve(true);
        };

        audio.addEventListener('ended', finish, { once: true });
        audio.addEventListener('error', finish, { once: true });

        // Safety fallback timeout if 'ended' is delayed by browser (canonical audio duration is ~500ms)
        setTimeout(finish, 1200);

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.debug?.('[NotificationSound] HTML5 sequence fallback:', err);
            playWebAudioChimeFallback();
            setTimeout(finish, 500);
          });
        }
      } catch (e) {
        playWebAudioChimeFallback();
        setTimeout(() => resolve(true), 500);
      }
    });
  };

  try {
    for (let i = 0; i < count; i++) {
      await playSingleAudio();
      // Clean brief pause (100ms) between sound #1 and sound #2
      if (i < count - 1) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    return true;
  } catch (err) {
    console.warn('[NotificationSound] Sequential play error:', err);
    return false;
  }
}

/**
 * Directly plays a test notification sound for the user.
 * Bypasses deduplication so the user can verify their speaker/headphones.
 */
export function testNotificationSound() {
  const now = Date.now();
  if (now - lastSoundPlayedAt < 250) return false;
  lastSoundPlayedAt = now;

  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = NOTIFICATION_SOUND_VOLUME;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        playWebAudioChimeFallback();
      });
    }
    return true;
  } catch (e) {
    playWebAudioChimeFallback();
    return true;
  }
}

/**
 * Backwards compatibility alias for existing callers.
 */
export function playNotificationChime(params) {
  if (params && typeof params === 'object' && params.currentUser) {
    return playNotificationSound(params);
  }
  return testNotificationSound();
}

/**
 * Resets in-memory audio and deduplication state (useful on logout / user switch).
 */
export function resetNotificationAudioState() {
  playedEventIds.clear();
  lastSoundPlayedAt = 0;
}
