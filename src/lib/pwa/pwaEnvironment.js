/**
 * UPCOMM Modular PWA & Environment Detection Service
 * 
 * Provides platform and capability detection for:
 * - Standalone PWA install status (Android Chrome & iOS Home Screen)
 * - iOS / Android mobile environments
 * - Web Push and Notification API support
 * - App badging support
 */

/**
 * Detects whether UPCOMM is currently running as an installed standalone PWA.
 * Supports standard display-mode: standalone and iOS navigator.standalone.
 */
export function isStandalone() {
  if (typeof window === 'undefined') return false;

  const isStandaloneMedia = window.matchMedia?.('(display-mode: standalone)')?.matches;
  const isIOSStandalone = Boolean(window.navigator?.standalone);

  return Boolean(isStandaloneMedia || isIOSStandalone);
}

/**
 * Detects whether the user is on an iOS or iPadOS device.
 * Correctly accounts for iPadOS desktop userAgent with touch points.
 */
export function isIOS() {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const isDirectIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOSDesktop = navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1;

  return Boolean(isDirectIOS || isIPadOSDesktop);
}

/**
 * Detects whether the user is on an Android device.
 */
export function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent || '');
}

/**
 * Detects whether the device is a mobile or tablet device.
 */
export function isMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  if (isIOS() || isAndroid()) return true;

  const isTouchDevice = (navigator.maxTouchPoints || 0) > 0;
  const isCoarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches;
  const isMobileUA = /mobile|tablet|phone/i.test(navigator.userAgent || '');

  return Boolean((isTouchDevice && isCoarsePointer) || isMobileUA);
}

/**
 * Detects whether the browser/runtime supports Service Worker, Push API, and Notification API.
 */
export function isPushSupported() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  const hasSW = 'serviceWorker' in navigator;
  const hasPush = 'PushManager' in window;
  const hasNotification = 'Notification' in window;

  return Boolean(hasSW && hasPush && hasNotification);
}

/**
 * Detects whether the current session is an installed standalone mobile PWA eligible for Push enrollment.
 * 
 * CRITICAL PRODUCT RULE:
 * Push enrollment is ONLY for users running UPCOMM as an installed mobile PWA.
 */
export function isSupportedStandaloneMobile() {
  return isStandalone() && isMobileDevice() && isPushSupported();
}

/**
 * Detects whether the App Badging API is supported.
 */
export function isBadgingSupported() {
  if (typeof navigator === 'undefined') return false;
  return 'setAppBadge' in navigator && typeof navigator.setAppBadge === 'function';
}

/**
 * Gets a clean platform string for subscription metadata.
 */
export function getMobilePlatformName() {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  return 'other';
}

/**
 * Returns the current Notification permission state.
 */
export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'default' | 'granted' | 'denied'
}
