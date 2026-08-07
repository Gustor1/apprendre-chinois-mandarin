import './globals.css';
import type { Metadata } from 'next';
import AppLayout from '@/components/AppLayout';
import { ClerkProvider } from '@clerk/nextjs';

export const metadata: Metadata = {
  title: 'Chinois Mandarin — Session Quotidienne 15 min & SRS',
  description: 'Application d’apprentissage du mandarin oral, structurée autour du HSK 3.0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="fr">
        <body>
          <AppLayout>{children}</AppLayout>
        </body>
      </html>
    </ClerkProvider>
  );
}
