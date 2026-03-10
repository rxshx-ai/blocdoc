import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import Sidebar from '@/components/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import ClientDNAWrapper from '@/components/ClientDNAWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Halo Logistics Platform',
  description: 'Decentralized Healthcare Logistics',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased selection:bg-blue-200 selection:text-blue-900`}>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          <AuthProvider>
            <ClientDNAWrapper />
            <div className="flex relative z-10 h-screen w-full overflow-hidden">
              <Sidebar />
              <main className="flex-1 h-full overflow-y-auto w-full p-4 lg:p-8">
                {children}
              </main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
