'use client';

import { formatDistanceToNow } from 'date-fns';
import { FeedItem, FeedSource } from '@/lib/types';

interface ArticleListItemProps {
  article: FeedItem;
  feedSource?: FeedSource;
  onMarkAsRead?: (articleId: string, isRead: boolean) => Promise<void>;
  onToggleStar?: (articleId: string, isStarred: boolean) => Promise<void>;
}

export function ArticleListItem({
                                  article,
                                  feedSource,
                                  onMarkAsRead,
                                  onToggleStar,
                                }: Readonly<ArticleListItemProps>) {

  const handleToggleStar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleStar?.(article.id, !article.isStarred);
  };
  let pressTimer: ReturnType<typeof setTimeout>;

  const handleTouchStart = (e: React.TouchEvent) => {
    pressTimer = setTimeout(() => {
      // Long press detected
      onToggleStar?.(article.id, !article.isStarred);
      e.preventDefault(); // Prevent context menu
    }, 800); // 500ms threshold
  };
  const clearTouchTimer = () => {
    clearTimeout(pressTimer);
  };
  return (
    <div
      className={`
        group relative flex items-center p-1 bg-white hover:bg-gray-50 transition-colors gap-3
        ${article.isRead ? 'opacity-75':''}
      `}
    >

      <div className="flex-1 w-max">
        <div className="flex flex-wrap items-baseline gap-x-2">
          {/* Title */}
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`
              text-base text-sm font-medium  leading-snug hover:text-blue-600 transition-colors
              ${article.isRead ? 'text-gray-600 font-normal':'text-gray-900'}
            `}
            onClick={() => onMarkAsRead?.(article.id, true)}
            onTouchStart={handleTouchStart}
            onTouchEnd={clearTouchTimer}
            onTouchMove={clearTouchTimer}
          >
            {article.title}
          </a>

          {/* Metadata line */}
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span>({feedSource?.title || 'Unknown Source'})</span>
            <span>•</span>
            <time dateTime={article.pubDate.toISOString()}>
                {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
            </time>
          </span>
        </div>

        {/* Description (truncated) */}
        {article.content && (
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            {article.content}
          </p>
        )}
      </div>

      {/* Actions */}
      {article.isStarred && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleToggleStar}
            className={`p-1 rounded hover:bg-gray-200 ${article.isStarred ? 'text-yellow-400':'text-gray-400 hover:text-yellow-400'}`}
            title={article.isStarred ? 'Unstar':'Star'}
          >
            <svg className="w-4 h-4" fill={article.isStarred ? 'currentColor':'none'} stroke="currentColor"
                 viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
