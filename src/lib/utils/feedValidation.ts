export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

export function normalizeUrl(url: string): string {
  try {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const urlObj = new URL(url);
    return urlObj.toString();
  } catch {
    return url;
  }
}

export async function validateRssFeed(url: string): Promise<{
  isValid: boolean;
  error?: string;
  title?: string;
  description?: string;
}> {
  try {
    if (!isValidUrl(url)) {
      return {
        isValid: false,
        error: 'Invalid URL format',
      };
    }

    const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`);

    if (!response.ok) {
      return {
        isValid: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const xmlText = await response.text();

    // Basic XML validation
    if (!xmlText.trim().startsWith('<')) {
      return {
        isValid: false,
        error: 'Response is not valid XML',
      };
    }

    // Try to extract basic info from RSS
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlText, 'text/xml');

      // Check for RSS or Atom format
      const rssChannel = doc.querySelector('rss channel');
      const atomFeed = doc.querySelector('feed[xmlns*="atom"]');

      if (!rssChannel && !atomFeed) {
        return {
          isValid: false,
          error: 'Not a valid RSS or Atom feed',
        };
      }

      let title = '';
      let description = '';

      if (rssChannel) {
        title = rssChannel.querySelector('title')?.textContent || '';
        description = rssChannel.querySelector('description')?.textContent || '';
      } else if (atomFeed) {
        title = atomFeed.querySelector('title')?.textContent || '';
        description = atomFeed.querySelector('subtitle')?.textContent || '';
      }

      return {
        isValid: true,
        title: title.trim(),
        description: description.trim(),
      };
    } catch {
      return {
        isValid: false,
        error: 'Failed to parse RSS feed',
      };
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function sanitizeFeedTitle(title: string): string {
  return title.replace(/[<>]/g, '').trim() || 'Untitled Feed';
}

export function sanitizeFeedDescription(description: string): string {
  return description.replace(/<[^>]*>/g, '').trim();
}