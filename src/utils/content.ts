// Clean content for excerpt display
const getContentExcerpt = (content: string, maxLength: number = 350): string => {
  if (!content) return '';

  // Remove HTML tags and normalize whitespace
  const cleanContent = content
    .replaceAll(/<[^>]*>/g, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', '\'')
    .replaceAll(/\s+/g, ' ')
    .trim();

  if (cleanContent.length <= maxLength) return cleanContent;

  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

export {getContentExcerpt};