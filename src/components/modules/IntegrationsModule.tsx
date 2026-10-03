/**
 * COREvia Phase 38: Enterprise Integration Module
 * Module entry point rendering IntegrationsWorkspace.
 */

import React from 'react';
import { IntegrationsWorkspace } from '../integrations/IntegrationsWorkspace.tsx';

export const IntegrationsModule: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto animate-fadeIn">
      <IntegrationsWorkspace />
    </div>
  );
};
