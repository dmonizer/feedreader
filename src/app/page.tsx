'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ReaderLayout } from '@/components/reader/ReaderLayout';
import { FilterSidebar } from '@/components/reader/FilterSidebar';
import { Button } from '@/components/ui/Button';
import ArticlesToolbar from '@/components/ArticlesToolbar';
import { useArticles } from '@/hooks/useArticles';
import { useBackgroundUpdates } from '@/hooks/useBackgroundUpdates';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { dbService } from '@/lib/db';
import type { FilterState, UserSettings } from '@/lib/types';

export default function Home() {
  const [filters, setFilters] = useState<FilterState>({
    selectedTags: [],
    selectedFeedIds: [],
    filterMode: 'OR',
    searchQuery: '',
    showRead: false,
    showStarred: true,
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(-1);
  const [displayMode, setDisplayMode] = useState<UserSettings['displayMode']>('cards');

  const {
    articles,
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
  } = useArticles({ filters });

  const {
    isUpdating: backgroundUpdating,
    progress: updateProgress,
    updateAllFeeds: triggerBackgroundUpdate,
    scheduleAllFeeds,
    workerInitialized,
  } = useBackgroundUpdates();

  // Initialize background updates when feeds are loaded
  useEffect(() => {
    if (workerInitialized && allFeeds.length > 0) {
      scheduleAllFeeds();
    }
  }, [workerInitialized, allFeeds.length, scheduleAllFeeds]);

  // Load display mode settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await dbService.initialize();
        const settings = await dbService.getSettings();
        if (settings.displayMode) {
          setDisplayMode(settings.displayMode);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  const handleDisplayModeChange = async (mode: UserSettings['displayMode']) => {
    setDisplayMode(mode);
    try {
      await dbService.updateSettings({ displayMode: mode });
    } catch (error) {
      console.error('Failed to save display mode:', error);
    }
  };

  // Bulk operations
  // const toggleArticleSelection = useCallback((articleId: string) => {
  //   setSelectedArticles(prev =>
  //     prev.includes(articleId)
  //       ? prev.filter(id => id !== articleId)
  //       : [...prev, articleId]
  //   );
  // }, []);

  const selectAllVisibleArticles = useCallback(() => {
    const visibleIds = articles.map(article => article.id);
    setSelectedArticles(visibleIds);
  }, [articles]);

  const clearSelection = useCallback(() => {
    setSelectedArticles([]);
  }, []);

  const markSelectedAsRead = useCallback(async () => {
    if (selectedArticles.length === 0) return;

    try {
      await Promise.all(
        selectedArticles.map(id => markAsRead(id, true))
      );
      setSelectedArticles([]);
    } catch (error) {
      console.error('Failed to mark selected articles as read:', error);
    }
  }, [selectedArticles, markAsRead]);

  // Keyboard navigation
  const navigateToNextArticle = useCallback(() => {
    if (articles.length === 0) return;
    const nextIndex = Math.min(currentArticleIndex + 1, articles.length - 1);
    setCurrentArticleIndex(nextIndex);
  }, [articles.length, currentArticleIndex]);

  const navigateToPreviousArticle = useCallback(() => {
    if (articles.length === 0) return;
    const prevIndex = Math.max(currentArticleIndex - 1, 0);
    setCurrentArticleIndex(prevIndex);
  }, [articles.length, currentArticleIndex]);

  const openCurrentArticle = useCallback(() => {
    if (currentArticleIndex >= 0 && currentArticleIndex < articles.length) {
      const article = articles[currentArticleIndex];
      window.open(article.link, '_blank', 'noopener,noreferrer');
    }
  }, [articles, currentArticleIndex]);

  const toggleCurrentArticleRead = useCallback(async () => {
    if (currentArticleIndex >= 0 && currentArticleIndex < articles.length) {
      const article = articles[currentArticleIndex];
      await markAsRead(article.id, !article.isRead);
    }
  }, [articles, currentArticleIndex, markAsRead]);

  const toggleCurrentArticleStar = useCallback(async () => {
    if (currentArticleIndex >= 0 && currentArticleIndex < articles.length) {
      const article = articles[currentArticleIndex];
      await toggleStar(article.id, !article.isStarred);
    }
  }, [articles, currentArticleIndex, toggleStar]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'r',
        ctrlKey: true,
        action: async () => {
          if (backgroundUpdating) return;
          try {
            await triggerBackgroundUpdate();
          } catch {
            refresh();
          }
        },
        description: 'Refresh feeds',
      },
      {
        key: 'f',
        ctrlKey: true,
        action: () => {
          // Focus search input in filter sidebar
          const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        },
        description: 'Focus search',
      },
      {
        key: 'ArrowDown',
        action: navigateToNextArticle,
        description: 'Next article',
      },
      {
        key: 'ArrowUp',
        action: navigateToPreviousArticle,
        description: 'Previous article',
      },
      {
        key: 'Enter',
        action: openCurrentArticle,
        description: 'Open current article',
      },
      {
        key: 'r',
        action: toggleCurrentArticleRead,
        description: 'Toggle read status',
      },
      {
        key: 's',
        action: toggleCurrentArticleStar,
        description: 'Toggle star',
      },
      {
        key: 'a',
        ctrlKey: true,
        action: selectAllVisibleArticles,
        description: 'Select all visible articles',
      },
      {
        key: 'Escape',
        action: clearSelection,
        description: 'Clear selection',
      },
    ],
  });

  // Show welcome message if no feeds are configured
  if (!loading && allFeeds.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">📰</div>
            <h2 className="text-2xl font-semibold mb-4">Welcome to RSS Reader</h2>
            <p className="text-gray-600 mb-6">
              Your modern newspaper-style RSS reader with multi-column layout and advanced feed management.
            </p>
            <div className="space-y-4">
              <Link href="/feeds">
                <Button className="w-full sm:w-auto">
                  Add Your First Feed
                </Button>
              </Link>
              <p className="text-sm text-gray-500">
                Start by adding some RSS feeds to begin reading articles
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-2xl mx-auto">
          <h2 className="font-semibold mb-2">Error Loading Articles</h2>
          <p>{error}</p>
          <button
            onClick={refresh}
            className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }


  return (
    <main className="flex min-h-screen bg-gray-50">
      {/* Filter Sidebar */}
      <FilterSidebar
        filters={filters}
        onFiltersChange={setFilters}
        allFeeds={allFeeds}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        articleCounts={counts}
        isExpanded={sidebarExpanded}
        onExpandToggle={() => setSidebarExpanded(!sidebarExpanded)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ArticlesToolbar
          title={undefined}
          counts={counts}
          updateProgress={updateProgress}
          selectedArticles={selectedArticles}
          loading={loading}
          backgroundUpdating={backgroundUpdating}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
          onMarkSelectedAsRead={markSelectedAsRead}
          onClearSelection={clearSelection}
          onMarkAllAsRead={markAllAsRead}
          displayMode={displayMode}
          onDisplayModeChange={handleDisplayModeChange}
          onRefresh={async () => {
            if (backgroundUpdating) return;
            try {
              await triggerBackgroundUpdate();
            } catch (error) {
              console.error('Background update failed:', error);
              refresh();
            }
          }}
        />

        {/* Articles */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <ReaderLayout
              articles={articles}
              allFeeds={allFeeds}
              loading={loading}
              onLoadMore={hasMore ? loadMore : undefined}
              onMarkAsRead={markAsRead}
              onToggleStar={toggleStar}
              displayMode={displayMode}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
