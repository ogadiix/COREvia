import React, { useState, useEffect } from 'react';
import {
  GitFork,
  Users2,
  Building2,
  Home,
  ShieldCheck,
  Search,
  Sparkles,
  BarChart3,
  Bot,
  RefreshCw,
  ExternalLink,
  Activity,
  Layers,
} from 'lucide-react';
import { RelationshipGraph } from '../graph/RelationshipGraph';
import { bankingApi } from '../../lib/api';
import { useCopilot } from '../../context/CopilotContext';
import { useAuth } from '../../context/AuthContext';
import { GraphAnalyticsSummary } from '../../types/relationshipGraph.types';
import { ModuleType } from '../../types';

interface RelationshipGraphModuleProps {
  onNavigateToModule?: (module: ModuleType) => void;
  onNavigateToCustomer?: (cifOrId: string | number) => void;
}

const SAMPLE_CUSTOMERS = [
  { id: 1, code: 'CUS-10482', name: 'Rahul Sharma', segment: 'HNW Individual & Enterprise' },
  { id: 2, code: 'CUS-20841', name: 'Kalyan Steels & Forgings Ltd', segment: 'Corporate Banking' },
  { id: 3, code: 'CUS-30915', name: 'Meera Sundaram', segment: 'Retail Premier' },
  { id: 4, code: 'CUS-40182', name: 'Sunil Varma', segment: 'SME Commercial' },
  { id: 5, code: 'CUS-50824', name: 'Ananya Deshmukh', segment: 'Retail NRI' },
];

export const RelationshipGraphModule: React.FC<RelationshipGraphModuleProps> = ({
  onNavigateToModule,
  onNavigateToCustomer,
}) => {
  const { user } = useAuth();
  const { openDrawer } = useCopilot();

  // URL state check
  const [selectedCustomer, setSelectedCustomer] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const custParam = params.get('customerId') || params.get('entityId');
      if (custParam) {
        const found = SAMPLE_CUSTOMERS.find(
          (c) => c.code.toLowerCase() === custParam.toLowerCase() || String(c.id) === custParam
        );
        if (found) return found.id;
      }
    }
    return 1;
  });

  const [activeEntityType, setActiveEntityType] = useState<string>('CUSTOMER');
  const [activeEntityId, setActiveEntityId] = useState<string | number>(1);

  const [analytics, setAnalytics] = useState<GraphAnalyticsSummary | null>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);

  useEffect(() => {
    setActiveEntityType('CUSTOMER');
    setActiveEntityId(selectedCustomer);
  }, [selectedCustomer]);

  // Load analytics summary
  useEffect(() => {
    bankingApi
      .getRelationshipGraphAnalytics(selectedCustomer)
      .then((res) => {
        if (res) setAnalytics(res);
      })
      .catch(() => {});
  }, [selectedCustomer]);

  const activeCustomerObj = SAMPLE_CUSTOMERS.find((c) => c.id === selectedCustomer) || SAMPLE_CUSTOMERS[0];

  const handleOpenCopilot = () => {
    openDrawer({
      initialPrompt: `Show me ${activeCustomerObj.name}'s (${activeCustomerObj.code}) key relationships, connected products, opportunities, and service cases.`,
    });
  };

  return (
    <div className="space-y-5 pb-10 text-[#142C45] dark:text-[#E8EEF5]">
      {/* Top Banner & Header */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#168C83]/10 dark:bg-[#168C83]/20 border border-[#168C83]/30 text-[#168C83] dark:text-[#46C3B2] rounded-xl">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#142C45] dark:text-[#E8EEF5]">Relationship Topology & Network Intelligence</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#EDF1F5] dark:bg-[#101C2A] text-[#168C83] dark:text-[#46C3B2] border border-[#DCE3EA] dark:border-[#33485D]">
                  Entity Graph Engine
                </span>
              </div>
              <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
                Governed relationship exploration layer across customers, households, businesses, accounts, credit facilities, cases, and intelligence engines
              </p>
            </div>
          </div>

          {/* Customer Selection & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-3 py-1.5 text-xs">
              <Users2 className="w-3.5 h-3.5 text-[#5D6B7B] dark:text-[#A9BACB] mr-2" />
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(Number(e.target.value))}
                className="bg-transparent text-[#142C45] dark:text-[#E8EEF5] font-semibold focus:outline-hidden cursor-pointer pr-2"
              >
                {SAMPLE_CUSTOMERS.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#FFFFFF] dark:bg-[#162638] text-[#142C45] dark:text-[#E8EEF5]">
                    {c.name} ({c.code}) - {c.segment}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAnalyticsModal(!showAnalyticsModal)}
              className="px-3 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" />
              <span>Network Analytics</span>
            </button>

            <button
              onClick={handleOpenCopilot}
              className="px-3 py-1.5 bg-[#168C83] hover:bg-[#127069] text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Copilot</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        {analytics && (
          <div className="mt-4 pt-3 border-t border-[#DCE3EA] dark:border-[#33485D] grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg">
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase font-semibold">Total Verified Nodes</span>
              <div className="text-base font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono mt-0.5">{analytics.totalNodes}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Connected entities</span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg">
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase font-semibold">Active Connections</span>
              <div className="text-base font-bold text-[#168C83] dark:text-[#46C3B2] font-mono mt-0.5">{analytics.totalEdges}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Governed edges</span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg">
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase font-semibold">Network Degree</span>
              <div className="text-base font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono mt-0.5">{analytics.averageDegree}</div>
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Avg connections per node</span>
            </div>
            <div className="p-2.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg">
              <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase font-semibold">Central Node</span>
              <div className="text-xs font-bold text-[#142C45] dark:text-[#E8EEF5] truncate mt-1">
                {analytics.mostConnectedEntities[0]?.label || activeCustomerObj.name}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                {analytics.mostConnectedEntities[0]?.degree || 0} active links
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Relationship Graph Component */}
      <RelationshipGraph
        initialEntityType={activeEntityType}
        initialEntityId={activeEntityId}
        compact={false}
        onNavigateToModule={(module, id) => {
          if (module === 'customers' && id && onNavigateToCustomer) {
            onNavigateToCustomer(id);
          } else if (onNavigateToModule) {
            onNavigateToModule(module as ModuleType);
          } else {
            window.location.href = `/${module}`;
          }
        }}
      />

      {/* Analytics Modal */}
      {showAnalyticsModal && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl shadow-xl w-full max-w-xl p-5 space-y-4 text-xs text-[#142C45] dark:text-[#E8EEF5]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3EA] dark:border-[#33485D]">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
                <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">Network Topology & Degree Distribution</h3>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider mb-2">
                Connected Entities by Type
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(analytics.nodesByType).map(([t, count]) => (
                  <div key={t} className="p-2.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg">
                    <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">{t.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider mb-2">
                Most Connected Entities (Degree Rank)
              </h4>
              <div className="divide-y divide-[#DCE3EA] dark:divide-[#33485D] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg overflow-hidden">
                {analytics.mostConnectedEntities.map((e, idx) => (
                  <div key={e.id} className="p-2.5 flex items-center justify-between hover:bg-[#F8FAFC] dark:hover:bg-[#101C2A] transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#EDF1F5] dark:bg-[#101C2A] flex items-center justify-center font-bold text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-[#142C45] dark:text-[#E8EEF5]">{e.label}</div>
                        <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">{e.type}</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[#168C83] dark:text-[#46C3B2] bg-[#168C83]/10 dark:bg-[#168C83]/20 px-2 py-0.5 rounded text-xs">
                      {e.degree} connections
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#DCE3EA] dark:border-[#33485D] flex justify-end">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] font-medium rounded text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
