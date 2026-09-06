/**
 * UPCOMM User Push Notification Preferences Service
 * 
 * Manages the global mobile_push_enabled preference per user.
 */

import { supabase, isSupabaseConfigured } from '../supabase';

const PREF_STORAGE_PREFIX = 'upcomm_mobile_push_pref_';

/**
 * Gets the mobile push enabled preference for a given user.
 * Defaults to false for new users until explicitly enrolled.
 */
export async function getUserPushPreference(userId) {
  if (!userId) return false;

  const localKey = `${PREF_STORAGE_PREFIX}${userId}`;
  const localVal = localStorage.getItem(localKey);

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('mobile_push_enabled')
        .eq('user_id', String(userId))
        .maybeSingle();

      if (!error && data) {
        const enabled = Boolean(data.mobile_push_enabled);
        localStorage.setItem(localKey, String(enabled));
        return enabled;
      }
    } catch (err) {
      console.warn('[PWA] Error fetching push preference:', err);
    }
  }

  // Fallback to local storage if available
  return localVal === 'true';
}

/**
 * Updates the user's mobile push preference in database & local storage.
 */
export async function setUserPushPreference(userId, enabled) {
  if (!userId) return false;

  const isEnabled = Boolean(enabled);
  const localKey = `${PREF_STORAGE_PREFIX}${userId}`;
  localStorage.setItem(localKey, String(isEnabled));

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .upsert(
          {
            user_id: String(userId),
            mobile_push_enabled: isEnabled,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.warn('[PWA] Error saving push preference:', error.message);
      }
    } catch (err) {
      console.warn('[PWA] Exception saving push preference:', err);
    }
  }

  return isEnabled;
}
