/**
 * UPCOMM Notification Audio Service
 * - Synthesizes a soft, pleasant notification chime using Web Audio API
 * - Requires no external mp3 assets (zero network latency / 100% reliable)
 * - Throttled to prevent audio storms on rapid comment bursts
 * - Respects user notification sound preferences
 */

let audioCtx = null;
let lastChimeTime = 0;
const CHIME_THROTTLE_MS = 800;

export function isSoundEnabled() {
  try {
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

export function playNotificationChime() {
  if (!isSoundEnabled()) return;

  const now = Date.now();
  if (now - lastChimeTime < CHIME_THROTTLE_MS) {
    return; // Throttled
  }
  lastChimeTime = now;

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    const startTime = audioCtx.currentTime;

    // First Tone: 784 Hz (G5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, startTime);
    gain1.gain.setValueAtTime(0.001, startTime);
    gain1.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(startTime);
    osc1.stop(startTime + 0.14);

    // Second Tone (Harmonic resolution): 1046.5 Hz (C6)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, startTime + 0.08);
    gain2.gain.setValueAtTime(0.001, startTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.15, startTime + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(startTime + 0.08);
    osc2.stop(startTime + 0.30);
  } catch (e) {
    // Graceful silent fallback for environments without audio support
  }
}
