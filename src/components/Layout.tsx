import type { ReactNode } from 'react';
import Sidebar from '@/components/Sidebar';
import RitualBanner from '@/components/RitualBanner';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50">
      <Sidebar />
      <div className="md:pl-64">
        <main className="min-h-screen">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
            <RitualBanner />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
