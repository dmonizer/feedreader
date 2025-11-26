'use client';

import { DisplayModeSelector } from './reader/DisplayModeSelector';
import { UserSettings } from '@/lib/types';

interface UpdateProgress {
  totalFeeds?: number;
  completedFeeds?: number;
  progress?: number;
}

interface ArticleCounts {
  total: number;
  unread: number;
  starred: number;
}

interface ArticlesToolbarProps {
  title?: string;
  counts: ArticleCounts;
  updateProgress?: UpdateProgress | null;
  selectedArticles: string[];
  loading: boolean;
  backgroundUpdating: boolean;
  onSidebarToggle: () => void;
  onMarkSelectedAsRead: () => void;
  onClearSelection: () => void;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  displayMode?: UserSettings['displayMode'];
  onDisplayModeChange?: (mode: UserSettings['displayMode']) => void;
}

export default function ArticlesToolbar({
  title,
  counts,
  updateProgress,
  selectedArticles,
  loading,
  backgroundUpdating,
  onSidebarToggle,
  onMarkSelectedAsRead,
  onClearSelection,
  onMarkAllAsRead,
  onRefresh,
  displayMode,
  onDisplayModeChange,
}: ArticlesToolbarProps) {
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {title ? (<h1 className="text-2xl font-bold">{title}</h1>) : ''}
            <div className="hidden sm:flex items-center space-x-4 text-sm text-gray-600">
              <span>{counts.total} articles</span>
              {counts.unread > 0 && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {counts.unread} unread
                </span>
              )}
              {counts.starred > 0 && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {counts.starred} starred
                </span>
              )}
              {updateProgress && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  {updateProgress.totalFeeds ?
                    `${updateProgress.completedFeeds || 0}/${updateProgress.totalFeeds} feeds` :
                    `${updateProgress.progress || 0}%`
                  }
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {displayMode && onDisplayModeChange && (
              <div className="mr-2">
                <DisplayModeSelector
                  currentMode={displayMode}
                  onChange={onDisplayModeChange}
                />
              </div>
            )}

            <button
              onClick={onSidebarToggle}
              className="lg:hidden text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors"
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>

            {/* Bulk Operations */}
            {selectedArticles.length > 0 && (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedArticles.length} selected
                </span>
                <button
                  onClick={onMarkSelectedAsRead}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors"
                >
                  Mark Read
                </button>
                <button
                  onClick={onClearSelection}
                  className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors"
                >
                  Clear
                </button>
              </>
            )}

            {selectedArticles.length === 0 && counts.unread > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1 rounded transition-colors"
              >
                Mark all read
              </button>
            )}

            <button
              onClick={onRefresh}
              disabled={loading || backgroundUpdating}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50"
            >
              {backgroundUpdating ? 'Updating...' : loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
