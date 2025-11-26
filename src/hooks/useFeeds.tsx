'use client';

import { useState, useEffect, useCallback } from 'react';
import { dbService } from '@/lib/db';
import type { FeedSource } from '@/lib/types';

export function useFeeds() {
  const [feeds, setFeeds] = useState<FeedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeeds = useCallback(async () => {
    try {
      console.log('useFeeds: Starting loadFeeds');
      setLoading(true);
      setError(null);
      console.log('useFeeds: Initializing database');
      await dbService.initialize();
      console.log('useFeeds: Database initialized, getting feeds');
      const feedList = await dbService.getAllFeeds();
      console.log('useFeeds: Got feeds:', feedList.length);
      setFeeds(feedList);
    } catch (err) {
      console.error('useFeeds: Error loading feeds:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feeds');
    } finally {
      console.log('useFeeds: loadFeeds complete');
      setLoading(false);
    }
  }, []);

  const addFeed = useCallback(async (feedData: Omit<FeedSource, 'id' | 'createdAt'>) => {
    try {
      const id = await dbService.addFeed(feedData);
      const newFeed = await dbService.getFeed(id);
      if (newFeed) {
        setFeeds(prev => [...prev, newFeed]);
      }
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add feed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateFeed = useCallback(async (id: string, updates: Partial<FeedSource>) => {
    try {
      await dbService.updateFeed(id, updates);
      const updatedFeed = await dbService.getFeed(id);
      if (updatedFeed) {
        setFeeds(prev => prev.map(feed =>
          feed.id === id ? updatedFeed : feed
        ));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update feed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const deleteFeed = useCallback(async (id: string) => {
    try {
      await dbService.deleteFeed(id);
      setFeeds(prev => prev.filter(feed => feed.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete feed';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const testFeed = useCallback(async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(url)}`);
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  const getFeedsByTag = useCallback((tag: string) => {
    return feeds.filter(feed => feed.tags.includes(tag));
  }, [feeds]);

  const getActiveFeedsCount = useCallback(() => {
    return feeds.filter(feed => feed.isActive).length;
  }, [feeds]);

  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  return {
    feeds,
    loading,
    error,
    addFeed,
    updateFeed,
    deleteFeed,
    testFeed,
    getFeedsByTag,
    getActiveFeedsCount,
    refetch: loadFeeds,
  };
}