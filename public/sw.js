/**
 * UPCOMM Solutions Task Manager - Service Worker
 * 
 * Responsibilities:
 * - Native Web Push notification display for installed mobile PWA.
 * - System sound and vibration via native OS notifications.
 * - Privacy-safe lock screen notification presentation.
 * - Multi-device deep link routing & window focus on notification tap.
 * - App icon badging on supported platforms (iOS 16.4+).
 * 
 * NOTE: No private company data, messages, or auth tokens are cached here.
 */

const SW_VERSION = 'upcomm-sw-v1.0.0';

// 1. Install Lifecycle
self.addEventListener('install', (event) => {
  // Activate immediately without waiting for old worker to exit
  self.skipWaiting();
});

// 2. Activate Lifecycle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Take control of all open pages immediately
      await self.clients.claim();
    })()
  );
});

/**
 * Safely parses the push payload data.
 */
function parsePushPayload(event) {
  const fallback = {
    version: 1,
    title: 'UPCOMM',
    body: 'You have a new notification.',
    url: '/',
    tag: `upcomm-${Date.now()}`,
    unreadCount: null,
  };

  if (!event || !event.data) {
    return fallback;
  }

  try {
    const data = event.data.json();
    return {
      version: data.version || 1,
      eventId: data.eventId || null,
      eventType: data.eventType || 'SYSTEM',
      title: (typeof data.title === 'string' && data.title.trim()) ? data.title.trim() : 'UPCOMM',
      body: (typeof data.body === 'string' && data.body.trim()) ? data.body.trim() : 'You have a new notification.',
      url: (typeof data.url === 'string' && data.url.trim()) ? data.url.trim() : '/',
      tag: (typeof data.tag === 'string' && data.tag.trim()) ? data.tag.trim() : `upcomm-${Date.now()}`,
      unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : null,
      createdAt: data.createdAt || new Date().toISOString(),
    };
  } catch (err) {
    // If text payload rather than JSON
    try {
      const text = event.data.text();
      if (text && text.trim()) {
        return {
          ...fallback,
          body: text.trim(),
        };
      }
    } catch {}
    return fallback;
  }
}

// 3. Web Push Handler
self.addEventListener('push', (event) => {
  const payload = parsePushPayload(event);

  const notificationOptions = {
    body: payload.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/notification-badge.png',
    tag: payload.tag,
    renotify: true,
    data: {
      eventId: payload.eventId,
      eventType: payload.eventType,
      url: payload.url,
      unreadCount: payload.unreadCount,
      createdAt: payload.createdAt,
    },
    // Let OS / device manage sound, vibration, and banner presentation
  };

  const tasks = [];

  // Show the native system notification
  tasks.push(
    self.registration.showNotification(payload.title, notificationOptions)
  );

  // Update App Badge on iOS/macOS/supported platforms
  if (typeof payload.unreadCount === 'number' && 'setAppBadge' in navigator) {
    if (payload.unreadCount > 0) {
      tasks.push(navigator.setAppBadge(payload.unreadCount).catch(() => {}));
    } else {
      tasks.push(navigator.clearAppBadge().catch(() => {}));
    }
  }

  event.waitUntil(Promise.all(tasks));
});

/**
 * Validates deep link to prevent unsafe URLs (e.g. javascript:, external phishing).
 */
function sanitizeDeepLink(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '/';
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, self.location.origin);
    if (parsed.origin === self.location.origin) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {}
  return '/';
}

// 4. Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  // Always close the system notification when clicked
  event.notification.close();

  const targetUrl = sanitizeDeepLink(event.notification?.data?.url);
  const fullTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    (async () => {
      // Find all existing client window tabs/standalone windows for UPCOMM
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // If an existing window is open, focus it and navigate to destination
      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus();
          if ('navigate' in client) {
            await client.navigate(fullTargetUrl);
          } else {
            client.postMessage({
              type: 'UPCOMM_PUSH_NAVIGATE',
              url: targetUrl,
            });
          }
          return;
        }
      }

      // If no window is currently open, launch a new standalone window
      if (self.clients.openWindow) {
        await self.clients.openWindow(fullTargetUrl);
      }
    })()
  );
});

// 5. Notification Dismissal (Do NOT mark items read on swipe-away)
self.addEventListener('notificationclose', () => {
  // No-op: Dismissing a banner does not mean the user has read the message/task.
});
