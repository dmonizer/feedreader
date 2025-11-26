// RSS Worker for background feed processing
import Parser from 'rss-parser';
import { WorkerMessage, WorkerResponse, FeedItem, ParsedFeed, FeedSource } from '@/lib/types';
import { shouldHideContent } from '@/lib/utils/ignoredWords';
import logger from '@/logger';

class RSSWorker {
  private readonly parser: Parser;
  private readonly updateIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly feedSources: Map<string, FeedSource> = new Map();
  private readonly retryAttempts: Map<string, number> = new Map();
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_BASE = 5000; // 5 seconds base delay

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      maxRedirects: 5,
    });
  }

  async handleMessage(message: WorkerMessage): Promise<void> {
    const logMsg = `RSS-WORKER received a message of type '${message.type}' with payload: '${message.payload}'`
    console.log(logMsg)
    logger.log(logMsg)

    try {
      switch (message.type) {
        case 'UPDATE_FEED':
          if (message.payload.feedId && message.payload.feedUrl) {
            const feedSource = message.payload.feedSource;
            if (feedSource) {
              this.feedSources.set(message.payload.feedId, feedSource);
            }
            await this.updateSingleFeed(message.payload.feedId, message.payload.feedUrl);
          }
          break;
        case 'UPDATE_ALL_FEEDS':
          if (message.payload.feeds) {
            await this.updateAllFeeds(message.payload.feeds);
          }
          break;
        case 'SCHEDULE_UPDATE':
          if (message.payload.feedId && message.payload.interval) {
            this.scheduleUpdate(message.payload.feedId, message.payload.interval);
          }
          break;
        case 'CANCEL_UPDATE':
          if (message.payload.feedId) {
            this.cancelScheduledUpdate(message.payload.feedId);
          }
          break;
        case 'SET_FEED_SOURCES':
          if (message.payload.feeds) {
            message.payload.feeds.forEach(feed => {
              this.feedSources.set(feed.id, feed);
            });
          }
          break;
        case 'CLEANUP':
          this.cleanup();
          break;
      }
    } catch (error) {
      this.postMessage({
        type: 'UPDATE_ERROR',
        payload: {
          feedId: message.payload.feedId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  private async updateSingleFeed(feedId: string, feedUrl: string, retryCount = 0): Promise<void> {
    try {
      this.postMessage({
        type: 'UPDATE_PROGRESS',
        payload: { feedId, progress: 0 },
      });

      // Fetch RSS feed through CORS proxy with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const proxyUrl = `/api/rss-proxy?url=${encodeURIComponent(feedUrl)}`;
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'RSS Reader Bot 1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();

      // Validate XML content
      if (!xmlText.trim() || (!xmlText.includes('<rss') && !xmlText.includes('<feed') && !xmlText.includes('<atom'))) {
        throw new Error('Invalid RSS/Atom feed format');
      }

      this.postMessage({
        type: 'UPDATE_PROGRESS',
        payload: { feedId, progress: 30 },
      });

      // Parse RSS feed with better error handling
      let feed: ParsedFeed;
      try {
        feed = await this.parser.parseString(xmlText) as ParsedFeed;
      } catch (parseError) {
        throw new Error(`Feed parsing failed: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
      }

      if (!feed.items || feed.items.length === 0) {
        throw new Error('Feed contains no items');
      }

      this.postMessage({
        type: 'UPDATE_PROGRESS',
        payload: { feedId, progress: 70 },
      });

      // Get feed source for content filtering
      const feedSource = this.feedSources.get(feedId);
      const ignoredWords = feedSource?.ignoredWords || [];

      // Convert to FeedItems with content filtering and og:image extraction
      const items: Omit<FeedItem, 'id' | 'createdAt'>[] = await Promise.all(
        feed.items
          .filter(item => item.title && item.link) // Filter out invalid items first
          .map(async (item) => {
            const title = this.cleanHtml(item.title || '');
            const description = this.cleanHtml(item.description || '');
            const content = this.cleanHtml(item.content || item.description || '');

            // Check if item should be hidden based on ignored words
            const isHidden = shouldHideContent(item, ignoredWords);

            // Extract og:image from article link
            const ogImage = await this.extractOgImage(item.link || '');

            return {
              feedId,
              title,
              link: item.link || '',
              description,
              content,
              author: this.cleanHtml(item.author || ''),
              pubDate: this.parseDate(item.pubDate),
              guid: item.guid || item.link || `${feedId}-${Date.now()}-${Math.random()}`,
              categories: this.normalizeCategories(item.categories),
              ogImage,
              isRead: false,
              isStarred: false,
              isHidden,
            };
          })
      );

      this.postMessage({
        type: 'UPDATE_PROGRESS',
        payload: { feedId, progress: 100 },
      });

      // Reset retry count on success
      this.retryAttempts.delete(feedId);

      this.postMessage({
        type: 'UPDATE_COMPLETE',
        payload: {
          feedId,
          items: items as FeedItem[],
          totalItems: items.length,
          hiddenItems: items.filter(item => item.isHidden).length
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update feed';

      // Implement retry logic
      if (retryCount < this.MAX_RETRY_ATTEMPTS && !errorMessage.includes('parsing failed')) {
        const delay = this.RETRY_DELAY_BASE * Math.pow(2, retryCount); // Exponential backoff

        this.postMessage({
          type: 'UPDATE_PROGRESS',
          payload: {
            feedId,
            progress: 0,
            status: `Retrying in ${delay/1000}s... (${retryCount + 1}/${this.MAX_RETRY_ATTEMPTS})`
          },
        });

        setTimeout(() => {
          this.updateSingleFeed(feedId, feedUrl, retryCount + 1);
        }, delay);

        return;
      }

      // Track retry attempts
      this.retryAttempts.set(feedId, retryCount);

      this.postMessage({
        type: 'UPDATE_ERROR',
        payload: {
          feedId,
          error: errorMessage,
          retryCount,
          maxRetries: this.MAX_RETRY_ATTEMPTS,
        },
      });
    }
  }

  private async updateAllFeeds(feeds: FeedSource[]): Promise<void> {
    const activeFeeds = feeds.filter(feed => feed.isActive);
    let completed = 0;

    this.postMessage({
      type: 'UPDATE_PROGRESS',
      payload: {
        progress: 0,
        totalFeeds: activeFeeds.length,
        completedFeeds: 0
      },
    });

    // Update feeds in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = [];

    for (let i = 0; i < activeFeeds.length; i += concurrencyLimit) {
      chunks.push(activeFeeds.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (feed) => {
        try {
          await this.updateSingleFeed(feed.id, feed.url);
        } catch {
          // Error already handled in updateSingleFeed
        } finally {
          completed++;
          this.postMessage({
            type: 'UPDATE_PROGRESS',
            payload: {
              progress: Math.round((completed / activeFeeds.length) * 100),
              totalFeeds: activeFeeds.length,
              completedFeeds: completed
            },
          });
        }
      });

      await Promise.all(promises);
    }

    this.postMessage({
      type: 'FEEDS_UPDATED',
      payload: {
        totalFeeds: activeFeeds.length,
        completedFeeds: completed
      },
    });
  }

  private scheduleUpdate(feedId: string, intervalMinutes: number): void {
    // Cancel existing interval if present
    this.cancelScheduledUpdate(feedId);

    // Schedule new interval
    const interval = setInterval(async () => {
      const feedSource = this.feedSources.get(feedId);
      if (feedSource?.isActive) {
        try {
          await this.updateSingleFeed(feedId, feedSource.url);
        } catch {
          // Error already handled in updateSingleFeed
        }
      }
    }, intervalMinutes * 60 * 1000);

    this.updateIntervals.set(feedId, interval);

    this.postMessage({
      type: 'SCHEDULE_SET',
      payload: {
        feedId,
        interval: intervalMinutes,
        nextUpdate: new Date(Date.now() + intervalMinutes * 60 * 1000).toISOString()
      },
    });
  }

  private cancelScheduledUpdate(feedId: string): void {
    const interval = this.updateIntervals.get(feedId);
    if (interval) {
      clearInterval(interval);
      this.updateIntervals.delete(feedId);
    }
  }

  private cleanup(): void {
    // Clear all intervals
    this.updateIntervals.forEach(interval => clearInterval(interval));
    this.updateIntervals.clear();

    // Clear all maps
    this.feedSources.clear();
    this.retryAttempts.clear();

    // Notify cleanup complete
    this.postMessage({
      type: 'CLEANUP_COMPLETE',
      payload: {},
    });
  }

  private postMessage(message: WorkerResponse): void {
    if (typeof self !== 'undefined' && self.postMessage) {
      self.postMessage(message);
    }
  }

  // Extract og:image from article URL
  private async extractOgImage(url: string): Promise<string | undefined> {
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

    } catch (ignored) {       // eslint-disable-line @typescript-eslint/no-unused-vars
      // Silently fail - og:image is optional

      return undefined;
    }
  }

  private normalizeCategories(categories: any): string[] {
    if (!categories) return [];

    // If it's already an array, normalize each element
    if (Array.isArray(categories)) {
      return categories
        .map(cat => {
          // Handle string categories
          if (typeof cat === 'string') return cat;

          // Handle object categories (e.g., {_: 'value', $: {...}})
          if (typeof cat === 'object' && cat !== null) {
            // Try common XML parser formats
            if (cat._ !== undefined) return String(cat._);
            if (cat.$ !== undefined && typeof cat.$ === 'string') return cat.$;
            if (cat.value !== undefined) return String(cat.value);
            if (cat['#text'] !== undefined) return String(cat['#text']);

            // Fallback: stringify the object
            return JSON.stringify(cat);
          }

          // Fallback: convert to string
          return String(cat);
        })
        .filter(cat => cat && cat.trim().length > 0);
    }

    // If it's a single value, convert to array
    if (typeof categories === 'string') return [categories];

    // Fallback
    return [];
  }

  private cleanHtml(text: string): string {
    if (!text) return '';

    // Remove HTML tags and decode entities
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private parseDate(dateString: string | undefined): Date {
    if (!dateString) return new Date();

    const parsed = new Date(dateString);

    // Check if date is valid
    if (isNaN(parsed.getTime())) {
      // Try some common date formats
      const formats = [
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO format
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/, // MySQL format
        /^\w{3}, \d{2} \w{3} \d{4}/, // RFC format
      ];

      for (const format of formats) {
        if (format.test(dateString)) {
          const attempt = new Date(dateString);
          if (!isNaN(attempt.getTime())) {
            return attempt;
          }
        }
      }

      // Fallback to current date
      return new Date();
    }

    return parsed;
  }
}

// Worker instance
const worker = new RSSWorker();

// Handle messages from main thread
self.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  worker.handleMessage(event.data);
});

export default worker;
