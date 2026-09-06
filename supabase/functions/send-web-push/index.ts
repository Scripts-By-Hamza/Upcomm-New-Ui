/**
 * UPCOMM Solutions Task Manager - Web Push Dispatcher Edge Function
 * 
 * Invoked by Database Webhook on push_notifications INSERT or direct dispatch.
 * 
 * Environment Secrets required in Supabase:
 * - WEB_PUSH_VAPID_PUBLIC_KEY
 * - WEB_PUSH_VAPID_PRIVATE_KEY
 * - WEB_PUSH_VAPID_SUBJECT (e.g. mailto:support@upcomm.com)
 * - PUSH_WEBHOOK_SECRET
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { sendPushNotification, rawPayload, WebPushError } from '@mmmike/web-push/send';
import { createClient } from '@supabase/supabase-js';

// Ambient declaration for IDE TypeScript language server
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(handler: (req: Request) => Promise<Response> | Response): void;
};

// Setup Supabase admin client with service role
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const vapidPublicKey = Deno.env.get('WEB_PUSH_VAPID_PUBLIC_KEY') ?? '';
const vapidPrivateKey = Deno.env.get('WEB_PUSH_VAPID_PRIVATE_KEY') ?? '';
const vapidSubject = Deno.env.get('WEB_PUSH_VAPID_SUBJECT') ?? 'mailto:support@upcomm.com';
const webhookSecret = Deno.env.get('PUSH_WEBHOOK_SECRET') ?? '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  // 1. CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-push-webhook-secret',
      },
    });
  }

  // 2. Validate Request Method
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 3. Webhook Authentication (if secret configured)
  const incomingSecret = req.headers.get('x-push-webhook-secret');
  const authHeader = req.headers.get('Authorization');

  if (webhookSecret) {
    const isSecretValid = incomingSecret === webhookSecret;
    const isServiceAuth = authHeader && authHeader.includes(supabaseServiceKey);
    if (!isSecretValid && !isServiceAuth) {
      return new Response(JSON.stringify({ error: 'Unauthorized webhook call' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  try {
    const body = await req.json();

    // 4. Extract push_notification record
    // Handle Supabase Webhook payload format: { type: 'INSERT', table: 'push_notifications', record: { ... } }
    const notification = body.record || body.notification || body;

    if (!notification || !notification.id || !notification.recipient_user_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload: missing notification record or recipient_user_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const recipientUserId = String(notification.recipient_user_id);

    // 5. Check if recipient user is active
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, is_active')
      .eq('id', recipientUserId)
      .maybeSingle();

    if (profile && profile.is_active === false) {
      return new Response(
        JSON.stringify({ success: true, skipped: 'Recipient account is inactive' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Check recipient push notification preference
    const { data: preference } = await supabaseAdmin
      .from('user_notification_preferences')
      .select('mobile_push_enabled')
      .eq('user_id', recipientUserId)
      .maybeSingle();

    if (!preference || preference.mobile_push_enabled !== true) {
      return new Response(
        JSON.stringify({ success: true, skipped: 'User has not enabled mobile push notifications' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Retrieve all active subscriptions for recipient
    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('web_push_subscriptions')
      .select('*')
      .eq('user_id', recipientUserId)
      .eq('is_active', true);

    if (subError || !subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, skipped: 'No active device subscriptions found for recipient' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 8. Calculate Authoritative Unread Count for app badging
    const { count: unreadCount } = await supabaseAdmin
      .from('push_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_user_id', recipientUserId)
      .is('read_at', null);

    // 9. Build Minimal, Privacy-Safe Payload
    const notificationTag = `upcomm-${(notification.event_type || 'notice').toLowerCase()}-${notification.entity_id || notification.id}`;

    const pushPayload = JSON.stringify({
      version: 1,
      eventId: notification.id,
      eventType: notification.event_type || 'SYSTEM',
      title: notification.title || 'UPCOMM',
      body: notification.body || 'You have a new notification.',
      url: notification.deep_link || '/',
      tag: notificationTag,
      unreadCount: typeof unreadCount === 'number' ? unreadCount : 1,
      createdAt: notification.created_at || new Date().toISOString(),
    });

    const vapidConfig = {
      subject: vapidSubject,
      publicKey: vapidPublicKey,
      privateKey: vapidPrivateKey,
    };

    const deliveryResults = [];

    // 10. Dispatch Web Push to each registered active device
    for (const sub of subscriptions) {
      const subKey = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        const delivered = await sendPushNotification(
          subKey,
          rawPayload(pushPayload),
          vapidConfig,
          {
            ttl: 86400, // 24 hours TTL
            urgency: 'high',
          }
        );

        if (!delivered) {
          // Push service indicated 404 / 410 Gone
          await supabaseAdmin
            .from('web_push_subscriptions')
            .update({
              is_active: false,
              last_failure_at: new Date().toISOString(),
              last_error: 'Subscription expired (404/410 Gone)',
            })
            .eq('id', sub.id);

          await supabaseAdmin
            .from('web_push_deliveries')
            .upsert(
              {
                notification_id: notification.id,
                subscription_id: sub.id,
                status: 'expired',
                last_error: 'Subscription expired (404/410 Gone)',
                attempt_count: 1,
              },
              { onConflict: 'notification_id,subscription_id' }
            );

          deliveryResults.push({ subscriptionId: sub.id, status: 'expired' });
          continue;
        }

        // Record successful delivery
        await supabaseAdmin
          .from('web_push_deliveries')
          .upsert(
            {
              notification_id: notification.id,
              subscription_id: sub.id,
              status: 'sent',
              delivered_at: new Date().toISOString(),
              attempt_count: 1,
            },
            { onConflict: 'notification_id,subscription_id' }
          );

        // Update subscription last success
        await supabaseAdmin
          .from('web_push_subscriptions')
          .update({
            last_success_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', sub.id);

        deliveryResults.push({ subscriptionId: sub.id, status: 'sent' });
      } catch (err: unknown) {
        let statusCode = 500;
        let errorMessage = 'Push send failed';

        if (err instanceof WebPushError) {
          statusCode = err.statusCode;
          errorMessage = err.message || `WebPushError: ${err.statusCode}`;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }

        // Automatic prune of dead/expired subscriptions (404 / 410)
        if (statusCode === 404 || statusCode === 410) {
          await supabaseAdmin
            .from('web_push_subscriptions')
            .update({
              is_active: false,
              last_failure_at: new Date().toISOString(),
              last_error: `Subscription expired (${statusCode})`,
            })
            .eq('id', sub.id);
        } else {
          await supabaseAdmin
            .from('web_push_subscriptions')
            .update({
              last_failure_at: new Date().toISOString(),
              last_error: errorMessage,
            })
            .eq('id', sub.id);
        }

        // Record failed delivery
        await supabaseAdmin
          .from('web_push_deliveries')
          .upsert(
            {
              notification_id: notification.id,
              subscription_id: sub.id,
              status: 'failed',
              last_error: errorMessage,
              attempt_count: 1,
            },
            { onConflict: 'notification_id,subscription_id' }
          );

        deliveryResults.push({ subscriptionId: sub.id, status: 'failed', error: errorMessage });
      }
    }

    // 11. Mark notification dispatched
    await supabaseAdmin
      .from('push_notifications')
      .update({ dispatched_at: new Date().toISOString() })
      .eq('id', notification.id);

    return new Response(
      JSON.stringify({
        success: true,
        notificationId: notification.id,
        deliveries: deliveryResults,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[send-web-push] Handler error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
