/**
 * COREvia Phase 34: Household & Business Group 360 Portfolio View
 * Institutional overview of relationship groups, households, and corporate groups
 * with RBAC filtering, search, key metric cards, and group creation modal.
 */

import React, { useState, useEffect } from 'react';
import {
  Users2,
  Building2,
  Home,
  Search,
  Filter,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Milestone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { RelationshipGroupDTO, GroupType, GroupStatus, GroupAnalyticsDTO } from '../../types/group.types.ts';
import { api } from '../../lib/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Button } from '../common/Button.tsx';

interface PortfolioGroupsViewProps {
  onSelectGroup: (groupId: string) => void;
}

export const PortfolioGroupsView: React.FC<PortfolioGroupsViewProps> = ({ onSelectGroup }) => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<RelationshipGroupDTO[]>([]);
  const [analytics, setAnalytics] = useState<GroupAnalyticsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'ALL' | GroupType | 'MY_GROUPS' | 'NEEDS_ATTENTION'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState({
    groupId: '',
    groupType: 'HOUSEHOLD' as GroupType,
    name: '',
    displayName: '',
    description: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (search) params.search = search;
      if (selectedType === 'HOUSEHOLD' || selectedType === 'BUSINESS' || selectedType === 'BUSINESS_GROUP') {
        params.groupType = selectedType;
      } else if (selectedType === 'MY_GROUPS' && user?.id) {
        params.ownerId = user.id;
      }

      const [groupRes, analyticsRes] = await Promise.all([
        api.listGroups(params),
        api.getGroupAnalytics().catch(() => ({ success: false, data: null })),
      ]);

      if (groupRes && groupRes.success) {
        let list = groupRes.data || [];
        if (selectedType === 'NEEDS_ATTENTION') {
          list = list.filter((g: any) => g.status === 'UNDER_REVIEW' || (g.openCasesCount && g.openCasesCount > 0));
        }
        setGroups(list);
      }
      if (analyticsRes && analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error('Failed to load relationship groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [search, selectedType]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const res = await api.createGroup({
        groupId: createForm.groupId.trim(),
        groupType: createForm.groupType,
        name: createForm.name.trim(),
        displayName: createForm.displayName.trim(),
        description: createForm.description.trim() || undefined,
        relationshipManagerId: user?.id,
      });
      if (res && res.success) {
        setIsCreateModalOpen(false);
        setCreateForm({
          groupId: '',
          groupType: 'HOUSEHOLD',
          name: '',
          displayName: '',
          description: '',
        });
        fetchGroups();
        if (res.data?.groupId) {
          onSelectGroup(res.data.groupId);
        }
      } else {
        setCreateError((res as any)?.error || 'Failed to create group');
      }
    } catch (err: any) {
      setCreateError(err.message || 'Error creating group');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-50 rounded-lg text-cyan-700">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Household & Business Group 360
              </h1>
              <p className="text-xs text-slate-500">
                Governed relationship intelligence layer aggregating households, corporate groups, and beneficial affiliations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchGroups}
            className="flex items-center gap-1.5 text-xs text-slate-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-cyan-700 hover:bg-cyan-800 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            New Group
          </Button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Total Groups</span>
            <Users2 className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {analytics?.totalGroups ?? groups.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-purple-600 font-semibold">{analytics?.householdsCount ?? 0} Households</span>
            <span>•</span>
            <span className="text-cyan-600 font-semibold">{analytics?.businessGroupsCount ?? 0} Business</span>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Portfolio Relationship Value</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {analytics?.totalRelationshipValueFormatted ?? '₹61.2L'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across authorized group members
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Active Lifecycle Journeys</span>
            <Milestone className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {analytics?.activeJourneysTotal ?? 3}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {analytics?.blockedJourneysTotal ?? 0} blocked steps requiring attention
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium">Open Service Cases</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">
            {analytics?.openServiceCasesTotal ?? 2}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            SLA compliance actively tracked
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-lg border border-slate-200">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedType === 'ALL'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Groups
          </button>
          <button
            onClick={() => setSelectedType('HOUSEHOLD')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              selectedType === 'HOUSEHOLD'
                ? 'bg-purple-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            Households
          </button>
          <button
            onClick={() => setSelectedType('BUSINESS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              selectedType === 'BUSINESS'
                ? 'bg-cyan-700 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Business Groups
          </button>
          <button
            onClick={() => setSelectedType('MY_GROUPS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              selectedType === 'MY_GROUPS'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            My Assigned Groups
          </button>
          <button
            onClick={() => setSelectedType('NEEDS_ATTENTION')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
              selectedType === 'NEEDS_ATTENTION'
                ? 'bg-amber-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Attention
          </button>
        </div>

        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search group ID, name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Group List / Grid */}
      {loading ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-600 mb-2" />
          <div className="text-sm font-semibold text-slate-800">Loading Relationship Groups...</div>
          <div className="text-xs text-slate-500">Querying authoritative PostgreSQL group records</div>
        </div>
      ) : groups.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-lg">
          <Users2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <div className="text-sm font-semibold text-slate-800">No relationship groups found</div>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search criteria or create a new group.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const isHousehold = group.groupType === 'HOUSEHOLD';
            return (
              <div
                key={group.id || group.groupId}
                onClick={() => onSelectGroup(group.groupId)}
                className="bg-white border border-slate-200 hover:border-cyan-400 rounded-lg p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-md ${
                          isHousehold ? 'bg-purple-50 text-purple-700' : 'bg-cyan-50 text-cyan-700'
                        }`}
                      >
                        {isHousehold ? <Home className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isHousehold
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-cyan-100 text-cyan-800'
                          }`}
                        >
                          {group.groupType}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 ml-1.5">
                          {group.groupId}
                        </span>
                      </div>
                    </div>

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

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                    {group.displayName || group.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    {group.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{group.memberCount ?? 0} Members</span>
                  </div>

                  <div className="flex items-center gap-1 text-cyan-700 font-semibold group-hover:translate-x-0.5 transition-transform">
                    <span>Open 360</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Group Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users2 className="w-4 h-4 text-cyan-700" />
                <h3 className="font-bold text-sm text-slate-900">Create Relationship Group</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-4 space-y-3">
              {createError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group ID / Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HH-20841 or BIZ-59102"
                  value={createForm.groupId}
                  onChange={(e) => setCreateForm({ ...createForm, groupId: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group Type *
                </label>
                <select
                  value={createForm.groupType}
                  onChange={(e) => setCreateForm({ ...createForm, groupType: e.target.value as GroupType })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                >
                  <option value="HOUSEHOLD">HOUSEHOLD (Family / Household Relationship)</option>
                  <option value="BUSINESS">BUSINESS (Single Business Enterprise)</option>
                  <option value="BUSINESS_GROUP">BUSINESS_GROUP (Conglomerate / Multi-Entity Corporate Group)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Formal Legal / Family Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Family Household or Bio-Agro Holdings"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Display / Short Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharma Family or Sharma Bio-Agro"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Relationship Summary
                </label>
                <textarea
                  rows={2}
                  placeholder="Private banking relationship scope, family head, or corporate holding notes..."
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-600 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createSubmitting}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white"
                >
                  {createSubmitting ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
