'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import KeyboardShortcutsModal from '@/components/ui/KeyboardShortcutsModal';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '🏠' },
  { href: '/devices', label: 'Devices', icon: '🤖' },
  { href: '/flows', label: 'Flows', icon: '📊' },
  { href: '/system', label: 'System', icon: '🔧' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts([
    { key: '?', shift: true, action: () => setShowShortcuts(true), description: 'Show keyboard shortcuts' },
  ]);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md dark:shadow-gray-900/50 transition-colors" role="navigation" aria-label="Main navigation">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center" aria-label="Tafy Studio Home">
              <span className="text-2xl font-bold text-tafy-700 dark:text-tafy-400">
                Tafy Studio
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-tafy-100 dark:bg-tafy-900 text-tafy-900 dark:text-tafy-100'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-tafy-50 dark:hover:bg-tafy-800 hover:text-tafy-900 dark:hover:text-tafy-100'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <span className="mr-2">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Help Button */}
            <button
              data-help-button
              onClick={() => setShowShortcuts(true)}
              className="hidden md:block p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              title="Keyboard shortcuts (Shift + ?)"
              aria-label="Show keyboard shortcuts"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Status:</span>
              <span className="flex items-center">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse mr-1" aria-hidden="true"></span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Connected
                </span>
              </span>
            </div>
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMenuOpen ? (
                  <path d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-tafy-100 dark:bg-tafy-900 text-tafy-900 dark:text-tafy-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-tafy-50 dark:hover:bg-tafy-800 hover:text-tafy-900 dark:hover:text-tafy-100'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setShowShortcuts(true);
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-tafy-50 dark:hover:bg-tafy-800 hover:text-tafy-900 dark:hover:text-tafy-100 transition-colors"
              >
                <span className="mr-2">❓</span>
                Keyboard Shortcuts
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </nav>
  );
}
