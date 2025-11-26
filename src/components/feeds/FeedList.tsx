'use client';

import { useState } from 'react';
import { FeedCard } from './FeedCard';
import { FeedForm } from './FeedForm';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { BrowseFeedsWizard } from './BrowseFeedsWizard';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useFeeds } from '@/hooks/useFeeds';
import type { FeedSource } from '@/lib/types';
import { ImportExport } from '@/components/feeds/ImportExport';

export function FeedList() {
  const { feeds, loading, error, addFeed, updateFeed, deleteFeed } = useFeeds();
  console.log('FeedList: useFeeds hook result:', { feeds: feeds.length, loading, error });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [showBrowseWizard, setShowBrowseWizard] = useState(false);

  const [editingFeed, setEditingFeed] = useState<FeedSource | null>(null);
  const [deletingFeed, setDeletingFeed] = useState<FeedSource | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  // Get all unique tags from feeds
  const allTags = Array.from(
    new Set(feeds.flatMap(feed => feed.tags || []))
  ).sort();

  // Filter feeds based on search and tag
  const filteredFeeds = feeds.filter(feed => {
    const matchesSearch = searchQuery === '' ||
      feed.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feed.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feed.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feed.tags?.filter(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = selectedTag === '' || (feed.tags || []).includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  const handleAddFeed = async (feedData: Omit<FeedSource, 'id' | 'createdAt'>) => {
    await addFeed(feedData);
    setShowAddForm(false);
  };

  const handleEditFeed = async (feedData: Omit<FeedSource, 'id' | 'createdAt'>) => {
    if (editingFeed) {
      await updateFeed(editingFeed.id, feedData);
      setEditingFeed(null);
    }
  };

  const handleDeleteFeed = async () => {
    if (deletingFeed) {
      await deleteFeed(deletingFeed.id);
      setDeletingFeed(null);
    }
  };

  const handleAddMultipleFeeds = async (feedsData: Omit<FeedSource, 'id' | 'createdAt'>[]) => {
    // Add feeds one by one
    for (const feedData of feedsData) {
      await addFeed(feedData);
    }
    setShowBrowseWizard(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2">Loading feeds...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <span>Error loading feeds: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">RSS Feeds</h1>
          <p className="text-base-content/70">
            {feeds.length} feed{feeds.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex gap-2">
          {/* <Button
            variant="secondary"
            onClick={() => setShowImportExport(true)}
          >
            Import/Export
          </Button> */}
          <button
            onClick={() => setShowBrowseWizard(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Browse...
          </button>
          <button
            onClick={() => {
              setShowAddForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Add Feed
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search feeds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
        <div className="sm:w-48">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Feed Grid */}
      {filteredFeeds.length === 0 ? (
        <div className="text-center py-12">
          {feeds.length === 0 ? (
            <div>
              <div className="text-6xl mb-4">📰</div>
              <h3 className="text-lg font-medium mb-2">No feeds yet</h3>
              <p className="text-base-content/70 mb-4">
                Add your first RSS feed to get started
              </p>
              <button
                onClick={() => {
                  setShowAddForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Add Your First Feed
              </button>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-medium mb-2">No feeds found</h3>
              <p className="text-base-content/70">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeeds.map((feed) => (
            <FeedCard
              key={feed.id}
              feed={feed}
              onEdit={setEditingFeed}
              onDelete={setDeletingFeed}
            />
          ))}
        </div>
      )}


      {/* Modals */}
      <FeedForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddFeed}
        mode="add"
      />

      <FeedForm
        isOpen={!!editingFeed}
        onClose={() => setEditingFeed(null)}
        onSubmit={handleEditFeed}
        initialData={editingFeed || undefined}
        mode="edit"
      />

      <DeleteConfirmModal
        isOpen={!!deletingFeed}
        onClose={() => setDeletingFeed(null)}
        onConfirm={handleDeleteFeed}
        feed={deletingFeed}
      />

      <BrowseFeedsWizard
        isOpen={showBrowseWizard}
        onClose={() => setShowBrowseWizard(false)}
        onAddFeeds={handleAddMultipleFeeds}
        existingFeeds={feeds}
      />

      <ImportExport
        isOpen={showImportExport}
        onClose={() => setShowImportExport(false)}
        onImportComplete={() => {
          // Refresh feeds after import
          window.location.reload();
        }}
      />
    </div>
  );
}
