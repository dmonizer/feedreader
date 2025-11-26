/**
 * Utility functions for checking ignored words filtering
 */
import { FeedItem, ParsedFeedItem } from '@/lib/types';

export function shouldHideContent(
  article: FeedItem | ParsedFeedItem,
  ignoredWords: string[],
): boolean {
  if (ignoredWords.length===0) return false;

  const textToCheck = combineStringProperties(article).toLowerCase();

  return ignoredWords.some(word => {
    const lowerWord = word.toLowerCase().trim();
    if (!lowerWord) return false;
    let cleanWord = '';

    // Support both exact word matching and partial matching
    if (lowerWord.startsWith('*') && lowerWord.endsWith('*')) {      // Wildcard matching: *word* -> contains word
      cleanWord = lowerWord.slice(1, -1);
    } else if (lowerWord.startsWith('*')) {      // Suffix matching: *word -> ends with word
      cleanWord = lowerWord.slice(1);
    } else if (lowerWord.endsWith('*')) {       // Prefix matching: word* -> starts with word
      cleanWord = lowerWord.slice(0, -1);
    } else {
      // Exact word matching
      const wordBoundaryRegex = new RegExp(`\\b${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      return wordBoundaryRegex.test(textToCheck);
    }
    return textToCheck.includes(cleanWord);
  });
}

export function combineIgnoredWords(feedIgnoredWords: string[] = [], globalIgnoredWords: string[] = []): string[] {
  // Combine and deduplicate ignored words from both feed and global lists
  const combined = [...feedIgnoredWords, ...globalIgnoredWords];
  return Array.from(new Set(combined.map(word => word.toLowerCase().trim()))).filter(word => word.length > 0);
}

function combineStringProperties(obj: FeedItem | ParsedFeedItem) {
  return Object.values(obj)
    .filter(v => typeof v==='string')
    .join(' ');
}
