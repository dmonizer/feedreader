'use client';

import { useState } from 'react';
import { SearchBar } from './SearchBar';
import type { FilterState, FeedSource } from '@/lib/types';

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  allFeeds: FeedSource[];
  isOpen: boolean;
  onToggle: () => void;
  articleCounts: {
    total: number;
    unread: number;
    starred: number;
  };
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  allFeeds,
  isOpen,
  onToggle,
  articleCounts,
  isExpanded = false,
  onExpandToggle
}: Readonly<FilterSidebarProps>) {
  const [tagsExpanded, setTagsExpanded] = useState(true);
  const [sourcesExpanded, setSourcesExpanded] = useState(true);

  // Get all unique tags from feeds
  const allTags = Array.from(
    new Set(allFeeds.flatMap(feed => feed.tags || []))
  ).sort();

  const handleSearchChange = (searchQuery: string) => {
    onFiltersChange({ ...filters, searchQuery });
  };

  const handleTagToggle = (tag: string) => {
    const newSelectedTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter(t => t !== tag)
      : [...filters.selectedTags, tag];

    onFiltersChange({ ...filters, selectedTags: newSelectedTags });
  };

  const handleFeedToggle = (feedId: string) => {
    const selectedFeedIds = filters.selectedFeedIds || [];
    const newSelectedFeedIds = selectedFeedIds.includes(feedId)
      ? selectedFeedIds.filter(id => id !== feedId)
      : [...selectedFeedIds, feedId];

    onFiltersChange({ ...filters, selectedFeedIds: newSelectedFeedIds });
  };

  const handleFilterModeToggle = () => {
    onFiltersChange({
      ...filters,
      filterMode: filters.filterMode === 'AND' ? 'OR' : 'AND'
    });
  };

  const handleShowReadToggle = () => {
    onFiltersChange({ ...filters, showRead: !filters.showRead });
  };

  const handleShowStarredToggle = () => {
    onFiltersChange({ ...filters, showStarred: !filters.showStarred });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      selectedTags: [],
      selectedFeedIds: [],
      filterMode: 'OR',
      searchQuery: '',
      showRead: true,
      showStarred: true,
    });
  };

  const hasActiveFilters =
    filters.selectedTags.length > 0 ||
    (filters.selectedFeedIds && filters.selectedFeedIds.length > 0) ||
    filters.searchQuery.length > 0 ||
    !filters.showRead ||
    !filters.showStarred;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      <div
        className={`fixed lg:sticky lg:top-0 inset-y-0 left-0 z-30 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out lg:h-screen ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${isExpanded ? 'w-80' : 'w-16 lg:w-16'
          }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {isExpanded ? (
              <>
                <h2 className="text-lg font-semibold dark:text-white">Filters</h2>
                <div className="flex items-center space-x-2">
                  {hasActiveFilters && (
                    <button
                      onClick={clearAllFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Clear all
                    </button>
                  )}
                  {onExpandToggle && (
                    <button
                      onClick={onExpandToggle}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      aria-label="Collapse filters"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={onToggle}
                    className="lg:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    aria-label="Close filters"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center w-full">
                {onExpandToggle && (
                  <button
                    onClick={onExpandToggle}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg mb-2"
                    aria-label="Expand filters"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
                <button
                  onClick={onToggle}
                  className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  aria-label="Close filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {isExpanded ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search
                </label>
                <SearchBar
                  value={filters.searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search in titles and content..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Article Status
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!filters.showRead}
                      onChange={handleShowReadToggle}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm dark:text-gray-300">
                      Unread only ({articleCounts.unread})
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!filters.showStarred}
                      onChange={handleShowStarredToggle}
                      className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                    />
                    <span className="ml-2 text-sm dark:text-gray-300">
                      Starred only ({articleCounts.starred})
                    </span>
                  </label>
                </div>
              </div>

              {allTags.length > 0 && (
                <div className="flex flex-col">
                  <button
                    onClick={() => setTagsExpanded(!tagsExpanded)}
                    className="flex items-center justify-between mb-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded -mx-2"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-transform ${tagsExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Tags
                      </label>
                    </div>
                    {filters.selectedTags.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFilterModeToggle();
                        }}
                        className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 px-2 py-1 rounded transition-colors"
                        title={`Currently using ${filters.filterMode} logic`}
                      >
                        {filters.filterMode}
                      </button>
                    )}
                  </button>
                  {tagsExpanded && (
                    <div className={`space-y-2 overflow-y-auto ${sourcesExpanded ? 'max-h-48' : 'flex-1'}`}>
                      {allTags.map((tag) => {
                        const feedsWithTag = allFeeds.filter(feed =>
                          (feed.tags || []).includes(tag)
                        );

                        return (
                          <label key={tag} className="flex items-center group">
                            <input
                              type="checkbox"
                              checked={filters.selectedTags.includes(tag)}
                              onChange={() => handleTagToggle(tag)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm flex-1 truncate group-hover:text-blue-600 dark:text-gray-300 dark:group-hover:text-blue-400">
                              {tag}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              ({feedsWithTag.length})
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {allFeeds.length > 0 && (
                <div className="flex flex-col">
                  <button
                    onClick={() => setSourcesExpanded(!sourcesExpanded)}
                    className="flex items-center justify-between mb-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded -mx-2"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-4 h-4 transition-transform ${sourcesExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                        Sources
                      </label>
                    </div>
                  </button>
                  {sourcesExpanded && (
                    <div className={`space-y-1 overflow-y-auto ${tagsExpanded ? 'max-h-48' : 'flex-1'}`}>
                      {allFeeds.map((feed) => {
                        const isSelected = (filters.selectedFeedIds || []).includes(feed.id);
                        return (
                          <button
                            key={feed.id}
                            onClick={() => handleFeedToggle(feed.id)}
                            className={`w-full flex items-center p-2 rounded text-sm transition-colors ${isSelected
                                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                          >
                            {feed.favicon && (
                              <img
                                src={feed.favicon}
                                alt=""
                                className="w-4 h-4 rounded mr-2 flex-shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                            <span className={`flex-1 truncate text-left ${isSelected
                                ? 'text-blue-700 dark:text-blue-300 font-medium'
                                : 'dark:text-gray-300'
                              }`} title={feed.title}>
                              {feed.title}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ml-2 ${feed.isActive
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                }`}
                            >
                              {feed.isActive ? '●' : '○'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center py-4 space-y-4">
              {hasActiveFilters && (
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" title="Active filters" />
              )}

              {filters.searchQuery && (
                <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title={`Searching: "${filters.searchQuery}"`}>
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}

              {filters.selectedTags.length > 0 && (
                <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title={`${filters.selectedTags.length} tags selected`}>
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="text-xs mt-1 text-center font-medium">{filters.selectedTags.length}</div>
                </div>
              )}

              {(filters.selectedFeedIds && filters.selectedFeedIds.length > 0) && (
                <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title={`${filters.selectedFeedIds.length} sources selected`}>
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <div className="text-xs mt-1 text-center font-medium">{filters.selectedFeedIds.length}</div>
                </div>
              )}

              {(!filters.showRead || !filters.showStarred) && (
                <div className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Status filters active">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
            {isExpanded ? (
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div>Total: {articleCounts.total} articles</div>
                <div>Unread: {articleCounts.unread}</div>
                <div>Starred: {articleCounts.starred}</div>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-1">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{articleCounts.total}</div>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${articleCounts.unread} unread`}></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" title={`${articleCounts.starred} starred`}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
