'use client';

import type { InitialFeedData } from '@/lib/types';

interface FeedSelectionStepProps {
    availableFeeds: InitialFeedData[];
    selectedFeeds: InitialFeedData[];
    onFeedsChange: (feeds: InitialFeedData[]) => void;
}

export function FeedSelectionStep({
    availableFeeds,
    selectedFeeds,
    onFeedsChange,
}: FeedSelectionStepProps) {
    const toggleFeed = (feed: InitialFeedData) => {
        const isSelected = selectedFeeds.some(f => f.rss_url === feed.rss_url);
        if (isSelected) {
            onFeedsChange(selectedFeeds.filter(f => f.rss_url !== feed.rss_url));
        } else {
            onFeedsChange([...selectedFeeds, feed]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedFeeds.length === availableFeeds.length) {
            onFeedsChange([]);
        } else {
            onFeedsChange([...availableFeeds]);
        }
    };

    const isSelected = (feed: InitialFeedData) =>
        selectedFeeds.some(f => f.rss_url === feed.rss_url);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Select feeds to add</h2>
                    <p className="text-gray-600 text-sm">
                        {availableFeeds.length} feed{availableFeeds.length !== 1 ? 's' : ''} available
                    </p>
                </div>
                <button
                    onClick={toggleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    {selectedFeeds.length === availableFeeds.length ? 'Deselect All' : 'Select All'}
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2 p-1">
                {availableFeeds.map((feed) => {
                    const selected = isSelected(feed);
                    return (
                        <button
                            key={feed.rss_url}
                            onClick={() => toggleFeed(feed)}
                            className={`
                w-full p-4 rounded-lg border-2 transition-all text-left
                ${selected
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                }
              `}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`
                  mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                  ${selected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                `}>
                                    {selected && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900">{feed.name}</div>
                                    <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-1">
                                        {feed.topics.map(topic => (
                                            <span key={topic} className="bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                {topic}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {selectedFeeds.length > 0 && (
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <strong>{selectedFeeds.length}</strong> feed{selectedFeeds.length !== 1 ? 's' : ''} selected
                </div>
            )}
        </div>
    );
}
