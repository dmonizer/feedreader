'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { dbService } from '@/lib/db';
import { useTheme } from '@/contexts/ThemeContext';
import type { UserSettings } from '@/lib/types';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [globalIgnoredWordsText, setGlobalIgnoredWordsText] = useState('');

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        await dbService.initialize();
        const userSettings = await dbService.getSettings();
        setSettings(userSettings);
        setGlobalIgnoredWordsText(userSettings.globalIgnoredWords?.join(', ') || '');
      } catch (error) {
        console.error('Failed to load settings:', error);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      // Process the globalIgnoredWordsText into an array
      const processedGlobalIgnoredWords = globalIgnoredWordsText
        .split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0);

      const updatedSettings = {
        ...settings,
        globalIgnoredWords: processedGlobalIgnoredWords
      };

      await dbService.updateSettings(updatedSettings);
      setSettings(updatedSettings);

      // Update theme in context as well
      if (settings.theme !== theme) {
        setTheme(settings.theme);
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    setSaving(true);
    try {
      // Reset to default values
      const defaultSettings: UserSettings = {
        id: 'global',
        defaultUpdateInterval: 60,
        maxColumns: 4,
        columnMaxWidth: 400,
        theme: 'auto',
        tagFilterMode: 'OR',
        itemsPerPage: 50,
        markAsReadOnScroll: false,
        globalIgnoredWords: [],
        displayMode: 'cards',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dbService.updateSettings(defaultSettings);
      setSettings(defaultSettings);
      setGlobalIgnoredWordsText('');
      setMessage({ type: 'success', text: 'Settings reset to defaults!' });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            <h2 className="font-semibold mb-2">Error Loading Settings</h2>
            <p>Unable to load settings. Please try refreshing the page.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Settings</h1>
          <p className="text-gray-600 dark:text-gray-400">Customize your RSS reader experience</p>
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mb-6 px-4 py-3 rounded-lg ${message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
            }`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-6">
          {/* Appearance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Appearance</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as 'light' | 'dark' | 'auto' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Choose your preferred color scheme
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Columns
                </label>
                <Input
                  type="number"
                  min="1"
                  max="6"
                  value={settings.maxColumns}
                  onChange={(e) => setSettings({ ...settings, maxColumns: parseInt(e.target.value) || 1 })}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Maximum number of columns in the reader layout
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Column Max Width (pixels)
                </label>
                <Input
                  type="number"
                  min="200"
                  max="800"
                  value={settings.columnMaxWidth}
                  onChange={(e) => setSettings({ ...settings, columnMaxWidth: parseInt(e.target.value) || 400 })}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Maximum width for each column in the layout
                </p>
              </div>
            </div>
          </div>

          {/* Feed Updates */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Feed Updates</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Update Interval (minutes)
                </label>
                <Input
                  type="number"
                  min="5"
                  max="1440"
                  value={settings.defaultUpdateInterval}
                  onChange={(e) => setSettings({ ...settings, defaultUpdateInterval: parseInt(e.target.value) || 60 })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  How often feeds should be updated automatically (applies to feeds without specific intervals)
                </p>
              </div>
            </div>
          </div>

          {/* Reading Experience */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Reading Experience</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items Per Page
                </label>
                <Input
                  type="number"
                  min="10"
                  max="200"
                  value={settings.itemsPerPage}
                  onChange={(e) => setSettings({ ...settings, itemsPerPage: parseInt(e.target.value) || 50 })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Number of articles to load at once
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Filter Mode
                </label>
                <select
                  value={settings.tagFilterMode}
                  onChange={(e) => setSettings({ ...settings, tagFilterMode: e.target.value as 'AND' | 'OR' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="OR">OR - Show articles matching any selected tag</option>
                  <option value="AND">AND - Show articles matching all selected tags</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  How multiple tag filters should be combined
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="markAsReadOnScroll"
                  checked={settings.markAsReadOnScroll}
                  onChange={(e) => setSettings({ ...settings, markAsReadOnScroll: e.target.checked })}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="markAsReadOnScroll" className="ml-2 text-sm font-medium text-gray-700">
                  Mark articles as read when scrolling past them
                </label>
              </div>
            </div>
          </div>

          {/* Storage & Data */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Storage & Data</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Data Management</h3>
                <p className="text-sm text-gray-600 mb-4">
                  All data is stored locally in your browser. No data is sent to external servers.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      // TODO: Implement data export
                      alert('Data export feature coming soon!');
                    }}
                  >
                    Export Data
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => {
                      // TODO: Implement data import
                      alert('Data import feature coming soon!');
                    }}
                  >
                    Import Data
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
                        // TODO: Implement data clearing
                        alert('Data clearing feature coming soon!');
                      }
                    }}
                  >
                    Clear All Data
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Global Content Filtering */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Global Content Filtering</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Global Ignored Words/Phrases
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                  placeholder="jalgpall, sport, hamilton, advertisement, spam, promotion (comma-separated)"
                  value={globalIgnoredWordsText}
                  onChange={(e) => setGlobalIgnoredWordsText(e.target.value)}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Articles containing these words in their title, description, or content will be hidden from all feeds.
                  Separate multiple words with commas. This works in combination with feed-specific ignored words.
                </p>
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p><strong>Supported patterns:</strong></p>
                  <p>• <code className="bg-gray-100 dark:bg-gray-600 px-1">word</code> - Exact word match (case insensitive)</p>
                  <p>• <code className="bg-gray-100 dark:bg-gray-600 px-1">*word*</code> - Contains word anywhere</p>
                  <p>• <code className="bg-gray-100 dark:bg-gray-600 px-1">word*</code> - Starts with word</p>
                  <p>• <code className="bg-gray-100 dark:bg-gray-600 px-1">*word</code> - Ends with word</p>
                </div>
                {globalIgnoredWordsText.trim() && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                    {(() => {
                      const previewWords = globalIgnoredWordsText
                        .split(',')
                        .map(word => word.trim())
                        .filter(word => word.length > 0);
                      return (
                        <>
                          <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                            Currently filtering: {previewWords.length} word{previewWords.length !== 1 ? 's' : ''}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {previewWords.map((word, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 text-xs rounded">
                                {word}
                              </span>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Keyboard Shortcuts</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Navigate articles</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">↑ ↓</code>
                </div>
                <div className="flex justify-between">
                  <span>Mark as read/unread</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">R</code>
                </div>
                <div className="flex justify-between">
                  <span>Star/unstar article</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">S</code>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Open article</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Enter</code>
                </div>
                <div className="flex justify-between">
                  <span>Refresh feeds</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Ctrl+R</code>
                </div>
                <div className="flex justify-between">
                  <span>Search</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">Ctrl+F</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="secondary"
            onClick={resetSettings}
            disabled={saving}
          >
            Reset to Defaults
          </Button>

          <Button
            onClick={saveSettings}
            disabled={saving}
            className="min-w-24"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </main>
  );
}