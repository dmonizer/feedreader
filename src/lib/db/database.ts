import { openDB, IDBPDatabase } from 'idb';
import { RSSReaderDB, DB_NAME, DB_VERSION, DEFAULT_SETTINGS } from './schema';
import { FeedSource, FeedItem, UserSettings, Tag } from '@/lib/types';

export class DatabaseService {
  private db: IDBPDatabase<RSSReaderDB> | null = null;

  async initialize(): Promise<void> {
    this.db = await openDB<RSSReaderDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create feedSources store
        if (!db.objectStoreNames.contains('feedSources')) {
          const feedSourcesStore = db.createObjectStore('feedSources', {
            keyPath: 'id',
          });
          feedSourcesStore.createIndex('by-url', 'url', { unique: true });
          feedSourcesStore.createIndex('by-tags', 'tags', { multiEntry: true });
          feedSourcesStore.createIndex('by-active', 'isActive');
          feedSourcesStore.createIndex('by-lastUpdated', 'lastUpdated');
        }

        // Create feedItems store
        if (!db.objectStoreNames.contains('feedItems')) {
          const feedItemsStore = db.createObjectStore('feedItems', {
            keyPath: 'id',
          });
          feedItemsStore.createIndex('by-feedId', 'feedId');
          feedItemsStore.createIndex('by-pubDate', 'pubDate');
          feedItemsStore.createIndex('by-isRead', 'isRead');
          feedItemsStore.createIndex('by-isStarred', 'isStarred');
          feedItemsStore.createIndex('by-isHidden', 'isHidden');
          feedItemsStore.createIndex('by-feedId-pubDate', ['feedId', 'pubDate']);
          feedItemsStore.createIndex('by-feedId-isRead', ['feedId', 'isRead']);
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Create tags store
        if (!db.objectStoreNames.contains('tags')) {
          const tagsStore = db.createObjectStore('tags', { keyPath: 'id' });
          tagsStore.createIndex('by-name', 'name', { unique: true });
        }
      },
    });

    // Initialize default settings if not present
    const existingSettings = await this.db.get('settings', 'global');
    if (!existingSettings) {
      await this.db.put('settings', DEFAULT_SETTINGS);
    }
  }

  private ensureDB(): IDBPDatabase<RSSReaderDB> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  // Feed Sources
  async addFeed(feed: Omit<FeedSource, 'id' | 'createdAt'>): Promise<string> {
    const db = this.ensureDB();
    const id = crypto.randomUUID();
    const feedWithId: FeedSource = {
      ...feed,
      id,
      createdAt: new Date(),
    };
    await db.put('feedSources', feedWithId);
    return id;
  }

  async updateFeed(id: string, updates: Partial<FeedSource>): Promise<void> {
    const db = this.ensureDB();
    const existing = await db.get('feedSources', id);
    if (!existing) {
      throw new Error(`Feed with id ${id} not found`);
    }
    const updated = { ...existing, ...updates };
    await db.put('feedSources', updated);
  }

  async deleteFeed(id: string): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction(['feedSources', 'feedItems'], 'readwrite');

    try {
      console.log(`[Database] Deleting feed ${id}`);
      // Delete the feed
      await tx.objectStore('feedSources').delete(id);

      // Delete all items from this feed
      const itemsIndex = tx.objectStore('feedItems').index('by-feedId');
      const items = await itemsIndex.getAllKeys(id);
      console.log(`[Database] Found ${items.length} items to delete for feed ${id}`);

      await Promise.all(items.map(key => {
        // console.log(`[Database] Deleting item ${key}`);
        return tx.objectStore('feedItems').delete(key);
      }));

      await tx.done;
      console.log(`[Database] Feed ${id} and items deleted successfully`);
    } catch (error) {
      console.error(`[Database] Failed to delete feed ${id}:`, error);
      tx.abort();
      throw new Error(`Failed to delete feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFeed(id: string): Promise<FeedSource | undefined> {
    const db = this.ensureDB();
    return await db.get('feedSources', id);
  }

  async getAllFeeds(): Promise<FeedSource[]> {
    const db = this.ensureDB();
    return await db.getAll('feedSources');
  }

  async getActiveFeeds(): Promise<FeedSource[]> {
    const db = this.ensureDB();
    return await db.getAllFromIndex('feedSources', 'by-active', true);
  }

  // Feed Items
  async addFeedItems(items: Omit<FeedItem, 'id' | 'createdAt'>[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('feedItems', 'readwrite');

    try {
      await Promise.all(items.map(item => {
        const itemWithId: FeedItem = {
          ...item,
          id: `${item.feedId}-${item.guid}`,
          createdAt: new Date(),
        };
        return tx.objectStore('feedItems').put(itemWithId);
      }));

      await tx.done;
    } catch (error) {
      tx.abort();
      throw new Error(`Failed to add feed items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFeedItems(
    feedId?: string,
    limit?: number,
    offset?: number
  ): Promise<FeedItem[]> {
    const db = this.ensureDB();

    if (feedId) {
      const index = db.transaction('feedItems').store.index('by-feedId-pubDate');
      const items = await index.getAll(IDBKeyRange.bound([feedId, new Date(0)], [feedId, new Date()]));
      return items
        .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
        .slice(offset || 0, limit ? (offset || 0) + limit : undefined);
    } else {
      const items = await db.getAllFromIndex('feedItems', 'by-pubDate');
      return items
        .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
        .slice(offset || 0, limit ? (offset || 0) + limit : undefined);
    }
  }

  async markAsRead(itemIds: string[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('feedItems', 'readwrite');

    try {
      await Promise.all(itemIds.map(async id => {
        const item = await tx.objectStore('feedItems').get(id);
        if (item) {
          item.isRead = true;
          await tx.objectStore('feedItems').put(item);
        }
      }));

      await tx.done;
    } catch (error) {
      tx.abort();
      throw new Error(`Failed to mark items as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async toggleStar(itemId: string): Promise<void> {
    const db = this.ensureDB();
    const item = await db.get('feedItems', itemId);
    if (item) {
      item.isStarred = !item.isStarred;
      await db.put('feedItems', item);
    }
  }

  async hideItems(itemIds: string[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('feedItems', 'readwrite');

    try {
      await Promise.all(itemIds.map(async id => {
        const item = await tx.objectStore('feedItems').get(id);
        if (item) {
          item.isHidden = true;
          await tx.objectStore('feedItems').put(item);
        }
      }));

      await tx.done;
    } catch (error) {
      tx.abort();
      throw new Error(`Failed to hide items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Settings
  async getSettings(): Promise<UserSettings> {
    const db = this.ensureDB();
    const settings = await db.get('settings', 'global');
    return settings || DEFAULT_SETTINGS;
  }

  async updateSettings(updates: Partial<UserSettings>): Promise<void> {
    const db = this.ensureDB();
    const existing = await this.getSettings();
    const updated: UserSettings = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    await db.put('settings', updated);
  }

  // Tags
  async addTag(tag: Omit<Tag, 'id' | 'createdAt'>): Promise<string> {
    const db = this.ensureDB();
    const id = crypto.randomUUID();
    const tagWithId: Tag = {
      ...tag,
      id,
      createdAt: new Date(),
    };
    await db.put('tags', tagWithId);
    return id;
  }

  async getAllTags(): Promise<Tag[]> {
    const db = this.ensureDB();
    return await db.getAll('tags');
  }

  async deleteTag(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('tags', id);
  }

  async updateFeedLastUpdated(feedId: string): Promise<void> {
    const db = this.ensureDB();
    const feed = await db.get('feedSources', feedId);
    if (feed) {
      feed.lastUpdated = new Date();
      await db.put('feedSources', feed);
    }
  }

  // Utility methods
  async getItemCount(feedId?: string): Promise<number> {
    const db = this.ensureDB();
    if (feedId) {
      return await db.countFromIndex('feedItems', 'by-feedId', feedId);
    } else {
      return await db.count('feedItems');
    }
  }

  async cleanup(daysToKeep: number = 30): Promise<void> {
    const db = this.ensureDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const tx = db.transaction('feedItems', 'readwrite');

    try {
      const index = tx.store.index('by-pubDate');
      const range = IDBKeyRange.upperBound(cutoffDate);

      let cursor = await index.openCursor(range);
      while (cursor) {
        if (!cursor.value.isStarred) {
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }

      await tx.done;
    } catch (error) {
      tx.abort();
      throw new Error(`Failed to cleanup old feed items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Singleton instance
export const dbService = new DatabaseService();