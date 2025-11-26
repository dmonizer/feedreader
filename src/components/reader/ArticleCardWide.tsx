'use client';

import { formatDistanceToNow } from 'date-fns';
import { FeedItem, FeedSource } from '@/lib/types';
import { getContentExcerpt } from '@/utils/content';

interface ArticleCardWideProps {
    article: FeedItem;
    feedSource?: FeedSource;
    onMarkAsRead?: (articleId: string, isRead: boolean) => Promise<void>;
    onToggleStar?: (articleId: string, isStarred: boolean) => Promise<void>;
}

export function ArticleCardWide({
    article,
    feedSource,
    onMarkAsRead,
    onToggleStar,
}: ArticleCardWideProps) {
  const contentExcerpt = getContentExcerpt(article.content || article.description || '', 500);

  const handleToggleRead = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onMarkAsRead?.(article.id, !article.isRead);
    };

    const handleToggleStar = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleStar?.(article.id, !article.isStarred);
    };

    // Extract image from content if available and not set in ogImage
    const getImage = () => {
        if (article.ogImage) return article.ogImage;

        if (article.content) {
            const match = article.content.match(/<img[^>]+src="([^">]+)"/);
            if (match) return match[1];
        }

        return null;
    };

    const imageUrl = getImage();

    return (
        <div
            className={`
        group relative flex bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow
        ${article.isRead ? 'opacity-75' : ''}
      `}
        >
            {imageUrl && (
                <div className="w-48 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                    <img
                        src={imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                    />
                </div>
            )}

            <div className="flex-1 p-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        {feedSource?.favicon ? (
                            <img
                                src={feedSource.favicon}
                                alt=""
                                className="w-4 h-4 rounded-sm object-contain"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        ) : (
                            <span className="w-4 h-4 rounded-sm bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                {feedSource?.title?.charAt(0) || '?'}
                            </span>
                        )}
                        <span className="font-medium text-gray-700 truncate max-w-[200px]">
                            {feedSource?.title || 'Unknown Source'}
                        </span>

                        <time dateTime={article.pubDate.toISOString()}>
                            {formatDistanceToNow(new Date(article.pubDate), { addSuffix: true })}
                        </time>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleToggleRead}
                            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            title={article.isRead ? "Mark as unread" : "Mark as read"}
                        >
                            {article.isRead ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </button>

                        <button
                            onClick={handleToggleStar}
                            className={`p-1.5 rounded-full hover:bg-gray-100 ${article.isStarred ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}`}
                            title={article.isStarred ? "Unstar" : "Star"}
                        >
                            <svg className="w-5 h-5" fill={article.isStarred ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 group-hover:text-blue-600 transition-colors"
                    onClick={() => onMarkAsRead?.(article.id, true)}
                >
                    <h3 className={`
            text-xl font-semibold leading-tight mb-2
            ${article.isRead ? 'text-gray-600 font-normal' : 'text-gray-900'}
          `}>
                        {article.title}
                    </h3>

                    {contentExcerpt && (
                        <p className="text-gray-600 line-clamp-2 text-sm">
                            {contentExcerpt}
                        </p>
                    )}
                </a>
            </div>
        </div>
    );
}
