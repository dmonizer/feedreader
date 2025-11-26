'use client';

import { useEffect, useState, useCallback } from 'react';
import { workerManager } from '@/lib/workers/worker-manager';
import { WorkerResponse, FeedSource } from '@/lib/types';

interface UpdateProgress {
  feedId?: string;
  progress?: number;
  status?: string;
  totalFeeds?: number;
  completedFeeds?: number;
}

interface UpdateState {
  isUpdating: boolean;
  progress: UpdateProgress | null;
  lastUpdate: Date | null;
  error: string | null;
}

export function useBackgroundUpdates() {
  const [updateState, setUpdateState] = useState<UpdateState>({
    isUpdating: false,
    progress: null,
    lastUpdate: null,
    error: null,
  });

  const [workerInitialized, setWorkerInitialized] = useState(false);

  // Initialize worker on mount
  useEffect(() => {
    const initializeWorker = async () => {
      try {
        await workerManager.initialize();
        setWorkerInitialized(true);
      } catch (error) {
        console.error('Failed to initialize worker:', error);
        setUpdateState(prev => ({
          ...prev,
          error: 'Failed to initialize background updates'
        }));
      }
    };

    initializeWorker();

    return () => {
      workerManager.terminate();
    };
  }, []);

  // Handle worker messages
  useEffect(() => {
    if (!workerInitialized) return;

    const handleWorkerMessage = (response: WorkerResponse) => {
      switch (response.type) {
        case 'UPDATE_PROGRESS':
          setUpdateState(prev => ({
            ...prev,
            isUpdating: true,
            progress: response.payload,
            error: null,
          }));
          break;

        case 'UPDATE_COMPLETE':
          setUpdateState(prev => ({
            ...prev,
            isUpdating: false,
            progress: null,
            lastUpdate: new Date(),
            error: null,
          }));
          break;

        case 'UPDATE_ERROR':
          setUpdateState(prev => ({
            ...prev,
            isUpdating: false,
            progress: null,
            error: response.payload.error || 'Update failed',
          }));
          break;

        case 'FEEDS_UPDATED':
          setUpdateState(prev => ({
            ...prev,
            isUpdating: false,
            progress: null,
            lastUpdate: new Date(),
            error: null,
          }));
          break;
      }
    };

    // Add listener
    workerManager.addListener('background-updates', handleWorkerMessage);

    return () => {
      workerManager.removeListener('background-updates');
    };
  }, [workerInitialized]);

  // Listen for custom progress events
  useEffect(() => {
    const handleProgressEvent = (event: CustomEvent) => {
      setUpdateState(prev => ({
        ...prev,
        progress: event.detail,
      }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('rss-update-progress', handleProgressEvent as EventListener);

      return () => {
        window.removeEventListener('rss-update-progress', handleProgressEvent as EventListener);
      };
    }
  }, []);

  // Update single feed
  const updateFeed = useCallback(async (feedId: string, feedUrl: string, feedSource?: FeedSource) => {
    if (!workerInitialized) {
      throw new Error('Worker not initialized');
    }

    try {
      setUpdateState(prev => ({
        ...prev,
        isUpdating: true,
        error: null,
      }));

      await workerManager.updateFeed(feedId, feedUrl, feedSource);
    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Update failed',
      }));
      throw error;
    }
  }, [workerInitialized]);

  // Update all feeds
  const updateAllFeeds = useCallback(async () => {
    if (!workerInitialized) {
      throw new Error('Worker not initialized');
    }

    try {
      setUpdateState(prev => ({
        ...prev,
        isUpdating: true,
        error: null,
      }));

      await workerManager.updateAllFeeds();
    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Update failed',
      }));
      throw error;
    }
  }, [workerInitialized]);

  // Schedule feed updates
  const scheduleUpdate = useCallback(async (feedId: string, intervalMinutes: number) => {
    if (!workerInitialized) {
      throw new Error('Worker not initialized');
    }

    try {
      await workerManager.scheduleUpdate(feedId, intervalMinutes);
    } catch (error) {
      console.error('Failed to schedule update:', error);
      throw error;
    }
  }, [workerInitialized]);

  // Cancel scheduled update
  const cancelUpdate = useCallback(async (feedId: string) => {
    if (!workerInitialized) {
      throw new Error('Worker not initialized');
    }

    try {
      await workerManager.cancelUpdate(feedId);
    } catch (error) {
      console.error('Failed to cancel update:', error);
      throw error;
    }
  }, [workerInitialized]);

  // Schedule all active feeds
  const scheduleAllFeeds = useCallback(async () => {
    if (!workerInitialized) {
      throw new Error('Worker not initialized');
    }

    try {
      await workerManager.scheduleAllFeeds();
      // This now also syncs with service worker automatically
    } catch (error) {
      console.error('Failed to schedule all feeds:', error);
      throw error;
    }
  }, [workerInitialized]);

  // Sync feed sources with worker
  const syncFeedSources = useCallback(async () => {
    if (!workerInitialized) {
      throw new Error('Worker not initialized');
    }

    try {
      await workerManager.syncFeedSources();
    } catch (error) {
      console.error('Failed to sync feed sources:', error);
      throw error;
    }
  }, [workerInitialized]);

  // Update feed via service worker (for background updates)
  const updateFeedViaServiceWorker = useCallback(async (feed: FeedSource) => {
    if (!workerInitialized) {
      throw new Error('Worker not initialized');
    }

    try {
      setUpdateState(prev => ({
        ...prev,
        isUpdating: true,
        error: null,
      }));

      await workerManager.updateFeedViaServiceWorker(feed);
    } catch (error) {
      setUpdateState(prev => ({
        ...prev,
        isUpdating: false,
        error: error instanceof Error ? error.message : 'Service worker update failed',
      }));
      throw error;
    }
  }, [workerInitialized]);

  // Clear error
  const clearError = useCallback(() => {
    setUpdateState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    // State
    isUpdating: updateState.isUpdating,
    progress: updateState.progress,
    lastUpdate: updateState.lastUpdate,
    error: updateState.error,
    workerInitialized,

    // Actions
    updateFeed,
    updateAllFeeds,
    updateFeedViaServiceWorker,
    scheduleUpdate,
    cancelUpdate,
    scheduleAllFeeds,
    syncFeedSources,
    clearError,
  };
}