// Clean content for excerpt display
const getContentExcerpt = (content: string, maxLength: number = 350): string => {
  if (!content) return '';

  // Remove HTML tags and normalize whitespace
  const cleanContent = content
    .replace(/<[^>]*>/g, '')
    .replace('&nbsp;', ' ')
    .replace('&amp;', '&')
    .replace('&lt;', '<')
    .replace('&gt;', '>')
    .replace('&quot;', '"')
    .replace('&#39;', '\'')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleanContent.length <= maxLength) return cleanContent;

  const truncated = cleanContent.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
};

export {getContentExcerpt};