import { useEffect } from 'react';

const INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in a form field
      if (INPUT_TAGS.has(e.target.tagName) || e.target.isContentEditable) return;
      // Don't fire with modifier keys
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const fn = shortcuts[e.key];
      if (fn) {
        e.preventDefault();
        fn(e);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
