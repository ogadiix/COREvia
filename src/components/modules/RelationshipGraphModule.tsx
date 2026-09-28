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
import { RelationshipGraph } from '../graph/RelationshipGraph.tsx';
import { bankingApi } from '../../lib/api.ts';
import { useCopilot } from '../../context/CopilotContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { GraphAnalyticsSummary } from '../../types/relationshipGraph.types.ts';

const SAMPLE_CUSTOMERS = [
  { id: 1, code: 'CUS-10482', name: 'Rahul Sharma', segment: 'HNW Individual & Enterprise' },
  { id: 2, code: 'CUS-20841', name: 'Kalyan Steels & Forgings Ltd', segment: 'Corporate Banking' },
  { id: 3, code: 'CUS-30915', name: 'Meera Sundaram', segment: 'Retail Premier' },
  { id: 4, code: 'CUS-40182', name: 'Sunil Varma', segment: 'SME Commercial' },
  { id: 5, code: 'CUS-50824', name: 'Ananya Deshmukh', segment: 'Retail NRI' },
];

export const RelationshipGraphModule: React.FC = () => {
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
    <div className="space-y-5 pb-10">
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Relationship Graph & Network Intelligence</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Phase 28 Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Governed relationship exploration layer across customers, households, businesses, accounts, loans, cases, and intelligence engines
              </p>
            </div>
          </div>

          {/* Customer Selection & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
              <Users2 className="w-3.5 h-3.5 text-slate-400 mr-2" />
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(Number(e.target.value))}
                className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer pr-2"
              >
                {SAMPLE_CUSTOMERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.segment}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowAnalyticsModal(!showAnalyticsModal)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5 text-slate-600" />
              <span>Network Analytics</span>
            </button>

            <button
              onClick={handleOpenCopilot}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-xs"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Copilot</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Strip */}
        {analytics && (
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Verified Nodes</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{analytics.totalNodes}</div>
              <span className="text-[10px] text-slate-400">Connected entities</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Active Connections</span>
              <div className="text-base font-bold text-indigo-700 font-mono mt-0.5">{analytics.totalEdges}</div>
              <span className="text-[10px] text-slate-400">Governed edges</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Network Degree</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">{analytics.averageDegree}</div>
              <span className="text-[10px] text-slate-400">Avg connections per node</span>
            </div>
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[10px] text-slate-500 uppercase font-semibold">Top Entity</span>
              <div className="text-xs font-bold text-slate-900 truncate mt-1">
                {analytics.mostConnectedEntities[0]?.label || activeCustomerObj.name}
              </div>
              <span className="text-[10px] text-emerald-700 font-medium">
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
          if (module === 'customers') {
            window.location.href = `/customers?cif=${id}`;
          } else {
            window.location.href = `/${module}`;
          }
        }}
      />

      {/* Analytics Modal */}
      {showAnalyticsModal && analytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-2xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Network Intelligence & Degree Distribution</h3>
              </div>
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Connected Entities by Type
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(analytics.nodesByType).map(([t, count]) => (
                  <div key={t} className="p-2 bg-slate-50 border border-slate-200 rounded">
                    <div className="text-[10px] text-slate-500">{t.replace(/_/g, ' ')}</div>
                    <div className="text-sm font-bold text-slate-900 font-mono">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Most Connected Entities (Degree Rank)
              </h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded overflow-hidden">
                {analytics.mostConnectedEntities.map((e, idx) => (
                  <div key={e.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">{e.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{e.type}</div>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-xs">
                      {e.degree} connections
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowAnalyticsModal(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded text-xs"
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
