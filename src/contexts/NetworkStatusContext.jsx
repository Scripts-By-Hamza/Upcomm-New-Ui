import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NetworkStatusContext = createContext({
  isOnline: true,
  isReconnecting: false,
  checkConnection: async () => true,
});

export function NetworkStatusProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isReconnecting, setIsReconnecting] = useState(false);

  const checkConnection = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOnline(false);
      return false;
    }
    setIsReconnecting(true);
    try {
      // Lightweight connection ping (cache-busting HEAD/GET request)
      const response = await fetch(`${window.location.origin}/favicon.ico?_ping=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-store',
      });
      const online = response.ok || response.status < 500;
      setIsOnline(online);
      setIsReconnecting(false);
      return online;
    } catch (e) {
      // If network request failed completely, we are offline
      setIsOnline(false);
      setIsReconnecting(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReconnecting(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  return (
    <NetworkStatusContext.Provider value={{ isOnline, isReconnecting, checkConnection }}>
      {children}
    </NetworkStatusContext.Provider>
  );
}

export function useNetworkStatus() {
  const context = useContext(NetworkStatusContext);
  if (!context) {
    throw new Error('useNetworkStatus must be used within a NetworkStatusProvider');
  }
  return context;
}
