'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { validateRssFeed, normalizeUrl } from '@/lib/utils/feedValidation';
import type { FeedSource } from '@/lib/types';

interface FeedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedData: Omit<FeedSource, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: Partial<FeedSource>;
  mode: 'add' | 'edit';
}

export function FeedForm({ isOpen, onClose, onSubmit, initialData, mode }: FeedFormProps) {

  const [formData, setFormData] = useState({
    url: initialData?.url || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    tags: initialData?.tags?.join(', ') || '',
    ignoredWords: initialData?.ignoredWords?.join(', ') || '',
    updateInterval: initialData?.updateInterval || undefined,
    isActive: initialData?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when initialData changes (e.g., when switching to edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        url: initialData.url || '',
        title: initialData.title || '',
        description: initialData.description || '',
        tags: initialData.tags?.join(', ') || '',
        ignoredWords: initialData.ignoredWords?.join(', ') || '',
        updateInterval: initialData.updateInterval || undefined,
        isActive: initialData.isActive ?? true,
      });
    } else {
      // Reset form for add mode
      setFormData({
        url: '',
        title: '',
        description: '',
        tags: '',
        ignoredWords: '',
        updateInterval: undefined,
        isActive: true,
      });
    }
    // Clear any existing errors when switching modes
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else {
      const normalizedUrl = normalizeUrl(formData.url.trim());
      try {
        new URL(normalizedUrl);
      } catch {
        newErrors.url = 'Please enter a valid URL';
      }
    }

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestFeed = async () => {
    if (!formData.url.trim()) {
      setErrors(prev => ({ ...prev, url: 'Enter a URL to test' }));
      return;
    }

    setTesting(true);
    setErrors(prev => ({ ...prev, url: '' }));

    try {
      const normalizedUrl = normalizeUrl(formData.url.trim());
      const result = await validateRssFeed(normalizedUrl);

      if (result.isValid) {
        setFormData(prev => ({
          ...prev,
          url: normalizedUrl,
          title: prev.title || result.title || '',
          description: prev.description || result.description || '',
        }));
        setErrors(prev => ({ ...prev, url: '' }));
      } else {
        setErrors(prev => ({ ...prev, url: result.error || 'Invalid RSS feed' }));
      }
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        url: error instanceof Error ? error.message : 'Failed to test feed',
      }));
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const feedData: Omit<FeedSource, 'id' | 'createdAt'> = {
        url: normalizeUrl(formData.url.trim()),
        title: formData.title.trim(),
        description: formData.description.trim(),
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        ignoredWords: formData.ignoredWords
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0),
        updateInterval: formData.updateInterval || undefined,
        lastUpdated: initialData?.lastUpdated || new Date(),
        isActive: formData.isActive,
        favicon: initialData?.favicon,
      };

      await onSubmit(feedData);
      onClose();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save feed',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'add' ? 'Add RSS Feed' : 'Edit RSS Feed'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            label="RSS Feed URL"
            value={formData.url}
            onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
            placeholder="https://example.com/rss.xml"
            error={errors.url}
            disabled={loading}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={handleTestFeed}
              loading={testing}
              disabled={!formData.url.trim() || loading}
            >
              Test
            </Button>
          </div>
        </div>

        <Input
          label="Feed Title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Enter feed title"
          error={errors.title}
          disabled={loading}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Feed description (optional)"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            disabled={loading}
            rows={3}
          />
        </div>

        <Input
          label="Tags"
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="tech, news, programming (comma-separated)"
          helpText="Separate multiple tags with commas"
          disabled={loading}
        />

        <Input
          label="Ignored Words/Expressions"
          value={formData.ignoredWords}
          onChange={(e) => setFormData(prev => ({ ...prev, ignoredWords: e.target.value }))}
          placeholder="spam, advertisement, promotion (comma-separated)"
          helpText="Articles containing these words will be hidden"
          disabled={loading}
        />

        <Input
          label="Update Interval (minutes)"
          type="number"
          value={formData.updateInterval || ''}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            updateInterval: e.target.value ? parseInt(e.target.value) : undefined
          }))}
          placeholder="60"
          helpText="Leave empty to use global default"
          disabled={loading}
          min="5"
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isActive"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={formData.isActive}
            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            disabled={loading}
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Active (fetch updates)
          </label>
        </div>

        {errors.submit && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {errors.submit}
          </div>
        )}

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {mode === 'add' ? 'Add Feed' : 'Update Feed'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
