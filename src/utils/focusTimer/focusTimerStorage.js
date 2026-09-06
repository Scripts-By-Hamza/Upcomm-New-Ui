/**
 * UPCOMM Focus Timer Storage & Serialization Utilities
 * 
 * Manages user-scoped, resilient persistence for the "My Focus" countdown timer.
 * Source of truth is an absolute target timestamp (endAt), not decrementing state.
 */

export const FOCUS_TIMER_STORAGE_VERSION = 1;
export const STALE_COMPLETION_GRACE_MS = 30 * 1000; // 30 seconds grace window for completion audio
export const MULTI_TAB_FOCUS_CHANNEL_NAME = 'upcomm-focus-timer-sync';

/**
 * Returns the user-scoped localStorage key for the timer.
 */
export function getFocusTimerStorageKey(userId) {
  if (!userId) return null;
  return `upcomm_focus_timer_${String(userId)}`;
}

/**
 * Generates a unique, collision-resistant timer session ID.
 */
export function generateTimerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ft-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates whether an object adheres to the Focus Timer schema.
 */
export function isValidFocusTimerObject(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (obj.version !== FOCUS_TIMER_STORAGE_VERSION) return false;
  if (!obj.timerId || typeof obj.timerId !== 'string') return false;
  if (!['idle', 'running', 'completed'].includes(obj.status)) return false;
  if (typeof obj.startedAt !== 'number' || isNaN(obj.startedAt)) return false;
  if (typeof obj.endAt !== 'number' || isNaN(obj.endAt)) return false;
  if (typeof obj.originalDurationSeconds !== 'number' || obj.originalDurationSeconds < 0) return false;
  return true;
}

/**
 * Loads and validates the stored timer for a given user.
 * Automatically resolves time progression (e.g. running -> completed).
 */
export function getStoredTimer(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  const key = getFocusTimerStorageKey(userId);
  if (!key) return null;

  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isValidFocusTimerObject(parsed)) {
      // Corrupt or outdated schema — clear safely
      localStorage.removeItem(key);
      return null;
    }

    const now = Date.now();

    // If it was stored as 'running' but the endAt has passed:
    if (parsed.status === 'running' && parsed.endAt <= now) {
      const msSinceCompletion = now - parsed.endAt;
      const isStale = msSinceCompletion > STALE_COMPLETION_GRACE_MS;

      const updated = {
        ...parsed,
        status: 'completed',
        // If expired long ago, mark completion sound handled silently to avoid jarring audio blast
        completionSoundHandled: isStale ? true : Boolean(parsed.completionSoundHandled),
        updatedAt: now,
      };

      // Persist the updated state back
      saveStoredTimer(userId, updated);
      return updated;
    }

    return parsed;
  } catch (err) {
    console.warn('[FocusTimerStorage] Failed to read stored timer:', err);
    try {
      localStorage.removeItem(key);
    } catch {}
    return null;
  }
}

/**
 * Persists the timer data to localStorage.
 */
export function saveStoredTimer(userId, timerData) {
  if (typeof window === 'undefined' || !userId || !timerData) return false;
  const key = getFocusTimerStorageKey(userId);
  if (!key) return false;

  try {
    const payload = {
      version: FOCUS_TIMER_STORAGE_VERSION,
      timerId: timerData.timerId || generateTimerId(),
      status: timerData.status || 'idle',
      startedAt: timerData.startedAt || Date.now(),
      endAt: timerData.endAt || Date.now(),
      originalDurationSeconds: timerData.originalDurationSeconds || 0,
      completionSoundHandled: Boolean(timerData.completionSoundHandled),
      updatedAt: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[FocusTimerStorage] Failed to save stored timer:', err);
    return false;
  }
}

/**
 * Clears the user's stored timer from localStorage.
 */
export function clearStoredTimer(userId) {
  if (typeof window === 'undefined' || !userId) return false;
  const key = getFocusTimerStorageKey(userId);
  if (!key) return false;

  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn('[FocusTimerStorage] Failed to clear stored timer:', err);
    return false;
  }
}
