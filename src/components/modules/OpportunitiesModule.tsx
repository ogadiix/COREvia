import React, { useState, useEffect } from 'react';
import { bankingApi } from '../../lib/api.ts';
import { Badge } from '../common/Badge.tsx';
import { Button } from '../common/Button.tsx';
import { Modal } from '../common/Modal.tsx';
import { Table, Column } from '../common/Table.tsx';
import { StatCard } from '../common/StatCard.tsx';
import { formatINR } from '../../data/mockIndianBankingData.ts';
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
} from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext.tsx';

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

export const OpportunitiesModule: React.FC = () => {
  const { openDrawer } = useCopilot();
  const [opps, setOpps] = useState<OpportunityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const [selectedOpp, setSelectedOpp] = useState<OpportunityItem | null>(null);
  const [oppDetail, setOppDetail] = useState<OpportunityItem | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // New Opp Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCustomerId, setNewCustomerId] = useState<number>(1);
  const [newValue, setNewValue] = useState<string>('1000000');
  const [newStage, setNewStage] = useState<string>('PROSPECT');
  const [newCloseDate, setNewCloseDate] = useState<string>('2026-10-31');
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
      loadDetail(selectedOpp.id);
      loadOpps();
    } catch (err: any) {
      alert(err.message);
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
      loadOpps();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalPipeline = opps.reduce((sum, o) => sum + (parseFloat(o.expectedValue) || 0), 0);
  const wonPipeline = opps
    .filter((o) => o.stage === 'WON')
    .reduce((sum, o) => sum + (parseFloat(o.expectedValue) || 0), 0);

  const filteredOpps = opps.filter((o) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      o.opportunityCode.toLowerCase().includes(term) ||
      o.title.toLowerCase().includes(term) ||
      (o.customerName && o.customerName.toLowerCase().includes(term))
    );
  });

  const columns: Column<OpportunityItem>[] = [
    {
      key: 'opportunityCode',
      header: 'Opp ID',
      mono: true,
      render: (o) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{o.opportunityCode}</span>
          <div className="text-[10px] text-slate-500">{new Date(o.createdAt).toLocaleDateString('en-IN')}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (o) => (
        <div>
          <span className="font-medium text-slate-900">{o.customerName || 'Client'}</span>
          <div className="font-mono text-[11px] text-slate-500">{o.customerCode || 'CUS-NA'}</div>
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Opportunity & Product',
      render: (o) => (
        <div className="max-w-[240px]">
          <div className="font-semibold text-slate-800 text-xs truncate">{o.title}</div>
          <div className="text-[11px] text-slate-500 truncate">{o.productName || 'Direct Facility'}</div>
        </div>
      ),
    },
    {
      key: 'expectedValue',
      header: 'Expected Facility',
      mono: true,
      render: (o) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">
            {formatINR(parseFloat(o.expectedValue) || 0)}
          </span>
          <div className="text-[10px] text-slate-500">{o.probability}% confidence</div>
        </div>
      ),
    },
    {
      key: 'stage',
      header: 'Stage',
      render: (o) => (
        <Badge
          variant={
            o.stage === 'WON'
              ? 'success'
              : o.stage === 'LOST'
              ? 'danger'
              : o.stage === 'PROPOSAL' || o.stage === 'NEGOTIATION'
              ? 'info'
              : 'neutral'
          }
          size="sm"
        >
          {o.stage}
        </Badge>
      ),
    },
    {
      key: 'expectedCloseDate',
      header: 'Target Date',
      render: (o) => (
        <span className="text-xs font-mono text-slate-700">{o.expectedCloseDate || '—'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-slate-700" />
            <span>Relationship Growth & Deals Pipeline</span>
          </h1>
          <p className="text-xs text-slate-500">
            PostgreSQL deal pipeline tracking, credit cross-sell, and relationship expansion.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadOpps} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsNewModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            New Deal
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Active Deals"
          value={opps.length.toString()}
          badge="Live DB"
          badgeVariant="neutral"
        />
        <StatCard
          label="Total Pipeline Value"
          value={formatINR(totalPipeline)}
          badge="Weighted Target"
          badgeVariant="info"
        />
        <StatCard
          label="In Proposal / Neg."
          value={opps.filter((o) => o.stage === 'PROPOSAL' || o.stage === 'NEGOTIATION').length.toString()}
          badge="Advanced"
          badgeVariant="warning"
        />
        <StatCard
          label="Won Mandates"
          value={formatINR(wonPipeline)}
          badge="Realized"
          badgeVariant="success"
        />
      </div>

      {/* Controls & Filter */}
      <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search deals by code, customer, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Deal Stages</option>
              <option value="PROSPECT">Prospect</option>
              <option value="QUALIFIED">Qualified</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="WON">Closed Won</option>
              <option value="LOST">Closed Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
          Error: {error}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredOpps}
          keyExtractor={(o) => String(o.id)}
          onRowClick={handleOpenOpp}
        />
      )}

      {/* Detail Modal */}
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
          maxWidth="2xl"
          footerActions={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500 mr-1">Move Stage:</span>
                {['PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'].map((st) => (
                  <Button
                    key={st}
                    variant={selectedOpp.stage === st ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleUpdateStage(st)}
                    disabled={selectedOpp.stage === st}
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
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Copilot Contextual Quick Actions */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white">Ask Copilot about Deal:</span>
                  <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">{selectedOpp.opportunityCode}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openDrawer({
                    type: 'CUSTOMER',
                    id: selectedOpp.customerId,
                    code: selectedOpp.customerCode,
                    label: `${selectedOpp.customerName || 'Client'} · ${selectedOpp.customerCode || selectedOpp.customerId}`,
                  }, `Review opportunity ${selectedOpp.opportunityCode} (${selectedOpp.title}). What is blocking stage progression and what should I do next?`)}
                  className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium rounded border border-emerald-500/40 transition-colors"
                >
                  Analyze Stage & Next Steps
                </button>
                <button
                  type="button"
                  onClick={() => openDrawer({
                    type: 'CUSTOMER',
                    id: selectedOpp.customerId,
                    code: selectedOpp.customerCode,
                    label: `${selectedOpp.customerName || 'Client'} · ${selectedOpp.customerCode || selectedOpp.customerId}`,
                  }, `Summarize customer relationship for ${selectedOpp.customerName}.`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded border border-slate-700 transition-colors"
                >
                  Customer 360 Summary
                </button>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Target Client</span>
                <div className="font-semibold text-slate-900 mt-0.5">{selectedOpp.customerName}</div>
                <div className="font-mono text-[10px] text-slate-500">{selectedOpp.customerCode}</div>
              </div>
              <div>
                <span className="text-slate-500">Facility Size</span>
                <div className="font-mono font-bold text-slate-900 mt-0.5">
                  {formatINR(parseFloat(selectedOpp.expectedValue) || 0)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Current Stage</span>
                <div className="mt-0.5">
                  <Badge variant={selectedOpp.stage === 'WON' ? 'success' : 'info'} size="sm">
                    {selectedOpp.stage}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Target Close</span>
                <div className="font-mono text-slate-800 mt-0.5">
                  {selectedOpp.expectedCloseDate || '—'}
                </div>
              </div>
            </div>

            {selectedOpp.notes && (
              <div className="p-3 bg-white border border-slate-200 rounded text-xs space-y-1">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">
                  Deal Notes & Term Sheet Parameters
                </span>
                <p className="text-slate-700">{selectedOpp.notes}</p>
              </div>
            )}

            {/* Activities Trail */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">
                Stage Transition & Audit Trail
              </span>
              {detailLoading ? (
                <div className="text-xs text-slate-500 py-2">Loading pipeline events...</div>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {oppDetail?.activities && oppDetail.activities.length > 0 ? (
                    oppDetail.activities.map((act: any) => (
                      <div key={act.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center">
                        <div>
                          <div className="font-medium text-slate-800">{act.description}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{act.activityType}</div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(act.timestamp).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">No previous events.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* New Opportunity Modal */}
      {isNewModalOpen && (
        <Modal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          title="Originate Commercial Opportunity"
          subtitle="Create deal record with PostgreSQL persistence"
          maxWidth="lg"
          footerActions={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" size="sm" onClick={() => setIsNewModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateOpp} disabled={saving || !newTitle.trim()}>
                {saving ? 'Creating...' : 'Originate Opportunity'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateOpp} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Select Client Account</label>
              <select
                value={newCustomerId}
                onChange={(e) => setNewCustomerId(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              >
                <option value={1}>Rahul Sharma (CUS-10482) - Affluent Retail</option>
                <option value={2}>Kalyan Steels & Forgings Ltd (CUS-20841) - Commercial Mid-Market</option>
                <option value={3}>Meera Sundaram (CUS-30915) - Private Banking</option>
                <option value={4}>Sunil Varma (CUS-40182) - Emerging Corporate</option>
                <option value={5}>Ananya Deshmukh (CUS-50824) - Retail Wealth</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Deal Title</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Working Capital Line Enhancement"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Expected Facility Size (INR)</label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Initial Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                >
                  <option value="PROSPECT">Prospect</option>
                  <option value="QUALIFIED">Qualified</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="NEGOTIATION">Negotiation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Target Close Date</label>
              <input
                type="date"
                value={newCloseDate}
                onChange={(e) => setNewCloseDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Deal Synopsis & Notes</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Facility justification, credit rating, collateral notes..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
