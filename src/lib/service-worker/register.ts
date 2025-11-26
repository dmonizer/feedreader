// Service Worker Registration
export class ServiceWorkerManager {
  private serviceWorker: ServiceWorker | null = null;
  private registration: ServiceWorkerRegistration | null = null;
  private isRegistered = false;

  async register(): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.error('Service Workers not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully:', this.registration.scope);

      // Handle service worker updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              console.log('New Service Worker activated');
              // Refresh feed schedules after update
              this.refreshFeedSchedules();
            }
          });
        }
      });

      // Get the active service worker
      this.serviceWorker = this.registration.active || this.registration.waiting || this.registration.installing;

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

      this.isRegistered = true;

      // Initial setup - refresh feed schedules
      if (this.serviceWorker?.state === 'activated') {
        await this.refreshFeedSchedules();
      } else {
        // Wait for activation
        await this.waitForActivation();
        await this.refreshFeedSchedules();
      }

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  private async waitForActivation(): Promise<void> {
    return new Promise((resolve) => {
      if (this.serviceWorker?.state === 'activated') {
        resolve();
        return;
      }

      const handleStateChange = () => {
        if (this.serviceWorker?.state === 'activated') {
          this.serviceWorker.removeEventListener('statechange', handleStateChange);
          resolve();
        }
      };

      this.serviceWorker?.addEventListener('statechange', handleStateChange);
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    const { type, payload } = event.data;

    switch (type) {
      case 'FEED_UPDATED':
        console.log(`Feed updated: ${payload.feedTitle} (${payload.newItems} new items)`);

        // Dispatch custom event for components to listen
        window.dispatchEvent(new CustomEvent('service-worker-feed-updated', {
          detail: payload
        }));

        // Show notification if new items were found
        if (payload.newItems > 0) {
          this.showNotification(payload.feedTitle, `${payload.newItems} new articles available`);
        }
        break;

      case 'FEED_UPDATE_ERROR':
        console.error(`Feed update error: ${payload.feedTitle} - ${payload.error}`);

        // Dispatch error event
        window.dispatchEvent(new CustomEvent('service-worker-feed-error', {
          detail: payload
        }));
        break;

      default:
        console.warn('Unknown service worker message:', type, payload);
    }
  }

  async refreshFeedSchedules(): Promise<void> {
    if (!this.isRegistered || !this.serviceWorker) {
      console.warn('Service Worker not registered, cannot refresh feed schedules');
      return;
    }

    try {
      // Send message to service worker to refresh schedules
      this.serviceWorker.postMessage({
        type: 'REFRESH_SCHEDULES'
      });

      console.log('Feed schedules refresh requested');
    } catch (error) {
      console.error('Failed to refresh feed schedules:', error);
    }
  }

  async updateFeedNow(feed: any): Promise<void> {
    if (!this.isRegistered || !this.serviceWorker) {
      console.warn('Service Worker not registered, cannot update feed');
      return;
    }

    try {
      this.serviceWorker.postMessage({
        type: 'UPDATE_FEED_NOW',
        payload: { feed }
      });

      console.log(`Manual feed update requested: ${feed.title}`);
    } catch (error) {
      console.error('Failed to request feed update:', error);
    }
  }

  async requestPersistentNotifications(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  private async showNotification(title: string, body: string): Promise<void> {
    if (!this.registration) return;

    try {
      // Check if we have permission
      const hasPermission = await this.requestPersistentNotifications();
      if (!hasPermission) return;

      // Show notification through service worker for better persistence
      await this.registration.showNotification(`RSS Reader - ${title}`, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'rss-feed-update',
        // @ts-expect-error - renotify is valid but not in types
        renotify: true,
        requireInteraction: false,
        actions: [
          {
            action: 'view',
            title: 'View Articles'
          }
        ]
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      console.log('Service Worker unregistered');
    }
  }

  get isSupported(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  get isActive(): boolean {
    return this.isRegistered && this.serviceWorker?.state === 'activated';
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();
