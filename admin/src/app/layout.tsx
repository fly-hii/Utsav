import '../styles/globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Utsav Admin Portal – Village Festival Management',
  description: 'Super Admin Portal for managing village festival committees, events, donations, expenses, and reels moderation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-festival-background text-festival-dark antialiased selection:bg-festival-orange selection:text-white">
        {children}
      </body>
    </html>
  );
}
