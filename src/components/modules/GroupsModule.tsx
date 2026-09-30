import React, { useState, useEffect } from 'react';
import { PortfolioGroupsView } from '../groups/PortfolioGroupsView';
import { GroupWorkspace } from '../groups/GroupWorkspace';

interface GroupsModuleProps {
  onNavigateToCustomer?: (customerId: number | string) => void;
  onNavigateToGraph?: (groupId: string) => void;
  onNavigateToJourney?: (journeyId: number | string) => void;
}

export const GroupsModule: React.FC<GroupsModuleProps> = ({
  onNavigateToCustomer,
  onNavigateToGraph,
  onNavigateToJourney,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const groupMatch = pathname.match(/^\/group\/([^/?#]+)/);
      if (groupMatch && groupMatch[1]) {
        return groupMatch[1];
      }
      const params = new URLSearchParams(window.location.search);
      return params.get('id') || null;
    }
    return null;
  });

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const groupMatch = pathname.match(/^\/group\/([^/?#]+)/);
      if (groupMatch && groupMatch[1]) {
        setSelectedGroupId(groupMatch[1]);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      setSelectedGroupId(params.get('id') || null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectGroup = (id: string) => {
    setSelectedGroupId(id);
    const url = new URL(window.location.href);
    url.searchParams.set('id', id);
    window.history.pushState({}, '', url.toString());
  };

  const handleBackToPortfolio = () => {
    setSelectedGroupId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {selectedGroupId ? (
        <GroupWorkspace
          groupId={selectedGroupId}
          onBack={handleBackToPortfolio}
          onNavigateToCustomer={onNavigateToCustomer}
          onNavigateToGraph={onNavigateToGraph}
          onNavigateToJourney={onNavigateToJourney}
        />
      ) : (
        <PortfolioGroupsView onSelectGroup={handleSelectGroup} />
      )}
    </div>
  );
};

export default GroupsModule;
