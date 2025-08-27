import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/layout/Navigation';
import Footer from '@/components/layout/Footer';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import FeedbackWidget from '@/components/ui/FeedbackWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Tafy Studio Hub',
  description: 'Robot Distributed Operation System Control Hub',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          {/* Skip to content link for screen readers */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-tafy-600 text-white px-4 py-2 rounded-md z-50"
          >
            Skip to main content
          </a>
          <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Navigation />
            <main id="main-content" className="flex-grow">{children}</main>
            <Footer />
          </div>
          <FeedbackWidget />
        </ThemeProvider>
      </body>
    </html>
  );
}
