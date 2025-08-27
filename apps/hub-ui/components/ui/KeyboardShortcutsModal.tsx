'use client';

import Modal from './Modal';

interface Shortcut {
  keys: string[];
  description: string;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'D'], description: 'Go to Dashboard' },
  { keys: ['Ctrl', 'E'], description: 'Go to Devices' },
  { keys: ['Ctrl', 'F'], description: 'Go to Flows' },
  { keys: ['Ctrl', 'S'], description: 'Go to System' },
  { keys: ['Ctrl', '/'], description: 'Focus search' },
  { keys: ['Shift', '?'], description: 'Show this help' },
  { keys: ['Esc'], description: 'Close modal/dialog' },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="md"
    >
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center space-x-1">
              {shortcut.keys.map((key, keyIndex) => (
                <kbd
                  key={keyIndex}
                  className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
                >
                  {key}
                </kbd>
              ))}
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {shortcut.description}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}