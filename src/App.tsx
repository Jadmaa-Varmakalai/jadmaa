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
  const isLearnPlayer = location.pathname.startsWith('/learn/');
  const { isLoggedIn } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6F0] text-[#2B2521]">
      <SEOManager />
      <ScrollObserver />
      {!isLearnPlayer && <Navbar />}
      <CartDrawer />
      <main key={location.pathname} className="flex-grow route-fade">
        <AppRoutes />
      </main>
      {!isLearnPlayer && <Footer />}
      {!isLoggedIn && <WhatsAppButton />}
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
