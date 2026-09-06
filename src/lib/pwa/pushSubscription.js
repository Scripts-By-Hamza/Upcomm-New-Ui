/**
 * UPCOMM Push Subscription Manager
 * 
 * Handles browser PushManager subscription lifecycle, VAPID key encoding,
 * Supabase storage, and account-switch endpoint deactivation.
 */

import { supabase, isSupabaseConfigured } from '../supabase';
import {
  isSupportedStandaloneMobile,
  getMobilePlatformName,
  getNotificationPermission,
} from './pwaEnvironment';
import {
  registerUpcommServiceWorker,
  getUpcommServiceWorkerRegistration,
} from './serviceWorkerRegistration';
import { setUserPushPreference } from './pushPreferences';

// Default public VAPID key fallback if environment variable is not yet populated
const DEFAULT_VAPID_PUBLIC_KEY = 'BDZh9MPGeFb6Tph2ZJx40WBfPnVAu7nk0A6iOAFlQo6ciHa7Oe9IO8SdM4AFI5_LXI083kqYdfZjO4qnFlflYHY';

/**
 * Converts a base64url VAPID public key into a Uint8Array.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Helper to convert ArrayBuffer to Base64url string.
 */
function arrayBufferToBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Gets the current active PushSubscription on this browser if one exists.
 */
export async function getCurrentPushSubscription() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return null;
  }

  try {
    const registration = await getUpcommServiceWorkerRegistration();
    if (!registration || !registration.pushManager) return null;
    return await registration.pushManager.getSubscription();
  } catch (err) {
    console.debug?.('[PWA] Error getting current subscription:', err);
    return null;
  }
}

/**
 * Subscribes the current installed mobile PWA to Web Push notifications.
 * ONLY called after explicit user interaction (e.g. clicking "Enable Notifications").
 * 
 * @param {string} userId - Current authenticated user ID.
 */
export async function subscribeToPushNotifications(userId) {
  if (!userId) {
    return { success: false, error: 'User must be authenticated.' };
  }

  // Enforce PWA installed standalone rule
  if (!isSupportedStandaloneMobile()) {
    return {
      success: false,
      error: 'Web Push is only available for installed mobile PWA sessions.',
    };
  }

  try {
    // 1. Ensure Service Worker is registered and ready
    await registerUpcommServiceWorker();
    const registration = await getUpcommServiceWorkerRegistration();
    if (!registration || !registration.pushManager) {
      return { success: false, error: 'Service worker is not ready.' };
    }

    // 2. Request Notification Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        success: false,
        permission,
        error: permission === 'denied' ? 'Notification permission was denied.' : 'Notification permission was dismissed.',
      };
    }

    // 3. Resolve VAPID Public Key
    const rawVapidKey = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
    const applicationServerKey = urlBase64ToUint8Array(rawVapidKey);

    // 4. Subscribe or retrieve existing subscription
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    if (!subscription) {
      return { success: false, error: 'Failed to create push subscription.' };
    }

    // 5. Extract keys
    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');

    const p256dh = arrayBufferToBase64(p256dhKey);
    const auth = arrayBufferToBase64(authKey);
    const endpoint = subscription.endpoint;
    const platform = getMobilePlatformName();
    const userAgent = navigator.userAgent || '';
    const deviceLabel = `${platform === 'ios' ? 'iPhone/iPad' : 'Android'} Standalone PWA`;

    // 6. Upsert subscription into Supabase
    if (isSupabaseConfigured && supabase) {
      const { error: dbError } = await supabase
        .from('web_push_subscriptions')
        .upsert(
          {
            user_id: String(userId),
            endpoint,
            p256dh,
            auth,
            platform,
            device_label: deviceLabel,
            user_agent: userAgent,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );

      if (dbError) {
        console.warn('[PWA] Error saving subscription in database:', dbError.message);
      }
    }

    // 7. Enable user mobile push preference
    await setUserPushPreference(userId, true);

    return {
      success: true,
      permission,
      subscription,
    };
  } catch (err) {
    console.error('[PWA] Subscription failed:', err);
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during push setup.',
    };
  }
}

/**
 * Unsubscribes from mobile push notifications and disables the user preference.
 */
export async function unsubscribeFromPushNotifications(userId) {
  try {
    // 1. Set user preference OFF
    if (userId) {
      await setUserPushPreference(userId, false);
    }

    // 2. Deactivate subscription in database
    const subscription = await getCurrentPushSubscription();
    if (subscription && isSupabaseConfigured && supabase && userId) {
      await supabase
        .from('web_push_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('endpoint', subscription.endpoint)
        .eq('user_id', String(userId));
    }

    return { success: true };
  } catch (err) {
    console.warn('[PWA] Unsubscribe warning:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Deactivates current device subscription on logout to prevent shared device notification leaks.
 */
export async function deactivatePushSubscriptionOnLogout(userId) {
  if (!userId) return;

  try {
    const subscription = await getCurrentPushSubscription();
    if (subscription && isSupabaseConfigured && supabase) {
      await supabase
        .from('web_push_subscriptions')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('endpoint', subscription.endpoint)
        .eq('user_id', String(userId));
    }
  } catch (err) {
    console.debug?.('[PWA] Logout subscription deactivation notice:', err);
  }
}

/**
 * Re-associates the current device subscription to the newly logged-in user if permissions are already active.
 */
export async function reassociatePushSubscriptionOnLogin(userId) {
  if (!userId || !isSupportedStandaloneMobile()) return;

  try {
    const permission = getNotificationPermission();
    if (permission !== 'granted') return;

    const subscription = await getCurrentPushSubscription();
    if (!subscription) return;

    const p256dhKey = subscription.getKey('p256dh');
    const authKey = subscription.getKey('auth');
    const p256dh = arrayBufferToBase64(p256dhKey);
    const auth = arrayBufferToBase64(authKey);
    const endpoint = subscription.endpoint;
    const platform = getMobilePlatformName();
    const userAgent = navigator.userAgent || '';
    const deviceLabel = `${platform === 'ios' ? 'iPhone/iPad' : 'Android'} Standalone PWA`;

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('web_push_subscriptions')
        .upsert(
          {
            user_id: String(userId),
            endpoint,
            p256dh,
            auth,
            platform,
            device_label: deviceLabel,
            user_agent: userAgent,
            is_active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
    }
  } catch (err) {
    console.debug?.('[PWA] Login subscription re-association notice:', err);
  }
}
