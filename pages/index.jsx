import React, { useCallback, useState, useEffect } from 'react';
import useOrderSchema from '../hooks/useOrderSchema';
import OrderRenderer from '../OrderRenderer';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/layout/HeroSection';
import HowItWorksSection from '../components/layout/HowItWorksSection';
import RequestInput from '../components/RequestInput';
import { OrderConfirmation } from '../components/ui';
import restaurants from '../data/restaurants.json';
import menus from '../data/menus.json';

const VIEWS = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  RESULT: 'RESULT',
  CONFIRMED: 'CONFIRMED',
  ERROR: 'ERROR',
};

export default function HomePage() {
  const {
    schema,
    isLoading,
    error,
    submitRequest,
    reset,
  } = useOrderSchema(restaurants, menus);

  const [currentView, setCurrentView] = useState(VIEWS.IDLE);

  useEffect(() => {
    if (isLoading) {
      setCurrentView(VIEWS.LOADING);
    } else if (error) {
      setCurrentView(VIEWS.ERROR);
    } else if (schema) {
      setCurrentView(VIEWS.RESULT);
    }
  }, [isLoading, error, schema]);

  const handleSubmit = useCallback(async (requestText) => {
    if (!requestText.trim()) return;
    await submitRequest(requestText);
  }, [submitRequest]);

  const handleStartOver = useCallback(() => {
    reset();
    setCurrentView(VIEWS.IDLE);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reset]);

  const handleCheckout = useCallback(() => {
    setCurrentView(VIEWS.CONFIRMED);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isResult = currentView === VIEWS.RESULT || currentView === VIEWS.CONFIRMED || currentView === VIEWS.LOADING;
  const hasResults = Boolean(schema) && currentView !== VIEWS.IDLE && currentView !== VIEWS.ERROR;

  return (
    <div className="min-h-screen bg-white">
      <Navbar view={currentView} onStartOver={handleStartOver} />
      <div className="h-14" />

      <main>
        <HeroSection isCompact={isResult}>
          <RequestInput
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
          {error && currentView === VIEWS.ERROR && (
            <p className="mt-3 text-[14px] text-[#DC2626]">{error}</p>
          )}
        </HeroSection>

        {currentView === VIEWS.CONFIRMED && (
          <OrderConfirmation
            schema={schema}
            restaurants={restaurants}
            onStartNewOrder={handleStartOver}
          />
        )}

        {currentView === VIEWS.RESULT && hasResults && (
          <OrderRenderer
            schema={schema}
            restaurants={restaurants}
            menus={menus}
            onCheckout={handleCheckout}
          />
        )}

        {!hasResults && currentView !== VIEWS.CONFIRMED && <HowItWorksSection />}
      </main>

      {/* Footer */}
      {(currentView === VIEWS.IDLE || currentView === VIEWS.LOADING || currentView === VIEWS.ERROR) && (
        <footer className="border-t border-[#EFEFED] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-[14px] text-[#6B6B67] font-medium">Ordr</span>
              <span className="text-[14px] text-[#9A9A96]">Built with Generative UI</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
