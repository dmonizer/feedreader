'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { dbService } from '@/lib/db';
import { shouldHideContent, combineIgnoredWords } from '@/lib/utils/ignoredWords';
import type { FeedItem, FeedSource, FilterState, UserSettings } from '@/lib/types';

interface UseArticlesOptions {
  limit?: number;
  filters?: FilterState;
  sortBy?: 'date' | 'title' | 'source';
  sortOrder?: 'asc' | 'desc';
}

export function useArticles({
  limit = 50,
  filters = {
    selectedTags: [],
    filterMode: 'OR',
    searchQuery: '',
    showRead: true,
    showStarred: true,
  },
  sortBy = 'date',
  sortOrder = 'desc',
}: UseArticlesOptions = {}) {
  const [articles, setArticles] = useState<FeedItem[]>([]);
  const [allFeeds, setAllFeeds] = useState<FeedSource[]>([]);
  const [globalSettings, setGlobalSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Use ref to store current offset for callbacks
  const offsetRef = useRef(offset);

  // Use ref for refresh callback to avoid re-registering event listener
  const refreshRef = useRef<() => void>();

  // Keep ref in sync with state
  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  // Load feeds and global settings for filtering and metadata
  const loadFeeds = useCallback(async () => {
    try {
      await dbService.initialize();
      const [feedList, settings] = await Promise.all([
        dbService.getAllFeeds(),
        dbService.getSettings()
      ]);
      setAllFeeds(feedList);
      setGlobalSettings(settings);
    } catch (err) {
      console.error('Failed to load feeds and settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feeds and settings');
    }
  }, []);

  // Load articles with filters applied
  const loadArticles = useCallback(async (reset = false, currentOffset?: number) => {
    try {
      setLoading(true);
      setError(null);

      await dbService.initialize();

      // Use provided offset, or get current offset from state if not provided
      let offsetToUse = currentOffset ?? 0;
      if (!reset && currentOffset === undefined) {
        // When not resetting and no offset provided, we need to use current state
        // This is handled by the caller passing the correct offset
        offsetToUse = 0; // fallback
      }

      const items = await dbService.getFeedItems(undefined, limit, offsetToUse);

      if (reset) {
        setArticles(items);
        setOffset(limit);
      } else {
        setArticles(prev => [...prev, ...items]);
        setOffset(prev => prev + limit);
      }

      setHasMore(items.length === limit);
    } catch (err) {
      console.error('Failed to load articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  // Apply filters to articles
  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    // Filter out articles based on ignored words (both feed-specific and global)
    if (globalSettings) {
      filtered = filtered.filter(article => {
        const feed = allFeeds.find(f => f.id === article.feedId);
        const feedIgnoredWords = feed?.ignoredWords || [];
        const globalIgnoredWords = globalSettings.globalIgnoredWords || [];
        const combinedIgnoredWords = combineIgnoredWords(feedIgnoredWords, globalIgnoredWords);

        if (combinedIgnoredWords.length === 0) return true;

        return !shouldHideContent(
          article,
          combinedIgnoredWords
        );
      });
    }

    // Filter by read status
    if (!filters.showRead) {
      filtered = filtered.filter(article => !article.isRead);
    }

    // Filter by starred status
    if (!filters.showStarred) {
      filtered = filtered.filter(article => article.isStarred);
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.description?.toLowerCase().includes(query) ||
        article.content?.toLowerCase().includes(query)
      );
    }

    // Tag filter
    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter(article => {
        const feed = allFeeds.find(f => f.id === article.feedId);
        if (!feed) return false;

        if (filters.filterMode === 'AND') {
          return filters.selectedTags.every(tag => feed.tags.includes(tag));
        } else {
          return filters.selectedTags.some(tag => feed.tags.includes(tag));
        }
      });
    }

    // Sort articles
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = a.pubDate.getTime() - b.pubDate.getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'source':
          const feedA = allFeeds.find(f => f.id === a.feedId);
          const feedB = allFeeds.find(f => f.id === b.feedId);
          comparison = (feedA?.title || '').localeCompare(feedB?.title || '');
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [articles, allFeeds, globalSettings, sortBy, sortOrder, filters.showRead, filters.showStarred, filters.searchQuery, filters.filterMode, filters.selectedTags]);

  // Mark article as read/unread
  const markAsRead = useCallback(async (articleId: string, isRead: boolean) => {
    try {
      await dbService.markAsRead([articleId]);

      // Optimistic update
      setArticles(prev =>
        prev.map(article =>
          article.id === articleId ? { ...article, isRead } : article
        )
      );
    } catch (err) {
      console.error('Failed to mark article as read:', err);
      throw new Error('Failed to update article status');
    }
  }, []);

  // Toggle star on article
  const toggleStar = useCallback(async (articleId: string, isStarred: boolean) => {
    try {
      await dbService.toggleStar(articleId);

      // Optimistic update
      setArticles(prev =>
        prev.map(article =>
          article.id === articleId ? { ...article, isStarred } : article
        )
      );
    } catch (err) {
      console.error('Failed to toggle star:', err);
      throw new Error('Failed to update article status');
    }
  }, []);

  // Mark all visible articles as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadIds = filteredArticles
        .filter(article => !article.isRead)
        .map(article => article.id);

      if (unreadIds.length === 0) return;

      await dbService.markAsRead(unreadIds);

      // Optimistic update
      setArticles(prev =>
        prev.map(article =>
          unreadIds.includes(article.id) ? { ...article, isRead: true } : article
        )
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      throw new Error('Failed to mark articles as read');
    }
  }, [filteredArticles]);

  // Load more articles (for infinite scroll)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadArticles(false, offsetRef.current);
    }
  }, [loading, hasMore, loadArticles]);

  // Refresh articles (reset and reload)
  const refresh = useCallback(() => {
    setOffset(0);
    loadArticles(true, 0);
  }, [loadArticles]);

  // Keep refresh ref up to date
  useEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  // Listen for worker update completions to auto-refresh
  useEffect(() => {
    const handleWorkerUpdate = () => {
      // Refresh articles when new items are added via worker
      refreshRef.current?.();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('rss-worker-complete', handleWorkerUpdate);

      return () => {
        window.removeEventListener('rss-worker-complete', handleWorkerUpdate);
      };
    }
  }, []); // Empty dependency array - listener never re-registers

  // Get feed source for an article
  const getFeedSource = useCallback((feedId: string): FeedSource | undefined => {
    return allFeeds.find(feed => feed.id === feedId);
  }, [allFeeds]);

  // Get article counts
  const counts = useMemo(() => {
    const total = filteredArticles.length;
    const unread = filteredArticles.filter(a => !a.isRead).length;
    const starred = filteredArticles.filter(a => a.isStarred).length;

    return { total, unread, starred };
  }, [filteredArticles]);

  // Initialize data loading
  useEffect(() => {
    loadFeeds();
  }, [loadFeeds]);

  useEffect(() => {
    if (allFeeds.length > 0) {
      loadArticles(true, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFeeds.length]); // Only trigger when feeds are loaded, loadArticles is stable

  // Reset when filters change significantly
  useEffect(() => {
    if (allFeeds.length > 0) {
      setOffset(0);
      loadArticles(true, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.selectedTags, filters.filterMode, filters.showRead, filters.showStarred]); // loadArticles is stable

  return {
    articles: filteredArticles,
    allFeeds,
    loading,
    error,
    hasMore,
    counts,
    markAsRead,
    toggleStar,
    markAllAsRead,
    loadMore,
    refresh,
    getFeedSource,
  };
}
