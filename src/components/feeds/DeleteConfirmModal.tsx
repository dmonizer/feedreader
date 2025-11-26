'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { FeedSource } from '@/lib/types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  feed: FeedSource | null;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  feed
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!feed) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Feed"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-base-content/80">
          Are you sure you want to delete this feed? This action cannot be undone.
        </p>

        <div className="bg-base-200 p-3 rounded-lg">
          <div className="font-medium">{feed.title}</div>
          <div className="text-sm text-base-content/60 break-all">
            {feed.url}
          </div>
        </div>

        <div className="alert alert-warning">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span>All articles from this feed will also be deleted.</span>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirm}
            loading={loading}
          >
            Delete Feed
          </Button>
        </div>
      </div>
    </Modal>
  );
}