'use client';

import { useState, useEffect, useCallback } from 'react';
import { dbService } from '@/lib/db';
import type { Tag } from '@/lib/types';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await dbService.initialize();
      const tagList = await dbService.getAllTags();
      setTags(tagList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  const addTag = useCallback(async (tagData: Omit<Tag, 'id' | 'createdAt'>) => {
    try {
      // Check if tag already exists
      const existingTag = tags.find(tag =>
        tag.name.toLowerCase() === tagData.name.toLowerCase()
      );

      if (existingTag) {
        throw new Error('Tag already exists');
      }

      const id = await dbService.addTag(tagData);
      const newTag: Tag = {
        ...tagData,
        id,
        createdAt: new Date(),
      };
      setTags(prev => [...prev, newTag]);
      return id;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add tag';
      setError(message);
      throw new Error(message);
    }
  }, [tags]);

  const deleteTag = useCallback(async (id: string) => {
    try {
      await dbService.deleteTag(id);
      setTags(prev => prev.filter(tag => tag.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const getTagByName = useCallback((name: string) => {
    return tags.find(tag => tag.name.toLowerCase() === name.toLowerCase());
  }, [tags]);

  const getTagUsage = useCallback(async (tagName: string) => {
    try {
      const feeds = await dbService.getAllFeeds();
      return feeds.filter(feed => feed.tags.includes(tagName)).length;
    } catch {
      return 0;
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  return {
    tags,
    loading,
    error,
    addTag,
    deleteTag,
    getTagByName,
    getTagUsage,
    refetch: loadTags,
  };
}