import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getFocusTimerStorageKey,
  getStoredTimer,
  saveStoredTimer,
  clearStoredTimer,
  generateTimerId,
  MULTI_TAB_FOCUS_CHANNEL_NAME,
  STALE_COMPLETION_GRACE_MS,
} from '../utils/focusTimer/focusTimerStorage';
import {
  playNotificationSoundSequence,
  SOUND_ENABLED_EVENT_TYPES,
  preloadNotificationSound,
  initNotificationAudioUnlock,
  unlockAndPrimeAudio,
} from '../utils/audio/notificationSound';

const FocusTimerContext = createContext(null);

export function FocusTimerProvider({ children }) {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ? String(currentUser.id) : null;

  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'completed'
  const [timerId, setTimerId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [endAt, setEndAt] = useState(null);
  const [originalDurationSeconds, setOriginalDurationSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const timerRef = useRef({
    status: 'idle',
    timerId: null,
    startedAt: null,
    endAt: null,
    originalDurationSeconds: 0,
    completionSoundHandled: false,
  });

  // Keep ref synchronized
  useEffect(() => {
    timerRef.current = {
      status,
      timerId,
      startedAt,
      endAt,
      originalDurationSeconds,
      completionSoundHandled: timerRef.current.completionSoundHandled,
    };
  }, [status, timerId, startedAt, endAt, originalDurationSeconds]);

  // Broadcast channel for instantaneous cross-tab updates
  const broadcastChannelRef = useRef(null);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel(MULTI_TAB_FOCUS_CHANNEL_NAME);
        broadcastChannelRef.current = bc;
        bc.onmessage = (event) => {
          if (!userId || event?.data?.userId !== userId) return;
          const { type, payload } = event.data;
          if (type === 'SYNC' && payload) {
            applyTimerState(payload, false);
          } else if (type === 'RESET') {
            applyResetState(false);
          }
        };
      }
    } catch {}

    return () => {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
        broadcastChannelRef.current = null;
      }
    };
  }, [userId]);

  const broadcastTimerChange = (type, payload = null) => {
    if (broadcastChannelRef.current && userId) {
      try {
        broadcastChannelRef.current.postMessage({
          userId,
          type,
          payload,
          timestamp: Date.now(),
        });
      } catch {}
    }
  };

  // Helper to apply timer state to React state & ref
  const applyTimerState = useCallback((stored, broadcast = false) => {
    if (!stored || stored.status === 'idle') {
      applyResetState(broadcast);
      return;
    }

    const now = Date.now();
    const remaining = Math.max(0, Math.ceil((stored.endAt - now) / 1000));

    setStatus(stored.status);
    setTimerId(stored.timerId);
    setStartedAt(stored.startedAt);
    setEndAt(stored.endAt);
    setOriginalDurationSeconds(stored.originalDurationSeconds);
    setRemainingSeconds(remaining);

    timerRef.current = {
      status: stored.status,
      timerId: stored.timerId,
      startedAt: stored.startedAt,
      endAt: stored.endAt,
      originalDurationSeconds: stored.originalDurationSeconds,
      completionSoundHandled: Boolean(stored.completionSoundHandled),
    };

    if (broadcast) {
      broadcastTimerChange('SYNC', stored);
    }
  }, [userId]);

  // Helper to reset state
  const applyResetState = useCallback((broadcast = false) => {
    setStatus('idle');
    setTimerId(null);
    setStartedAt(null);
    setEndAt(null);
    setOriginalDurationSeconds(0);
    setRemainingSeconds(0);

    timerRef.current = {
      status: 'idle',
      timerId: null,
      startedAt: null,
      endAt: null,
      originalDurationSeconds: 0,
      completionSoundHandled: false,
    };

    if (broadcast) {
      broadcastTimerChange('RESET', null);
    }
  }, [userId]);

  // Load user's timer on authentication or user switch
  useEffect(() => {
    if (!userId) {
      applyResetState(false);
      return;
    }

    const stored = getStoredTimer(userId);
    if (stored) {
      applyTimerState(stored, false);
      // Check if newly restored timer just completed and sound is not yet handled
      if (stored.status === 'completed' && !stored.completionSoundHandled) {
        const msSinceCompletion = Date.now() - stored.endAt;
        if (msSinceCompletion <= STALE_COMPLETION_GRACE_MS) {
          triggerCompletionAudio(stored.timerId);
        }
      }
    } else {
      applyResetState(false);
    }
  }, [userId, applyTimerState, applyResetState]);

  // Trigger double notification sound on completion
  const triggerCompletionAudio = useCallback((idToAlert) => {
    if (!currentUser?.id || !idToAlert) return;
    const currentUid = String(currentUser.id);

    // Mark handled in storage immediately
    const currentTimer = getStoredTimer(currentUid);
    if (currentTimer) {
      const updated = { ...currentTimer, completionSoundHandled: true };
      saveStoredTimer(currentUid, updated);
      timerRef.current.completionSoundHandled = true;
    }

    const eventId = `focus-timer-complete:${currentUid}:${idToAlert}`;
    playNotificationSoundSequence({
      eventId,
      eventType: SOUND_ENABLED_EVENT_TYPES.FOCUS_TIMER_COMPLETE,
      currentUser,
      count: 2,
    });
  }, [currentUser]);

  // Periodic countdown interval & completion evaluator
  useEffect(() => {
    if (!userId || status !== 'running' || !endAt) return;

    const tick = () => {
      const now = Date.now();
      const diffMs = endAt - now;
      const remSec = Math.max(0, Math.ceil(diffMs / 1000));

      setRemainingSeconds(remSec);

      if (diffMs <= 0) {
        // Transition to completed
        setStatus('completed');
        const completedData = {
          version: 1,
          timerId,
          status: 'completed',
          startedAt,
          endAt,
          originalDurationSeconds,
          completionSoundHandled: true,
          updatedAt: now,
        };

        saveStoredTimer(userId, completedData);
        broadcastTimerChange('SYNC', completedData);

        if (!timerRef.current.completionSoundHandled) {
          triggerCompletionAudio(timerId);
        }
      }
    };

    tick();
    const interval = setInterval(tick, 500);

    return () => clearInterval(interval);
  }, [userId, status, endAt, timerId, startedAt, originalDurationSeconds, triggerCompletionAudio]);

  // Handle visibility change and tab focus (eliminates background tab throttling drift)
  useEffect(() => {
    const handleRecalibrate = () => {
      if (!userId || timerRef.current.status !== 'running' || !timerRef.current.endAt) return;
      const now = Date.now();
      const diffMs = timerRef.current.endAt - now;
      const remSec = Math.max(0, Math.ceil(diffMs / 1000));
      setRemainingSeconds(remSec);

      if (diffMs <= 0) {
        setStatus('completed');
        const completedData = {
          version: 1,
          timerId: timerRef.current.timerId,
          status: 'completed',
          startedAt: timerRef.current.startedAt,
          endAt: timerRef.current.endAt,
          originalDurationSeconds: timerRef.current.originalDurationSeconds,
          completionSoundHandled: true,
          updatedAt: now,
        };
        saveStoredTimer(userId, completedData);
        broadcastTimerChange('SYNC', completedData);

        if (!timerRef.current.completionSoundHandled) {
          triggerCompletionAudio(timerRef.current.timerId);
        }
      }
    };

    window.addEventListener('visibilitychange', handleRecalibrate);
    window.addEventListener('focus', handleRecalibrate);

    return () => {
      window.removeEventListener('visibilitychange', handleRecalibrate);
      window.removeEventListener('focus', handleRecalibrate);
    };
  }, [userId, triggerCompletionAudio]);

  // Storage listener for cross-tab sync fallback
  useEffect(() => {
    if (!userId) return;
    const userStorageKey = getFocusTimerStorageKey(userId);

    const handleStorage = (e) => {
      if (e.key === userStorageKey) {
        if (!e.newValue) {
          applyResetState(false);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            applyTimerState(parsed, false);
          } catch {}
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [userId, applyTimerState, applyResetState]);

  // Public Methods
  const startTimer = useCallback(({ hours = 0, minutes = 0, seconds = 0 }) => {
    if (!userId) return false;

    // Sanitize and validate inputs
    const cleanHours = Math.max(0, Math.min(23, parseInt(hours || 0, 10) || 0));
    const cleanMinutes = Math.max(0, Math.min(59, parseInt(minutes || 0, 10) || 0));
    const cleanSeconds = Math.max(0, Math.min(59, parseInt(seconds || 0, 10) || 0));

    const totalSecs = cleanHours * 3600 + cleanMinutes * 60 + cleanSeconds;
    if (totalSecs < 1) {
      return false;
    }

    // Ensure audio unlocking and priming is executed on direct user gesture
    try {
      unlockAndPrimeAudio();
      preloadNotificationSound();
    } catch {}

    const now = Date.now();
    const newTimerId = generateTimerId();
    const newEndAt = now + totalSecs * 1000;

    const timerPayload = {
      version: 1,
      timerId: newTimerId,
      status: 'running',
      startedAt: now,
      endAt: newEndAt,
      originalDurationSeconds: totalSecs,
      completionSoundHandled: false,
      updatedAt: now,
    };

    saveStoredTimer(userId, timerPayload);
    applyTimerState(timerPayload, true);
    return true;
  }, [userId, applyTimerState]);

  const addSeconds = useCallback((deltaSec = 10) => {
    if (!userId || timerRef.current.status !== 'running' || !timerRef.current.endAt) return;
    try {
      unlockAndPrimeAudio();
    } catch {}

    const addedMs = deltaSec * 1000;
    const newEndAt = timerRef.current.endAt + addedMs;

    const updated = {
      version: 1,
      timerId: timerRef.current.timerId,
      status: 'running',
      startedAt: timerRef.current.startedAt,
      endAt: newEndAt,
      originalDurationSeconds: timerRef.current.originalDurationSeconds + deltaSec,
      completionSoundHandled: false,
      updatedAt: Date.now(),
    };

    saveStoredTimer(userId, updated);
    applyTimerState(updated, true);
  }, [userId, applyTimerState]);

  const subtractSeconds = useCallback((deltaSec = 10) => {
    if (!userId || timerRef.current.status !== 'running' || !timerRef.current.endAt) return;
    try {
      unlockAndPrimeAudio();
    } catch {}

    const now = Date.now();
    const subtractedMs = deltaSec * 1000;
    const newEndAt = timerRef.current.endAt - subtractedMs;

    if (newEndAt <= now) {
      // Immediate completion
      const completed = {
        version: 1,
        timerId: timerRef.current.timerId,
        status: 'completed',
        startedAt: timerRef.current.startedAt,
        endAt: now,
        originalDurationSeconds: timerRef.current.originalDurationSeconds,
        completionSoundHandled: true,
        updatedAt: now,
      };

      saveStoredTimer(userId, completed);
      applyTimerState(completed, true);
      triggerCompletionAudio(timerRef.current.timerId);
    } else {
      const updated = {
        version: 1,
        timerId: timerRef.current.timerId,
        status: 'running',
        startedAt: timerRef.current.startedAt,
        endAt: newEndAt,
        originalDurationSeconds: Math.max(0, timerRef.current.originalDurationSeconds - deltaSec),
        completionSoundHandled: false,
        updatedAt: now,
      };

      saveStoredTimer(userId, updated);
      applyTimerState(updated, true);
    }
  }, [userId, applyTimerState, triggerCompletionAudio]);

  const resetTimer = useCallback(() => {
    if (!userId) return;
    try {
      unlockAndPrimeAudio();
    } catch {}
    clearStoredTimer(userId);
    applyResetState(true);
  }, [userId, applyResetState]);

  const startAnother = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  const value = {
    status,
    remainingSeconds,
    startedAt,
    endAt,
    timerId,
    originalDurationSeconds,
    startTimer,
    addSeconds,
    subtractSeconds,
    resetTimer,
    startAnother,
  };

  return <FocusTimerContext.Provider value={value}>{children}</FocusTimerContext.Provider>;
}

export function useFocusTimer() {
  const context = useContext(FocusTimerContext);
  if (!context) {
    throw new Error('useFocusTimer must be used within a FocusTimerProvider');
  }
  return context;
}
