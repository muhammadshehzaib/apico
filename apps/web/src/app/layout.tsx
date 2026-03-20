import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Apico',
    template: '%s | Apico',
  },
  description: 'Open-source REST API testing tool. Test, debug, and document your APIs with ease.',
  keywords: ['API', 'REST', 'testing', 'HTTP', 'debug'],
  authors: [{ name: 'Apico' }],
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'Apico',
    description: 'Open-source REST API testing tool',
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
      <body className="bg-bg-primary text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}
