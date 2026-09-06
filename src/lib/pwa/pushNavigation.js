/**
 * UPCOMM Push Navigation Helper
 * 
 * Listens for navigation messages posted from the Service Worker and routes the SPA smoothly.
 */

/**
 * Initializes listener for Service Worker navigation messages.
 * @param {Function} navigate - React Router navigate function.
 */
export function initPushNavigationListener(navigate) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || typeof navigate !== 'function') {
    return () => {};
  }

  const handleMessage = (event) => {
    if (event?.data?.type === 'UPCOMM_PUSH_NAVIGATE' && event.data.url) {
      navigate(event.data.url);
    }
  };

  navigator.serviceWorker.addEventListener('message', handleMessage);

  return () => {
    navigator.serviceWorker.removeEventListener('message', handleMessage);
  };
}
