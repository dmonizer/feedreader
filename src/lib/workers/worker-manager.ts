import { WorkerMessage, WorkerResponse, FeedSource } from '@/lib/types';
import { dbService } from '@/lib/db';
import { serviceWorkerManager } from '@/lib/service-worker/register';

export class WorkerManager {
  private worker: Worker | null = null;
  private readonly listeners: Map<string, (response: WorkerResponse) => void> = new Map();
  private isInitialized = false;

  async initialize(): Promise<void> {
    console.log("initialize")

    if (typeof window === 'undefined') {
      throw new Error('WorkerManager can only be used in browser environment');
    }

    try {
      console.log("Initializing worker")
      // Create worker from worker file
      this.worker = new Worker(
        new URL('./rss-worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data);
      });

      this.worker.addEventListener('error', (error) => {
        console.log('Worker error:', error);
      });

      this.isInitialized = true;

      // Sync feed sources with worker
      await this.syncFeedSources();

    } catch (error) {
      console.error('Failed to initialize worker:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  private handleWorkerMessage(response: WorkerResponse): void {
    // Handle specific response types
    switch (response.type) {
      case 'UPDATE_COMPLETE':
        this.handleUpdateComplete(response);
        break;
      case 'UPDATE_ERROR':
        this.handleUpdateError(response);
        break;
      case 'UPDATE_PROGRESS':
        this.handleUpdateProgress(response);
        break;
      case 'FEEDS_UPDATED':
        this.handleFeedsUpdated(response);
        break;
      case 'SCHEDULE_SET':
        this.handleScheduleSet(response);
        break;
    }

    // Broadcast to all listeners
    this.listeners.forEach(listener => {
      try {
        listener(response);
      } catch (error) {
        console.error('Error in worker message listener:', error);
      }
    });
  }

  private async handleUpdateComplete(response: WorkerResponse): Promise<void> {
    if (response.payload.items && response.payload.feedId) {
      try {
        await dbService.initialize();

        const lockName = `feed-update-${response.payload.feedId}`;

        // Use Web Locks API to coordinate with Service Worker
        if ('locks' in navigator) {
          await navigator.locks.request(lockName, async () => {
            await this.saveFeedItems(response);
          });
        } else {
          // Fallback for browsers without Web Locks API
          await this.saveFeedItems(response);
        }

      } catch (error) {
        console.error('Failed to save feed items:', error);
        throw error;
      }
    }
  }

  private async saveFeedItems(response: WorkerResponse): Promise<void> {
    // Filter out existing items by checking GUIDs
    const existingItems = await dbService.getFeedItems(response.payload.feedId);
    const existingGuids = new Set(existingItems.map(item => item.guid));
    if (!response?.payload) {
      return
    }

    const newItems = response?.payload?.items?.filter(item => !existingGuids.has(item.guid));

    if (newItems && newItems.length > 0) {
      await dbService.addFeedItems(newItems);
      console.log(`Added ${newItems.length} new items for feed ${response.payload.feedId}`);
    }

    // Update feed's lastUpdated timestamp
    if (response.payload.feedId) {
      await dbService.updateFeedLastUpdated(response.payload.feedId);
    }

    // Emit event for UI to refresh
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rss-worker-complete', {
        detail: {
          feedId: response.payload.feedId,
          newItems: newItems?.length,
          totalItems: response.payload.totalItems,
          hiddenItems: response.payload.hiddenItems
        }
      }));
    }
  }

  private handleUpdateError(response: WorkerResponse): void {
    console.error(`Feed update error for ${response.payload.feedId}:`, response.payload.error);
  }

  private handleUpdateProgress(response: WorkerResponse): void {
    // Emit progress events for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('rss-update-progress', {
        detail: response.payload
      }));
    }
  }

  private handleFeedsUpdated(response: WorkerResponse): void {
    console.log('All feeds updated:', response.payload);
  }

  private handleScheduleSet(response: WorkerResponse): void {
    console.log(`Schedule set for feed ${response.payload.feedId}:`, response.payload);
  }

  addListener(id: string, listener: (response: WorkerResponse) => void): void {
    this.listeners.set(id, listener);
  }

  removeListener(id: string): void {
    this.listeners.delete(id);
  }

  async updateFeed(feedId: string, feedUrl: string, feedSource?: FeedSource): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    const message: WorkerMessage = {
      type: 'UPDATE_FEED',
      payload: {
        feedId,
        feedUrl,
        feedSource
      },
    };

    this.worker.postMessage(message);
  }

  async updateAllFeeds(): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    try {
      await dbService.initialize();
      const feeds = await dbService.getAllFeeds();

      const message: WorkerMessage = {
        type: 'UPDATE_ALL_FEEDS',
        payload: {
          feeds
        },
      };

      this.worker.postMessage(message);
    } catch (error) {
      console.error('Failed to get feeds for update:', error);
      throw error;
    }
  }

  async scheduleUpdate(feedId: string, intervalMinutes: number): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    const message: WorkerMessage = {
      type: 'SCHEDULE_UPDATE',
      payload: { feedId, interval: intervalMinutes },
    };

    this.worker.postMessage(message);
  }

  async cancelUpdate(feedId: string): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    const message: WorkerMessage = {
      type: 'CANCEL_UPDATE',
      payload: { feedId },
    };

    this.worker.postMessage(message);
  }

  async syncFeedSources(): Promise<void> {
    if (!this.isInitialized || !this.worker) {
      throw new Error('Worker not initialized');
    }

    try {
      await dbService.initialize();
      const feeds = await dbService.getAllFeeds();

      const message: WorkerMessage = {
        type: 'SET_FEED_SOURCES',
        payload: {
          feeds
        },
      };

      this.worker.postMessage(message);
    } catch (error) {
      console.error('Failed to sync feed sources:', error);
      throw error;
    }
  }

  async scheduleAllFeeds(): Promise<void> {
    try {
      await dbService.initialize();
      const feeds = await dbService.getAllFeeds();

      for (const feed of feeds) {
        if (feed.isActive && feed.updateInterval) {
          await this.scheduleUpdate(feed.id, feed.updateInterval);
        }
      }

      // Also update service worker schedules
      await this.syncWithServiceWorker();
    } catch (error) {
      console.error('Failed to schedule all feeds:', error);
    }
  }

  async syncWithServiceWorker(): Promise<void> {
    try {
      if (serviceWorkerManager.isSupported && serviceWorkerManager.isActive) {
        await serviceWorkerManager.refreshFeedSchedules();
        console.log('Service worker schedules synced');
      }
    } catch (error) {
      console.error('Failed to sync with service worker:', error);
    }
  }

  async updateFeedViaServiceWorker(feed: FeedSource): Promise<void> {
    try {
      if (serviceWorkerManager.isSupported && serviceWorkerManager.isActive) {
        await serviceWorkerManager.updateFeedNow(feed);
        console.log(`Service worker feed update requested: ${feed.title}`);
      } else {
        // Fallback to regular worker if service worker not available
        await this.updateFeed(feed.id, feed.url, feed);
      }
    } catch (error) {
      console.error('Failed to update feed via service worker:', error);
      throw error;
    }
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const workerManager = new WorkerManager();
