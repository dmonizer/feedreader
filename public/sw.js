// RSS Reader Service Worker
// Handles background RSS feed updates

const CACHE_NAME = 'rss-reader-v1';
const DB_NAME = 'rss-reader-db';
const DB_VERSION = 2;

class RSSServiceWorker {
  constructor() {
    this.db = null;
    this.updateIntervals = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize IndexedDB connection
      await this.initDB();

      // Set up background sync registration
      await this.setupBackgroundSync();

      this.isInitialized = true;
      console.log('RSS Service Worker initialized');
    } catch (error) {
      console.error('Failed to initialize service worker:', error);
    }
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // Version 1: Initial schema
        if (oldVersion < 1) {
          // Create feedSources object store
          if (!db.objectStoreNames.contains('feedSources')) {
            const feedStore = db.createObjectStore('feedSources', { keyPath: 'id' });
            feedStore.createIndex('by-url', 'url', { unique: true });
            feedStore.createIndex('by-active', 'isActive', { unique: false });
            feedStore.createIndex('by-lastUpdated', 'lastUpdated', { unique: false });
          }

          // Create feedItems object store
          if (!db.objectStoreNames.contains('feedItems')) {
            const itemStore = db.createObjectStore('feedItems', { keyPath: 'id' });
            itemStore.createIndex('by-feedId', 'feedId', { unique: false });
            itemStore.createIndex('by-pubDate', 'pubDate', { unique: false });
            itemStore.createIndex('by-isRead', 'isRead', { unique: false });
            itemStore.createIndex('by-isStarred', 'isStarred', { unique: false });
            itemStore.createIndex('by-feedId-pubDate', ['feedId', 'pubDate'], { unique: false });
          }

          // Create settings object store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
        }

        // Version 2: Add missing indexes and tags object store for og:image support
        if (oldVersion < 2) {
          // Add missing indexes to feedSources
          if (db.objectStoreNames.contains('feedSources')) {
            const transaction = event.target.transaction;
            const feedStore = transaction.objectStore('feedSources');

            // Add by-tags index if it doesn't exist
            if (!feedStore.indexNames.contains('by-tags')) {
              feedStore.createIndex('by-tags', 'tags', { unique: false, multiEntry: true });
            }
          }

          // Add missing indexes to feedItems
          if (db.objectStoreNames.contains('feedItems')) {
            const transaction = event.target.transaction;
            const itemStore = transaction.objectStore('feedItems');

            // Add by-isHidden index if it doesn't exist
            if (!itemStore.indexNames.contains('by-isHidden')) {
              itemStore.createIndex('by-isHidden', 'isHidden', { unique: false });
            }

            // Add by-feedId-isRead index if it doesn't exist
            if (!itemStore.indexNames.contains('by-feedId-isRead')) {
              itemStore.createIndex('by-feedId-isRead', ['feedId', 'isRead'], { unique: false });
            }
          }

          // Create tags object store
          if (!db.objectStoreNames.contains('tags')) {
            const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
            tagStore.createIndex('by-name', 'name', { unique: true });
          }
        }
      };
    });
  }

  async setupBackgroundSync() {
    try {
      // Schedule periodic feed updates
      const feeds = await this.getAllActiveFeeds();

      for (const feed of feeds) {
        if (feed.updateInterval && feed.isActive) {
          await this.scheduleFeedUpdate(feed);
        }
      }
    } catch (error) {
      console.error('Failed to setup background sync:', error);
    }
  }

  async scheduleFeedUpdate(feed) {
    // Clear existing interval
    if (this.updateIntervals.has(feed.id)) {
      clearInterval(this.updateIntervals.get(feed.id));
    }

    // Calculate next update time
    const intervalMs = (feed.updateInterval || 60) * 60 * 1000; // Convert minutes to ms
    const now = Date.now();
    const lastUpdated = new Date(feed.lastUpdated).getTime();
    const timeSinceUpdate = now - lastUpdated;
    const timeUntilNext = Math.max(0, intervalMs - timeSinceUpdate);

    // Schedule initial update if needed
    setTimeout(() => {
      this.updateFeed(feed);

      // Set recurring interval
      const interval = setInterval(() => {
        this.updateFeed(feed);
      }, intervalMs);

      this.updateIntervals.set(feed.id, interval);
    }, timeUntilNext);

    console.log(`Scheduled updates for feed ${feed.title} every ${feed.updateInterval} minutes`);
  }

  async updateFeed(feed) {
    try {
      console.log(`Updating feed: ${feed.title}`);

      // Fetch RSS feed
      const response = await fetch(`/api/rss-proxy?url=${encodeURIComponent(feed.url)}`, {
        headers: {
          'User-Agent': 'RSS Reader Service Worker 1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();

      // Parse RSS feed
      const items = await this.parseRSSFeed(xmlText, feed);

      // Save new items to database
      const newItems = await this.saveNewFeedItems(feed.id, items);

      // Update feed's lastUpdated timestamp
      await this.updateFeedTimestamp(feed.id);

      // Send notification to main thread if page is open
      if (self.clients) {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'FEED_UPDATED',
            payload: {
              feedId: feed.id,
              feedTitle: feed.title,
              newItems: newItems.length,
              totalItems: items.length
            }
          });
        });
      }

      console.log(`Updated feed ${feed.title}: ${newItems.length} new items`);

    } catch (error) {
      console.error(`Failed to update feed ${feed.title}:`, error);

      // Notify main thread of error
      if (self.clients) {
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'FEED_UPDATE_ERROR',
            payload: {
              feedId: feed.id,
              feedTitle: feed.title,
              error: error.message
            }
          });
        });
      }
    }
  }

  async parseRSSFeed(xmlText, feed) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');

      const items = [];
      const itemElements = doc.querySelectorAll('item, entry');

      // Process items with og:image extraction
      const itemPromises = Array.from(itemElements).map(async (itemEl, index) => {
        const title = this.getElementText(itemEl, 'title') || `Untitled ${index + 1}`;
        const link = this.getElementText(itemEl, 'link') || this.getElementAttribute(itemEl, 'link', 'href');
        const description = this.getElementText(itemEl, 'description, summary');
        const content = this.getElementText(itemEl, 'content:encoded, content') || description;
        const author = this.getElementText(itemEl, 'author, dc:creator');
        const pubDateStr = this.getElementText(itemEl, 'pubDate, published, updated');
        const guid = this.getElementText(itemEl, 'guid, id') || link || `${feed.id}-${Date.now()}-${index}`;

        // Parse categories
        const categoryElements = itemEl.querySelectorAll('category');
        const categories = Array.from(categoryElements).map(el => el.textContent || el.getAttribute('term')).filter(Boolean);

        // Parse date
        const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
        if (isNaN(pubDate.getTime())) {
          pubDate.setTime(Date.now());
        }

        // Check if item should be hidden based on ignored words
        const isHidden = this.shouldHideContent(title, description, content, feed.ignoredWords || []);

        // Extract og:image from article link
        const ogImage = await this.extractOgImage(link);

        return {
          id: this.generateId(),
          feedId: feed.id,
          title: this.cleanHtml(title),
          link: link || '',
          description: this.cleanHtml(description || ''),
          content: this.cleanHtml(content || ''),
          author: this.cleanHtml(author || ''),
          pubDate,
          guid,
          categories,
          ogImage,
          isRead: false,
          isStarred: false,
          isHidden,
          createdAt: new Date()
        };
      });

      return await Promise.all(itemPromises);
    } catch (error) {
      console.error('Failed to parse RSS feed:', error);
      return [];
    }
  }

  getElementText(parent, selector) {
    const element = parent.querySelector(selector);
    return element ? element.textContent.trim() : '';
  }

  getElementAttribute(parent, selector, attribute) {
    const element = parent.querySelector(selector);
    return element ? element.getAttribute(attribute) : '';
  }

  cleanHtml(text) {
    if (!text) return '';

    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  async extractOgImage(url) {
    if (!url) return undefined;

    try {
      // Fetch the article page with a short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot 1.0)',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) return undefined;

      const html = await response.text();

      // Extract og:image from meta tags
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
      if (ogImageMatch && ogImageMatch[1]) {
        return ogImageMatch[1];
      }

      // Also try reversed attribute order
      const ogImageMatch2 = html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
      if (ogImageMatch2 && ogImageMatch2[1]) {
        return ogImageMatch2[1];
      }

      return undefined;
    } catch (error) {
      console.error("error loading image:",error)
      // Silently fail - og:image is optional
      return undefined;
    }
  }

  shouldHideContent(title, description, content, ignoredWords) {
    if (!ignoredWords || ignoredWords.length === 0) return false;

    const textToCheck = `${title} ${description} ${content}`.toLowerCase();

    return ignoredWords.some(word => {
      const lowerWord = word.toLowerCase().trim();
      if (!lowerWord) return false;

      if (lowerWord.startsWith('*') && lowerWord.endsWith('*')) {
        const cleanWord = lowerWord.slice(1, -1);
        return textToCheck.includes(cleanWord);
      } else if (lowerWord.startsWith('*')) {
        const cleanWord = lowerWord.slice(1);
        return textToCheck.includes(cleanWord);
      } else if (lowerWord.endsWith('*')) {
        const cleanWord = lowerWord.slice(0, -1);
        return textToCheck.includes(cleanWord);
      } else {
        const wordBoundaryRegex = new RegExp(`\\b${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
        return wordBoundaryRegex.test(textToCheck);
      }
    });
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  async getAllActiveFeeds() {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedSources'], 'readonly');
      const store = transaction.objectStore('feedSources');
      const request = store.getAll();

      request.onsuccess = () => {
        const allFeeds = request.result || [];
        const activeFeeds = allFeeds.filter(feed => feed.isActive === true);
        resolve(activeFeeds);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveNewFeedItems(feedId, items) {
    if (!this.db || !items.length) return [];

    const lockName = `feed-update-${feedId}`;

    // Use Web Locks API to coordinate with Web Worker
    if ('locks' in navigator) {
      return navigator.locks.request(lockName, async () => {
        return this.performSaveNewFeedItems(feedId, items);
      });
    } else {
      // Fallback for browsers without Web Locks API
      return this.performSaveNewFeedItems(feedId, items);
    }
  }

  async performSaveNewFeedItems(feedId, items) {
    if (!this.db || !items.length) return [];

    return new Promise(async (resolve, reject) => {
      try {
        // Get existing items for this feed
        const existingItems = await this.getFeedItems(feedId);
        const existingGuids = new Set(existingItems.map(item => item.guid));

        // Filter out items that already exist
        const newItems = items.filter(item => !existingGuids.has(item.guid));

        if (newItems.length === 0) {
          resolve([]);
          return;
        }

        // Save new items
        const transaction = this.db.transaction(['feedItems'], 'readwrite');
        const store = transaction.objectStore('feedItems');

        newItems.forEach(item => {
          store.add(item);
        });

        transaction.oncomplete = () => resolve(newItems);
        transaction.onerror = () => reject(transaction.error);

      } catch (error) {
        reject(error);
      }
    });
  }

  async getFeedItems(feedId) {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedItems'], 'readonly');
      const store = transaction.objectStore('feedItems');
      const index = store.index('by-feedId');
      const request = index.getAll(feedId);

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async updateFeedTimestamp(feedId) {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['feedSources'], 'readwrite');
      const store = transaction.objectStore('feedSources');
      const request = store.get(feedId);

      request.onsuccess = () => {
        const feed = request.result;
        if (feed) {
          feed.lastUpdated = new Date();
          const updateRequest = store.put(feed);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async refreshFeedSchedules() {
    // Clear existing intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();

    // Re-setup background sync with updated feed configurations
    await this.setupBackgroundSync();
  }

  handleMessage(event) {
    const { type, payload } = event.data;

    switch (type) {
      case 'REFRESH_SCHEDULES':
        this.refreshFeedSchedules();
        break;
      case 'UPDATE_FEED_NOW':
        if (payload.feed) {
          this.updateFeed(payload.feed);
        }
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }
}

// Global service worker instance
const rssServiceWorker = new RSSServiceWorker();

// Service Worker Events
self.addEventListener('install', (event) => {
  console.log('RSS Service Worker installed');
  event.waitUntil(
    caches.open(CACHE_NAME).then(() => {
      return rssServiceWorker.initialize();
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('RSS Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return rssServiceWorker.initialize();
    })
  );
  return self.clients.claim();
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  rssServiceWorker.handleMessage(event);
});

// Background Sync (when supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'rss-feed-update') {
    event.waitUntil(rssServiceWorker.refreshFeedSchedules());
  }
});

// Periodic Background Sync (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'rss-periodic-update') {
    event.waitUntil(rssServiceWorker.refreshFeedSchedules());
  }
});
