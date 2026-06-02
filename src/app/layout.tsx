import type { Metadata } from 'next';
import '@/styles/globals.scss';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'Tiny Universe — Your Memory Galaxy',
  description:
    'A shared digital universe where every memory becomes a planet floating in space. Create, explore, and cherish your memories in a beautiful starfield.',
  keywords: ['memories', 'universe', 'space', 'journal', 'personal'],
  openGraph: {
    title: 'Tiny Universe — Your Memory Galaxy',
    description: 'Every memory is a planet. Explore your universe.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#0B1120',
              color: '#FFFFFF',
              border: '1px solid #1E293B',
              borderRadius: '10px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#8B5CF6',
                secondary: '#0B1120',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#0B1120',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
