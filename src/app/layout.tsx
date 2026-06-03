import type { Metadata } from 'next';
import '@/styles/globals.scss';
import { Toaster } from 'react-hot-toast';
import { CONTENT } from '@/lib/content';

export const metadata: Metadata = {
  title: CONTENT.metadata.layout.title,
  description: CONTENT.metadata.layout.description,
  keywords: [...CONTENT.metadata.layout.keywords],
  openGraph: {
    title: CONTENT.metadata.layout.openGraph.title,
    description: CONTENT.metadata.layout.openGraph.description,
    type: CONTENT.metadata.layout.openGraph.type,
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
