'use client';

import { useEffect } from 'react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ['Ctrl', 'Enter'], description: 'Send request' },
  { keys: ['Ctrl', 'S'], description: 'Save request' },
  { keys: ['Ctrl', 'L'], description: 'Load request' },
  { keys: ['Ctrl', 'N'], description: 'New request' },
  { keys: ['?'], description: 'Show keyboard shortcuts' },
  { keys: ['Ctrl', '/'], description: 'Toggle shortcuts' },
  { keys: ['Esc'], description: 'Close modal' },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: KeyboardShortcutsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-40"
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-bg-secondary border border-bg-tertiary rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
          <div className="p-6 border-b border-bg-tertiary sticky top-0 bg-bg-secondary">
            <h2 className="text-xl font-bold text-text-primary">Keyboard Shortcuts</h2>
          </div>

          <div className="p-6 space-y-4">
            {shortcuts.map((shortcut, i) => (
              <div key={i} className="flex items-center justify-between">
                <p className="text-text-muted text-sm">{shortcut.description}</p>
                <div className="flex gap-1">
                  {shortcut.keys.map((key, j) => (
                    <span key={j}>
                      <kbd className="px-2 py-1 bg-bg-tertiary text-text-primary text-xs font-mono border border-bg-tertiary rounded">
                        {key}
                      </kbd>
                      {j < shortcut.keys.length - 1 && (
                        <span className="mx-1 text-text-muted">+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-bg-tertiary sticky bottom-0 bg-bg-secondary">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-accent text-white rounded hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
