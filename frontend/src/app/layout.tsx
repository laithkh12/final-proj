import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/providers/AppProviders';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'TeamFlow — Team Project Management',
  description: 'Collaborate, manage projects, assign tasks, and track team activity.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="h-dvh overflow-hidden font-sans antialiased">
        <AppProviders>
          <div className="flex h-dvh min-h-0 w-full max-w-full flex-col overflow-hidden">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
