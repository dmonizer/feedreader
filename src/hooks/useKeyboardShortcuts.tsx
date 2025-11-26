'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger shortcuts when user is typing in form elements
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    for (const shortcut of shortcuts) {
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatches = !!shortcut.altKey === event.altKey;
      const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
      const metaMatches = !!shortcut.metaKey === event.metaKey;

      if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts: shortcuts.map(s => ({
      key: s.key,
      ctrlKey: s.ctrlKey,
      altKey: s.altKey,
      shiftKey: s.shiftKey,
      metaKey: s.metaKey,
      description: s.description,
    }))
  };
}

// Utility function to format shortcut display
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'action' | 'preventDefault'>) {
  const parts = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.metaKey) parts.push('Cmd');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(' + ');
}

// Common keyboard shortcuts
export const commonShortcuts = {
  refresh: {
    key: 'r',
    ctrlKey: true,
    description: 'Refresh feeds',
  },
  search: {
    key: 'f',
    ctrlKey: true,
    description: 'Focus search',
  },
  markAsRead: {
    key: 'r',
    description: 'Mark as read/unread',
  },
  star: {
    key: 's',
    description: 'Star/unstar article',
  },
  nextArticle: {
    key: 'ArrowDown',
    description: 'Next article',
  },
  previousArticle: {
    key: 'ArrowUp',
    description: 'Previous article',
  },
  openArticle: {
    key: 'Enter',
    description: 'Open article',
  },
  escape: {
    key: 'Escape',
    description: 'Close modal/dialog',
  },
};