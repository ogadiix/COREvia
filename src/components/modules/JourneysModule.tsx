import React, { useState, useEffect } from 'react';
import { PortfolioJourneysView } from '../journeys/PortfolioJourneysView';
import { CustomerJourneyWorkspace } from '../journeys/CustomerJourneyWorkspace';

interface JourneysModuleProps {
  onNavigateToCustomer?: (customerId: number | string) => void;
}

export const JourneysModule: React.FC<JourneysModuleProps> = ({ onNavigateToCustomer }) => {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | number | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('id') || null;
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSelectedJourneyId(params.get('id') || null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectJourney = (id: string | number) => {
    setSelectedJourneyId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('id', String(id));
    window.history.pushState({}, '', url.toString());
  };

  const handleBackToPortfolio = () => {
    setSelectedJourneyId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {selectedJourneyId ? (
        <CustomerJourneyWorkspace
          journeyId={selectedJourneyId}
          onBack={handleBackToPortfolio}
          onNavigateToCustomer={onNavigateToCustomer}
        />
      ) : (
        <PortfolioJourneysView
          onSelectJourney={handleSelectJourney}
          onNavigateToCustomer={onNavigateToCustomer}
        />
      )}
    </div>
  );
};
