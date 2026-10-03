import React from 'react';
import { PortfolioIntelligenceWorkspace } from '../portfolio-intelligence/PortfolioIntelligenceWorkspace';

interface PortfolioIntelligenceModuleProps {
  onNavigateToCustomer?: (customerId: number) => void;
  onNavigateToTwin?: (customerId: number) => void;
  onNavigateToModule?: (module: string) => void;
}

export const PortfolioIntelligenceModule: React.FC<PortfolioIntelligenceModuleProps> = ({
  onNavigateToCustomer,
  onNavigateToTwin,
  onNavigateToModule,
}) => {
  return (
    <div className="w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <PortfolioIntelligenceWorkspace
        onNavigateToCustomer={onNavigateToCustomer}
        onNavigateToTwin={onNavigateToTwin}
        onNavigateToModule={onNavigateToModule}
      />
    </div>
  );
};
