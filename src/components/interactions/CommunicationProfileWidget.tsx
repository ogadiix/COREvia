import React, { useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  Video,
  Users,
  Building2,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  Calendar,
} from 'lucide-react';
import { CommunicationProfile, EngagementTrendData } from '../../types';

interface CommunicationProfileWidgetProps {
  customerId: number;
  customerName?: string;
  onViewAllInteractions?: () => void;
}

export const CommunicationProfileWidget: React.FC<CommunicationProfileWidgetProps> = ({
  customerId,
  customerName,
  onViewAllInteractions,
}) => {
  const [profile, setProfile] = useState<CommunicationProfile | null>(null);
  const [trend, setTrend] = useState<EngagementTrendData | null>(null);
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '12m'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [profRes, trendRes] = await Promise.all([
          fetch(`/api/customers/${customerId}/communication-profile`, { credentials: 'include' }),
          fetch(`/api/customers/${customerId}/engagement-trend?timeframe=${timeframe}`, { credentials: 'include' }),
        ]);

        if (profRes.ok && isMounted) {
          const profData = await profRes.json();
          setProfile(profData);
        }
        if (trendRes.ok && isMounted) {
          const trendData = await trendRes.json();
          setTrend(trendData);
        }
      } catch (err) {
        console.error('Failed to load communication profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (customerId) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [customerId, timeframe]);

  if (loading) {
    return (
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs animate-pulse space-y-3">
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
        <div className="h-16 bg-slate-100 rounded"></div>
        <div className="h-12 bg-slate-100 rounded"></div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const channelIcons: Record<string, React.ReactNode> = {
    PHONE: <Phone className="w-3.5 h-3.5 text-blue-600" />,
    EMAIL: <Mail className="w-3.5 h-3.5 text-slate-600" />,
    VIDEO: <Video className="w-3.5 h-3.5 text-indigo-600" />,
    IN_PERSON: <Users className="w-3.5 h-3.5 text-emerald-600" />,
    BRANCH: <Building2 className="w-3.5 h-3.5 text-amber-600" />,
    CHAT: <MessageSquare className="w-3.5 h-3.5 text-purple-600" />,
    MESSAGE: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
  };

  const channelLabels: Record<string, string> = {
    PHONE: 'Phone Calls',
    EMAIL: 'Email Dispatch',
    VIDEO: 'Virtual Video',
    IN_PERSON: 'Client Site Visit',
    BRANCH: 'Branch Counter',
    CHAT: 'Portal Chat',
    MESSAGE: 'WhatsApp / SMS',
  };

  return (
    <div id="communication-profile-widget" className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Communication Profile {customerName ? `• ${customerName}` : ''}
          </h3>
        </div>
        {onViewAllInteractions && (
          <button
            id="btn-view-customer-interactions"
            onClick={onViewAllInteractions}
            className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
          >
            Full Timeline
          </button>
        )}
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Top Key Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Touchpoints</span>
            <span className="text-base font-bold text-slate-900">{profile.totalInteractions}</span>
          </div>
          <div className="p-2.5 bg-sky-50 border border-sky-100 rounded text-center">
            <span className="text-[10px] uppercase font-semibold text-sky-700 block">Preferred Channel</span>
            <span className="text-xs font-bold text-sky-900 truncate block mt-0.5">
              {channelLabels[profile.preferredChannel] || profile.preferredChannel}
            </span>
          </div>
          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded text-center">
            <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Open Commitments</span>
            <span className="text-base font-bold text-emerald-800">{profile.openCommitmentsCount}</span>
          </div>
        </div>

        {/* Cadence / Recency */}
        <div className="p-2.5 bg-white border border-slate-200 rounded flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <div>
              <span className="text-slate-500 text-[11px] block">Contact Cadence</span>
              <span className="font-semibold text-slate-800">{profile.contactCadence}</span>
            </div>
          </div>
          {profile.lastContactDate && (
            <div className="text-right">
              <span className="text-slate-400 text-[10px] block">Last Contact</span>
              <span className="font-medium text-slate-700">
                {new Date(profile.lastContactDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Channel Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Channel Distribution</span>
            <span className="text-[10px] text-slate-400">Past activity</span>
          </div>
          <div className="space-y-1.5">
            {Object.entries(profile.channelBreakdown).map(([ch, count]) => {
              const numCount = Number(count) || 0;
              const pct = profile.totalInteractions > 0 ? Math.round((numCount / profile.totalInteractions) * 100) : 0;
              return (
                <div key={ch} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 w-32 truncate">
                    {channelIcons[ch] || <MessageSquare className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="text-slate-700">{channelLabels[ch] || ch}</span>
                  </div>
                  <div className="flex-1 mx-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-600 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-slate-500 font-mono w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sentiment Distribution */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Observed Sentiment</span>
            <span className="text-[10px] text-slate-400">Relationship tone</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
            <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded">
              <span className="text-emerald-700 font-medium block">Positive</span>
              <span className="font-bold text-emerald-900">{profile.sentimentDistribution.POSITIVE || 0}</span>
            </div>
            <div className="p-1.5 bg-slate-50 border border-slate-200 rounded">
              <span className="text-slate-600 font-medium block">Neutral</span>
              <span className="font-bold text-slate-800">{profile.sentimentDistribution.NEUTRAL || 0}</span>
            </div>
            <div className="p-1.5 bg-amber-50 border border-amber-200 rounded">
              <span className="text-amber-700 font-medium block">Concerned</span>
              <span className="font-bold text-amber-900">{profile.sentimentDistribution.CONCERNED || 0}</span>
            </div>
            <div className="p-1.5 bg-rose-50 border border-rose-200 rounded">
              <span className="text-rose-700 font-medium block">Escalated</span>
              <span className="font-bold text-rose-900">{profile.sentimentDistribution.ESCALATED || 0}</span>
            </div>
          </div>
        </div>

        {/* Engagement Trend (Historical Records) */}
        {trend && (
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">Engagement Trend</span>
              </div>
              <div className="flex items-center gap-1">
                {(['30d', '90d', '12m'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-1.5 py-0.5 text-[10px] rounded font-medium ${
                      timeframe === tf ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-16 flex items-end gap-1 px-1 py-1 bg-slate-50 border border-slate-200 rounded">
              {trend.buckets.map((b, idx) => {
                const maxCount = Math.max(1, ...trend.buckets.map((x) => x.count));
                const heightPct = Math.max(10, Math.round((b.count / maxCount) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center group relative">
                    <div
                      className="w-full bg-sky-500 hover:bg-sky-600 rounded-t transition-all"
                      style={{ height: `${heightPct}%` }}
                      title={`${b.label}: ${b.count} interactions`}
                    />
                    <span className="text-[8px] text-slate-400 mt-1 truncate max-w-full">
                      {b.label.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
