'use client';

import { useState } from 'react';
import { dbService } from '@/lib/db';
import { parseOPML, downloadOPML, validateOPML } from '@/lib/utils/opml';
import {
  exportFeeds,
  validateImportData,
  downloadJSON,
  readFileAsText,
  sanitizeFeedForImport,
  sanitizeTagForImport,
} from '@/lib/utils/feedExport';
import type { FeedSource } from '@/lib/types';

export function useImportExport() {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const exportToOPML = async (filename?: string) => {
    try {
      setLoading(true);
      setError(null);

      await dbService.initialize();
      const feeds = await dbService.getAllFeeds();
      downloadOPML(feeds, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const exportToJSON = async (filename?: string) => {
    try {
      setLoading(true);
      setError(null);

      await dbService.initialize();
      const [feeds, tags, settings] = await Promise.all([
        dbService.getAllFeeds(),
        dbService.getAllTags(),
        dbService.getSettings(),
      ]);

      const exportData = exportFeeds(feeds, tags, settings);
      downloadJSON(exportData, filename);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const importFromOPML = async (file: File): Promise<{ imported: number; skipped: number }> => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      const content = await readFileAsText(file);
      const validation = validateOPML(content);

      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid OPML file');
      }

      const feeds = parseOPML(content);
      await dbService.initialize();

      let imported = 0;
      let skipped = 0;

      for (let i = 0; i < feeds.length; i++) {
        setProgress((i / feeds.length) * 100);

        try {
          const feed = feeds[i];

          // Check if feed already exists
          const existingFeeds = await dbService.getAllFeeds();
          const exists = existingFeeds.some(existing => existing.url === feed.url);

          if (exists) {
            skipped++;
          } else {
            await dbService.addFeed(feed);
            imported++;
          }
        } catch (feedError) {
          console.warn('Failed to import feed:', feeds[i], feedError);
          skipped++;
        }
      }

      setProgress(100);
      return { imported, skipped };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const importFromJSON = async (file: File): Promise<{
    imported: number;
    skipped: number;
    tagsImported: number;
  }> => {
    try {
      setLoading(true);
      setError(null);
      setProgress(0);

      const content = await readFileAsText(file);
      const data = JSON.parse(content);
      const validation = validateImportData(data);

      if (!validation.isValid || !validation.data) {
        throw new Error(validation.error || 'Invalid JSON file');
      }

      await dbService.initialize();
      const importData = validation.data;

      let imported = 0;
      let skipped = 0;
      let tagsImported = 0;

      // Import tags first
      if (importData.tags && Array.isArray(importData.tags)) {
        const existingTags = await dbService.getAllTags();

        for (const tagData of importData.tags) {
          try {
            const tag = sanitizeTagForImport(tagData);
            const exists = existingTags.some(existing =>
              existing.name.toLowerCase() === tag.name.toLowerCase()
            );

            if (!exists) {
              await dbService.addTag(tag);
              tagsImported++;
            }
          } catch (tagError) {
            console.warn('Failed to import tag:', tagData, tagError);
          }
        }
      }

      // Import feeds
      const existingFeeds = await dbService.getAllFeeds();
      const totalFeeds = importData.feeds.length;

      for (let i = 0; i < totalFeeds; i++) {
        setProgress((i / totalFeeds) * 100);

        try {
          const feedData = importData.feeds[i];
          const feed = sanitizeFeedForImport(feedData);

          const exists = existingFeeds.some(existing => existing.url === feed.url);

          if (exists) {
            skipped++;
          } else {
            await dbService.addFeed(feed);
            imported++;
          }
        } catch (feedError) {
          console.warn('Failed to import feed:', importData.feeds[i], feedError);
          skipped++;
        }
      }

      setProgress(100);
      return { imported, skipped, tagsImported };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const importSingleFeed = async (url: string): Promise<string> => {
    try {
      setLoading(true);
      setError(null);

      await dbService.initialize();

      // Check if feed already exists
      const existingFeeds = await dbService.getAllFeeds();
      const exists = existingFeeds.some(existing => existing.url === url);

      if (exists) {
        throw new Error('Feed already exists');
      }

      // Validate the feed first
      const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch feed: ${response.statusText}`);
      }

      const xmlContent = await response.text();

      // Parse basic info
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlContent, 'text/xml');

      let title = 'Untitled Feed';
      let description = '';

      const rssChannel = doc.querySelector('rss channel');
      const atomFeed = doc.querySelector('feed[xmlns*="atom"]');

      if (rssChannel) {
        title = rssChannel.querySelector('title')?.textContent || title;
        description = rssChannel.querySelector('description')?.textContent || '';
      } else if (atomFeed) {
        title = atomFeed.querySelector('title')?.textContent || title;
        description = atomFeed.querySelector('subtitle')?.textContent || '';
      }

      const feedData: Omit<FeedSource, 'id' | 'createdAt'> = {
        url,
        title: title.trim(),
        description: description.trim(),
        tags: [],
        ignoredWords: [],
        lastUpdated: new Date(),
        isActive: true,
      };

      const id = await dbService.addFeed(feedData);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import feed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    progress,
    error,
    exportToOPML,
    exportToJSON,
    importFromOPML,
    importFromJSON,
    importSingleFeed,
  };
}