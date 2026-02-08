import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'JanSunwai AI - The People\'s Grievance Platform',
  description: 'AI-powered civic grievance resolution platform for Indian citizens',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
