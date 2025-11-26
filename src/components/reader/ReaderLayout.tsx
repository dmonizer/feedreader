'use client';

import { useEffect, useState, useRef } from 'react';
import { ArticleCard } from './ArticleCard';
import { ArticleListItem } from './ArticleListItem';
import { ArticleCardWide } from './ArticleCardWide';
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
  displayMode?: UserSettings['displayMode'];
}

export function ReaderLayout({
  articles,
  allFeeds,
  loading = false,
  onLoadMore,
  onMarkAsRead,
  onToggleStar,
  children,
  displayMode = 'cards',
}: Readonly<ReaderLayoutProps>) {
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    columns: 1,
    columnMaxWidth: 400,
    isMobile: false,
  });
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);

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

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && onLoadMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, loading]);

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

  const gridTemplateColumns = layoutConfig.isMobile || displayMode === 'list' || displayMode === 'cards-wide'
    ? '1fr'
    : `repeat(${layoutConfig.columns}, minmax(300px, ${layoutConfig.columnMaxWidth}px))`;

  const renderArticle = (article: FeedItem) => {
    const feedSource = allFeeds.find(feed => feed.id === article.feedId);

    switch (displayMode) {
      case 'list':
        return (
          <ArticleListItem
            key={article.id}
            article={article}
            feedSource={feedSource}
            onMarkAsRead={onMarkAsRead}
            onToggleStar={onToggleStar}
          />
        );
      case 'cards-wide':
        return (
          <ArticleCardWide
            key={article.id}
            article={article}
            feedSource={feedSource}
            onMarkAsRead={onMarkAsRead}
            onToggleStar={onToggleStar}
          />
        );
      case 'cards':
      default:
        return (
          <ArticleCard
            key={article.id}
            article={article}
            feedSource={feedSource}
            onMarkAsRead={onMarkAsRead}
            onToggleStar={onToggleStar}
          />
        );
    }
  };

  return (
    <div className="w-full">
      {/* Header area for filters and controls */}
      {children}

      {/* Main article grid */}
      <div
        className={`
          mx-auto px-4
          ${displayMode === 'cards' ? 'grid gap-6 justify-center' : 'flex flex-col gap-4 max-w-4xl'}
        `}
        style={displayMode === 'cards' ? {
          gridTemplateColumns,
          maxWidth: layoutConfig.isMobile
            ? '100%'
            : `${(layoutConfig.columnMaxWidth + 24) * layoutConfig.columns}px`,
        } : undefined}
      >
        {articles.map(renderArticle)}
      </div>

      {/* Loading indicator and infinite scroll target */}
      <div ref={observerTarget} className="flex justify-center py-8">
        {loading && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        )}
      </div>

      {/* Empty state */}
      {!loading && articles.length === 0 && (
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
