// Database entity types for IndexedDB

export interface FeedSource {
  id: string;
  url: string;
  title: string;
  description?: string;
  tags: string[];
  ignoredWords: string[];
  updateInterval?: number; // minutes, null = use global default
  lastUpdated: Date;
  isActive: boolean;
  favicon?: string;
  createdAt: Date;
}

export interface FeedItem {
  id: string;
  feedId: string;
  title: string;
  link: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate: Date;
  guid: string;
  categories: string[];
  ogImage?: string; // Open Graph image URL
  isRead: boolean;
  isStarred: boolean;
  isHidden: boolean; // filtered by ignored words
  createdAt: Date;
}

export interface UserSettings {
  id: 'global';
  defaultUpdateInterval: number; // minutes
  maxColumns: number;
  columnMaxWidth: number; // pixels
  theme: 'light' | 'dark' | 'auto';
  tagFilterMode: 'AND' | 'OR';
  itemsPerPage: number;
  markAsReadOnScroll: boolean;
  globalIgnoredWords: string[];
  displayMode: 'list' | 'cards' | 'cards-wide';
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

// Initial feed data from public/feeds/initial.json
export interface InitialFeedData {
  rss_url: string;
  main_url: string;
  name: string;
  topics: string[];
  languages: string[];
}

// Worker communication types
export interface WorkerMessage {
  type: 'UPDATE_FEED' | 'UPDATE_ALL_FEEDS' | 'SCHEDULE_UPDATE' | 'CANCEL_UPDATE' | 'SET_FEED_SOURCES' | 'CLEANUP';
  payload: {
    feedId?: string;
    interval?: number;
    feedUrl?: string;
    feedSource?: FeedSource;
    feeds?: FeedSource[];
  };
}

export interface WorkerResponse {
  type: 'UPDATE_PROGRESS' | 'UPDATE_COMPLETE' | 'UPDATE_ERROR' | 'FEEDS_UPDATED' | 'SCHEDULE_SET' | 'CLEANUP_COMPLETE';
  payload: {
    feedId?: string;
    progress?: number;
    error?: string;
    items?: FeedItem[];
    totalFeeds?: number;
    completedFeeds?: number;
    totalItems?: number;
    hiddenItems?: number;
    retryCount?: number;
    maxRetries?: number;
    status?: string;
    interval?: number;
    nextUpdate?: string;
  };
}

// RSS Parser types
export interface ParsedFeedItem {
  title: string;
  link: string;
  description?: string;
  content?: string;
  author?: string;
  pubDate: string;
  guid: string;
  categories?: string[];
}

export interface ParsedFeed {
  title: string;
  description?: string;
  link?: string;
  items: ParsedFeedItem[];
}

// UI state types
export interface FilterState {
  selectedTags: string[];
  selectedFeedIds?: string[];
  filterMode: 'AND' | 'OR';
  searchQuery: string;
  showRead: boolean;
  showStarred: boolean;
}

export interface LayoutConfig {
  columns: number;
  columnMaxWidth: number;
  isMobile: boolean;
}
