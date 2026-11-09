import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AppRoutes } from './routes/AppRoutes';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { CartProvider } from './context/CartContext';
import { CartDrawer } from './components/cart/CartDrawer';
import { WhatsAppButton } from './components/common/WhatsAppButton';
import { OfferPopup } from './components/offers/OfferPopup';
import { ScrollObserver } from './components/common/ScrollObserver';
import { SEOManager } from './components/common/SEOManager';

import { useAuth } from './context/AuthContext';

const AppContent: React.FC = () => {
  const location = useLocation();
  const { isLoggedIn } = useAuth();

  // Determine if current route is part of the authenticated portal application shell
  const isAppRoute = 
    location.pathname.startsWith('/student') ||
    location.pathname.startsWith('/instructor') ||
    location.pathname.startsWith('/admin');

  // Video learning player is also a specialized view
  const isLearnPlayer = location.pathname.startsWith('/learn/');

  // Suppress public marketing chrome (Navbar, Footer, popups) for app routes and learning player
  const showPublicChrome = !isAppRoute && !isLearnPlayer;

  if (!showPublicChrome) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#FAF6F0] text-[#2B2521]">
        <SEOManager />
        <AppRoutes />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#2B2521]">
      <SEOManager />
      <ScrollObserver />
      
      {/* Public Marketing Header */}
      <Navbar />
      
      <CartDrawer />
      
      <main key={location.pathname} className="flex-grow route-fade">
        <AppRoutes />
      </main>

      {/* Public Marketing Footer */}
      <Footer />

      {/* WhatsApp Support Button - only shown on public website for visitors */}
      {!isLoggedIn && <WhatsAppButton />}

      {/* Promotional Campaign Popup - only shown on public marketing pages */}
      <OfferPopup />
    </div>
  );
};

export function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <SettingsProvider>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </SettingsProvider>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
