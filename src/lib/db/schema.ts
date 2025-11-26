// @ts-nocheck
import type { DBSchema } from 'idb';
import type { FeedSource, FeedItem, UserSettings, Tag } from '@/lib/types';

export interface RSSReaderDB extends DBSchema {
  feedSources: {
    key: string;
    value: FeedSource;
    indexes: {
      'by-url': string;
      'by-tags': string[];
      'by-active': boolean;
      'by-lastUpdated': Date;
    };
  };
  feedItems: {
    key: string;
    value: FeedItem;
    indexes: {
      'by-feedId': string;
      'by-pubDate': Date;
      'by-isRead': boolean;
      'by-isStarred': boolean;
      'by-isHidden': boolean;
      'by-feedId-pubDate': [string, Date];
      'by-feedId-isRead': [string, boolean];
    };
  };
  settings: {
    key: 'global';
    value: UserSettings;
  };
  tags: {
    key: string;
    value: Tag;
    indexes: {
      'by-name': string;
    };
  };
}

export const DB_NAME = 'rss-reader-db';
export const DB_VERSION = 2; // Incremented for og:image support

export const DEFAULT_SETTINGS: UserSettings = {
  id: 'global',
  defaultUpdateInterval: 60, // 1 hour
  maxColumns: 3,
  columnMaxWidth: 400,
  theme: 'auto',
  tagFilterMode: 'OR',
  itemsPerPage: 50,
  markAsReadOnScroll: false,
  globalIgnoredWords: [],
  displayMode: 'cards',
  createdAt: new Date(),
  updatedAt: new Date(),
};