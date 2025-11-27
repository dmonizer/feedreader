'use client';

import { useEffect, useMemo, useState } from 'react';
import { LanguageSelectionStep } from './wizard/LanguageSelectionStep';
import { TopicSelectionStep } from './wizard/TopicSelectionStep';
import { FeedSelectionStep } from './wizard/FeedSelectionStep';
import type { FeedSource, InitialFeedData } from '@/lib/types';

interface BrowseFeedsWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFeeds: (feeds: Omit<FeedSource, 'id' | 'createdAt'>[]) => Promise<void>;
  existingFeeds: FeedSource[];
}

type WizardStep = 'language' | 'topic' | 'feed';

export function BrowseFeedsWizard({
  isOpen,
  onClose,
  onAddFeeds,
  existingFeeds,
}: Readonly<BrowseFeedsWizardProps>) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('language');
  const [initialFeeds, setInitialFeeds] = useState<InitialFeedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedFeeds, setSelectedFeeds] = useState<InitialFeedData[]>([]);

  // Load initial feeds data
  useEffect(() => {
    if (isOpen) {
      loadInitialFeeds();
    }
  }, [isOpen]);
  const feedSources = ['initial', 'second', 'third'];

  const loadSingleFeedSource = async (source: string): Promise<InitialFeedData[]> => {
    const response = await fetch(`/feeds/${source}.json`);
    if (!response.ok) {
      throw new Error('Failed to load feeds');
    }
    return await response.json() as InitialFeedData[];
  };

  const loadInitialFeeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = (await Promise.all(feedSources.flatMap(loadSingleFeedSource))).flat();

      // Deduplicate feeds by rss_url
      const uniqueFeeds = Array.from(
        new Map(data.map(feed => [feed.rss_url, feed])).values()
      );

      setInitialFeeds(uniqueFeeds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load feeds');
    } finally {
      setLoading(false);
    }
  };

  // Get unique languages from initial feeds
  const availableLanguages = useMemo(() => {
    const languages = new Set<string>();
    initialFeeds.forEach(feed => {
      feed.languages.forEach(lang => languages.add(lang));
    });
    return Array.from(languages).sort();
  }, [initialFeeds]);

  // Get topics filtered by selected languages
  const availableTopics = useMemo(() => {
    if (selectedLanguages.length === 0) return [];

    const topicCounts = new Map<string, number>();
    initialFeeds.forEach(feed => {
      // Only include feeds that match selected languages
      const hasMatchingLanguage = feed.languages.some(lang =>
        selectedLanguages.includes(lang),
      );

      if (hasMatchingLanguage) {
        feed.topics.forEach(topic => {
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
        });
      }
    });

    return Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => a.topic.localeCompare(b.topic));
  }, [initialFeeds, selectedLanguages]);

  // Get feeds filtered by selected languages and topics, excluding duplicates
  const availableFeeds = useMemo(() => {
    if (selectedLanguages.length === 0 || selectedTopics.length === 0) return [];

    // Get existing feed URLs for duplicate detection
    const existingFeedUrls = new Set(existingFeeds.map(feed => feed.url));

    return initialFeeds.filter(feed => {
      // Check if already added
      if (existingFeedUrls.has(feed.rss_url)) {
        return false;
      }

      // Check language match
      const hasMatchingLanguage = feed.languages.some(lang =>
        selectedLanguages.includes(lang),
      );

      // Check topic match
      const hasMatchingTopic = feed.topics.some(topic =>
        selectedTopics.includes(topic),
      );

      return hasMatchingLanguage && hasMatchingTopic;
    });
  }, [initialFeeds, selectedLanguages, selectedTopics, existingFeeds]);

  const handleNext = () => {
    if (currentStep === 'language') {
      setCurrentStep('topic');
      setSelectedTopics([]); // Reset topics when languages change
    } else if (currentStep === 'topic') {
      setCurrentStep('feed');
      setSelectedFeeds([]); // Reset feed selection
    }
  };

  const handleBack = () => {
    if (currentStep === 'feed') {
      setCurrentStep('topic');
    } else if (currentStep === 'topic') {
      setCurrentStep('language');
    }
  };

  const handleFinish = async () => {
    if (selectedFeeds.length === 0) return;

    try {
      // Convert InitialFeedData to FeedSource format
      const feedsToAdd: Omit<FeedSource, 'id' | 'createdAt'>[] = selectedFeeds.map(feed => ({
        url: feed.rss_url,
        title: feed.name,
        description: `Topics: ${feed.topics.join(', ')}`,
        tags: feed.topics,
        ignoredWords: [],
        updateInterval: undefined,
        lastUpdated: new Date(),
        isActive: true,
        favicon: undefined,
      }));

      await onAddFeeds(feedsToAdd);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add feeds');
    }
  };

  const handleClose = () => {
    setCurrentStep('language');
    setSelectedLanguages([]);
    setSelectedTopics([]);
    setSelectedFeeds([]);
    setError(null);
    onClose();
  };

  const canProceed = () => {
    if (currentStep === 'language') return selectedLanguages.length > 0;
    if (currentStep === 'topic') return selectedTopics.length > 0;
    if (currentStep === 'feed') return selectedFeeds.length > 0;
    return false;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Browse Feeds</h1>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`flex-1 h-2 rounded ${currentStep === 'language' ? 'bg-blue-500' : 'bg-gray-200'}`} />
            <div
              className={`flex-1 h-2 rounded ${currentStep === 'topic' ? 'bg-blue-500' : currentStep === 'feed' ? 'bg-gray-200' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded ${currentStep === 'feed' ? 'bg-blue-500' : 'bg-gray-200'}`} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading feeds...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              Error: {error}
            </div>
          ) : (
            <>
              {currentStep === 'language' && (
                <LanguageSelectionStep
                  availableLanguages={availableLanguages}
                  selectedLanguages={selectedLanguages}
                  onLanguagesChange={setSelectedLanguages}
                />
              )}

              {currentStep === 'topic' && (
                <TopicSelectionStep
                  availableTopics={availableTopics}
                  selectedTopics={selectedTopics}
                  onTopicsChange={setSelectedTopics}
                />
              )}

              {currentStep === 'feed' && (
                <>
                  {availableFeeds.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📭</div>
                      <h3 className="text-lg font-medium mb-2">No new feeds available</h3>
                      <p className="text-gray-600">
                        All feeds matching your criteria have already been added.
                      </p>
                    </div>
                  ) : (
                    <FeedSelectionStep
                      availableFeeds={availableFeeds}
                      selectedFeeds={selectedFeeds}
                      onFeedsChange={setSelectedFeeds}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={currentStep === 'language' ? handleClose : handleBack}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
          >
            {currentStep === 'language' ? 'Cancel' : 'Back'}
          </button>

          <button
            onClick={currentStep === 'feed' ? handleFinish : handleNext}
            disabled={!canProceed()}
            className={`
              px-6 py-2 rounded-lg font-medium transition-colors
              ${canProceed()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {currentStep === 'feed' ? 'Add Feeds' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
