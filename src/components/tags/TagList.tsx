'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useTags } from '@/hooks/useTags';
import type { Tag } from '@/lib/types';

interface TagListProps {
  onEdit?: (tag: Tag) => void;
  onDelete?: (tag: Tag) => void;
  showActions?: boolean;
}

export function TagList({ onEdit, onDelete, showActions = true }: TagListProps) {
  const { tags, loading, getTagUsage } = useTags();
  const [tagUsage, setTagUsage] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadUsage = async () => {
      const usage: Record<string, number> = {};
      for (const tag of tags) {
        usage[tag.name] = await getTagUsage(tag.name);
      }
      setTagUsage(usage);
    };

    if (tags.length > 0) {
      loadUsage();
    }
  }, [tags, getTagUsage]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-base-200 rounded"></div>
        ))}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">🏷️</div>
        <h3 className="text-lg font-medium mb-2">No tags yet</h3>
        <p className="text-base-content/70">
          Tags will appear here when you add them to feeds
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="flex items-center justify-between p-3 bg-base-100 rounded-lg border border-base-300"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: tag.color }}
            />
            <div>
              <div className="font-medium">{tag.name}</div>
              <div className="text-sm text-base-content/60">
                {tagUsage[tag.name] || 0} feed{(tagUsage[tag.name] || 0) !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(tag)}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(tag)}
                  disabled={(tagUsage[tag.name] || 0) > 0}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}