'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

const defaultShortcuts: KeyboardShortcut[] = [
  { key: 'd', ctrl: true, action: () => {}, description: 'Go to Dashboard' },
  { key: 'e', ctrl: true, action: () => {}, description: 'Go to Devices' },
  { key: 'f', ctrl: true, action: () => {}, description: 'Go to Flows' },
  { key: 's', ctrl: true, action: () => {}, description: 'Go to System' },
  { key: '/', ctrl: true, action: () => {}, description: 'Focus search' },
  { key: '?', shift: true, action: () => {}, description: 'Show keyboard shortcuts' },
  { key: 'Escape', action: () => {}, description: 'Close modal/dialog' },
];

export function useKeyboardShortcuts(customShortcuts?: KeyboardShortcut[]) {
  const router = useRouter();

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Update default shortcuts with router navigation
    const shortcuts = defaultShortcuts.map(shortcut => {
      switch (shortcut.key) {
        case 'd':
          return { ...shortcut, action: () => router.push('/') };
        case 'e':
          return { ...shortcut, action: () => router.push('/devices') };
        case 'f':
          return { ...shortcut, action: () => router.push('/flows') };
        case 's':
          return { ...shortcut, action: () => router.push('/system') };
        case '/':
          return { ...shortcut, action: () => {
            const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
            searchInput?.focus();
          }};
        case '?':
          return { ...shortcut, action: () => {
            const helpButton = document.querySelector('[data-help-button]') as HTMLButtonElement;
            helpButton?.click();
          }};
        case 'Escape':
          return { ...shortcut, action: () => {
            const closeButton = document.querySelector('[data-modal-close]') as HTMLButtonElement;
            closeButton?.click();
          }};
        default:
          return shortcut;
      }
    });

    const allShortcuts = [...shortcuts, ...(customShortcuts || [])];

    for (const shortcut of allShortcuts) {
      const keyMatch = event.key === shortcut.key || event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : true;
      const altMatch = shortcut.alt ? event.altKey : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : true;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
        // Don't trigger shortcuts when typing in inputs
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          if (event.key !== 'Escape') return;
        }

        event.preventDefault();
        shortcut.action();
        break;
      }
    }
  }, [router, customShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return defaultShortcuts.concat(customShortcuts || []);
}