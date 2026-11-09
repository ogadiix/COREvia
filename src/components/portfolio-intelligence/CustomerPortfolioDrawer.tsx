import React, { useEffect, useRef } from 'react';
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
  Clock,
  Network,
} from 'lucide-react';
import { CustomerPortfolioProfileDTO } from '../../types/portfolioIntelligence.types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { zIndex } from '../common/tokens';

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
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;

      const timer = setTimeout(() => {
        if (drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        } else if (e.key === 'Tab' && drawerRef.current) {
          const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyDown);
        if (previouslyFocusedRef.current) {
          previouslyFocusedRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{ zIndex: zIndex.drawer }}
      className="fixed inset-0 overflow-hidden select-none"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] motion-fade-in"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Customer Portfolio Profile"
          className="w-full sm:w-[540px] md:w-[600px] max-w-full bg-[#F5F7FA] dark:bg-[#0F1B2A] border-l border-[#CBD5E1] dark:border-[#33485D] shadow-2xl flex flex-col h-full overflow-hidden motion-drawer-right"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#33485D] bg-[#FFFFFF] dark:bg-[#162638] flex items-start justify-between shrink-0 shadow-2xs">
            {isLoading || !profile ? (
              <div className="animate-pulse space-y-2">
                <div className="h-5 w-48 bg-[#E2E8F0] dark:bg-[#26394C] rounded-xs" />
                <div className="h-3 w-32 bg-[#E2E8F0] dark:bg-[#26394C] rounded-xs" />
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight uppercase truncate">
                    {profile.customer.name}
                  </h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-[#F0FDFA] dark:bg-[#168C83]/20 border border-[#CCFBF1] dark:border-[#168C83]/40 text-[#087F8C] dark:text-[#46C3B2] font-semibold shrink-0">
                    {profile.customer.customerCode}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B] dark:text-[#A9BACB]">
                  <span>{profile.customer.entityType}</span>
                  <span>•</span>
                  <span>Risk: {profile.customer.riskCategory}</span>
                  <span>•</span>
                  <span className="font-mono text-[11px]">CIF: {profile.customer.cifNumber}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              {profile && (
                <>
                  <Button
                    variant="brand"
                    size="xs"
                    onClick={() => onNavigateToCustomer?.(profile.customer.id)}
                    icon={<ExternalLink className="w-3 h-3" />}
                    iconPosition="right"
                    title="Open Customer 360"
                  >
                    Customer 360
                  </Button>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => onNavigateToTwin?.(profile.customer.id)}
                    icon={<Network className="w-3 h-3" />}
                    title="Open Relationship Twin"
                  >
                    Twin
                  </Button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-xs text-[#64748B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] hover:bg-[#F1F5F9] dark:hover:bg-[#26394C] transition-colors cursor-pointer ml-1"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {isLoading || !profile ? (
              <div className="flex items-center justify-center py-20 text-[#64748B] dark:text-[#A9BACB] gap-2">
                <Clock className="w-5 h-5 animate-spin text-[#087F8C] dark:text-[#46C3B2]" />
                <span className="text-xs font-medium">Loading relationship profile...</span>
              </div>
            ) : (
              <>
                {/* Core Relationship Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-sm bg-[#FFFFFF] dark:bg-[#162638] border border-[#CBD5E1] dark:border-[#33485D] shadow-2xs">
                    <div className="text-[11px] text-[#64748B] dark:text-[#A9BACB] font-semibold uppercase tracking-wider">
                      Relationship Value
                    </div>
                    <div className="text-lg font-bold text-[#16803C] dark:text-emerald-400 font-mono mt-1">
                      ₹{(profile.metrics.relationshipValue / 100000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L
                    </div>
                    <div className="text-[10px] text-[#94A3B8] dark:text-slate-400 mt-0.5">Direct holdings & credit facilities</div>
                  </div>

                  <div className="p-3.5 rounded-sm bg-[#FFFFFF] dark:bg-[#162638] border border-[#CBD5E1] dark:border-[#33485D] shadow-2xs">
                    <div className="text-[11px] text-[#64748B] dark:text-[#A9BACB] font-semibold uppercase tracking-wider">
                      CORE Score & Momentum
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-[#087F8C] dark:text-[#46C3B2] font-mono">
                        {profile.metrics.coreScore} / 1000
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-xs font-semibold flex items-center gap-1 ${
                          profile.metrics.momentum === 'POSITIVE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : profile.metrics.momentum === 'NEGATIVE'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {profile.metrics.momentum === 'POSITIVE' && <TrendingUp className="w-2.5 h-2.5" />}
                        {profile.metrics.momentum === 'NEGATIVE' && <TrendingDown className="w-2.5 h-2.5" />}
                        {profile.metrics.momentum === 'STABLE' && <Minus className="w-2.5 h-2.5" />}
                        <span>{profile.metrics.momentum}</span>
                      </span>
                    </div>
                    <div className="text-[10px] text-[#94A3B8] dark:text-slate-400 mt-0.5">Canonical intelligence engine</div>
                  </div>
                </div>

                {/* Products Held */}
                <div className="p-4 rounded-sm bg-[#FFFFFF] dark:bg-[#162638] border border-[#CBD5E1] dark:border-[#33485D] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#142C45] dark:text-[#E8EEF5] uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-[#087F8C] dark:text-[#46C3B2]" />
                      <span>Product Penetration & Depth ({profile.products.length})</span>
                    </div>
                    <span className="text-[11px] text-[#64748B] dark:text-[#A9BACB] font-medium">Depth Score: {profile.metrics.productDepth}</span>
                  </div>
                  {profile.products.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] dark:text-slate-400 italic">No active products recorded.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {profile.products.map((p, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xs bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#E2E8F0] dark:border-[#26394C] flex flex-col justify-between"
                        >
                          <div className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5] truncate">{p.productName}</div>
                          <div className="flex items-center justify-between mt-1 text-[11px]">
                            <span className="text-[#64748B] dark:text-[#A9BACB]">{p.category}</span>
                            <span className="font-mono font-semibold text-[#16803C] dark:text-emerald-400">
                              {p.balance ? `₹${(p.balance / 1000).toFixed(0)}k` : 'Active'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Engagement & Touchpoints */}
                <div className="p-4 rounded-sm bg-[#FFFFFF] dark:bg-[#162638] border border-[#CBD5E1] dark:border-[#33485D] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#142C45] dark:text-[#E8EEF5] uppercase tracking-wider">
                      <Phone className="w-4 h-4 text-[#16803C] dark:text-emerald-400" />
                      <span>Engagement Recency</span>
                    </div>
                    <span className="text-[11px] text-[#64748B] dark:text-[#A9BACB] font-mono">
                      Last: {profile.engagement.lastInteractionDate || 'Never logged'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xs bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#E2E8F0] dark:border-[#26394C]">
                      <span className="text-[10px] text-[#64748B] dark:text-[#A9BACB] uppercase font-semibold block">Total Touchpoints</span>
                      <span className="font-bold text-[#142C45] dark:text-[#E8EEF5] text-sm mt-0.5 block">{profile.engagement.totalInteractions}</span>
                    </div>
                    <div className="p-2.5 rounded-xs bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#E2E8F0] dark:border-[#26394C]">
                      <span className="text-[10px] text-[#64748B] dark:text-[#A9BACB] uppercase font-semibold block">Days Since Last Contact</span>
                      <span
                        className={`font-bold text-sm mt-0.5 block ${
                          (profile.engagement.daysSinceLastInteraction || 0) > 45
                            ? 'text-[#B42318] dark:text-rose-400'
                            : 'text-[#16803C] dark:text-emerald-400'
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
                <div className="p-4 rounded-sm bg-[#FFFFFF] dark:bg-[#162638] border border-[#CBD5E1] dark:border-[#33485D] space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#142C45] dark:text-[#E8EEF5] uppercase tracking-wider">
                      <Shield className="w-4 h-4 text-[#B45309] dark:text-amber-400" />
                      <span>Service Quality & SLA Health</span>
                    </div>
                    <Badge
                      variant={profile.serviceQuality.openCasesCount === 0 ? 'success' : 'warning'}
                      size="sm"
                    >
                      {profile.serviceQuality.openCasesCount} Open Cases
                    </Badge>
                  </div>
                  {profile.serviceQuality.slaAtRiskCount > 0 && (
                    <div className="p-2.5 rounded-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#B42318] dark:text-rose-400 shrink-0" />
                      <span>{profile.serviceQuality.slaAtRiskCount} service cases currently at risk of SLA breach.</span>
                    </div>
                  )}
                </div>

                {/* Next Best Actions */}
                <div className="p-4 rounded-sm bg-[#FFFFFF] dark:bg-[#162638] border border-[#CBD5E1] dark:border-[#33485D] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#142C45] dark:text-[#E8EEF5] uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#087F8C] dark:text-[#46C3B2]" />
                    <span>Available Next Best Actions ({profile.nextBestActions.length})</span>
                  </div>
                  {profile.nextBestActions.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] dark:text-slate-400 italic">No outstanding Next Best Actions for this customer.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.nextBestActions.map((nba) => (
                        <div
                          key={nba.id}
                          className="p-3 rounded-xs bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#E2E8F0] dark:border-[#26394C] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">{nba.title}</span>
                            <Badge
                              variant={
                                nba.priority === 'CRITICAL'
                                  ? 'danger'
                                  : nba.priority === 'HIGH'
                                  ? 'warning'
                                  : 'info'
                              }
                              size="sm"
                            >
                              {nba.priority}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-[#64748B] dark:text-[#A9BACB] leading-relaxed">{nba.rationale}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Active Signals */}
                <div className="p-4 rounded-sm bg-[#FFFFFF] dark:bg-[#162638] border border-[#CBD5E1] dark:border-[#33485D] space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#142C45] dark:text-[#E8EEF5] uppercase tracking-wider">
                    <Activity className="w-4 h-4 text-[#B45309] dark:text-amber-400" />
                    <span>Active Relationship Signals ({profile.signals.length})</span>
                  </div>
                  {profile.signals.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] dark:text-slate-400 italic">No active signals registered.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.signals.map((sig) => (
                        <div
                          key={sig.id}
                          className="p-2.5 rounded-xs bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#E2E8F0] dark:border-[#26394C] flex items-start gap-2"
                        >
                          <AlertTriangle
                            className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                              sig.severity === 'CRITICAL'
                                ? 'text-[#B42318] dark:text-rose-400'
                                : sig.severity === 'HIGH'
                                ? 'text-[#B45309] dark:text-amber-400'
                                : 'text-[#2563EB] dark:text-sky-400'
                            }`}
                          />
                          <div className="space-y-0.5 min-w-0">
                            <div className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">{sig.headline}</div>
                            <p className="text-[11px] text-[#64748B] dark:text-[#A9BACB] leading-relaxed">{sig.evidence}</p>
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
          <div className="p-3.5 sm:p-4 border-t border-[#E2E8F0] dark:border-[#33485D] bg-[#FFFFFF] dark:bg-[#162638] flex items-center justify-between text-xs text-[#64748B] dark:text-[#A9BACB] shrink-0">
            <span className="font-mono text-[11px]">Authorized Banking RM Portfolio View</span>
            <Button
              variant="outline"
              size="xs"
              onClick={onClose}
            >
              Close Drawer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
