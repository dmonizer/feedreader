'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { FileUpload } from './FileUpload';
import { useImportExport } from '@/hooks/useImportExport';

interface ImportExportProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export function ImportExport({ isOpen, onClose, onImportComplete }: ImportExportProps) {
  const {
    loading,
    progress,
    error,
    exportToOPML,
    exportToJSON,
    importFromOPML,
    importFromJSON,
    importSingleFeed,
  } = useImportExport();

  const [singleFeedUrl, setSingleFeedUrl] = useState('');
  const [importResult, setImportResult] = useState<string | null>(null);

  const handleFileImport = async (file: File) => {
    try {
      setImportResult(null);

      if (file.name.toLowerCase().endsWith('.opml')) {
        const result = await importFromOPML(file);
        setImportResult(
          `Successfully imported ${result.imported} feeds. ${result.skipped} feeds were skipped (already exist).`
        );
      } else if (file.name.toLowerCase().endsWith('.json')) {
        const result = await importFromJSON(file);
        setImportResult(
          `Successfully imported ${result.imported} feeds and ${result.tagsImported} tags. ${result.skipped} feeds were skipped (already exist).`
        );
      } else {
        throw new Error('Unsupported file format. Please use OPML or JSON files.');
      }

      onImportComplete?.();
    } catch (err) {
      setImportResult(
        `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleSingleFeedImport = async () => {
    if (!singleFeedUrl.trim()) return;

    try {
      setImportResult(null);
      await importSingleFeed(singleFeedUrl.trim());
      setImportResult('Feed imported successfully!');
      setSingleFeedUrl('');
      onImportComplete?.();
    } catch (err) {
      setImportResult(
        `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    }
  };

  const handleExportOPML = async () => {
    try {
      await exportToOPML();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleExportJSON = async () => {
    try {
      await exportToJSON();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleClose = () => {
    setImportResult(null);
    setSingleFeedUrl('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import & Export Feeds"
      size="lg"
    >
      <div className="space-y-6">
        {/* Export Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Export Feeds</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-base">OPML Format</h4>
                <p className="text-sm text-base-content/70 mb-3">
                  Standard format compatible with most RSS readers
                </p>
                <Button
                  variant="secondary"
                  onClick={handleExportOPML}
                  loading={loading}
                  disabled={loading}
                >
                  Export OPML
                </Button>
              </div>
            </div>

            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-base">JSON Format</h4>
                <p className="text-sm text-base-content/70 mb-3">
                  Complete backup including tags and settings
                </p>
                <Button
                  variant="secondary"
                  onClick={handleExportJSON}
                  loading={loading}
                  disabled={loading}
                >
                  Export JSON
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="divider"></div>

        {/* Import Section */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Import Feeds</h3>

          {/* File Import */}
          <div className="mb-6">
            <h4 className="font-medium mb-3">From File</h4>
            <FileUpload
              onFileSelect={handleFileImport}
              loading={loading}
              disabled={loading}
            />
          </div>

          {/* Single Feed Import */}
          <div>
            <h4 className="font-medium mb-3">Single Feed URL</h4>
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com/rss.xml"
                value={singleFeedUrl}
                onChange={(e) => setSingleFeedUrl(e.target.value)}
                disabled={loading}
              />
              <Button
                onClick={handleSingleFeedImport}
                loading={loading}
                disabled={!singleFeedUrl.trim() || loading}
              >
                Import
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && progress > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Importing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <progress className="progress progress-primary w-full" value={progress} max="100"></progress>
          </div>
        )}

        {/* Results/Error Display */}
        {importResult && (
          <div className={`alert ${importResult.includes('failed') ? 'alert-error' : 'alert-success'}`}>
            <span>{importResult}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="modal-action">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={loading}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}