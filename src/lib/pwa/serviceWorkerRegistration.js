/**
 * UPCOMM Centralized Service Worker Registration Service
 * 
 * Registers /sw.js once and exposes helper to get the active registration.
 */

let swRegistrationPromise = null;

/**
 * Registers the UPCOMM Service Worker (/sw.js).
 */
export async function registerUpcommServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (swRegistrationPromise) {
    return swRegistrationPromise;
  }

  swRegistrationPromise = (async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // New content is available
                console.debug?.('[PWA] New service worker installed.');
              }
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.warn('[PWA] Service worker registration notice:', error?.message || error);
      return null;
    }
  })();

  return swRegistrationPromise;
}

/**
 * Retrieves the current ready ServiceWorkerRegistration.
 */
export async function getUpcommServiceWorkerRegistration() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}
