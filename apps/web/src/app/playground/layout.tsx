import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Playground',
  description:
    'Test REST APIs instantly. No signup required. The fastest free online API tester.',
  keywords: [
    'api tester',
    'rest api',
    'postman alternative',
    'online api testing',
    'free api tester',
    'curl tester',
  ],
  openGraph: {
    title: 'Apico — Free Online API Tester',
    description: 'Test REST APIs instantly. No signup required.',
    type: 'website',
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-bg-primary">{children}</div>;
}
