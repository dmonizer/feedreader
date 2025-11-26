'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { TagList } from './TagList';
import { TagEditor } from './TagEditor';
import { useTags } from '@/hooks/useTags';
import type { Tag } from '@/lib/types';

export function TagManager() {
  const { addTag, deleteTag } = useTags();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const handleAddTag = async (tagData: Omit<Tag, 'id' | 'createdAt'>) => {
    await addTag(tagData);
    setShowAddForm(false);
  };

  const handleEditTag = async (tagData: Omit<Tag, 'id' | 'createdAt'>) => {
    // Note: We'd need to implement updateTag in the hook and database service
    // For now, this is a placeholder
    console.log('Edit tag:', editingTag?.id, tagData);
    setEditingTag(null);
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (window.confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      await deleteTag(tag.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tags</h2>
        <Button onClick={() => setShowAddForm(true)}>
          Add Tag
        </Button>
      </div>

      <TagList
        onEdit={setEditingTag}
        onDelete={handleDeleteTag}
      />

      <TagEditor
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddTag}
        mode="add"
      />

      <TagEditor
        isOpen={!!editingTag}
        onClose={() => setEditingTag(null)}
        onSubmit={handleEditTag}
        initialData={editingTag || undefined}
        mode="edit"
      />
    </div>
  );
}