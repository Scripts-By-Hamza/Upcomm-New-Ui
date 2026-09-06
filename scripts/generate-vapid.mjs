/**
 * UPCOMM Solutions Task Manager
 * VAPID Key Generation Utility
 *
 * Uses @mmmike/web-push/vapid to generate a standards-based VAPID public/private keypair.
 *
 * Run once for production setup:
 *   npm run generate:vapid
 *
 * Then configure:
 * - VITE_WEB_PUSH_PUBLIC_KEY in your frontend environment (.env / Vercel)
 * - WEB_PUSH_VAPID_PUBLIC_KEY & WEB_PUSH_VAPID_PRIVATE_KEY in Supabase Edge Secrets
 */

import { generateVapidKeys } from '@mmmike/web-push/vapid';

async function main() {
  try {
    const keys = await generateVapidKeys();

    console.log('\n==================================================');
    console.log('UPCOMM WEB PUSH - VAPID KEYS GENERATED');
    console.log('==================================================\n');

    console.log('PUBLIC KEY (for Frontend .env & Supabase Secret):');
    console.log(keys.publicKey);
    console.log('\nPRIVATE KEY (NEVER expose to frontend, Supabase Secret only):');
    console.log(keys.privateKey);

    console.log('\n==================================================');
    console.log('FRONTEND (.env / Vercel Environment Variables):');
    console.log(`VITE_WEB_PUSH_PUBLIC_KEY=${keys.publicKey}`);

    console.log('\nSUPABASE SECRETS (Run via Supabase CLI):');
    console.log(`npx supabase secrets set \\`);
    console.log(`  WEB_PUSH_VAPID_PUBLIC_KEY="${keys.publicKey}" \\`);
    console.log(`  WEB_PUSH_VAPID_PRIVATE_KEY="${keys.privateKey}" \\`);
    console.log(`  WEB_PUSH_VAPID_SUBJECT="mailto:support@upcomm.com" \\`);
    console.log(`  PUSH_WEBHOOK_SECRET="your-strong-random-webhook-secret"`);
    console.log('==================================================\n');
  } catch (error) {
    console.error('Failed to generate VAPID keys:', error);
    process.exit(1);
  }
}

main();
