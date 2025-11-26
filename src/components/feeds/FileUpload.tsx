'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  loading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}

export function FileUpload({
  onFileSelect,
  accept = '.opml,.json',
  loading = false,
  disabled = false,
  children
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || loading}
      />

      {children ? (
        <div onClick={handleClick}>
          {children}
        </div>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${dragOver ? 'border-primary bg-primary/5' : 'border-base-300'}
            ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
          `}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-4xl mb-4">📁</div>
          <div className="text-lg font-medium mb-2">
            Choose a file or drag it here
          </div>
          <div className="text-sm text-base-content/60 mb-4">
            Supports OPML and JSON files
          </div>
          <Button
            variant="secondary"
            disabled={disabled || loading}
            loading={loading}
          >
            Select File
          </Button>
        </div>
      )}
    </div>
  );
}