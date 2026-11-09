import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Package,
  WalletCards,
  Landmark,
  LifeBuoy,
  ShieldCheck,
  Calendar,
  Filter,
  ArrowUpDown,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  User,
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR } from '../../data/mockIndianBankingData';

export interface TimelineEventItem {
  id: string;
  timestamp: string | Date;
  category: 'INTERACTION' | 'PRODUCT' | 'ACCOUNT' | 'LOAN' | 'CASE' | 'KYC';
  title: string;
  summary: string;
  actor?: string;
  status?: string;
  badge?: string;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  metadata?: Record<string, any>;
}

interface CustomerTimelineTabProps {
  customer: any;
  dossier360: any;
  financialSummary: any;
  onLogInteractionClick?: () => void;
}

export const CustomerTimelineTab: React.FC<CustomerTimelineTabProps> = ({
  customer,
  dossier360,
  financialSummary,
  onLogInteractionClick,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [timelineSearch, setTimelineSearch] = useState<string>('');

  const events: TimelineEventItem[] = useMemo(() => {
    const list: TimelineEventItem[] = [];

    // 1. Onboarding & KYC baseline events
    if (customer?.onboardingDate) {
      list.push({
        id: `kyc-onboard-${customer.id || 1}`,
        timestamp: customer.onboardingDate,
        category: 'KYC',
        title: 'Institutional CIF Onboarded & Verified',
        summary: `Full cKYC registry verified with UIDAI Aadhaar & PAN validation. Assigned CIF ${customer.cifNumber || 'CIF-10482'}.`,
        actor: 'Central Operations / System',
        status: 'VERIFIED',
        badge: 'Onboarding',
        badgeVariant: 'success',
      });
    }

    if (customer?.kycLastReviewedDate) {
      list.push({
        id: `kyc-review-${customer.id || 1}`,
        timestamp: customer.kycLastReviewedDate,
        category: 'KYC',
        title: 'Periodic AML & KYC Compliance Audit Completed',
        summary: `Risk rating reaffirmed as ${customer.riskCategory || 'LOW'} Risk. Regulatory next review scheduled for ${customer.kycNextReviewDue || '2027-06-15'}.`,
        actor: 'Compliance & AML Cell',
        status: 'COMPLIANT',
        badge: 'Audit Completed',
        badgeVariant: 'neutral',
      });
    }

    // 2. Interactions
    if (dossier360?.interactions && Array.isArray(dossier360.interactions)) {
      dossier360.interactions.forEach((int: any) => {
        list.push({
          id: `int-${int.id}`,
          timestamp: int.timestamp || '2026-03-10',
          category: 'INTERACTION',
          title: int.subject || 'Client Touchpoint',
          summary: int.summary || 'Relationship engagement and review logged in CRM.',
          actor: int.officerName || 'Relationship Manager',
          status: int.outcome,
          badge: int.channel ? int.channel.replace('_', ' ') : 'MEETING',
          badgeVariant: 'info',
          metadata: {
            channel: int.channel,
            sentiment: int.sentiment,
            followupRequired: int.followupRequired,
            followupAction: int.followupAction,
            reference: int.interactionReference,
          },
        });
      });
    }

    // 3. Products
    if (financialSummary?.activeProducts && Array.isArray(financialSummary.activeProducts)) {
      financialSummary.activeProducts.forEach((p: any) => {
        list.push({
          id: `prod-${p.id}`,
          timestamp: p.enrolledDate || '2025-08-01',
          category: 'PRODUCT',
          title: `Subscribed to ${p.name || p.schemeName || 'Banking Product'}`,
          summary: `Product code ${p.productCode || 'PRD'} enrolled under category ${p.category || 'General'}. Linked account: ${p.accountNumber || 'Primary CASA'}.`,
          actor: 'Commercial Desk',
          status: p.status || 'ACTIVE',
          badge: p.category || 'Product',
          badgeVariant: 'success',
        });
      });
    }

    // 4. Accounts
    if (dossier360?.accounts && Array.isArray(dossier360.accounts)) {
      dossier360.accounts.forEach((acc: any) => {
        list.push({
          id: `acc-${acc.id}`,
          timestamp: acc.openedDate || '2024-04-12',
          category: 'ACCOUNT',
          title: `Account Activated: ${acc.accountType || 'CASA'} · ${acc.accountNumber}`,
          summary: `IFSC ${acc.ifscCode} | Current Available Balance: ${formatINR(parseFloat(acc.balance?.availableBalance) || 0)}.`,
          actor: 'Branch Operations',
          status: acc.status || 'ACTIVE',
          badge: acc.accountType || 'Account',
          badgeVariant: 'info',
        });
      });
    }

    // 5. Loans
    if (dossier360?.loans && Array.isArray(dossier360.loans)) {
      dossier360.loans.forEach((loan: any) => {
        list.push({
          id: `loan-${loan.id}`,
          timestamp: loan.sanctionDate || '2025-01-20',
          category: 'LOAN',
          title: `Credit Facility Sanctioned: ${loan.loanType || 'Term Loan'}`,
          summary: `Facility #${loan.loanAccountNumber} sanctioned for ${formatINR(parseFloat(loan.sanctionedLimit) || 0)} at ${loan.interestRate}% p.a. Outstanding: ${formatINR(parseFloat(loan.outstandingPrincipal) || 0)}.`,
          actor: 'Credit Committee',
          status: loan.status || 'STANDARD',
          badge: 'Credit Facility',
          badgeVariant: 'warning',
        });
      });
    }

    // 6. Cases
    if (dossier360?.cases && Array.isArray(dossier360.cases)) {
      dossier360.cases.forEach((cs: any) => {
        list.push({
          id: `case-${cs.id}`,
          timestamp: cs.createdAt || '2026-02-14',
          category: 'CASE',
          title: `Service Grievance: ${cs.caseNumber} — ${cs.subject}`,
          summary: cs.description || 'Service ticket registered and assigned to support desk.',
          actor: cs.assignedTo || 'Service Desk',
          status: cs.status || 'OPEN',
          badge: cs.priority || 'Ticket',
          badgeVariant: cs.priority === 'CRITICAL' ? 'danger' : 'warning',
        });
      });
    }

    // Sort chronologically
    return list.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [customer, dossier360, financialSummary, sortOrder]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchCat = filterCategory === 'ALL' || ev.category === filterCategory;
      const matchSearch =
        timelineSearch === '' ||
        ev.title.toLowerCase().includes(timelineSearch.toLowerCase()) ||
        ev.summary.toLowerCase().includes(timelineSearch.toLowerCase()) ||
        (ev.actor && ev.actor.toLowerCase().includes(timelineSearch.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [events, filterCategory, timelineSearch]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'INTERACTION':
        return <MessageSquare className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'PRODUCT':
        return <Package className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'ACCOUNT':
        return <WalletCards className="w-4 h-4 text-teal-600 dark:text-teal-400" />;
      case 'LOAN':
        return <Landmark className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'CASE':
        return <LifeBuoy className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      case 'KYC':
        return <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Timeline Controls */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-[#A9BACB] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Category:
          </span>
          {[
            { id: 'ALL', label: `All Events (${events.length})` },
            { id: 'INTERACTION', label: 'Touchpoints' },
            { id: 'PRODUCT', label: 'Products' },
            { id: 'ACCOUNT', label: 'Accounts' },
            { id: 'LOAN', label: 'Credit Facilities' },
            { id: 'CASE', label: 'Service & Cases' },
            { id: 'KYC', label: 'KYC & Compliance' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`text-xs px-2.5 py-1 rounded transition-colors font-medium ${
                filterCategory === cat.id
                  ? 'bg-[#142C45] dark:bg-[#1B9D92] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-[#192B3D] text-slate-600 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#20364B]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400 dark:text-[#8194A8]" />
            <input
              type="text"
              placeholder="Search timeline events..."
              value={timelineSearch}
              onChange={(e) => setTimelineSearch(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            />
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#20364B] border border-slate-200 dark:border-[#33485D] transition-colors"
            title="Toggle chronological sorting"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>

          {onLogInteractionClick && (
            <Button
              size="xs"
              variant="primary"
              onClick={onLogInteractionClick}
              icon={<MessageSquare className="w-3 h-3" />}
            >
              Log Touchpoint
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8]">
          <Calendar className="w-8 h-8 text-slate-400 dark:text-[#8194A8] mx-auto mb-2" />
          <div className="font-semibold text-slate-700 dark:text-[#E8EEF5]">No Timeline Events Found</div>
          <p className="text-[11px] mt-0.5">No events match the selected filter criteria or search query.</p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#33485D]">
          {filteredEvents.map((ev) => {
            const formattedDate = new Date(ev.timestamp).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div key={ev.id} className="relative group">
                {/* Node icon circle */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white dark:bg-[#162638] border-2 border-slate-300 dark:border-[#33485D] group-hover:border-[#168C83] dark:group-hover:border-[#1B9D92] flex items-center justify-center transition-colors shadow-2xs">
                  {getCategoryIcon(ev.category)}
                </div>

                {/* Event Card */}
                <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-3 hover:border-slate-300 dark:hover:border-[#435e7a] transition-all shadow-2xs space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-[#E8EEF5]">
                        {ev.title}
                      </span>
                      {ev.badge && (
                        <Badge variant={ev.badgeVariant || 'neutral'} size="sm">
                          {ev.badge}
                        </Badge>
                      )}
                      {ev.metadata?.reference && (
                        <span className="font-mono text-[10px] bg-slate-100 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] px-1.5 py-0.2 rounded border border-slate-200 dark:border-[#33485D]">
                          {ev.metadata.reference}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-[#8194A8] font-mono">
                      <Calendar className="w-3 h-3 text-slate-400 dark:text-[#8194A8]" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-[#A9BACB] leading-relaxed">
                    {ev.summary}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#1F334A] text-[10px] text-slate-500 dark:text-[#8194A8]">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400 dark:text-[#8194A8]" />
                      <span>Actor: <strong className="text-slate-700 dark:text-[#E8EEF5]">{ev.actor || 'Core Banking Ledger'}</strong></span>
                      {ev.metadata?.sentiment && (
                        <>
                          <span>•</span>
                          <span>Sentiment: <strong className="text-emerald-700 dark:text-emerald-400">{ev.metadata.sentiment}</strong></span>
                        </>
                      )}
                    </div>

                    {ev.metadata?.followupRequired && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800">
                        <Clock className="w-2.5 h-2.5" />
                        Follow-up: {ev.metadata.followupAction || 'Pending'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

