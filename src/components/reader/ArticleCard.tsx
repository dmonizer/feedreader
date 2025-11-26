'use client';

import { useEffect, useRef, useState } from 'react';
import type { FeedItem, FeedSource } from '@/lib/types';
import Image from 'next/image';

interface ArticleCardProps {
  article: FeedItem;
  feedSource?: FeedSource;
  onMarkAsRead?: (articleId: string, isRead: boolean) => Promise<void>;
  onToggleStar?: (articleId: string, isStarred: boolean) => Promise<void>;
  onClick?: (article: FeedItem) => void;
  isSelected?: boolean;
  onFocus?: (articleId: string) => void;
  tabIndex?: number;
}

export function ArticleCard({
                              article,
                              feedSource,
                              onMarkAsRead,
                              onToggleStar,
                              onClick,
                              isSelected = false,
                              onFocus,
                              tabIndex = 0,
                            }: ArticleCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onMarkAsRead || isUpdating) return;

    setIsUpdating(true);
    try {
      await onMarkAsRead(article.id, !article.isRead);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleStar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onToggleStar || isUpdating) return;

    setIsUpdating(true);
    try {
      await onToggleStar(article.id, !article.isStarred);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(article);
    } else {
      // Default action: open article link
      window.open(article.link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleCardClick();
        break;
      case 'r':
      case 'R':
        e.preventDefault();
        if (onMarkAsRead) {
          handleMarkAsRead(e as any);
        }
        break;
      case 's':
      case 'S':
        e.preventDefault();
        if (onToggleStar) {
          handleToggleStar(e as any);
        }
        break;
      case 'Escape':
        setShowContextMenu(false);
        break;
    }
  };

  const handleFocus = () => {
    if (onFocus) {
      onFocus(article.id);
    }
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContextMenu]);

  // Extract images from content
  const extractImages = (content: string): string[] => {
    if (!content) return [];

    const imgRegex = /<img[^>]+src="([^">]+)"[^>]*>/gi;
    const matches = [];
    let match;

    while ((match = imgRegex.exec(content))!==null) {
      matches.push(match[1]);
    }

    return matches.slice(0, 3); // Limit to first 3 images
  };

  // Clean content for excerpt display
  const getContentExcerpt = (content: string, maxLength: number = 150): string => {
    if (!content) return '';

    // Remove HTML tags and normalize whitespace
    const cleanContent = content
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, '\'')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanContent.length <= maxLength) return cleanContent;

    const truncated = cleanContent.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...':truncated + '...';
  };

  // Prioritize og:image, then fall back to content images
  const ogImage = article.ogImage;
  const contentImages = extractImages(article.content || '');
  const images = ogImage ? [ogImage, ...contentImages]:contentImages;
  const contentExcerpt = getContentExcerpt(article.content || '');

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 168) {
      const days = Math.floor(diffInHours / 24);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const normalizeCategories = (category: string | object) => {
    // Normalize category to string (handle legacy object categories from some RSS feeds)
    let categoryText: string;
    if (typeof category==='string') {
      categoryText = category;
    } else if (category && typeof category==='object') {
      // Handle object categories like {_: 'value', $: {...}}
      const cat = category as any;
      categoryText = cat._ || cat.$ || cat.value || cat['#text'] || JSON.stringify(category);
    } else {
      categoryText = String(category);
    }
    return categoryText
  };


  const outputCategories = (c: string, i: number) => {
    const fullLength = c
    if (c && c.length > 10) {
      c = c.slice(0,25) + '..'
    }

    return (
      <span
        key={'k_' + i}
        className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded text-[10px]"
      title={fullLength}>
          {c}
        </span>);
  };


  return (
    <article
      ref={cardRef}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-lg cursor-pointer group relative ${
        article.isRead ? 'opacity-75':''
      } ${article.isHidden ? 'hidden':''} ${
        isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400':''
      }`}
      onClick={handleCardClick}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={tabIndex}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      aria-label={`Read article: ${article.title}`}
      aria-selected={isSelected}
    >
      {/* Article Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between mb-2">
          {/* Read status indicator */}
          <div className="flex items-center space-x-2">
            {!article.isRead && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
            )}
            {feedSource && (
              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                {feedSource.favicon && (
                  <Image
                    src={feedSource.favicon}
                    alt=""
                    className="w-4 h-4 rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <span className="truncate">{feedSource.title}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleMarkAsRead}
              disabled={isUpdating}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-300"
              title={article.isRead ? 'Mark as unread':'Mark as read'}
              aria-label={article.isRead ? 'Mark as unread':'Mark as read'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {article.isRead ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                ):(
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                )}
              </svg>
            </button>

            <button
              onClick={handleToggleStar}
              disabled={isUpdating}
              className={`p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors ${
                article.isStarred ? 'text-yellow-500':'text-gray-400 dark:text-gray-500'
              }`}
              title={article.isStarred ? 'Remove star':'Star article'}
              aria-label={article.isStarred ? 'Remove star':'Star article'}
            >
              <svg className="w-4 h-4" fill={article.isStarred ? 'currentColor':'none'} stroke="currentColor"
                   viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Article Title */}
        <h3 className={`font-semibold text-lg mb-2 line-clamp-2 leading-tight ${
          article.isRead ? 'text-gray-600 dark:text-gray-400':'text-gray-900 dark:text-white'
        }`}>
          {article.title}
        </h3>

        {/* Article Images */}
        {images.length > 0 && (
          <div className="mb-3">
            {images.length===1 ? (
              <img
                src={images[0]}
                alt=""
                className="w-full h-48 object-cover rounded-lg"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ):(
              <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 2).map((img, index) => (
                  <img
                    key={'k_' + index}
                    src={img}
                    alt=""
                    className="w-full h-24 object-cover rounded-lg"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Article Description */}
        {article.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-3 leading-relaxed">
            {article.description}
          </p>
        )}

        {/* Content Excerpt (if different from description) */}
        {contentExcerpt && contentExcerpt!==article.description && (
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              {contentExcerpt}
            </p>
          </div>
        )}

        {/* Article Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <time dateTime={article.pubDate.toISOString()}>
              {formatDate(article.pubDate)}
            </time>
            {article.author && (
              <>
                <span>•</span>
                <span className="truncate max-w-24">{article.author}</span>
              </>
            )}
          </div>

          {/* Categories/Tags*/}
          {article.categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {article.categories
                .slice(0, 5)
                .map(normalizeCategories)
                .map(outputCategories)}

              {article.categories.length > 5 && (
                <span className="text-gray-400 dark:text-gray-500 text-xs">+{article.categories.length - 5}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* External link indicator */}
      <div className="px-4 pb-4">
        <div
          className="flex items-center text-xs text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span className="truncate">{new URL(article.link).hostname}</span>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg py-2 min-w-48 z-50"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
            onClick={() => {
              handleCardClick();
              setShowContextMenu(false);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Article
          </button>

          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
            onClick={() => {
              navigator.clipboard.writeText(article.link);
              setShowContextMenu(false);
            }}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Link
          </button>

          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
            onClick={(e) => {
              handleMarkAsRead(e as any);
              setShowContextMenu(false);
            }}
            disabled={isUpdating}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {article.isRead ? 'Mark as Unread':'Mark as Read'}
          </button>

          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-300"
            onClick={(e) => {
              handleToggleStar(e as any);
              setShowContextMenu(false);
            }}
            disabled={isUpdating}
          >
            <svg className="w-4 h-4 mr-2" fill={article.isStarred ? 'currentColor':'none'} stroke="currentColor"
                 viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            {article.isStarred ? 'Remove Star':'Add Star'}
          </button>
        </div>
      )}
    </article>
  );
}
