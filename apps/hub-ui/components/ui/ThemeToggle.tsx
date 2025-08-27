'use client';

import { useTheme } from '@/components/providers/ThemeProvider';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => {
        const themes: Array<'light' | 'dark' | 'system'> = [
          'light',
          'dark',
          'system',
        ];
        const currentIndex = themes.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
      }}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-700 dark:text-gray-300"
        >
          <path
            d="M10 2V4M10 16V18M4 10H2M6.31412 6.31412L4.8999 4.8999M13.6859 6.31412L15.1001 4.8999M6.31412 13.6859L4.8999 15.1001M13.6859 13.6859L15.1001 15.1001M18 10H16M14 10C14 12.2091 12.2091 14 10 14C7.79086 14 6 12.2091 6 10C6 7.79086 7.79086 6 10 6C12.2091 6 14 7.79086 14 10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {theme === 'dark' && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-700 dark:text-gray-300"
        >
          <path
            d="M17 10.5C17 14.6421 13.6421 18 9.5 18C5.35786 18 2 14.6421 2 10.5C2 6.35786 5.35786 3 9.5 3C9.66848 3 9.8363 3.00509 10.003 3.01523C9.37107 4.10708 9 5.36269 9 6.7C9 10.3137 11.6863 13 15.3 13C16.6373 13 17.8929 12.6289 18.9848 11.997C18.9949 12.1637 19 12.3315 19 12.5C19 13.5544 18.6044 14.5134 17.9448 15.2285C17.6198 14.5116 17 14 16.5 14C15.6716 14 15 14.6716 15 15.5C15 16 15.4884 16.3802 16.2285 16.7052C15.5134 17.3648 14.5544 17.76 13.5 17.76C13.3315 17.76 13.1637 17.7549 12.997 17.7448Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {theme === 'system' && (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-gray-700 dark:text-gray-300"
        >
          <path
            d="M4 6C4 4.89543 4.89543 4 6 4H14C15.1046 4 16 4.89543 16 6V13C16 14.1046 15.1046 15 14 15H6C4.89543 15 4 14.1046 4 13V6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 17H12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 15V17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
