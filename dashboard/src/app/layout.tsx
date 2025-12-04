import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';
import { QueryProvider } from '@/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CCG Dashboard',
  description: 'Claude Code Guardian - Web Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider>
            <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
              <Sidebar />
              <main className="flex-1 p-4 lg:p-8 lg:ml-0 pt-16 lg:pt-8">
                <div className="max-w-7xl mx-auto fade-in">
                  {children}
                </div>
              </main>
            </div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
