import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  AlertTriangle,
  TrendingUp,
  LifeBuoy,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  FileText,
  User,
  CheckSquare,
  Building,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { bankingApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  CustomerInsight,
  RelationshipIntelligenceSummary,
  InsightType,
  InsightPriority,
  InsightStatus,
  InsightCategory,
  ModuleType,
} from '../../types/index.ts';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { formatINR } from '../../data/mockIndianBankingData';

interface RelationshipIntelligenceModuleProps {
  onNavigateToModule?: (module: ModuleType) => void;
  onNavigateToCustomer?: (cifOrId: string | number) => void;
}

export const RelationshipIntelligenceModule: React.FC<RelationshipIntelligenceModuleProps> = ({
  onNavigateToModule,
  onNavigateToCustomer,
}) => {
  const { user, hasPermission } = useAuth();

  const [insights, setInsights] = useState<CustomerInsight[]>([]);
  const [summary, setSummary] = useState<RelationshipIntelligenceSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ACTIVE');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Selected insight for Evidence Modal
  const [selectedInsight, setSelectedInsight] = useState<CustomerInsight | null>(null);
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState<boolean>(false);

  // Acknowledge & Resolve Modals
  const [actionInsight, setActionInsight] = useState<CustomerInsight | null>(null);
  const [actionType, setActionType] = useState<'ACKNOWLEDGE' | 'RESOLVE' | null>(null);
  const [actionNote, setActionNote] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const fetchInsightsAndSummary = async () => {
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        bankingApi.getIntelligence({
          status: selectedStatus === 'ALL' ? undefined : selectedStatus,
          category: selectedCategory === 'ALL' ? undefined : selectedCategory,
          priority: selectedPriority === 'ALL' ? undefined : selectedPriority,
          search: searchQuery || undefined,
          limit: 50,
        }),
        bankingApi.getIntelligenceSummary().catch(() => null),
      ]);

      setInsights(listRes.data || []);
      if (sumRes) setSummary(sumRes);
    } catch (err) {
      console.error('Failed to load relationship intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsAndSummary();
  }, [selectedStatus, selectedCategory, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInsightsAndSummary();
  };

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      await bankingApi.recalculateAllIntelligence();
      await fetchInsightsAndSummary();
    } catch (err) {
      console.error('Failed batch recalculation:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleOpenAcknowledge = (ins: CustomerInsight) => {
    setActionInsight(ins);
    setActionType('ACKNOWLEDGE');
    setActionNote('Officer review initiated. Engagement strategy logged with Relationship Desk.');
  };

  const handleOpenResolve = (ins: CustomerInsight) => {
    setActionInsight(ins);
    setActionType('RESOLVE');
    setActionNote('Action completed and signal resolved in client records.');
  };

  const handleSubmitAction = async () => {
    if (!actionInsight || !actionType) return;
    setSubmittingAction(true);
    try {
      if (actionType === 'ACKNOWLEDGE') {
        await bankingApi.acknowledgeIntelligence(actionInsight.id, actionNote);
      } else {
        await bankingApi.resolveIntelligence(actionInsight.id, actionNote);
      }
      setActionType(null);
      setActionInsight(null);
      setActionNote('');
      await fetchInsightsAndSummary();
    } catch (err) {
      console.error('Failed to update insight status:', err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const getPriorityBadge = (priority: InsightPriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            HIGH PRIORITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-100 text-blue-800 border border-blue-200">
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            LOW
          </span>
        );
    }
  };

  const getTypeIcon = (type: InsightType) => {
    switch (type) {
      case 'RELATIONSHIP_RISK':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'GROWTH_OPPORTUNITY':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'SERVICE_CONCERN':
        return <LifeBuoy className="w-4 h-4 text-amber-600" />;
      case 'OPERATIONAL_SIGNAL':
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'ENGAGEMENT_SIGNAL':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    return cat.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* 1. Header & Engine Controls */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-slate-900 text-white shadow-xs">
              <BrainCircuit className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
                  Relationship Intelligence Engine
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-slate-100 text-slate-700 rounded border border-slate-300">
                  Rule Engine RI-v1
                </span>
                <span className="px-2 py-0.5 text-[10px] font-sans font-medium bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                  Deterministic • Explainable
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Translating CRM customer records into explainable signals: Signal → Evidence → Impact → Action. Zero AI hallucinations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInsightsAndSummary}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            disabled={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRecalculateAll}
            disabled={recalculating}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />}
          >
            {recalculating ? 'Evaluating CRM Records...' : 'Recalculate Intelligence'}
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Active Signals</div>
          <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
            {summary?.totalActive ?? insights.filter((i) => i.status === 'ACTIVE' || i.status === 'ACKNOWLEDGED').length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Requiring Attention</div>
        </div>

        <div className="bg-white border border-rose-200 bg-rose-50/20 rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Critical Priority
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
            {summary?.criticalCount ?? insights.filter((i) => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length}
          </div>
          <div className="text-[10px] text-rose-600/80 mt-0.5">SLA Breaches & High Risk</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            Growth Signals
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {summary?.byType?.growthOpportunity ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cross-Sell & Expansion</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <LifeBuoy className="w-3.5 h-3.5 text-amber-600" />
            Service Concerns
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700 mt-1">
            {summary?.byType?.serviceConcern ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Grievance Pressures</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-blue-700 uppercase tracking-wider flex items-center gap-1">
            <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
            Operational
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            {summary?.byType?.operationalSignal ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tasks & Stagnation</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs">
          <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Resolved
          </div>
          <div className="text-2xl font-bold font-mono text-slate-700 mt-1">
            {summary?.resolvedCount ?? 0}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cleared Signals</div>
        </div>
      </div>

      {/* 3. Filtering & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs w-full sm:w-auto">
            {['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1.5 rounded font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status === 'ACTIVE'
                  ? 'Active Queue'
                  : status === 'ACKNOWLEDGED'
                  ? 'Acknowledged'
                  : status === 'RESOLVED'
                  ? 'Resolved Archive'
                  : 'All Signals'}
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-80">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, CIF, signal..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 font-sans"
              />
            </div>
            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
          </form>
        </div>

        {/* Category & Priority Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold text-[11px] uppercase tracking-wider">Filters:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500">Category:</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded bg-slate-50 text-slate-800 text-xs font-sans focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="SLA_BREACHED">SLA Breached (Grievances)</option>
              <option value="SLA_AT_RISK">SLA At Risk</option>
              <option value="REPEATED_ISSUE">Repeated Issue Friction</option>
              <option value="SCORE_DECLINE">Health / Score Decline</option>
              <option value="ENGAGEMENT_DECLINE">Engagement Inactivity</option>
              <option value="PRODUCT_DEPTH_GAP">Product Depth Expansion</option>
              <option value="HIGH_PROBABILITY_DEAL">High-Probability Deal</option>
              <option value="TASK_OVERDUE">Overdue Tasks</option>
              <option value="MULTIPLE_PENDING_TASKS">Task Backlog</option>
              <option value="OPPORTUNITY_STAGNATION">Opportunity Stagnation</option>
              <option value="INTERACTION_SPIKE">Interaction Velocity Spike</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500">Priority:</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="py-1 px-2 border border-slate-300 rounded bg-slate-50 text-slate-800 text-xs font-sans focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {(selectedCategory !== 'ALL' || selectedPriority !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedPriority('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-auto"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 4. Signals List / Feed */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2 shadow-xs">
          <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
          <span>Evaluating Relationship Signals across PostgreSQL CRM Database...</span>
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-xs text-slate-500 space-y-2 shadow-xs">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="text-sm font-semibold text-slate-800">No Relationship Signals Found</div>
          <p className="text-slate-500 max-w-md mx-auto">
            {selectedStatus === 'ACTIVE'
              ? 'All observed customer accounts are operating within standard performance benchmarks with zero outstanding alerts.'
              : 'No historical intelligence matches your selected status or filter criteria.'}
          </p>
          <Button size="sm" variant="outline" onClick={handleRecalculateAll} className="mt-2">
            Run Deterministic Rules Check
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((ins) => {
            const isResolved = ins.status === 'RESOLVED';
            const isAcknowledged = ins.status === 'ACKNOWLEDGED';
            const evidenceCount = ins.evidence?.length || 0;

            return (
              <div
                key={ins.id}
                className={`bg-white border rounded-lg p-4 transition-all shadow-xs hover:border-slate-300 ${
                  ins.priority === 'CRITICAL' && !isResolved
                    ? 'border-rose-300 bg-rose-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Row: Type, Category, Customer & Priority */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 font-medium text-xs text-slate-800">
                      {getTypeIcon(ins.insightType)}
                      <span className="font-semibold text-slate-900">{ins.insightType.replace(/_/g, ' ')}</span>
                    </div>

                    <span className="text-slate-300">•</span>

                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {getCategoryLabel(ins.category)}
                    </span>

                    <span className="text-slate-300">•</span>

                    {/* Customer Tag */}
                    <button
                      onClick={() => onNavigateToCustomer?.(ins.cifNumber || ins.customerId)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-800 hover:text-blue-700 transition-colors"
                    >
                      <User className="w-3 h-3 text-slate-500" />
                      <span>{ins.customerName}</span>
                      <span className="font-mono text-[10px] text-slate-500">({ins.customerCode})</span>
                    </button>

                    {ins.customerSegment && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-sans">
                        {ins.customerSegment}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {getPriorityBadge(ins.priority)}

                    {isResolved ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        RESOLVED
                      </span>
                    ) : isAcknowledged ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        ACKNOWLEDGED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>

                {/* Core Intelligence Body: Signal Title, Summary & Impact Statement */}
                <div className="py-3 space-y-2.5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                      {ins.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {ins.summary}
                    </p>
                  </div>

                  {/* Impact Box (Explainable Intelligence requirement: Why does it matter?) */}
                  <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80 text-xs flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-800">Business & Relationship Impact: </span>
                      <span className="text-slate-700">{ins.impact}</span>
                    </div>
                  </div>

                  {/* Evidence Snippet preview */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedInsight(ins);
                        setIsEvidenceModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs border border-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>View Evidence ({evidenceCount} Records)</span>
                    </button>

                    <span className="text-[11px] text-slate-500 font-sans">
                      Confidence: <strong className="text-slate-700 font-medium">HIGH ({ins.confidenceScore * 100}% Evidence Completeness)</strong>
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="text-[11px] text-slate-500 font-sans">
                      Detected: <span className="font-mono text-slate-700">{new Date(ins.detectedAt).toLocaleDateString('en-IN')}</span>
                    </span>

                    <span className="text-slate-300">•</span>

                    <span className="text-[11px] text-slate-400 font-mono">
                      Rule: {ins.ruleVersion}
                    </span>
                  </div>

                  {/* Officer Acknowledgment / Resolution Record */}
                  {ins.acknowledgedByName && (
                    <div className="text-[11px] text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-100 flex items-center justify-between">
                      <div>
                        <strong>Acknowledged by:</strong> {ins.acknowledgedByName} on{' '}
                        {ins.acknowledgedAt ? new Date(ins.acknowledgedAt).toLocaleString('en-IN') : 'Recent'}
                        {ins.acknowledgementNote && (
                          <div className="text-slate-700 italic mt-0.5">"{ins.acknowledgementNote}"</div>
                        )}
                      </div>
                    </div>
                  )}

                  {ins.resolvedAt && (
                    <div className="text-[11px] text-slate-600 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                      <strong>Resolved on:</strong> {new Date(ins.resolvedAt).toLocaleString('en-IN')} (
                      {ins.resolutionType || 'MANUAL'})
                      {ins.resolutionNote && (
                        <div className="text-slate-700 italic mt-0.5">"{ins.resolutionNote}"</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Assigned RM: </span>
                    <strong className="text-slate-700">{ins.assignedRmName || 'Branch Relationship Officer'}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isResolved && !isAcknowledged && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleOpenAcknowledge(ins)}
                      >
                        Acknowledge
                      </Button>
                    )}

                    {!isResolved && (
                      <Button
                        size="xs"
                        variant="secondary"
                        onClick={() => handleOpenResolve(ins)}
                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      >
                        Resolve Signal
                      </Button>
                    )}

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setSelectedInsight(ins);
                        setIsEvidenceModalOpen(true);
                      }}
                      icon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      Audit Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. "VIEW EVIDENCE" MODAL (Core Explainability Requirement) */}
      {isEvidenceModalOpen && selectedInsight && (
        <Modal
          isOpen={isEvidenceModalOpen}
          onClose={() => {
            setIsEvidenceModalOpen(false);
            setSelectedInsight(null);
          }}
          title={`Explainable Evidence Audit — ${selectedInsight.title}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Header meta */}
            <div className="bg-slate-900 text-white p-3.5 rounded border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  INSIGHT SIGNAL IDENTIFIER
                </div>
                <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
                  <span>{selectedInsight.insightId}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                    Rule {selectedInsight.ruleVersion}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedInsight.priority)}
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200">
                  {selectedInsight.status}
                </span>
              </div>
            </div>

            {/* Customer Dossier Snapshot */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <span className="text-slate-500 text-[11px] block">Customer Name</span>
                <span className="font-semibold text-slate-900">{selectedInsight.customerName}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">CIF Number</span>
                <span className="font-mono font-medium text-slate-800">{selectedInsight.cifNumber || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Relationship Segment</span>
                <span className="font-medium text-slate-800">{selectedInsight.customerSegment || 'RETAIL'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Assigned RM</span>
                <span className="font-medium text-slate-800">{selectedInsight.assignedRmName || 'Branch RM'}</span>
              </div>
            </div>

            {/* Why Does This Matter? */}
            <div className="p-3 rounded bg-amber-50/60 border border-amber-200 space-y-1">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>Why Does This Matter? (Institutional Impact)</span>
              </div>
              <p className="text-slate-800 leading-relaxed">
                {selectedInsight.impact}
              </p>
            </div>

            {/* SUPPORTING EVIDENCE RECORDS (Strictly Verified CRM Records) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Verified CRM Evidence Records ({selectedInsight.evidence?.length || 0})</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Zero AI Assumptions • 100% Traceable
                </span>
              </div>

              {selectedInsight.evidence && selectedInsight.evidence.length > 0 ? (
                <div className="space-y-2">
                  {selectedInsight.evidence.map((ev, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                            {ev.sourceType}
                          </span>
                          <span className="font-mono text-xs font-semibold text-blue-700">
                            {ev.sourceCode}
                          </span>
                          <span className="font-medium text-slate-900">
                            {ev.recordTitle}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {ev.detail}
                        </p>
                        {ev.timestamp && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Record Timestamp: {new Date(ev.timestamp).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      {ev.routePath && onNavigateToModule && (
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setIsEvidenceModalOpen(false);
                            if (ev.sourceType === 'CASE') onNavigateToModule('cases');
                            else if (ev.sourceType === 'TASK') onNavigateToModule('tasks');
                            else if (ev.sourceType === 'OPPORTUNITY') onNavigateToModule('opportunities');
                            else if (ev.sourceType === 'ACCOUNT') onNavigateToModule('accounts');
                            else onNavigateToCustomer?.(selectedInsight.cifNumber || selectedInsight.customerId);
                          }}
                          icon={<ExternalLink className="w-3 h-3" />}
                        >
                          Open Record
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-slate-500">
                  No individual line item records recorded for this composite score signal.
                </div>
              )}
            </div>

            {/* Recommended Action */}
            {selectedInsight.recommendedActionType && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Recommended Institutional Action
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-900 px-2 py-0.5 bg-slate-200 rounded">
                    {selectedInsight.recommendedActionType}
                  </span>
                  {selectedInsight.recommendedActionContext && (
                    <span className="text-slate-600 font-mono text-[11px]">
                      Context: {selectedInsight.recommendedActionContext}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Audit & Officer History */}
            <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <div>
                Detected At: <span className="font-mono text-slate-700">{new Date(selectedInsight.detectedAt).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setIsEvidenceModalOpen(false);
                    setSelectedInsight(null);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Acknowledge / Resolve Modal */}
      {actionInsight && actionType && (
        <Modal
          isOpen={true}
          onClose={() => {
            setActionType(null);
            setActionInsight(null);
            setActionNote('');
          }}
          title={actionType === 'ACKNOWLEDGE' ? 'Acknowledge Relationship Signal' : 'Resolve Relationship Signal'}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div className="font-bold text-slate-900">{actionInsight.title}</div>
              <div className="text-slate-600 text-[11px]">{actionInsight.summary}</div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Officer {actionType === 'ACKNOWLEDGE' ? 'Acknowledgment Note' : 'Resolution Note'}
              </label>
              <textarea
                rows={3}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Enter mandatory audit note explaining actions taken..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded font-sans text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
              />
            </div>

            {/* Quick Templates */}
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block mb-1">Quick Note Templates:</span>
              <div className="flex flex-wrap gap-1.5">
                {actionType === 'ACKNOWLEDGE' ? (
                  [
                    'Initiated client outreach call to review relationship.',
                    'Escalated case to Branch Operations for expedite.',
                    'Scheduled product structuring meeting with customer.',
                    'Reviewing terms with credit underwriting team.',
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActionNote(tpl)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] border border-slate-200 transition-colors"
                    >
                      {tpl}
                    </button>
                  ))
                ) : (
                  [
                    'Grievance resolved and verified with client.',
                    'All pending operational follow-up tasks completed.',
                    'Cross-sell opportunity converted and product booked.',
                    'Client meeting conducted, relationship reaffirmed.',
                  ].map((tpl, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActionNote(tpl)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] border border-slate-200 transition-colors"
                    >
                      {tpl}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActionType(null);
                  setActionInsight(null);
                  setActionNote('');
                }}
                disabled={submittingAction}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSubmitAction}
                disabled={submittingAction}
              >
                {submittingAction
                  ? 'Saving Audit Record...'
                  : actionType === 'ACKNOWLEDGE'
                  ? 'Confirm Acknowledgment'
                  : 'Mark Signal as Resolved'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
