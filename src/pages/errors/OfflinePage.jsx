import React, { useState } from 'react';
import { WifiOff, RefreshCw, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNetworkStatus } from '../../contexts/NetworkStatusContext';
import { useAppData } from '../../contexts/AppDataContext';

export function OfflinePage() {
  const { isReconnecting, checkConnection } = useNetworkStatus();
  const { settings, refreshAllData } = useAppData();
  const [isManualChecking, setIsManualChecking] = useState(false);
  const [offlineNotice, setOfflineNotice] = useState('');

  const portalName = settings?.portal_name || 'UPCOMM';
  const logoUrl = settings?.sidebar_logo_url || '/logo.png';

  const handleManualRetry = async () => {
    setIsManualChecking(true);
    setOfflineNotice('');
    const online = await checkConnection();
    if (online) {
      await refreshAllData();
    } else {
      setOfflineNotice('Still offline. Please check your network or Wi-Fi settings.');
      setTimeout(() => setOfflineNotice(''), 4000);
    }
    setIsManualChecking(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 select-none font-sans transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6 relative overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-400 via-rose-500 to-amber-500" />

        {/* Portal Branding */}
        <div className="flex items-center justify-center gap-3">
          <img
            src={logoUrl}
            alt={portalName}
            className="w-10 h-10 object-contain rounded-xl"
            onError={(e) => {
              e.currentTarget.src = '/logo.png';
            }}
          />
          <span className="text-base font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {portalName}
          </span>
        </div>

        {/* Icon & Status */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
            <WifiOff className="w-10 h-10 animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            You are Offline
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            It looks like your internet connection was lost. UPCOMM is waiting for connection to resume syncing your tasks and messages.
          </p>
        </div>

        {/* Dynamic status / alerts */}
        {offlineNotice && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl text-xs text-red-700 dark:text-red-300 font-medium flex items-center justify-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{offlineNotice}</span>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleManualRetry}
            disabled={isManualChecking || isReconnecting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            {isManualChecking || isReconnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking Connection...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Try to Reconnect</span>
              </>
            )}
          </button>
        </div>

        {/* Auto Recovery Subtext */}
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Auto-recovery enabled: Your session will automatically restore once connectivity returns.
        </p>
      </div>
    </div>
  );
}

export default OfflinePage;
