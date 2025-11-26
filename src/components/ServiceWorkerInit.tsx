'use client';

import { useEffect } from 'react';
import { serviceWorkerManager } from '@/lib/service-worker/register';

export default function ServiceWorkerInit() {
  useEffect(() => {
    // Register service worker when component mounts
    const initServiceWorker = async () => {
      try {
        if (serviceWorkerManager.isSupported) {
          await serviceWorkerManager.register();
          console.log('Service Worker initialization complete');
        } else {
          console.warn('Service Workers not supported in this browser');
        }
      } catch (error) {
        console.error('Failed to initialize Service Worker:', error);
      }
    };

    initServiceWorker();

    // Listen for service worker events
    const handleFeedUpdated = (event: CustomEvent) => {
      console.log('Service Worker feed update:', event.detail);
      // Dispatch event for UI components to refresh
      window.dispatchEvent(new CustomEvent('rss-worker-complete', {
        detail: event.detail
      }));
    };

    const handleFeedError = (event: CustomEvent) => {
      console.error('Service Worker feed error:', event.detail);
    };

    window.addEventListener('service-worker-feed-updated', handleFeedUpdated as EventListener);
    window.addEventListener('service-worker-feed-error', handleFeedError as EventListener);

    return () => {
      window.removeEventListener('service-worker-feed-updated', handleFeedUpdated as EventListener);
      window.removeEventListener('service-worker-feed-error', handleFeedError as EventListener);
    };
  }, []);

  // This component doesn't render anything visible
  return null;
}
