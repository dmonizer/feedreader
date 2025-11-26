'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import type { FeedSource } from '@/lib/types';

interface FeedCardProps {
  feed: FeedSource;
  onEdit: (feed: FeedSource) => void;
  onDelete: (feed: FeedSource) => void;
}

export function FeedCard({ feed, onEdit, onDelete }: FeedCardProps) {
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(feed.url)}`);
      const status = response.ok ? 'success' : 'error';

      // Could show toast notification here
      console.log(`Feed test ${status} for ${feed.title}`);
    } catch (error) {
      console.error('Feed test failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-start mb-2">
          <h3 className="card-title text-lg">{feed.title}</h3>
          <div className="flex items-center gap-2">
            {!feed.isActive && (
              <div className="badge badge-warning badge-sm">Inactive</div>
            )}
            <div className={`badge badge-sm ${
              feed.isActive ? 'badge-success' : 'badge-ghost'
            }`}>
              {feed.isActive ? 'Active' : 'Paused'}
            </div>
          </div>
        </div>

        {feed.description && (
          <p className="text-sm text-base-content/70 mb-3 line-clamp-2">
            {feed.description}
          </p>
        )}

        <div className="mb-3">
          <div className="text-xs text-base-content/60 mb-1">URL:</div>
          <a
            href={feed.url}
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary text-sm break-all"
          >
            {feed.url}
          </a>
        </div>

        {feed.tags.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-base-content/60 mb-2">Tags:</div>
            <div className="flex flex-wrap gap-1">
              {feed.tags.map((tag) => (
                <span key={tag} className="badge badge-outline badge-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {feed.ignoredWords.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-base-content/60 mb-1">
              Ignored Words: {feed.ignoredWords.length}
            </div>
            <div className="text-xs text-base-content/50">
              {feed.ignoredWords.slice(0, 3).join(', ')}
              {feed.ignoredWords.length > 3 && '...'}
            </div>
          </div>
        )}

        <div className="text-xs text-base-content/60 mb-4">
          <div>
            Last updated: {formatDate(feed.lastUpdated)}
          </div>
          {feed.updateInterval && (
            <div>
              Update interval: {feed.updateInterval} minutes
            </div>
          )}
        </div>

        <div className="card-actions justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTest}
            loading={loading}
          >
            Test
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(feed)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(feed)}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}