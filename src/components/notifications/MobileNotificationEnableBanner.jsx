import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  isSupportedStandaloneMobile,
  getNotificationPermission,
} from '../../lib/pwa/pwaEnvironment';
import {
  subscribeToPushNotifications,
  getCurrentPushSubscription,
} from '../../lib/pwa/pushSubscription';
import { getUserPushPreference } from '../../lib/pwa/pushPreferences';

const DISMISSED_KEY = 'upcomm_mobile_push_banner_dismissed';

export function MobileNotificationEnableBanner() {
  const { currentUser } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }

  useEffect(() => {
    let isMounted = true;

    async function evaluateBannerEligibility() {
      // 1. Must be authenticated
      if (!currentUser?.id) {
        setIsVisible(false);
        return;
      }

      // 2. Must be running in installed standalone mobile PWA
      if (!isSupportedStandaloneMobile()) {
        setIsVisible(false);
        return;
      }

      // 3. Must not have already denied permission
      const permission = getNotificationPermission();
      if (permission === 'denied') {
        setIsVisible(false);
        return;
      }

      // 4. Must not be temporarily dismissed in this session
      const isDismissed = sessionStorage.getItem(`${DISMISSED_KEY}_${currentUser.id}`);
      if (isDismissed === 'true') {
        setIsVisible(false);
        return;
      }

      // 5. Check if already enabled in preferences and has active subscription
      try {
        const prefEnabled = await getUserPushPreference(currentUser.id);
        const currentSub = await getCurrentPushSubscription();

        if (isMounted) {
          if (!prefEnabled || !currentSub) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        }
      } catch (err) {
        if (isMounted) setIsVisible(false);
      }
    }

    evaluateBannerEligibility();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (currentUser?.id) {
      sessionStorage.setItem(`${DISMISSED_KEY}_${currentUser.id}`, 'true');
    }
  };

  const handleEnable = async () => {
    if (!currentUser?.id) return;

    setIsLoading(true);
    setFeedback(null);

    const result = await subscribeToPushNotifications(currentUser.id);
    setIsLoading(false);

    if (result.success) {
      setFeedback({
        type: 'success',
        text: "Mobile notifications enabled. You'll receive alerts even when UPCOMM is closed.",
      });
      setTimeout(() => {
        setIsVisible(false);
      }, 3500);
    } else {
      if (result.permission === 'denied') {
        setFeedback({
          type: 'error',
          text: 'Notifications are blocked on this device. Enable them from device settings to receive alerts.',
        });
      } else {
        setFeedback({
          type: 'error',
          text: result.error || 'Failed to enable notifications. Please try again from Profile settings.',
        });
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full mb-4 animate-fade-in font-['Inter']" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] rounded-[10px] p-4 sm:p-5 shadow-xs transition-colors">
        {feedback ? (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-[#059669] dark:text-[#10B981] flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[#DC2626] dark:text-[#EF4444] flex-shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="text-[13.5px] font-semibold text-[#18181B] dark:text-zinc-100">
                  {feedback.type === 'success' ? 'Notifications Activated' : 'Notice'}
                </h4>
                <p className="text-[12.5px] text-[#52525B] dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {feedback.text}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 text-[#71717A] hover:text-[#18181B] dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center flex-shrink-0 text-[#059669] dark:text-[#10B981]">
                <Bell className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="text-[14px] font-semibold text-[#18181B] dark:text-zinc-100 tracking-tight">
                  Enable mobile notifications
                </h3>
                <p className="text-[12px] text-[#52525B] dark:text-zinc-400 leading-normal">
                  Get alerts for messages, task comments, assignments and requests even when UPCOMM is closed.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-shrink-0 pt-1 sm:pt-0">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={isLoading}
                className="h-[34px] px-3.5 text-[12.5px] font-medium text-[#52525B] dark:text-zinc-400 hover:text-[#18181B] dark:hover:text-zinc-200 bg-white dark:bg-[#18181B] border border-[#E5E7EB] dark:border-[#27272A] hover:border-[#D4D4D8] rounded-[7px] transition-colors cursor-pointer disabled:opacity-50"
              >
                Not Now
              </button>

              <button
                type="button"
                onClick={handleEnable}
                disabled={isLoading}
                className="h-[34px] px-4 text-[12.5px] font-semibold text-white bg-[#059669] hover:bg-[#047857] dark:bg-[#059669] dark:hover:bg-[#047857] rounded-[7px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-none disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Enabling...</span>
                  </>
                ) : (
                  <span>Enable Notifications</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
