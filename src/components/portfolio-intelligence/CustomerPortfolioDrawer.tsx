import React from 'react';
import {
  X,
  ExternalLink,
  Shield,
  Activity,
  Layers,
  Phone,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Clock,
  Briefcase,
  Network,
} from 'lucide-react';
import { CustomerPortfolioProfileDTO } from '../../types/portfolioIntelligence.types';

interface CustomerPortfolioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerPortfolioProfileDTO | null;
  isLoading?: boolean;
  onNavigateToCustomer?: (customerId: number) => void;
  onNavigateToTwin?: (customerId: number) => void;
}

export const CustomerPortfolioDrawer: React.FC<CustomerPortfolioDrawerProps> = ({
  isOpen,
  onClose,
  profile,
  isLoading = false,
  onNavigateToCustomer,
  onNavigateToTwin,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-700/80 h-full flex flex-col shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-850/60 flex items-start justify-between">
          {isLoading || !profile ? (
            <div className="animate-pulse space-y-2">
              <div className="h-5 w-48 bg-slate-800 rounded"></div>
              <div className="h-3 w-32 bg-slate-800 rounded"></div>
            </div>
          ) : (
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-slate-100">{profile.customer.name}</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  {profile.customer.customerCode}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
                <span>{profile.customer.entityType}</span>
                <span>•</span>
                <span>Risk: {profile.customer.riskCategory}</span>
                <span>•</span>
                <span className="font-mono text-[11px]">CIF: {profile.customer.cifNumber}</span>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {profile && (
              <>
                <button
                  onClick={() => onNavigateToCustomer?.(profile.customer.id)}
                  title="Open Customer 360"
                  className="px-2.5 py-1 text-xs rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 flex items-center space-x-1.5 transition-colors"
                >
                  <span>Customer 360</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateToTwin?.(profile.customer.id)}
                  title="Open Relationship Twin"
                  className="px-2.5 py-1 text-xs rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 flex items-center space-x-1.5 transition-colors"
                >
                  <Network className="w-3.5 h-3.5" />
                  <span>Twin</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isLoading || !profile ? (
            <div className="flex items-center justify-center py-20 text-slate-500">
              <Clock className="w-6 h-6 animate-spin mr-2" />
              <span>Loading relationship profile...</span>
            </div>
          ) : (
            <>
              {/* Core Relationship Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">Relationship Value</div>
                  <div className="text-base font-bold text-emerald-400 font-mono mt-1">
                    ₹{(profile.metrics.relationshipValue / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Direct holdings & credit facilities</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 font-medium">CORE Score & Momentum</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-base font-bold text-indigo-300 font-mono">
                      {profile.metrics.coreScore} / 1000
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center space-x-1 ${
                        profile.metrics.momentum === 'POSITIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : profile.metrics.momentum === 'NEGATIVE'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {profile.metrics.momentum === 'POSITIVE' && <TrendingUp className="w-2.5 h-2.5" />}
                      {profile.metrics.momentum === 'NEGATIVE' && <TrendingDown className="w-2.5 h-2.5" />}
                      {profile.metrics.momentum === 'STABLE' && <Minus className="w-2.5 h-2.5" />}
                      <span>{profile.metrics.momentum}</span>
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Canonical intelligence engine</div>
                </div>
              </div>

              {/* Products Held */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span>Product Penetration & Depth ({profile.products.length})</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Depth Score: {profile.metrics.productDepth}</span>
                </div>
                {profile.products.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No active products recorded.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {profile.products.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between"
                      >
                        <div className="text-xs font-medium text-slate-200 truncate">{p.productName}</div>
                        <div className="flex items-center justify-between mt-1.5 text-[10px]">
                          <span className="text-slate-400">{p.category}</span>
                          <span className="font-mono text-emerald-400">
                            {p.balance ? `₹${(p.balance / 1000).toFixed(0)}k` : 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Engagement & Touchpoints */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                    <Phone className="w-4 h-4 text-emerald-400" />
                    <span>Engagement Recency</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Last: {profile.engagement.lastInteractionDate || 'Never logged'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Touchpoints</span>
                    <span className="font-bold text-slate-100">{profile.engagement.totalInteractions}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Days Since Last Contact</span>
                    <span
                      className={`font-bold ${
                        (profile.engagement.daysSinceLastInteraction || 0) > 45
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {profile.engagement.daysSinceLastInteraction !== null
                        ? `${profile.engagement.daysSinceLastInteraction} days`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Desk & SLA */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>Service Quality & SLA Health</span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                      profile.serviceQuality.openCasesCount === 0
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {profile.serviceQuality.openCasesCount} Open Cases
                  </span>
                </div>
                {profile.serviceQuality.slaAtRiskCount > 0 && (
                  <div className="p-2 rounded bg-rose-950/30 border border-rose-800/40 text-[11px] text-rose-300 flex items-center space-x-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{profile.serviceQuality.slaAtRiskCount} service cases currently at risk of SLA breach.</span>
                  </div>
                )}
              </div>

              {/* Next Best Actions */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Available Next Best Actions ({profile.nextBestActions.length})</span>
                </div>
                {profile.nextBestActions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No outstanding Next Best Actions for this customer.</p>
                ) : (
                  <div className="space-y-2">
                    {profile.nextBestActions.map((nba) => (
                      <div
                        key={nba.id}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-purple-300">{nba.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-300 border border-purple-700/40 font-mono">
                            {nba.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300">{nba.rationale}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Signals */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>Active Relationship Signals ({profile.signals.length})</span>
                </div>
                {profile.signals.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No active signals registered.</p>
                ) : (
                  <div className="space-y-2">
                    {profile.signals.map((sig) => (
                      <div
                        key={sig.id}
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-2"
                      >
                        <AlertTriangle
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            sig.severity === 'CRITICAL'
                              ? 'text-rose-400'
                              : sig.severity === 'HIGH'
                              ? 'text-amber-400'
                              : 'text-blue-400'
                          }`}
                        />
                        <div className="space-y-0.5">
                          <div className="text-xs font-medium text-slate-200">{sig.headline}</div>
                          <p className="text-[11px] text-slate-400">{sig.evidence}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850/60 flex items-center justify-between text-xs text-slate-400">
          <span>Authorized Banking RM View</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
