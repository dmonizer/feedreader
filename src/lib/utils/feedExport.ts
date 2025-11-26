import type { FeedSource, Tag, UserSettings } from '@/lib/types';

export interface ExportData {
  version: string;
  exportDate: string;
  feeds: FeedSource[];
  tags: Tag[];
  settings: UserSettings;
}

export function exportFeeds(feeds: FeedSource[], tags: Tag[], settings: UserSettings): ExportData {
  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    feeds,
    tags,
    settings,
  };
}

export function validateImportData(data: any): { isValid: boolean; error?: string; data?: ExportData } {
  try {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid JSON format' };
    }

    if (!data.version) {
      return { isValid: false, error: 'Missing version information' };
    }

    if (!Array.isArray(data.feeds)) {
      return { isValid: false, error: 'Invalid feeds data' };
    }

    // Validate feed structure
    for (const feed of data.feeds) {
      if (!feed.url || !feed.title) {
        return { isValid: false, error: 'Invalid feed structure: missing url or title' };
      }
    }

    return {
      isValid: true,
      data: data as ExportData,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown validation error',
    };
  }
}

export function downloadJSON(data: ExportData, filename = 'rss-reader-export.json') {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function sanitizeFeedForImport(feed: any): Omit<FeedSource, 'id' | 'createdAt'> {
  return {
    url: feed.url || '',
    title: feed.title || 'Untitled Feed',
    description: feed.description || '',
    tags: Array.isArray(feed.tags) ? feed.tags : [],
    ignoredWords: Array.isArray(feed.ignoredWords) ? feed.ignoredWords : [],
    updateInterval: typeof feed.updateInterval === 'number' ? feed.updateInterval : undefined,
    lastUpdated: feed.lastUpdated ? new Date(feed.lastUpdated) : new Date(),
    isActive: typeof feed.isActive === 'boolean' ? feed.isActive : true,
    favicon: feed.favicon,
  };
}

export function sanitizeTagForImport(tag: any): Omit<Tag, 'id' | 'createdAt'> {
  return {
    name: tag.name || 'Untitled Tag',
    color: tag.color || '#3b82f6',
  };
}