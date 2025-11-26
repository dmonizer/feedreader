'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ColorPicker } from './ColorPicker';
import type { Tag } from '@/lib/types';

interface TagEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tagData: Omit<Tag, 'id' | 'createdAt'>) => Promise<void>;
  initialData?: Partial<Tag>;
  mode: 'add' | 'edit';
}

export function TagEditor({ isOpen, onClose, onSubmit, initialData, mode }: TagEditorProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    color: initialData?.color || '#3b82f6',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tag name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Tag name must be less than 50 characters';
    }

    if (!formData.color) {
      newErrors.color = 'Color is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const tagData: Omit<Tag, 'id' | 'createdAt'> = {
        name: formData.name.trim(),
        color: formData.color,
      };

      await onSubmit(tagData);
      handleClose();
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : 'Failed to save tag',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      color: '#3b82f6',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'add' ? 'Add Tag' : 'Edit Tag'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Tag Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter tag name"
          error={errors.name}
          disabled={loading}
          maxLength={50}
        />

        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium">Color</span>
          </label>
          <div className="flex items-center gap-3">
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData(prev => ({ ...prev, color }))}
              disabled={loading}
            />
            <div className="flex-1">
              <div
                className="px-3 py-2 rounded-lg text-white text-sm font-medium text-center"
                style={{ backgroundColor: formData.color }}
              >
                {formData.name || 'Tag Preview'}
              </div>
            </div>
          </div>
          {errors.color && (
            <label className="label">
              <span className="label-text-alt text-error">{errors.color}</span>
            </label>
          )}
        </div>

        {errors.submit && (
          <div className="alert alert-error">
            <span>{errors.submit}</span>
          </div>
        )}

        <div className="modal-action">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {mode === 'add' ? 'Add Tag' : 'Update Tag'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}