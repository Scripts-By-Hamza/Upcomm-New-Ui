/**
 * UPCOMM App Badging Utility
 * 
 * Safe wrapper for navigator.setAppBadge / navigator.clearAppBadge.
 */

import { isBadgingSupported } from './pwaEnvironment';

/**
 * Updates the app icon badge count on supported platforms (e.g. iOS 16.4+ standalone, macOS Safari).
 * @param {number} count - Unread notification count.
 */
export async function updateAppBadge(count) {
  if (!isBadgingSupported()) return;

  try {
    const numericCount = Math.max(0, parseInt(count, 10) || 0);
    if (numericCount > 0) {
      await navigator.setAppBadge(numericCount);
    } else {
      await navigator.clearAppBadge();
    }
  } catch (err) {
    console.debug?.('[PWA] setAppBadge error:', err);
  }
}

/**
 * Clears the app icon badge.
 */
export async function clearAppBadge() {
  if (!isBadgingSupported()) return;

  try {
    await navigator.clearAppBadge();
  } catch (err) {
    console.debug?.('[PWA] clearAppBadge error:', err);
  }
}
