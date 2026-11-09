import React, { useState, useEffect, useMemo } from 'react';
import { bankingApi } from '../../lib/api';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Table, Column } from '../common/Table';
import { StatCard } from '../common/StatCard';
import { formatINR } from '../../data/mockIndianBankingData';
import {
  TrendingUp,
  Search,
  Plus,
  RefreshCw,
  Briefcase,
  User,
  Calendar,
  IndianRupee,
  CheckCircle2,
  ArrowRight,
  Bot,
  X,
  SlidersHorizontal,
  Layers,
  Building2,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  Flame,
  Award,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';
import { useToast } from '../common/Toast';

interface OpportunityItem {
  id: number;
  opportunityCode: string;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  productName?: string;
  title: string;
  stage: string;
  expectedValue: string;
  probability: number;
  expectedCloseDate?: string;
  notes?: string;
  assignedToName?: string;
  createdAt: string;
  activities?: any[];
}

interface OpportunitiesModuleProps {
  onNavigateToCustomer?: (customerId: number) => void;
}

const STAGES = [
  { id: 'PROSPECT', label: 'Prospect', prob: 20 },
  { id: 'QUALIFIED', label: 'Qualified', prob: 40 },
  { id: 'PROPOSAL', label: 'Proposal', prob: 60 },
  { id: 'NEGOTIATION', label: 'Negotiation', prob: 80 },
  { id: 'WON', label: 'Closed Won', prob: 100 },
  { id: 'LOST', label: 'Closed Lost', prob: 0 },
];

export const OpportunitiesModule: React.FC<OpportunitiesModuleProps> = ({ onNavigateToCustomer }) => {
  const { openDrawer } = useCopilot();
  const toast = useToast();
  const [opps, setOpps] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Navigation
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isCompact, setIsCompact] = useState<boolean>(false);

  // Selection
  const [selectedOpp, setSelectedOpp] = useState<OpportunityItem | null>(null);
  const [oppDetail, setOppDetail] = useState<OpportunityItem | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // Originate New Deal Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCustomerId, setNewCustomerId] = useState<number>(1);
  const [newValue, setNewValue] = useState<string>('1500000');
  const [newStage, setNewStage] = useState<string>('PROSPECT');
  const [newCloseDate, setNewCloseDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  });
  const [newNotes, setNewNotes] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  const loadOpps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bankingApi.getOpportunities({
        stage: stageFilter === 'ALL' ? undefined : stageFilter,
      });
      setOpps(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpps();
  }, [stageFilter]);

  const loadDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await bankingApi.getOpportunityById(id);
      setOppDetail(detail);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenOpp = (o: OpportunityItem) => {
    setSelectedOpp(o);
    loadDetail(o.id);
  };

  const handleUpdateStage = async (newStageVal: string) => {
    if (!selectedOpp) return;
    try {
      await bankingApi.updateOpportunity(selectedOpp.id, {
        stage: newStageVal,
      });
      toast.success(`Opportunity stage transitioned to ${newStageVal}.`);
      loadDetail(selectedOpp.id);
      loadOpps();
      setSelectedOpp((prev) => (prev ? { ...prev, stage: newStageVal } : null));
    } catch (err: any) {
      toast.error(err.message || 'Failed to update opportunity stage.');
    }
  };

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      await bankingApi.createOpportunity({
        customerId: newCustomerId,
        title: newTitle.trim(),
        stage: newStage,
        expectedValue: newValue,
        expectedCloseDate: newCloseDate,
        notes: newNotes.trim() || undefined,
      });
      setIsNewModalOpen(false);
      setNewTitle('');
      setNewNotes('');
      toast.success('Commercial opportunity originated successfully.');
      loadOpps();
    } catch (err: any) {
      toast.error(err.message || 'Failed to originate opportunity.');
    } finally {
      setSaving(false);
    }
  };

  // Pipeline calculations
  const totalPipeline = useMemo(() => {
    return opps.reduce((sum, o) => sum + (parseFloat(o.expectedValue) || 0), 0);
  }, [opps]);

  const wonPipeline = useMemo(() => {
    return opps
      .filter((o) => o.stage === 'WON')
      .reduce((sum, o) => sum + (parseFloat(o.expectedValue) || 0), 0);
  }, [opps]);

  const weightedPipeline = useMemo(() => {
    return opps.reduce((sum, o) => {
      const val = parseFloat(o.expectedValue) || 0;
      const prob = o.probability || 0;
      return sum + (val * prob) / 100;
    }, 0);
  }, [opps]);

  const filteredOpps = useMemo(() => {
    return opps.filter((o) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        o.opportunityCode.toLowerCase().includes(term) ||
        o.title.toLowerCase().includes(term) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.customerCode && o.customerCode.toLowerCase().includes(term)) ||
        (o.productName && o.productName.toLowerCase().includes(term))
      );
    });
  }, [opps, search]);

  const columns: Column<OpportunityItem>[] = [
    {
      key: 'opportunityCode',
      header: 'Deal Reference',
      mono: true,
      render: (o) => (
        <div className="space-y-0.5">
          <div className="font-mono font-semibold text-[#142C45] dark:text-[#E8EEF5]">
            {o.opportunityCode}
          </div>
          <div className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1 font-mono">
            <Calendar className="w-3 h-3 text-[#8793A1]" />
            <span>{new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Client / Account CIF',
      render: (o) => (
        <div className="space-y-0.5">
          <div className="font-medium text-[#273444] dark:text-[#E8EEF5] text-xs">
            {o.customerName || 'Direct Client'}
          </div>
          <div className="font-mono text-[11px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#8793A1]" />
            <span>{o.customerCode || 'CIF-NA'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Deal Structure & Product',
      render: (o) => (
        <div className="max-w-[260px] space-y-0.5">
          <div className="font-medium text-[#142C45] dark:text-[#E8EEF5] text-xs truncate" title={o.title}>
            {o.title}
          </div>
          <div className="text-[11px] text-[#5D6B7B] dark:text-[#8194A8] truncate flex items-center gap-1">
            <span className="inline-block px-1.5 py-0.2 rounded bg-[#EDF1F5] dark:bg-[#101C2A] text-[#142C45] dark:text-[#A9BACB] text-[10px]">
              {o.productName || 'Direct Credit Facility'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'expectedValue',
      header: 'Facility Value',
      mono: true,
      render: (o) => (
        <div className="space-y-0.5">
          <div className="font-mono font-bold text-[#142C45] dark:text-[#E8EEF5] text-xs">
            {formatINR(parseFloat(o.expectedValue) || 0)}
          </div>
          <div className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1">
            <span className="text-[#168C83] font-semibold">{o.probability}%</span>
            <span>win probability</span>
          </div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Pipeline Stage',
      render: (o) => {
        const isWon = o.stage === 'WON';
        const isLost = o.stage === 'LOST';
        const isAdvanced = o.stage === 'PROPOSAL' || o.stage === 'NEGOTIATION';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              isWon
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : isLost
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                : isAdvanced
                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isWon ? 'bg-emerald-500' : isLost ? 'bg-red-500' : isAdvanced ? 'bg-blue-500' : 'bg-amber-500'
              }`}
            />
            {o.stage}
          </span>
        );
      },
    },
    {
      key: 'expectedCloseDate',
      header: 'Target Sanction',
      mono: true,
      render: (o) => (
        <span className="text-xs font-mono text-[#273444] dark:text-[#E8EEF5]">
          {o.expectedCloseDate || '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE3EA] dark:border-[#33485D] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#142C45] text-white dark:bg-[#168C83]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight">
              Deals & Commercial Opportunities Pipeline
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#168C83]/10 text-[#168C83] border border-[#168C83]/30">
              Credit Origination Engine
            </span>
          </div>
          <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
            Commercial loan origination, cross-sell deal progression, and relationship value expansion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOpps}
            disabled={loading}
            className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Pipeline
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="bg-[#142C45] dark:bg-[#168C83] hover:bg-[#192B3D] text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Originate Deal
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Pipeline Value"
          value={formatINR(totalPipeline)}
          badge="Gross Book"
          badgeVariant="neutral"
        />
        <StatCard
          label="Weighted Expectation"
          value={formatINR(weightedPipeline)}
          badge="Probability Adj."
          badgeVariant="info"
        />
        <StatCard
          label="Advanced Stages (Prop/Neg)"
          value={opps.filter((o) => o.stage === 'PROPOSAL' || o.stage === 'NEGOTIATION').length.toString()}
          badge="High Conviction"
          badgeVariant="warning"
        />
        <StatCard
          label="Closed Won Mandates"
          value={formatINR(wonPipeline)}
          badge="Executed Book"
          badgeVariant="success"
        />
      </div>

      {/* Visual Stage Progression Strip */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3 shadow-xs">
        <div className="text-[11px] font-semibold text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Origination Funnel Stages</span>
          <span className="font-mono text-[10px]">{opps.length} Active Mandates</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {STAGES.map((st) => {
            const stageOpps = opps.filter((o) => o.stage === st.id);
            const stageTotal = stageOpps.reduce((s, o) => s + (parseFloat(o.expectedValue) || 0), 0);
            const isSelected = stageFilter === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setStageFilter(isSelected ? 'ALL' : st.id)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'border-[#168C83] bg-[#168C83]/10 ring-1 ring-[#168C83]'
                    : 'border-[#DCE3EA] dark:border-[#33485D] bg-[#F4F6F8] dark:bg-[#101C2A] hover:border-[#8793A1]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#142C45] dark:text-[#E8EEF5]">{st.label}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#FFFFFF] dark:bg-[#162638] text-[#5D6B7B] dark:text-[#A9BACB]">
                    {stageOpps.length}
                  </span>
                </div>
                <div className="font-mono text-xs font-bold text-[#168C83] mt-1">
                  {formatINR(stageTotal)}
                </div>
                <div className="text-[10px] text-[#8793A1] font-mono mt-0.5">
                  {st.prob}% Win Rate
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3 space-y-2.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8793A1]" />
            <input
              type="text"
              placeholder="Search by deal reference, client name, CIF, product line..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83] focus:border-[#168C83]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-[#8793A1] hover:text-[#273444] dark:hover:text-[#E8EEF5]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4 flex items-center gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="ALL">All Deal Stages ({opps.length})</option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setIsCompact(!isCompact)}
              className="p-2 border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] shrink-0"
              title={isCompact ? 'Comfortable Table' : 'Compact Table'}
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="text-[11px] font-mono text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-2">
            <span>
              Showing <strong className="text-[#142C45] dark:text-[#E8EEF5]">{filteredOpps.length}</strong> of {opps.length} commercial deals
            </span>
            {(search || stageFilter !== 'ALL') && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#EDF1F5] dark:bg-[#101C2A] text-[#142C45] dark:text-[#A9BACB]">
                Filtered
              </span>
            )}
          </div>

          {(search || stageFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setStageFilter('ALL');
              }}
              className="text-xs text-[#168C83] hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Operational Table */}
      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Pipeline Error: {error}</span>
        </div>
      ) : !loading && filteredOpps.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-8 h-8 text-[#8793A1]" />}
          title="No commercial opportunities match criteria"
          description="Adjust your search parameters or stage filters to view active deals."
          actionLabel="Reset Pipeline Filters"
          onAction={() => {
            setSearch('');
            setStageFilter('ALL');
          }}
          className="border border-[#DCE3EA] dark:border-[#33485D] rounded-lg bg-[#FFFFFF] dark:bg-[#162638] p-8"
        />
      ) : (
        <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg overflow-hidden shadow-xs">
          <Table
            columns={columns}
            data={filteredOpps}
            isLoading={loading}
            keyExtractor={(o) => String(o.id)}
            onRowClick={handleOpenOpp}
            className={isCompact ? 'table-compact' : ''}
          />
        </div>
      )}

      {/* Opportunity Detail Dossier Modal */}
      {selectedOpp && (
        <Modal
          isOpen={!!selectedOpp}
          onClose={() => {
            setSelectedOpp(null);
            setOppDetail(null);
          }}
          title={`Deal Dossier — ${selectedOpp.opportunityCode}`}
          subtitle={selectedOpp.title}
          referenceId={selectedOpp.opportunityCode}
          maxWidth="4xl"
          footerActions={
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#5D6B7B] dark:text-[#8194A8] mr-1">Move Stage:</span>
                {['PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map((st) => (
                  <Button
                    key={st}
                    variant={selectedOpp.stage === st ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateStage(st)}
                    disabled={selectedOpp.stage === st}
                    className={
                      selectedOpp.stage === st
                        ? 'bg-[#168C83] text-white'
                        : 'border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]'
                    }
                  >
                    {st}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedOpp(null);
                  setOppDetail(null);
                }}
                className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                Dismiss
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Copilot Action Banner */}
            <div className="bg-[#101C2A] border border-[#168C83]/40 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#168C83]/20 flex items-center justify-center text-[#168C83]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#E8EEF5]">Deal Intelligence Copilot</div>
                  <div className="text-[10px] text-[#8194A8]">
                    Review credit appraisal hurdles, pricing thresholds, and sanction readiness
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openDrawer(
                      {
                        type: 'CUSTOMER',
                        id: selectedOpp.customerId,
                        code: selectedOpp.customerCode,
                        label: `${selectedOpp.customerName || 'Client'} · ${selectedOpp.customerCode || selectedOpp.customerId}`,
                      },
                      `Review commercial opportunity ${selectedOpp.opportunityCode} (${selectedOpp.title}). Facility value: ${formatINR(parseFloat(selectedOpp.expectedValue) || 0)}. Analyze credit risk, recommend closing strategy, and identify any missing collateral documents.`
                    )
                  }
                  className="px-2.5 py-1 bg-[#168C83]/20 hover:bg-[#168C83]/30 text-[#168C83] text-[11px] font-medium rounded border border-[#168C83]/40 transition-colors"
                >
                  Analyze Sanction Readiness
                </button>
                {onNavigateToCustomer && selectedOpp.customerId && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToCustomer(selectedOpp.customerId);
                      setSelectedOpp(null);
                    }}
                    className="px-2.5 py-1 bg-[#162638] hover:bg-[#1C3045] text-[#A9BACB] text-[11px] rounded border border-[#33485D] transition-colors flex items-center gap-1"
                  >
                    <span>Customer 360</span>
                    <ExternalLink className="w-3 h-3 text-[#8793A1]" />
                  </button>
                )}
              </div>
            </div>

            {/* Meta Strip */}
            <div className="bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">Borrower Account</span>
                <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5] mt-0.5">{selectedOpp.customerName}</div>
                <div className="font-mono text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">{selectedOpp.customerCode}</div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">Facility Principal</span>
                <div className="font-mono font-bold text-[#142C45] dark:text-[#E8EEF5] mt-0.5">
                  {formatINR(parseFloat(selectedOpp.expectedValue) || 0)}
                </div>
                <div className="text-[10px] text-[#168C83] font-mono">{selectedOpp.probability}% Win Probability</div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">Current Stage</span>
                <div className="mt-0.5">
                  <Badge variant={selectedOpp.stage === 'WON' ? 'success' : 'info'} size="sm">
                    {selectedOpp.stage}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">Target Sanction</span>
                <div className="font-mono text-[#273444] dark:text-[#E8EEF5] mt-0.5">
                  {selectedOpp.expectedCloseDate || '—'}
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOpp.notes && (
              <div className="p-3 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs space-y-1">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#168C83]" />
                  Term Sheet Synopsis & Notes
                </span>
                <p className="text-[#273444] dark:text-[#E8EEF5] leading-relaxed whitespace-pre-wrap">
                  {selectedOpp.notes}
                </p>
              </div>
            )}

            {/* Activities Audit Trail */}
            <div className="space-y-2 border-t border-[#DCE3EA] dark:border-[#33485D] pt-3">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#168C83]" />
                Stage Transition & Deal Audit Trail
              </span>
              {detailLoading ? (
                <div className="text-xs text-[#5D6B7B] dark:text-[#8194A8] py-2 text-center">
                  Loading deal history...
                </div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {oppDetail?.activities && oppDetail.activities.length > 0 ? (
                    oppDetail.activities.map((act: any) => (
                      <div
                        key={act.id}
                        className="p-2.5 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-xs flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-[#142C45] dark:text-[#E8EEF5]">{act.description}</div>
                          <div className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8] font-mono">{act.activityType}</div>
                        </div>
                        <span className="text-[10px] text-[#8793A1] font-mono">
                          {new Date(act.timestamp).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#8793A1] italic py-2 text-center">No stage transitions logged yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Originate Deal Modal */}
      {isNewModalOpen && (
        <Modal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          title="Originate Commercial Opportunity"
          subtitle="Persist commercial deal parameters in PostgreSQL"
          maxWidth="lg"
          footerActions={
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNewModalOpen(false)}
                className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateOpp}
                disabled={saving || !newTitle.trim()}
                className="bg-[#142C45] dark:bg-[#168C83] hover:bg-[#192B3D] text-white"
              >
                {saving ? 'Creating...' : 'Originate Opportunity'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateOpp} className="space-y-3 text-xs">
            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Select Client Account</label>
              <select
                value={newCustomerId}
                onChange={(e) => setNewCustomerId(Number(e.target.value))}
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              >
                <option value={1}>Rahul Sharma (CUS-10482) - Affluent Retail</option>
                <option value={2}>Kalyan Steels & Forgings Ltd (CUS-20841) - Commercial Mid-Market</option>
                <option value={3}>Meera Sundaram (CUS-30915) - Private Banking</option>
                <option value={4}>Sunil Varma (CUS-40182) - Emerging Corporate</option>
                <option value={5}>Ananya Deshmukh (CUS-50824) - Retail Wealth</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Deal Title & Structure</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Working Capital Line Enhancement / Term Loan"
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Facility Size (INR)</label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] font-mono focus:outline-none focus:ring-1 focus:ring-[#168C83]"
                />
              </div>
              <div>
                <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Initial Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
                >
                  <option value="PROSPECT">Prospect (20%)</option>
                  <option value="QUALIFIED">Qualified (40%)</option>
                  <option value="PROPOSAL">Proposal (60%)</option>
                  <option value="NEGOTIATION">Negotiation (80%)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Target Sanction Date</label>
              <input
                type="date"
                value={newCloseDate}
                onChange={(e) => setNewCloseDate(e.target.value)}
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] font-mono focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              />
            </div>

            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Deal Synopsis & Credit Parameters</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Facility justification, credit rating, collateral notes..."
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
