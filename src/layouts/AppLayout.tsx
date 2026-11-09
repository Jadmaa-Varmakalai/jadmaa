import React, { useState } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#FAF6F0]">
      {/* Static Persistent Sidebar (Desktop: pinned 256px flex sibling; Mobile: off-canvas drawer) */}
      <AppSidebar
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      {/* Main App Area: Fixed Header + Independently Scrollable Page Body */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <AppHeader onOpenSidebar={() => setIsMobileOpen(true)} />

        {/* Content Body: ONLY this container scrolls when scrolling page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

