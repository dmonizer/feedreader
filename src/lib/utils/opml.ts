import type { FeedSource } from '@/lib/types';

export interface OPMLOutline {
  type?: string;
  text?: string;
  title?: string;
  xmlUrl?: string;
  htmlUrl?: string;
  description?: string;
  outlines?: OPMLOutline[];
}

export interface OPMLDocument {
  version: string;
  head: {
    title?: string;
    dateCreated?: string;
    dateModified?: string;
  };
  body: {
    outlines: OPMLOutline[];
  };
}

export function parseOPML(opmlContent: string): FeedSource[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(opmlContent, 'text/xml');

    // Check for parsing errors
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Invalid OPML format');
    }

    const feeds: Omit<FeedSource, 'id' | 'createdAt'>[] = [];
    const outlines = doc.querySelectorAll('outline');

    outlines.forEach((outline) => {
      const xmlUrl = outline.getAttribute('xmlUrl');
      const text = outline.getAttribute('text');
      const title = outline.getAttribute('title');
      const description = outline.getAttribute('description');
      const type = outline.getAttribute('type');

      // Only process outlines that have an xmlUrl (RSS feeds)
      if (xmlUrl && (type === 'rss' || type === 'atom' || !type)) {
        const feedTitle = title || text || 'Untitled Feed';
        const feedDescription = description || '';

        feeds.push({
          url: xmlUrl,
          title: feedTitle,
          description: feedDescription,
          tags: [],
          ignoredWords: [],
          lastUpdated: new Date(),
          isActive: true,
        });
      }
    });

    return feeds as FeedSource[];
  } catch (error) {
    throw new Error(`Failed to parse OPML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function generateOPML(feeds: FeedSource[]): string {
  const now = new Date().toUTCString();

  const opmlDoc = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>RSS Reader Export</title>
    <dateCreated>${now}</dateCreated>
    <dateModified>${now}</dateModified>
  </head>
  <body>
${feeds.map(feed => `    <outline text="${escapeXml(feed.title)}" title="${escapeXml(feed.title)}" type="rss" xmlUrl="${escapeXml(feed.url)}" description="${escapeXml(feed.description || '')}" />`).join('\n')}
  </body>
</opml>`;

  return opmlDoc;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function downloadOPML(feeds: FeedSource[], filename = 'rss-feeds.opml') {
  const opmlContent = generateOPML(feeds);
  const blob = new Blob([opmlContent], { type: 'text/xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function validateOPML(opmlContent: string): { isValid: boolean; error?: string; feedCount?: number } {
  try {
    const feeds = parseOPML(opmlContent);
    return {
      isValid: true,
      feedCount: feeds.length,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid OPML format',
    };
  }
}