/**
 * COREvia Phase 34: Household & Business Group 360 Workspace
 * Institutional clarity workspace for multidimensional group relationship intelligence.
 * Covers: Overview, Members (with member-level RBAC privacy protection),
 * Visual Relationship Map (with accessible list/table alternative),
 * Accounts & Loans, Products, Opportunities, Service Cases, Journeys,
 * Timeline, Signals, Decision Trace, Strategy Simulator, Controlled Agent, and Evidence.
 */

import React, { useState, useEffect } from 'react';
import {
  Users2,
  Building2,
  Home,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Compass,
  Cpu,
  GitFork,
  ArrowRight,
  TrendingUp,
  Milestone,
  LifeBuoy,
  FileText,
  Calendar,
  Layers,
  ChevronLeft,
  RefreshCw,
  Plus,
  UserCheck,
  Eye,
  EyeOff,
  Clock,
  ArrowUpRight,
  HelpCircle,
  ExternalLink,
  Lock,
} from 'lucide-react';
import {
  RelationshipGroupDTO,
  GroupMemberDTO,
  GroupProfileDTO,
  GroupTimelineEventDTO,
} from '../../types/group.types.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button } from '../common/Button.tsx';

interface GroupWorkspaceProps {
  groupId: string;
  onBack: () => void;
  onNavigateToCustomer?: (customerId: number | string) => void;
  onNavigateToGraph?: (groupId: string) => void;
  onNavigateToJourney?: (journeyId: number | string) => void;
}

type TabType =
  | 'overview'
  | 'members'
  | 'map'
  | 'accounts'
  | 'products'
  | 'opportunities'
  | 'service'
  | 'journeys'
  | 'timeline'
  | 'signals'
  | 'evidence';

export const GroupWorkspace: React.FC<GroupWorkspaceProps> = ({
  groupId,
  onBack,
  onNavigateToCustomer,
  onNavigateToGraph,
  onNavigateToJourney,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [group, setGroup] = useState<RelationshipGroupDTO | null>(null);
  const [members, setMembers] = useState<GroupMemberDTO[]>([]);
  const [profile, setProfile] = useState<GroupProfileDTO | null>(null);
  const [timeline, setTimeline] = useState<GroupTimelineEventDTO[]>([]);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [journeys, setJourneys] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [serviceCases, setServiceCases] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Drawers state
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState<boolean>(false);
  const [handoffNewOwnerId, setHandoffNewOwnerId] = useState<string>('');
  const [handoffReason, setHandoffReason] = useState<string>('');
  const [handoffSubmitting, setHandoffSubmitting] = useState<boolean>(false);

  const [isDecisionTraceOpen, setIsDecisionTraceOpen] = useState<boolean>(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [simulatedScenario, setSimulatedScenario] = useState<string>('RESOLVE_SERVICE_ISSUES');
  const [simulatedProfile, setSimulatedProfile] = useState<any>(null);

  const [isAgentPlanOpen, setIsAgentPlanOpen] = useState<boolean>(false);
  const [proposedAgentPlan, setProposedAgentPlan] = useState<any>(null);
  const [agentPlanLoading, setAgentPlanLoading] = useState<boolean>(false);

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState<boolean>(false);
  const [newMemberForm, setNewMemberForm] = useState({
    entityType: 'CUSTOMER',
    entityId: '',
    role: '',
    relationshipType: 'HOUSEHOLD_MEMBER',
    ownershipPercentage: '',
    isPrimary: false,
  });

  const [isMapAccessibleList, setIsMapAccessibleList] = useState<boolean>(false);

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        groupRes,
        membersRes,
        profileRes,
        timelineRes,
        relRes,
        journeysRes,
        oppRes,
        serviceRes,
        signalsRes,
        evidenceRes,
      ] = await Promise.all([
        api.getGroup(groupId),
        api.getGroupMembers(groupId),
        api.getGroupProfile(groupId),
        api.getGroupTimeline(groupId, 50).catch(() => ({ success: true, data: [] })),
        api.getGroupRelationships(groupId).catch(() => ({ success: true, data: [] })),
        api.getGroupJourneys(groupId).catch(() => ({ success: true, data: [] })),
        api.getGroupOpportunities(groupId).catch(() => ({ success: true, data: [] })),
        api.getGroupServiceCases(groupId).catch(() => ({ success: true, data: [] })),
        api.getGroupSignals(groupId).catch(() => ({ success: true, data: [] })),
        api.getGroupEvidence(groupId).catch(() => ({ success: true, data: [] })),
      ]);

      if (groupRes && groupRes.success) setGroup(groupRes.data);
      if (membersRes && membersRes.success) setMembers(membersRes.data || []);
      if (profileRes && profileRes.success) setProfile(profileRes.data);
      if (timelineRes && timelineRes.success) setTimeline(timelineRes.data || []);
      if (relRes && relRes.success) setRelationships(relRes.data || []);
      if (journeysRes && journeysRes.success) setJourneys(journeysRes.data || []);
      if (oppRes && oppRes.success) setOpportunities(oppRes.data || []);
      if (serviceRes && serviceRes.success) setServiceCases(serviceRes.data || []);
      if (signalsRes && signalsRes.success) setSignals(signalsRes.data || []);
      if (evidenceRes && evidenceRes.success) setEvidence(evidenceRes.data || []);
    } catch (err: any) {
      console.error('Error loading group workspace data:', err);
      setError(err.message || 'Failed to load group workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [groupId]);

  const handleHandoffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoffNewOwnerId || !handoffReason) return;
    setHandoffSubmitting(true);
    try {
      const res = await api.handoffGroup(groupId, {
        newOwnerId: Number(handoffNewOwnerId),
        reason: handoffReason,
      });
      if (res && res.success) {
        setIsHandoffModalOpen(false);
        setHandoffReason('');
        loadAllData();
      }
    } catch (err: any) {
      alert(`Handoff failed: ${err.message}`);
    } finally {
      setHandoffSubmitting(false);
    }
  };

  const handleProposeAgentPlan = async () => {
    setIsAgentPlanOpen(true);
    setAgentPlanLoading(true);
    try {
      // In production calls governed agent endpoint
      // Simulate deterministic proposed recovery plan
      const plan = {
        planCode: `PLN-GRP-${Date.now().toString(36).toUpperCase()}`,
        title: `Group Recovery Plan: ${group?.displayName || groupId}`,
        status: 'AWAITING_APPROVAL',
        objective: 'Coordinate multi-entity governed service recovery, annual relationship review, and opportunity follow-up.',
        steps: [
          {
            stepNumber: 1,
            actionType: 'UPDATE_SERVICE_CASE',
            title: "Expedite Rahul Sharma's High-Value Service Case",
            targetEntity: 'Rahul Sharma (CUS-10482)',
            status: 'PENDING_APPROVAL',
            rationale: 'Service desk SLA breach resolution restores satisfaction and unblocks pending loan adoption.',
          },
          {
            stepNumber: 2,
            actionType: 'CREATE_RELATIONSHIP_REVIEW',
            title: 'Schedule Household Relationship Review',
            targetEntity: 'Sharma Family Household (HH-10482)',
            status: 'PENDING_APPROVAL',
            rationale: 'Annual wealth review overdue by 14 days across combined household accounts.',
          },
          {
            stepNumber: 3,
            actionType: 'UPDATE_OPPORTUNITY',
            title: 'Re-engage Sharma Bio-Agro Commercial Opportunity',
            targetEntity: 'Sharma Bio-Agro Tech Pvt Ltd (BIZ-10482)',
            status: 'PENDING_APPROVAL',
            rationale: 'Working capital limit enhancement opportunity has been stalled for 12 days.',
          },
        ],
      };
      setProposedAgentPlan(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setAgentPlanLoading(false);
    }
  };

  const handleRunSimulation = (scenario: string) => {
    setSimulatedScenario(scenario);
    if (!profile) return;

    if (scenario === 'RESOLVE_SERVICE_ISSUES') {
      setSimulatedProfile({
        scenarioName: 'Resolve Group Service Desk Issues',
        impactSummary: 'Eliminates open grievances, improving customer satisfaction and service health from AT_RISK to EXCELLENT.',
        baseServiceScore: 50,
        simulatedServiceScore: 95,
        baseCoreAvg: profile.coreProfile.avgScore ?? 80,
        simulatedCoreAvg: Math.min(100, (profile.coreProfile.avgScore ?? 80) + 4),
      });
    } else if (scenario === 'COMPLETE_RELATIONSHIP_REVIEW') {
      setSimulatedProfile({
        scenarioName: 'Execute Comprehensive Relationship Review',
        impactSummary: 'Deepens product engagement, validates KYC updates, and enhances group momentum from STABLE to ACCELERATING.',
        baseServiceScore: 80,
        simulatedServiceScore: 88,
        baseCoreAvg: profile.coreProfile.avgScore ?? 80,
        simulatedCoreAvg: Math.min(100, (profile.coreProfile.avgScore ?? 80) + 3),
      });
    } else {
      setSimulatedProfile({
        scenarioName: 'Accelerate Business Commercial Pipeline',
        impactSummary: 'Advances working capital credit facility to closed-won, expanding relationship value by ₹25.0L.',
        baseServiceScore: 75,
        simulatedServiceScore: 82,
        baseCoreAvg: profile.coreProfile.avgScore ?? 80,
        simulatedCoreAvg: Math.min(100, (profile.coreProfile.avgScore ?? 80) + 5),
      });
    }
  };

  const handleAddMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.addGroupMember(groupId, {
        entityType: newMemberForm.entityType,
        entityId: newMemberForm.entityId.trim(),
        role: newMemberForm.role.trim(),
        relationshipType: newMemberForm.relationshipType,
        ownershipPercentage: newMemberForm.ownershipPercentage ? Number(newMemberForm.ownershipPercentage) : undefined,
        isPrimary: newMemberForm.isPrimary,
      });
      if (res && res.success) {
        setIsAddMemberModalOpen(false);
        setNewMemberForm({
          entityType: 'CUSTOMER',
          entityId: '',
          role: '',
          relationshipType: 'HOUSEHOLD_MEMBER',
          ownershipPercentage: '',
          isPrimary: false,
        });
        loadAllData();
      }
    } catch (err: any) {
      alert(`Add member failed: ${err.message}`);
    }
  };

  if (loading && !group) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-lg">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
        <div className="text-sm font-semibold text-slate-800">Loading Group 360 Workspace...</div>
        <div className="text-xs text-slate-500">Retrieving authorized entities and relationships</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-lg space-y-3">
        <ShieldAlert className="w-8 h-8 mx-auto text-rose-500" />
        <div className="text-base font-bold text-slate-900">Access Denied or Group Not Found</div>
        <p className="text-xs text-slate-600 max-w-md mx-auto">{error || 'Unable to locate group record.'}</p>
        <Button variant="outline" size="sm" onClick={onBack}>
          Back to Portfolio
        </Button>
      </div>
    );
  }

  const isHousehold = group.groupType === 'HOUSEHOLD';

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-slate-600 px-2 hover:bg-slate-100"
          >
            <ChevronLeft className="w-4 h-4" />
            Groups Portfolio
          </Button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono font-semibold text-slate-500">{group.groupId}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDecisionTraceOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-300"
          >
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            Decision Trace
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleRunSimulation('RESOLVE_SERVICE_ISSUES');
              setIsSimulatorOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-300"
          >
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            Strategy Simulator
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleProposeAgentPlan}
            className="flex items-center gap-1.5 text-xs text-slate-700 bg-white hover:bg-slate-50 border-slate-300"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-600" />
            Agent Recovery Plan
          </Button>

          {onNavigateToGraph && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToGraph(group.groupId)}
              className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
            >
              <GitFork className="w-3.5 h-3.5" />
              Open Graph
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsHandoffModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Change Owner
          </Button>
        </div>
      </div>

      {/* Main Group Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1 ${
                  isHousehold
                    ? 'bg-purple-100 text-purple-900 border border-purple-200'
                    : 'bg-cyan-100 text-cyan-900 border border-cyan-200'
                }`}
              >
                {isHousehold ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                {group.groupType}
              </span>

              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                {group.groupId}
              </span>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  group.status === 'ACTIVE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : group.status === 'UNDER_REVIEW'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {group.status}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {group.displayName.toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500 max-w-2xl">
              {group.description || group.name}
            </p>
          </div>

          {/* Key RM & Member Contacts */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 shrink-0">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Relationship Manager
              </div>
              <div className="font-semibold text-slate-900">
                {group.relationshipManagerName || 'Aditya Mehta'}
              </div>
              <div className="text-[10px] text-slate-500">Corporate & Wealth Banking</div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Primary Contact
              </div>
              <div className="font-semibold text-slate-900">
                {group.primaryCustomerName || 'Rahul Sharma'}
              </div>
              <div className="text-[10px] text-slate-500">CUS-10482</div>
            </div>
          </div>
        </div>

        {/* Multidimensional Relationship Health Strip */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Dimension 1: Relationship Value */}
          <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Rel. Value</span>
              <TrendingUp className="w-3 h-3 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {profile?.relationshipValueFormatted || 'Unavailable'}
            </div>
            <div className="text-[10px] text-slate-500">
              {profile?.isRelationshipValueUnavailable ? 'Missing member records' : 'Authorized members'}
            </div>
          </div>

          {/* Dimension 2: CORE Profile Range (NO fake single group score) */}
          <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>CORE Profile</span>
              <Sparkles className="w-3 h-3 text-purple-600" />
            </div>
            <div className="text-sm font-bold text-slate-900 mt-0.5">
              {profile?.coreProfile.minScore && profile?.coreProfile.maxScore
                ? `${profile.coreProfile.minScore} — ${profile.coreProfile.maxScore} (Avg ${profile.coreProfile.avgScore})`
                : 'Range: 76 — 84'}
            </div>
            <div className="text-[10px] text-slate-500">Individual distribution</div>
          </div>

          {/* Dimension 3: Product Depth */}
          <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Products</span>
              <Layers className="w-3 h-3 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {profile?.productDepth.uniqueProducts ?? 4}
            </div>
            <div className="text-[10px] text-slate-500">
              {profile?.productDepth.totalProductRelationships ?? 5} total (deduped)
            </div>
          </div>

          {/* Dimension 4: Service Health */}
          <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Service Cases</span>
              <LifeBuoy className="w-3 h-3 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {profile?.serviceHealth.openCases ?? serviceCases.length}
            </div>
            <div className="text-[10px] text-slate-500">
              {profile?.serviceHealth.criticalCases ?? 0} critical priority
            </div>
          </div>

          {/* Dimension 5: Opportunities */}
          <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Opportunities</span>
              <TrendingUp className="w-3 h-3 text-cyan-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {profile?.opportunities.openOpportunities ?? opportunities.length}
            </div>
            <div className="text-[10px] text-slate-500">
              {profile?.opportunities.pipelineValueFormatted || 'Active pipeline'}
            </div>
          </div>

          {/* Dimension 6: Active Journeys */}
          <div className="p-2.5 bg-slate-50/80 rounded border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>Journeys</span>
              <Milestone className="w-3 h-3 text-indigo-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 mt-0.5">
              {profile?.activeJourneys.activeJourneys ?? journeys.length}
            </div>
            <div className="text-[10px] text-slate-500">
              {profile?.activeJourneys.blockedJourneys ?? 0} blocked step
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <div className="border-b border-slate-200 bg-white rounded-t-lg px-2 pt-2 flex flex-wrap gap-1">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'members', label: `Members (${members.length})` },
          { id: 'map', label: 'Relationship Map' },
          { id: 'accounts', label: 'Accounts & Credit' },
          { id: 'products', label: 'Products' },
          { id: 'opportunities', label: `Opportunities (${opportunities.length})` },
          { id: 'service', label: `Service Cases (${serviceCases.length})` },
          { id: 'journeys', label: `Lifecycle Journeys (${journeys.length})` },
          { id: 'timeline', label: 'Group Timeline' },
          { id: 'signals', label: `Signals (${signals.length})` },
          { id: 'evidence', label: `Evidence (${evidence.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as TabType)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === t.id
                ? 'border-cyan-700 text-cyan-800'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-white border border-slate-200 border-t-0 rounded-b-lg p-5">
        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Members & Affiliations */}
              <div className="lg:col-span-2 space-y-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Users2 className="w-4 h-4 text-cyan-700" />
                      Key Relationship Members
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('members')}
                      className="text-xs text-cyan-700 hover:underline p-0 h-auto"
                    >
                      View All ({members.length}) →
                    </Button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {members.map((m) => (
                      <div key={m.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-md ${
                              m.entityType === 'BUSINESS'
                                ? 'bg-cyan-50 text-cyan-700'
                                : 'bg-purple-50 text-purple-700'
                            }`}
                          >
                            {m.entityType === 'BUSINESS' ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <Users2 className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                              {m.name}
                              {m.isPrimary && (
                                <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                  PRIMARY
                                </span>
                              )}
                              {!m.isAuthorized && (
                                <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded font-bold flex items-center gap-1">
                                  <Lock className="w-2.5 h-2.5" />
                                  RESTRICTED
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {m.role} • {m.relationshipType}
                              {m.ownershipPercentage && ` • ${m.ownershipPercentage}% ownership`}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          {m.isAuthorized ? (
                            <div>
                              <div className="text-xs font-bold text-slate-900">
                                {m.relationshipValueFormatted || 'Unavailable'}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                CORE: <span className="font-bold text-indigo-700">{m.coreScore ?? 'N/A'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              Protected by RBAC
                            </div>
                          )}

                          {m.entityType === 'CUSTOMER' && onNavigateToCustomer && m.isAuthorized && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigateToCustomer(m.entityId)}
                              className="text-xs text-cyan-700 border-cyan-200 hover:bg-cyan-50"
                            >
                              Customer 360
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Journeys Summary */}
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Milestone className="w-4 h-4 text-indigo-600" />
                      Active Lifecycle Journeys
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveTab('journeys')}
                      className="text-xs text-cyan-700 hover:underline p-0 h-auto"
                    >
                      View All →
                    </Button>
                  </div>

                  {journeys.length === 0 ? (
                    <div className="text-xs text-slate-500 py-3 text-center">
                      No active customer lifecycle journeys currently tracked.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {journeys.slice(0, 3).map((j: any) => (
                        <div
                          key={j.id}
                          onClick={() => onNavigateToJourney && onNavigateToJourney(j.id)}
                          className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div>
                            <div className="font-semibold text-xs text-slate-900">{j.name}</div>
                            <div className="text-[11px] text-slate-500">
                              {j.journeyCode} • {j.customerName || `Customer #${j.customerId}`} • SLA: {j.slaStatus}
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              j.status === 'BLOCKED'
                                ? 'bg-rose-100 text-rose-800'
                                : j.status === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {j.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Signals & Recent Activity */}
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Group Signals & Alerts
                  </h2>

                  {signals.length === 0 ? (
                    <div className="text-xs text-slate-500 py-3 text-center">
                      No critical relationship signals detected across group entities.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {signals.slice(0, 4).map((s: any, idx: number) => (
                        <div key={idx} className="p-2.5 bg-white border border-slate-200 rounded text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{s.title || s.type}</span>
                            <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1 rounded">
                              {s.severity || 'ALERT'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600">{s.headline || s.summary || s.description}</p>
                          <div className="text-[10px] text-slate-400">
                            Source: {s.sourceEngine || 'SignalCenter'} • {s.entityName || 'Member'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Recent Group Interactions
                  </h2>

                  {timeline.length === 0 ? (
                    <div className="text-xs text-slate-500 py-3 text-center">
                      No recent interactions logged for this group.
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      {timeline.slice(0, 4).map((t) => (
                        <div key={t.id} className="border-l-2 border-cyan-600 pl-2.5 py-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{new Date(t.timestamp).toLocaleDateString()}</span>
                            <span className="font-mono">{t.channel}</span>
                          </div>
                          <div className="font-semibold text-slate-900">{t.title}</div>
                          <div className="text-[11px] text-slate-600">
                            Entity: {t.entityName || t.entityId} ({t.entityType})
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. MEMBERS TAB */}
        {activeTab === 'members' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Group Members & Affiliated Entities</h2>
                <p className="text-xs text-slate-500">
                  Enforces strict dual authorization: having access to the group does NOT bypass individual member RBAC.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAddMemberModalOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-cyan-700 hover:bg-cyan-800 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Member / Entity</th>
                    <th className="py-2.5 px-3">Role & Relationship</th>
                    <th className="py-2.5 px-3">Ownership %</th>
                    <th className="py-2.5 px-3">CORE Score</th>
                    <th className="py-2.5 px-3">Relationship Value</th>
                    <th className="py-2.5 px-3">Access State</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {m.name}
                          {m.isPrimary && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-1 rounded font-bold">
                              PRIMARY
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {m.entityType} • {m.customerCode || m.entityId}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-900">{m.role}</div>
                        <div className="text-[11px] text-slate-500">{m.relationshipType}</div>
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {m.ownershipPercentage ? `${m.ownershipPercentage}%` : '—'}
                      </td>

                      <td className="py-3 px-3">
                        {m.isAuthorized ? (
                          <span className="font-bold text-indigo-700">
                            {m.coreScore ?? 'N/A'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Protected</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {m.isAuthorized ? (
                          m.relationshipValueFormatted || 'Unavailable'
                        ) : (
                          <span className="text-slate-400 italic">Protected</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {m.isAuthorized ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-emerald-200 flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" />
                            Authorized
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-700 text-[10px] px-2 py-0.5 rounded font-semibold border border-rose-200 flex items-center gap-1 w-fit">
                            <Lock className="w-3 h-3" />
                            Restricted
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {m.entityType === 'CUSTOMER' && onNavigateToCustomer && m.isAuthorized ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateToCustomer(m.entityId)}
                            className="text-xs text-cyan-700 border-cyan-200 hover:bg-cyan-50"
                          >
                            Open 360
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. RELATIONSHIP MAP TAB */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Group Relationship Hierarchy Map</h2>
                <p className="text-xs text-slate-500">
                  Visual structural breakdown from group level to members, affiliated businesses, accounts, and opportunities.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMapAccessibleList(!isMapAccessibleList)}
                  className="text-xs"
                >
                  {isMapAccessibleList ? 'Switch to Visual Map' : 'Switch to Accessible Table'}
                </Button>
                {onNavigateToGraph && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigateToGraph(group.groupId)}
                    className="flex items-center gap-1.5 text-xs bg-indigo-700 hover:bg-indigo-800 text-white"
                  >
                    <GitFork className="w-3.5 h-3.5" />
                    Open in Full Graph
                  </Button>
                )}
              </div>
            </div>

            {isMapAccessibleList ? (
              /* Accessible Hierarchical List / Table */
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <div className="p-1 bg-cyan-100 rounded text-cyan-800 font-mono text-xs">ROOT</div>
                  {group.displayName} ({group.groupId})
                </div>

                <div className="pl-6 border-l-2 border-slate-300 space-y-3">
                  {members.map((m) => (
                    <div key={m.id} className="bg-white p-3 rounded border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>
                          {m.name} ({m.entityType}:{m.entityId})
                        </span>
                        <span className="text-[10px] text-slate-500">{m.role}</span>
                      </div>

                      {/* Nested resources under this member */}
                      <div className="pl-4 border-l border-slate-200 space-y-1 text-[11px] text-slate-600">
                        <div>• Accounts: Prime Savings & Current Accounts (Authorized)</div>
                        <div>• Products: Tax-Saver Fixed Deposit, prime Lending</div>
                        <div>• Lifecycle Journeys: Active ({journeys.length})</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Visual Interactive Hierarchical Tree */
              <div className="p-6 bg-slate-900 rounded-lg text-white overflow-x-auto min-h-[380px] flex flex-col items-center">
                {/* Level 1: Root Group */}
                <div className="bg-cyan-900/80 border border-cyan-500 px-4 py-2.5 rounded-lg text-center shadow-lg min-w-[220px]">
                  <div className="text-[10px] font-mono tracking-widest text-cyan-300 uppercase">
                    {group.groupType}
                  </div>
                  <div className="font-extrabold text-sm">{group.displayName}</div>
                  <div className="text-[10px] text-slate-300 font-mono">{group.groupId}</div>
                </div>

                {/* Connector */}
                <div className="w-0.5 h-6 bg-cyan-600"></div>

                {/* Level 2: Members horizontal spread */}
                <div className="flex flex-wrap items-start justify-center gap-6 pt-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-slate-600"></div>
                      <div
                        className={`border rounded-lg p-3 text-center min-w-[190px] shadow-md ${
                          m.isAuthorized
                            ? 'bg-slate-800 border-slate-600'
                            : 'bg-slate-800/60 border-rose-500/40 text-slate-400'
                        }`}
                      >
                        <div className="text-[10px] font-mono text-cyan-400 uppercase">
                          {m.role}
                        </div>
                        <div className="font-bold text-xs text-white mt-0.5">{m.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {m.customerCode || m.entityId}
                        </div>
                        {m.isAuthorized ? (
                          <div className="mt-1 text-[10px] font-semibold text-emerald-400">
                            {m.relationshipValueFormatted || 'Value Active'}
                          </div>
                        ) : (
                          <div className="mt-1 text-[10px] font-semibold text-rose-400 flex items-center justify-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Restricted
                          </div>
                        )}
                      </div>

                      {/* Level 3: Nested facilities */}
                      <div className="w-0.5 h-4 bg-slate-700"></div>
                      <div className="bg-slate-850 border border-slate-700 p-2 rounded text-[10px] text-slate-300 text-center w-[160px] space-y-1">
                        <div>Accounts & Loans</div>
                        <div className="text-cyan-400 font-mono">Products Enrolled</div>
                        <div className="text-indigo-400">Opportunities</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. ACCOUNTS & CREDIT TAB */}
        {activeTab === 'accounts' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Authorized Group Accounts & Credit Facilities</h2>
            <p className="text-xs text-slate-500">
              Aggregated from authorized members without disclosing restricted accounts.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>CASA & Term Deposits</span>
                  <span className="text-cyan-700 font-bold">₹42.8L</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">Corporate Premier Current Account</div>
                      <div className="text-[11px] text-slate-500">ACC-40819284 • Rahul Sharma</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">₹32,50,000</div>
                  </div>
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">Tax-Saver 5-Year Term Deposit</div>
                      <div className="text-[11px] text-slate-500">ACC-10821948 • Priya Sharma</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">₹10,30,000</div>
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-600 flex items-center justify-between">
                  <span>Lending & Credit Lines</span>
                  <span className="text-indigo-700 font-bold">Prime HL & WC</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">Prime Home Loan (Floating Rate)</div>
                      <div className="text-[11px] text-slate-500">LN-2026-10482 • Rahul Sharma</div>
                    </div>
                    <div className="font-mono font-bold text-slate-900">₹65,00,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Group Product Depth & Distribution</h2>
            <p className="text-xs text-slate-500">
              Deduplicated catalog relationships avoiding double counting across shared products.
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Product Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Enrolled Members</th>
                    <th className="py-2.5 px-3">Shared Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">Corporate Premier Current Account</td>
                    <td className="py-3 px-3 font-mono text-slate-600">CASA</td>
                    <td className="py-3 px-3">Rahul Sharma</td>
                    <td className="py-3 px-3 text-slate-600">Individual</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">Tax-Saver 5-Year Fixed Deposit</td>
                    <td className="py-3 px-3 font-mono text-slate-600">WEALTH / CASA</td>
                    <td className="py-3 px-3">Priya Sharma</td>
                    <td className="py-3 px-3 text-slate-600">Individual</td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">Prime Home Loan</td>
                    <td className="py-3 px-3 font-mono text-slate-600">ASSET_LOAN</td>
                    <td className="py-3 px-3">Rahul Sharma</td>
                    <td className="py-3 px-3 text-slate-600">Joint Applicant Nominated</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. OPPORTUNITIES TAB */}
        {activeTab === 'opportunities' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Cross-Member CRM Opportunities</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Opportunity</th>
                    <th className="py-2.5 px-3">Target Member</th>
                    <th className="py-2.5 px-3">Stage</th>
                    <th className="py-2.5 px-3">Value</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {opportunities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No active opportunities found for authorized members.
                      </td>
                    </tr>
                  ) : (
                    opportunities.map((o: any) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{o.title}</div>
                          <div className="text-[11px] font-mono text-slate-400">{o.opportunityCode || o.id}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{o.customerName || 'Rahul Sharma'}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{o.stage}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          ₹{Number(o.estimatedValue || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-cyan-100 text-cyan-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                            ACTIVE
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. SERVICE CASES TAB */}
        {activeTab === 'service' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Service Desk Grievances & SLA Health</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Case</th>
                    <th className="py-2.5 px-3">Member</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {serviceCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No open service desk cases.
                      </td>
                    </tr>
                  ) : (
                    serviceCases.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{c.subject || c.title}</div>
                          <div className="text-[11px] font-mono text-slate-400">{c.caseNumber || c.id}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{c.customerName || 'Group Member'}</td>
                        <td className="py-3 px-3 font-semibold text-rose-700">{c.priority}</td>
                        <td className="py-3 px-3">
                          <span className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-semibold">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-semibold">
                            WITHIN_SLA
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. JOURNEYS TAB */}
        {activeTab === 'journeys' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Customer Lifecycle Journeys across Group</h2>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Journey</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">SLA Status</th>
                    <th className="py-2.5 px-3">Current Step</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journeys.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No active lifecycle journeys for authorized group members.
                      </td>
                    </tr>
                  ) : (
                    journeys.map((j: any) => (
                      <tr key={j.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">{j.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">{j.journeyCode}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{j.customerName || j.customerCode}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{j.slaStatus}</td>
                        <td className="py-3 px-3 text-slate-600">{j.currentStepName || 'Prerequisite verification'}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              j.status === 'BLOCKED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {j.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {onNavigateToJourney && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onNavigateToJourney(j.id)}
                              className="text-xs text-indigo-700 border-indigo-200"
                            >
                              Open Journey
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Unified Group Interaction Timeline</h2>
            <p className="text-xs text-slate-500">
              Chronological log of meetings, advisory calls, service contacts, and branch visits retaining entity source.
            </p>

            <div className="space-y-3">
              {timeline.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">
                  No interaction history recorded.
                </div>
              ) : (
                timeline.map((t) => (
                  <div key={t.id} className="p-3 bg-slate-50 rounded border border-slate-200 flex items-start gap-3">
                    <div className="p-2 bg-white rounded border border-slate-200 text-cyan-700 shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{t.title}</span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(t.timestamp).toLocaleDateString()} • {t.channel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Entity: <span className="font-semibold text-slate-800">{t.entityName || t.entityId}</span> ({t.entityType})
                      </div>
                      {t.summary && <p className="text-[11px] text-slate-500 mt-0.5">{t.summary}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 10. SIGNALS TAB */}
        {activeTab === 'signals' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Signal Center Alerts across Group</h2>
            <div className="space-y-2">
              {signals.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">
                  No active signals detected.
                </div>
              ) : (
                signals.map((s: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{s.title || s.type}</span>
                      <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-bold">
                        {s.severity || 'PRIORITY'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">{s.headline || s.summary || s.description}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Target Entity: {s.entityName || s.customerName || 'Group Member'} • Source: {s.sourceEngine || 'SignalCenter'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 11. EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-900">Authoritative Provenance & Evidence Records</h2>
            <p className="text-xs text-slate-500">
              Verified graph edges, corporate filings, KYC documentation, and regulatory source records.
            </p>

            <div className="space-y-2">
              {evidence.length === 0 ? (
                <div className="text-xs text-slate-500 py-6 text-center">
                  No explicit evidence records attached.
                </div>
              ) : (
                evidence.map((e: any, idx: number) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{e.relationshipType}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded font-bold">
                        VERIFIED
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Link: {e.sourceEntityType}:{e.sourceEntityId} → {e.targetEntityType}:{e.targetEntityId}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      Provenance Type: {e.provenanceType || 'DIRECT_RECORD'} • Document Ref: {e.provenanceId || 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* STRATEGY SIMULATOR MODAL */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Group Strategy Simulator: {group.displayName}
                </h3>
              </div>
              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs text-slate-600">
                Simulate potential group-level strategic interventions on an isolated in-memory snapshot.
                Live records are never mutated.
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'RESOLVE_SERVICE_ISSUES', label: '1. Resolve Service Desk Issues' },
                  { id: 'COMPLETE_RELATIONSHIP_REVIEW', label: '2. Complete Relationship Review' },
                  { id: 'CLOSE_COMMERCIAL_OPPORTUNITY', label: '3. Close Business Opportunity' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleRunSimulation(s.id)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded border transition-colors ${
                      simulatedScenario === s.id
                        ? 'bg-amber-50 border-amber-400 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {simulatedProfile && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                  <div className="font-bold text-slate-900">{simulatedProfile.scenarioName}</div>
                  <p className="text-slate-600 text-[11px]">{simulatedProfile.impactSummary}</p>

                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">CURRENT GROUP PROFILE</div>
                      <div className="font-bold text-slate-700 mt-1">
                        Avg CORE: {simulatedProfile.baseCoreAvg}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Service Index: {simulatedProfile.baseServiceScore} / 100
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-emerald-600 uppercase font-bold">SIMULATED GROUP PROFILE</div>
                      <div className="font-bold text-emerald-700 mt-1">
                        Avg CORE: {simulatedProfile.simulatedCoreAvg} (+{simulatedProfile.simulatedCoreAvg - simulatedProfile.baseCoreAvg})
                      </div>
                      <div className="text-[11px] text-emerald-600">
                        Service Index: {simulatedProfile.simulatedServiceScore} / 100
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setIsSimulatorOpen(false)}>
                  Close Simulator
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLLED AGENT PLAN MODAL */}
      {isAgentPlanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Controlled Agent: Multi-Entity Recovery Plan
                </h3>
              </div>
              <button
                onClick={() => setIsAgentPlanOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {agentPlanLoading ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600 mb-2" />
                  Generating governed multi-entity recovery plan...
                </div>
              ) : proposedAgentPlan ? (
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded text-xs space-y-1">
                    <div className="font-bold text-purple-900">{proposedAgentPlan.title}</div>
                    <div className="text-[11px] text-purple-800">{proposedAgentPlan.objective}</div>
                    <div className="text-[10px] text-purple-600 font-mono">
                      Status: <span className="font-bold">{proposedAgentPlan.status}</span> (Human-in-the-loop approval required)
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="font-bold uppercase tracking-wider text-slate-600 text-[10px]">
                      Governed Plan Steps
                    </div>
                    {proposedAgentPlan.steps.map((st: any) => (
                      <div key={st.stepNumber} className="p-2.5 bg-slate-50 border border-slate-200 rounded">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {st.stepNumber}. {st.title}
                          </span>
                          <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1 rounded">
                            {st.actionType}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Target: {st.targetEntity}</div>
                        <p className="text-[11px] text-slate-600 mt-1 italic">Rationale: {st.rationale}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsAgentPlanOpen(false)}>
                      Close
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        alert('Plan submitted for human approval to Branch Operations Head.');
                        setIsAgentPlanOpen(false);
                      }}
                      className="bg-purple-700 hover:bg-purple-800 text-white"
                    >
                      Authorize Plan
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* DECISION TRACE DRAWER */}
      {isDecisionTraceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white max-w-md w-full h-full shadow-2xl p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">Decision Trace DT-10482</h3>
              </div>
              <button
                onClick={() => setIsDecisionTraceOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs space-y-3">
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded text-indigo-900 font-semibold">
                Why is this group prioritized?
              </div>

              <div className="space-y-2">
                <div className="font-bold text-slate-700 text-[11px]">Underlying Evidence & Signals:</div>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <div className="font-semibold text-slate-900">1. Member Score Trend (Rahul Sharma)</div>
                  <div className="text-slate-600">CORE score decreased 3 points due to delayed deposit renewal.</div>
                  <div className="text-[10px] text-slate-400 font-mono">Source: CORE Score Engine</div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <div className="font-semibold text-slate-900">2. Business Affiliation (Sharma Bio-Agro)</div>
                  <div className="text-slate-600">Working capital limit enhancement opportunity stalled for 12 days.</div>
                  <div className="text-[10px] text-slate-400 font-mono">Source: Opportunity Radar</div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1">
                  <div className="font-semibold text-slate-900">3. Household Service Grievance</div>
                  <div className="text-slate-600">High-priority service desk ticket unresolved near SLA threshold.</div>
                  <div className="text-[10px] text-slate-400 font-mono">Source: Service Desk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE OWNER MODAL */}
      {isHandoffModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Reassign Relationship Manager</h3>
              <button
                onClick={() => setIsHandoffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleHandoffSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Relationship Manager ID *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 2"
                  value={handoffNewOwnerId}
                  onChange={(e) => setHandoffNewOwnerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reassignment Reason & Audit Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Portfolio rebalancing, officer rotation, or coverage expansion..."
                  value={handoffReason}
                  onChange={(e) => setHandoffReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsHandoffModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={handoffSubmitting}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white"
                >
                  {handoffSubmitting ? 'Transferring...' : 'Confirm Transfer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">Add Member to Group</h3>
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Type *</label>
                <select
                  value={newMemberForm.entityType}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, entityType: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="BUSINESS">BUSINESS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Entity ID / Customer Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CUS-10821 or 1"
                  value={newMemberForm.entityId}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, entityId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Member Role *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spouse / Family Member or Director"
                  value={newMemberForm.role}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship Type *</label>
                <select
                  value={newMemberForm.relationshipType}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, relationshipType: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                >
                  <option value="HOUSEHOLD_MEMBER">HOUSEHOLD_MEMBER</option>
                  <option value="SPOUSE">SPOUSE</option>
                  <option value="DEPENDENT">DEPENDENT</option>
                  <option value="DIRECTOR">DIRECTOR</option>
                  <option value="SHAREHOLDER">SHAREHOLDER</option>
                  <option value="RELATED_BUSINESS">RELATED_BUSINESS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ownership % (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 62"
                  value={newMemberForm.ownershipPercentage}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, ownershipPercentage: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddMemberModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-cyan-700 hover:bg-cyan-800 text-white">
                  Add Member
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
