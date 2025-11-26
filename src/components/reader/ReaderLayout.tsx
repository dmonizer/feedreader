'use client';

import { useEffect, useState } from 'react';
import { ArticleCard } from './ArticleCard';
import { dbService } from '@/lib/db';
import type { FeedItem, FeedSource, LayoutConfig, UserSettings } from '@/lib/types';

interface ReaderLayoutProps {
  articles: FeedItem[];
  allFeeds: FeedSource[];
  loading?: boolean;
  onLoadMore?: () => void;
  onMarkAsRead?: (articleId: string, isRead: boolean) => Promise<void>;
  onToggleStar?: (articleId: string, isStarred: boolean) => Promise<void>;
  children?: React.ReactNode;
}

export function ReaderLayout({
                               articles,
                               allFeeds,
                               loading = false,
                               onLoadMore,
                               onMarkAsRead,
                               onToggleStar,
                               children,
                             }: ReaderLayoutProps) {
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    columns: 1,
    columnMaxWidth: 400,
    isMobile: false,
  });
  const [settings, setSettings] = useState<UserSettings | null>(null);
  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await dbService.initialize();
        const userSettings = await dbService.getSettings();
        setSettings(userSettings);
      } catch (error) {
        console.error('Failed to load layout settings:', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      const isMobile = width < 768;
      let columns = 1;

      if (!isMobile && settings) {
        // Use settings-based column calculation
        const maxColumns = settings.maxColumns;
        const settingsColumnMaxWidth = settings.columnMaxWidth;

        if (width >= 1920 && maxColumns >= 4) {
          columns = Math.min(4, maxColumns);
        } else if (width >= 1280 && maxColumns >= 3) {
          columns = Math.min(3, maxColumns);
        } else if (width >= 768 && maxColumns >= 2) {
          columns = Math.min(2, maxColumns);
        }

        setLayoutConfig({
          columns,
          columnMaxWidth: Math.min(settingsColumnMaxWidth, Math.floor(width / columns) - 32),
          isMobile,
        });
      } else {
        // Fallback for mobile or when settings aren't loaded
        if (width >= 1920) {
          columns = 4;
        } else if (width >= 1280) {
          columns = 3;
        } else if (width >= 768) {
          columns = 2;
        }

        setLayoutConfig({
          columns,
          columnMaxWidth: Math.min(400, Math.floor(width / columns) - 32),
          isMobile,
        });
      }
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    return () => window.removeEventListener('resize', updateLayout);
  }, [settings]); // Re-run when settings change

  const gridTemplateColumns = layoutConfig.isMobile
    ? '1fr'
    :`repeat(${layoutConfig.columns}, minmax(300px, ${layoutConfig.columnMaxWidth}px))`;
  const parseArticles = (articles: FeedItem[]) => {
    return Array.from(articles.map((article) => {
      const feedSource = allFeeds.find(feed => feed.id===article.feedId);
      return (
        <ArticleCard
          key={article.id}
          article={article}
          feedSource={feedSource}
          onMarkAsRead={onMarkAsRead}
          onToggleStar={onToggleStar}
        />
      );
    }));
  };

  return (
    <div className="w-full">
      {/* Header area for filters and controls */}
      {children}

      {/* Main article grid */}
      <div
        className="grid gap-6 justify-center mx-auto px-4"
        style={{
          gridTemplateColumns,
          maxWidth: layoutConfig.isMobile
            ? '100%'
            :`${(layoutConfig.columnMaxWidth + 24) * layoutConfig.columns}px`,
        }}
      >
        {parseArticles(articles)}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Load more trigger (for infinite scroll) */}
      {onLoadMore && !loading && articles.length > 0 && (
        <div className="flex justify-center py-8">
          <button
            onClick={onLoadMore}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Load More Articles
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && articles.length===0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-medium mb-2">No articles yet</h3>
          <p className="text-gray-600">
            Add some RSS feeds to start reading articles
          </p>
        </div>
      )}
    </div>
  );
}
