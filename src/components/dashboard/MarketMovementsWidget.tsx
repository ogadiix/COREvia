import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Clock,
  ExternalLink,
  Info,
  Sparkles,
  Newspaper,
  Coins,
  PiggyBank,
  Calculator,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { forexService } from '../../services/forex.service';
import { marketNewsService, FinancialNewsItem, AMFI_LATEST_STATISTICS } from '../../services/marketNews.service';
import { ForexRatesPayload } from '../../types';
import { formatINR } from '../../data/mockIndianBankingData';
import { AiBankingAssistantModal } from '../ai/AiBankingAssistantModal';

export type MainWidgetTab = 'treasury_chart' | 'financial_news' | 'currency_desk' | 'mutual_funds_sip';
export type MarketViewType = 'inr_usd' | 'gsec_10y' | 'yield_curve' | 'spread';
export type TimeframeType = 'intraday' | '7d' | '30d';

interface IntradayPoint {
  time: string;
  usdInr: number;
  gsec10y: number;
  us10y: number;
  spreadBps: number;
  volumeCr?: number;
}

interface YieldCurvePoint {
  tenor: string;
  tenorYears: number;
  yield: number;
  prevWeekYield: number;
  benchmarkInstrument: string;
}

// Institutional Intraday Market Feed (09:15 to 15:30 IST CCIL/NDS-OM Market Hours)
const INTRADAY_DATA: IntradayPoint[] = [
  { time: '09:15', usdInr: 83.91, gsec10y: 7.055, us10y: 4.25, spreadBps: 280.5, volumeCr: 420 },
  { time: '10:00', usdInr: 83.92, gsec10y: 7.052, us10y: 4.26, spreadBps: 279.2, volumeCr: 1150 },
  { time: '10:45', usdInr: 83.90, gsec10y: 7.048, us10y: 4.26, spreadBps: 278.8, volumeCr: 1890 },
  { time: '11:30', usdInr: 83.94, gsec10y: 7.044, us10y: 4.25, spreadBps: 279.4, volumeCr: 2640 },
  { time: '12:15', usdInr: 83.95, gsec10y: 7.042, us10y: 4.27, spreadBps: 277.2, volumeCr: 3410 },
  { time: '13:00', usdInr: 83.93, gsec10y: 7.039, us10y: 4.28, spreadBps: 275.9, volumeCr: 4120 },
  { time: '13:45', usdInr: 83.96, gsec10y: 7.036, us10y: 4.27, spreadBps: 276.6, volumeCr: 4980 },
  { time: '14:30', usdInr: 83.94, gsec10y: 7.038, us10y: 4.26, spreadBps: 277.8, volumeCr: 6240 },
  { time: '15:15', usdInr: 83.93, gsec10y: 7.041, us10y: 4.26, spreadBps: 278.1, volumeCr: 7850 },
  { time: '15:30', usdInr: 83.94, gsec10y: 7.040, us10y: 4.26, spreadBps: 278.0, volumeCr: 8420 },
];

// 7-Day Trading History
const SEVEN_DAY_DATA: IntradayPoint[] = [
  { time: '04-Sep', usdInr: 83.85, gsec10y: 7.085, us10y: 4.29, spreadBps: 279.5 },
  { time: '05-Sep', usdInr: 83.89, gsec10y: 7.078, us10y: 4.28, spreadBps: 279.8 },
  { time: '06-Sep', usdInr: 83.92, gsec10y: 7.062, us10y: 4.27, spreadBps: 279.2 },
  { time: '07-Sep', usdInr: 83.90, gsec10y: 7.055, us10y: 4.26, spreadBps: 279.5 },
  { time: '08-Sep', usdInr: 83.96, gsec10y: 7.049, us10y: 4.25, spreadBps: 279.9 },
  { time: '09-Sep', usdInr: 83.92, gsec10y: 7.045, us10y: 4.27, spreadBps: 277.5 },
  { time: '10-Sep', usdInr: 83.94, gsec10y: 7.040, us10y: 4.26, spreadBps: 278.0 },
];

// 30-Day Historical Trend for Treasury ALM
const THIRTY_DAY_DATA: IntradayPoint[] = [
  { time: '12-Aug', usdInr: 83.78, gsec10y: 7.140, us10y: 4.34, spreadBps: 280.0 },
  { time: '16-Aug', usdInr: 83.82, gsec10y: 7.125, us10y: 4.32, spreadBps: 280.5 },
  { time: '20-Aug', usdInr: 83.86, gsec10y: 7.110, us10y: 4.30, spreadBps: 281.0 },
  { time: '24-Aug', usdInr: 83.89, gsec10y: 7.095, us10y: 4.31, spreadBps: 278.5 },
  { time: '28-Aug', usdInr: 83.84, gsec10y: 7.080, us10y: 4.28, spreadBps: 280.0 },
  { time: '01-Sep', usdInr: 83.87, gsec10y: 7.070, us10y: 4.29, spreadBps: 278.0 },
  { time: '05-Sep', usdInr: 83.89, gsec10y: 7.060, us10y: 4.27, spreadBps: 279.0 },
  { time: '08-Sep', usdInr: 83.96, gsec10y: 7.048, us10y: 4.25, spreadBps: 279.8 },
  { time: '10-Sep', usdInr: 83.94, gsec10y: 7.040, us10y: 4.26, spreadBps: 278.0 },
];

// Indian Sovereign G-Sec Yield Curve (NDS-OM Settlement)
const SOVEREIGN_YIELD_CURVE: YieldCurvePoint[] = [
  { tenor: '91D', tenorYears: 0.25, yield: 6.64, prevWeekYield: 6.67, benchmarkInstrument: '91-Day T-Bill' },
  { tenor: '182D', tenorYears: 0.5, yield: 6.72, prevWeekYield: 6.74, benchmarkInstrument: '182-Day T-Bill' },
  { tenor: '1Y', tenorYears: 1.0, yield: 6.81, prevWeekYield: 6.85, benchmarkInstrument: '364-Day T-Bill' },
  { tenor: '3Y', tenorYears: 3.0, yield: 6.92, prevWeekYield: 6.96, benchmarkInstrument: '7.02% GS 2027' },
  { tenor: '5Y', tenorYears: 5.0, yield: 6.98, prevWeekYield: 7.03, benchmarkInstrument: '7.06% GS 2029' },
  { tenor: '7Y', tenorYears: 7.0, yield: 7.01, prevWeekYield: 7.05, benchmarkInstrument: '7.10% GS 2031' },
  { tenor: '10Y', tenorYears: 10.0, yield: 7.04, prevWeekYield: 7.09, benchmarkInstrument: '7.18% GS 2033 (Benchmark)' },
  { tenor: '14Y', tenorYears: 14.0, yield: 7.11, prevWeekYield: 7.15, benchmarkInstrument: '7.26% GS 2037' },
  { tenor: '30Y', tenorYears: 30.0, yield: 7.22, prevWeekYield: 7.26, benchmarkInstrument: '7.30% GS 2053' },
];

interface MarketMovementsWidgetProps {
  onNavigateToForex?: () => void;
}

export const MarketMovementsWidget: React.FC<MarketMovementsWidgetProps> = ({
  onNavigateToForex,
}) => {
  // Main Tab State
  const [mainTab, setMainTab] = useState<MainWidgetTab>('treasury_chart');
  const [activeView, setActiveView] = useState<MarketViewType>('inr_usd');
  const [timeframe, setTimeframe] = useState<TimeframeType>('intraday');

  // Live Data & Loading
  const [forexPayload, setForexPayload] = useState<ForexRatesPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('15:30 IST');

  // News Filtering
  const [newsCategory, setNewsCategory] = useState<string>('ALL');
  const [newsItems, setNewsItems] = useState<FinancialNewsItem[]>([]);

  // SIP Calculator State
  const [sipMonthly, setSipMonthly] = useState<number>(15000);
  const [sipYears, setSipYears] = useState<number>(10);
  const [sipReturnRate, setSipReturnRate] = useState<number>(12.5);

  // AI Assistant Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiInitialQuery, setAiInitialQuery] = useState<string | undefined>(undefined);

  const loadData = async (force = false) => {
    setIsLoading(true);
    try {
      const [fxData, newsData] = await Promise.all([
        forexService.fetchLiveRates(force),
        fetch(`/api/market/news${newsCategory !== 'ALL' ? `?category=${newsCategory}` : ''}`)
          .then((r) => r.json())
          .then((d) => d.headlines || marketNewsService.getLatestHeadlines(newsCategory))
          .catch(() => marketNewsService.getLatestHeadlines(newsCategory)),
      ]);

      setForexPayload(fxData);
      setNewsItems(newsData);

      const now = new Date();
      setLastRefreshedTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} IST`
      );
    } catch (err) {
      console.error('Failed to load market data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
  }, [newsCategory]);

  // Current Live USD Quotes
  const usdQuote = useMemo(() => {
    return forexPayload?.quotes?.find((q) => q.baseCurrency === 'USD');
  }, [forexPayload]);

  const currentUsdRate = Number(usdQuote?.midRate) || 83.94;
  const currentUsdChangePct = usdQuote?.changePercent24h ?? 0.04;
  const isUsdUp = currentUsdChangePct >= 0;

  // Active Series based on Timeframe
  const activeSeries = useMemo(() => {
    if (timeframe === 'intraday') return INTRADAY_DATA;
    if (timeframe === '7d') return SEVEN_DAY_DATA;
    return THIRTY_DAY_DATA;
  }, [timeframe]);

  const latestDataPoint = activeSeries[activeSeries.length - 1];
  const current10YYield = latestDataPoint?.gsec10y || 7.04;
  const currentSpreadBps = latestDataPoint?.spreadBps || 278.0;

  // Calculate live SIP projection
  const sipCalculation = useMemo(() => {
    return marketNewsService.calculateSipProjection(sipMonthly, sipReturnRate, sipYears);
  }, [sipMonthly, sipReturnRate, sipYears]);

  const openAiWithPrompt = (prompt: string) => {
    setAiInitialQuery(prompt);
    setIsAiModalOpen(true);
  };

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Header & Institutional Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#26394C]">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#E8EEF5]">
              Market Movements & Treasury Monitor
            </h3>
            <span className="text-[10px] bg-slate-100 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] font-mono px-1.5 py-0.5 rounded border border-slate-200 dark:border-[#33485D]">
              CCIL • RBI • AMFI
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#8194A8]">
            Institutional surveillance for INR/USD exchange rates, sovereign bond yields, financial news headlines, and AMFI mutual funds/SIP trends.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          {/* Ask AI Assistant Trigger */}
          <button
            onClick={() => openAiWithPrompt('')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-[#142C45] to-slate-800 hover:from-slate-900 hover:to-slate-850 dark:from-[#101C2A] dark:to-[#162638] rounded border border-slate-700 dark:border-[#33485D] shadow-2xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Ask AI Banking Copilot</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500 dark:text-[#8194A8] flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {lastRefreshedTime}
          </span>

          <button
            onClick={() => loadData(true)}
            disabled={isLoading}
            className="p-1.5 rounded border border-slate-200 dark:border-[#33485D] text-slate-600 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#192B3D] disabled:opacity-50 cursor-pointer transition-colors"
            title="Refresh All Benchmarks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {onNavigateToForex && (
            <button
              onClick={onNavigateToForex}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#142C45] dark:text-[#2dd4bf] bg-slate-100 dark:bg-[#101C2A] hover:bg-slate-200 dark:hover:bg-[#192B3D] rounded border border-slate-200 dark:border-[#33485D] transition-colors cursor-pointer"
            >
              <span>Forex Desk</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Primary KPI Strip for Treasury & Banking Officers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* USD/INR Spot */}
        <div
          onClick={() => {
            setMainTab('treasury_chart');
            setActiveView('inr_usd');
          }}
          className={`p-3 rounded border cursor-pointer transition-all ${
            mainTab === 'treasury_chart' && activeView === 'inr_usd'
              ? 'border-[#168C83] bg-teal-50/50 dark:bg-[#101C2A] shadow-xs'
              : 'border-slate-200 dark:border-[#33485D] hover:border-slate-300 dark:hover:border-[#168C83] bg-white dark:bg-[#162638]'
          }`}
        >
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-[#8194A8]">
            <span className="font-semibold text-slate-700 dark:text-[#E8EEF5]">USD / INR Spot</span>
            <span className="font-mono text-[10px] bg-slate-200/60 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] px-1 py-0.2 rounded">FEDAI</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-[#E8EEF5]">
              ₹{currentUsdRate.toFixed(2)}
            </span>
            <span
              className={`text-xs font-mono font-medium flex items-center ${
                isUsdUp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isUsdUp ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
              {isUsdUp ? '+' : ''}
              {currentUsdChangePct}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5 flex justify-between">
            <span>RBI Ref: ₹{(Number(usdQuote?.rbiReferenceRate) || 83.94).toFixed(2)}</span>
            <span>Range: 83.88 - 84.02</span>
          </div>
        </div>

        {/* 10Y Benchmark G-Sec */}
        <div
          onClick={() => {
            setMainTab('treasury_chart');
            setActiveView('gsec_10y');
          }}
          className={`p-3 rounded border cursor-pointer transition-all ${
            mainTab === 'treasury_chart' && activeView === 'gsec_10y'
              ? 'border-[#168C83] bg-teal-50/50 dark:bg-[#101C2A] shadow-xs'
              : 'border-slate-200 dark:border-[#33485D] hover:border-slate-300 dark:hover:border-[#168C83] bg-white dark:bg-[#162638]'
          }`}
        >
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-[#8194A8]">
            <span className="font-semibold text-slate-700 dark:text-[#E8EEF5]">10Y Benchmark G-Sec</span>
            <span className="font-mono text-[10px] bg-slate-200/60 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] px-1 py-0.2 rounded">7.18 GS 2033</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-[#E8EEF5]">
              {current10YYield.toFixed(3)}%
            </span>
            <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingDown className="w-3 h-3 mr-0.5" />
              -1.5 bps
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5 flex justify-between">
            <span>Price: ₹100.95</span>
            <span>Duration: 6.84 Yrs</span>
          </div>
        </div>

        {/* Mutual Funds Monthly SIP Inflow Record */}
        <div
          onClick={() => setMainTab('mutual_funds_sip')}
          className={`p-3 rounded border cursor-pointer transition-all ${
            mainTab === 'mutual_funds_sip'
              ? 'border-[#168C83] bg-teal-50/50 dark:bg-[#101C2A] shadow-xs'
              : 'border-slate-200 dark:border-[#33485D] hover:border-slate-300 dark:hover:border-[#168C83] bg-white dark:bg-[#162638]'
          }`}
        >
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-[#8194A8]">
            <span className="font-semibold text-slate-700 dark:text-[#E8EEF5]">Monthly SIP Inflows</span>
            <span className="font-mono text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-1 py-0.2 rounded font-medium">
              NEW RECORD
            </span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">
              ₹32,297 <span className="text-xs font-normal text-slate-600 dark:text-[#8194A8]">Cr</span>
            </span>
            <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" />
              +3.8% MoM
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5 flex justify-between">
            <span>Active Folios: 10.01 Cr</span>
            <span>SIP AUM: ₹18.61 L Cr</span>
          </div>
        </div>

        {/* RBI Policy Repo & OMO Stance */}
        <div
          onClick={() => setMainTab('financial_news')}
          className={`p-3 rounded border cursor-pointer transition-all ${
            mainTab === 'financial_news'
              ? 'border-[#168C83] bg-teal-50/50 dark:bg-[#101C2A] shadow-xs'
              : 'border-slate-200 dark:border-[#33485D] hover:border-slate-300 dark:hover:border-[#168C83] bg-white dark:bg-[#162638]'
          }`}
        >
          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-[#8194A8]">
            <span className="font-semibold text-slate-700 dark:text-[#E8EEF5]">RBI Repo / Liquidity</span>
            <span className="font-mono text-[10px] bg-slate-200/60 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] px-1 py-0.2 rounded">MPC STANCE</span>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-lg font-bold text-slate-900 dark:text-[#E8EEF5]">
              6.50%
            </span>
            <span className="text-xs font-mono text-amber-700 dark:text-amber-400">
              ₹1L Cr OMO Drain
            </span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5 flex justify-between">
            <span>SDF: 6.25% | MSF: 6.75%</span>
            <span>View News Feed →</span>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#26394C] overflow-x-auto no-scrollbar gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMainTab('treasury_chart')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              mainTab === 'treasury_chart'
                ? 'border-[#168C83] text-[#168C83] dark:text-[#2dd4bf] font-semibold'
                : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Treasury & Yield Curves</span>
          </button>

          <button
            onClick={() => setMainTab('financial_news')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              mainTab === 'financial_news'
                ? 'border-[#168C83] text-[#168C83] dark:text-[#2dd4bf] font-semibold'
                : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>Daily Financial News Headlines</span>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-mono px-1 rounded">
              Live
            </span>
          </button>

          <button
            onClick={() => setMainTab('currency_desk')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              mainTab === 'currency_desk'
                ? 'border-[#168C83] text-[#168C83] dark:text-[#2dd4bf] font-semibold'
                : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Currency & Forex Matrix</span>
          </button>

          <button
            onClick={() => setMainTab('mutual_funds_sip')}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              mainTab === 'mutual_funds_sip'
                ? 'border-[#168C83] text-[#168C83] dark:text-[#2dd4bf] font-semibold'
                : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
            }`}
          >
            <PiggyBank className="w-3.5 h-3.5" />
            <span>Mutual Funds & SIP Desk</span>
            <span className="text-[10px] bg-slate-100 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] font-mono px-1 rounded border border-slate-200 dark:border-[#33485D]">
              AMFI Data
            </span>
          </button>
        </div>

        <button
          onClick={() => openAiWithPrompt('Analyze current Indian macro indicators and suggest treasury portfolio positioning')}
          className="text-xs text-[#168C83] dark:text-[#2dd4bf] hover:underline font-medium cursor-pointer whitespace-nowrap flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>AI Macro Analysis</span>
        </button>
      </div>

      {/* TAB 1: TREASURY & BOND YIELDS (RECHARTS) */}
      {mainTab === 'treasury_chart' && (
        <div className="space-y-3">
          {/* Sub-selectors */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded border border-slate-200 dark:border-[#33485D] p-0.5 bg-slate-50 dark:bg-[#101C2A] text-xs">
              <button
                onClick={() => setActiveView('inr_usd')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeView === 'inr_usd'
                    ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-[#8194A8] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
                }`}
              >
                INR / USD Exchange Rate
              </button>
              <button
                onClick={() => setActiveView('gsec_10y')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeView === 'gsec_10y'
                    ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-[#8194A8] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
                }`}
              >
                10Y G-Sec Yield
              </button>
              <button
                onClick={() => setActiveView('yield_curve')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeView === 'yield_curve'
                    ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-[#8194A8] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
                }`}
              >
                Sovereign Yield Curve (Tenors)
              </button>
              <button
                onClick={() => setActiveView('spread')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  activeView === 'spread'
                    ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-[#8194A8] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
                }`}
              >
                IN-US Sovereign Spread
              </button>
            </div>

            {activeView !== 'yield_curve' && (
              <div className="inline-flex rounded border border-slate-200 dark:border-[#33485D] p-0.5 bg-slate-50 dark:bg-[#101C2A] text-xs">
                <button
                  onClick={() => setTimeframe('intraday')}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                    timeframe === 'intraday' ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-2xs font-semibold' : 'text-slate-600 dark:text-[#8194A8] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
                  }`}
                >
                  Intraday
                </button>
                <button
                  onClick={() => setTimeframe('7d')}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                    timeframe === '7d' ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-2xs font-semibold' : 'text-slate-600 dark:text-[#8194A8] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeframe('30d')}
                  className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                    timeframe === '30d' ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-2xs font-semibold' : 'text-slate-600 dark:text-[#8194A8] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
                  }`}
                >
                  30 Days
                </button>
              </div>
            )}
          </div>

          {/* Recharts Area */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {activeView === 'inr_usd' ? (
                <AreaChart data={activeSeries} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="usdInrGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f1e36" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0f1e36" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#26394C' : '#e2e8f0'} vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: isDark ? '#8194A8' : '#64748b' }} tickLine={false} axisLine={{ stroke: isDark ? '#33485D' : '#cbd5e1' }} />
                  <YAxis
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 11, fill: isDark ? '#8194A8' : '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(v) => `₹${Number(v).toFixed(2)}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#162638' : '#0b1626',
                      borderRadius: '4px',
                      border: `1px solid ${isDark ? '#33485D' : '#1e293b'}`,
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'USD / INR Spot']}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="usdInr"
                    stroke="#168C83"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#usdInrGrad)"
                    dot={timeframe !== 'intraday'}
                    activeDot={{ r: 4, stroke: '#168C83', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </AreaChart>
              ) : activeView === 'gsec_10y' ? (
                <AreaChart data={activeSeries} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gsecGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis
                    domain={['dataMin - 0.02', 'dataMax + 0.02']}
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${Number(v).toFixed(2)}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1626',
                      borderRadius: '4px',
                      border: '1px solid #1e293b',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(3)}%`, '10Y G-Sec Yield']}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  />
                  <ReferenceLine y={6.5} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'Repo 6.50%', fill: '#b45309', fontSize: 10, position: 'insideTopRight' }} />
                  <Area
                    type="monotone"
                    dataKey="gsec10y"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#gsecGrad)"
                    dot={timeframe !== 'intraday'}
                    activeDot={{ r: 4, stroke: '#0284c7', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </AreaChart>
              ) : activeView === 'spread' ? (
                <LineChart data={activeSeries} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${v} bps`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1626',
                      borderRadius: '4px',
                      border: '1px solid #1e293b',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [`${Number(val).toFixed(1)} bps`, 'IN-US 10Y Spread']}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  />
                  <ReferenceLine y={280} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: '280 bps Median', fill: '#64748b', fontSize: 10, position: 'insideTopLeft' }} />
                  <Line
                    type="monotone"
                    dataKey="spreadBps"
                    stroke="#059669"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#059669' }}
                    activeDot={{ r: 5, stroke: '#059669', strokeWidth: 2, fill: '#ffffff' }}
                  />
                </LineChart>
              ) : (
                <LineChart data={SOVEREIGN_YIELD_CURVE} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="tenor" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis
                    domain={[6.5, 7.4]}
                    tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                    tickFormatter={(v) => `${Number(v).toFixed(2)}%`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b1626',
                      borderRadius: '4px',
                      border: '1px solid #1e293b',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, name: any, item: any) => {
                      if (name === 'yield') {
                        return [`${Number(val).toFixed(2)}% (${item.payload.benchmarkInstrument})`, 'Current Yield'];
                      }
                      return [`${Number(val).toFixed(2)}%`, 'Previous Week'];
                    }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px' }}
                  />
                  <ReferenceLine y={6.5} stroke="#d97706" strokeDasharray="3 3" label={{ value: 'RBI Policy Repo (6.50%)', fill: '#b45309', fontSize: 10, position: 'insideBottomRight' }} />
                  <Line
                    type="monotone"
                    dataKey="yield"
                    name="yield"
                    stroke="#0f1e36"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0f1e36', stroke: '#ffffff', strokeWidth: 1.5 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="prevWeekYield"
                    name="prevWeekYield"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, fill: '#94a3b8' }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 2: DAILY FINANCIAL NEWS HEADLINES */}
      {mainTab === 'financial_news' && (
        <div className="space-y-3">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Filter News:
              </span>
              {[
                { id: 'ALL', label: 'All Headlines' },
                { id: 'MUTUAL_FUNDS_SIP', label: 'Mutual Funds & SIP' },
                { id: 'TREASURY_BONDS', label: 'Treasury & G-Sec' },
                { id: 'CURRENCY_FOREX', label: 'Currency & Forex' },
                { id: 'RBI_POLICY', label: 'RBI Monetary Policy' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setNewsCategory(cat.id)}
                  className={`px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                    newsCategory === cat.id
                      ? 'bg-[#168C83] text-white font-medium shadow-2xs'
                      : 'bg-slate-100 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#192B3D] border border-transparent dark:border-[#33485D]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <span className="text-[11px] text-slate-400 dark:text-[#8194A8] font-mono">
              Live Sources: Mint • ET • AMFI • RBI FMD
            </span>
          </div>

          {/* Headlines Feed Cards */}
          <div className="space-y-2.5">
            {newsItems.map((item) => {
              const badgeStyle =
                item.impactColor === 'emerald'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : item.impactColor === 'amber'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  : item.impactColor === 'rose'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                  : 'bg-slate-50 dark:bg-[#162638] text-slate-700 dark:text-[#A9BACB] border-slate-200 dark:border-[#33485D]';

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#101C2A] border border-slate-200 dark:border-[#26394C] hover:border-slate-300 dark:hover:border-[#33485D] rounded p-3.5 transition-all shadow-2xs space-y-2"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeStyle}`}>
                        {item.impactTag}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-[#8194A8] bg-slate-100 dark:bg-[#162638] px-2 py-0.5 rounded">
                        {item.categoryLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-[#8194A8] font-mono">
                        {item.source} • {item.publishedTime}
                      </span>
                    </div>

                    {item.statsHighlight && (
                      <span className="text-xs font-mono font-semibold text-[#142C45] dark:text-[#2dd4bf] bg-slate-50 dark:bg-[#162638] px-2 py-0.5 rounded border border-slate-200/80 dark:border-[#33485D] self-start sm:self-auto">
                        {item.statsHighlight}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-[#E8EEF5] leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-[#A9BACB] leading-relaxed">
                    {item.summary}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#26394C] text-xs">
                    <span className="text-[11px] text-slate-400 dark:text-[#8194A8]">
                      Grounded in Live Financial News Search
                    </span>
                    <button
                      onClick={() => openAiWithPrompt(`Analyze this headline for bank operations: "${item.title}". Detail its regulatory and treasury implications.`)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#168C83] dark:text-[#2dd4bf] hover:underline cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Ask AI Copilot to Analyze</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CURRENCY & FOREX MATRIX */}
      {mainTab === 'currency_desk' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-[#E8EEF5] uppercase tracking-wider">
              Institutional FEDAI Card Rates & RBI Reference Benchmarks
            </span>
            <span className="text-xs font-mono text-slate-500 dark:text-[#8194A8]">
              Interbank Spread: 18 - 25 bps
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 dark:border-[#33485D] rounded">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] font-semibold border-b border-slate-200 dark:border-[#26394C]">
                <tr>
                  <th className="py-2.5 px-3">Currency Pair</th>
                  <th className="py-2.5 px-3 text-right">Spot Mid Rate</th>
                  <th className="py-2.5 px-3 text-right">24h Change</th>
                  <th className="py-2.5 px-3 text-right">TT Selling (Outward)</th>
                  <th className="py-2.5 px-3 text-right">TT Buying (Inward)</th>
                  <th className="py-2.5 px-3 text-right">RBI Reference</th>
                  <th className="py-2.5 px-3 text-center">AI Analysis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#26394C] font-mono">
                {(forexPayload?.quotes || []).map((q) => {
                  const isUp = (q.changePercent24h || 0) >= 0;
                  return (
                    <tr key={q.baseCurrency} className="hover:bg-slate-50/80 dark:hover:bg-[#192B3D] transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{q.flag}</span>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-[#E8EEF5]">{q.pair}</span>
                            <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-normal">{q.currencyName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-[#E8EEF5]">
                        ₹{(Number(q.midRate) || 0).toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`inline-flex items-center ${isUp ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {isUp ? '+' : ''}
                          {(Number(q.changePercent24h) || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-blue-900 dark:text-blue-300 font-medium bg-blue-50/20 dark:bg-blue-950/20">
                        ₹{(Number(q.ttSellingRate) || 0).toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-900 dark:text-emerald-300 font-medium bg-emerald-50/20 dark:bg-emerald-950/20">
                        ₹{(Number(q.ttBuyingRate) || 0).toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-[#A9BACB]">
                        ₹{(Number(q.rbiReferenceRate) || 0).toFixed(4)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <button
                          onClick={() => openAiWithPrompt(`What are the key drivers for ${q.pair} and how does the current rate affect trade remittances under FEMA?`)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#192B3D] text-slate-600 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="Ask AI about currency"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* GST Rule 32(2) & FEMA Notice */}
          <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-[#A9BACB]">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Statutory FX Advisory:</strong> GST under CGST Rule 32(2) applies in 3 slabs (1% up to ₹1L, 0.5% up to ₹10L, 0.1% above, max ₹60,000). Cash margin liens must be marked against customer CASA before issuing Trade LCs.
              </span>
            </div>
            {onNavigateToForex && (
              <button
                onClick={onNavigateToForex}
                className="text-xs font-semibold text-[#168C83] dark:text-[#2dd4bf] hover:underline cursor-pointer shrink-0"
              >
                Open FX Calculator →
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: MUTUAL FUNDS & SIP WEALTH DESK */}
      {mainTab === 'mutual_funds_sip' && (
        <div className="space-y-4">
          {/* AMFI Industry Benchmark Snapshot */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 dark:bg-[#101C2A] rounded border border-slate-200 dark:border-[#33485D]">
              <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-medium">Monthly SIP Inflow</div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                ₹{AMFI_LATEST_STATISTICS.monthlySipInflowInrCr.toLocaleString()} Cr
              </div>
              <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5">
                All-Time High (+{AMFI_LATEST_STATISTICS.monthlyGrowthPercentage}% MoM)
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#101C2A] rounded border border-slate-200 dark:border-[#33485D]">
              <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-medium">Contributing SIP Accounts</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-[#E8EEF5] mt-0.5">
                {AMFI_LATEST_STATISTICS.contributingSipAccountsCrore} Crore
              </div>
              <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5">
                Crossed 10 Cr Milestone
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#101C2A] rounded border border-slate-200 dark:border-[#33485D]">
              <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-medium">Total SIP AUM</div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-[#E8EEF5] mt-0.5">
                ₹{AMFI_LATEST_STATISTICS.sipAumInrLakhCr} Lakh Cr
              </div>
              <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5">
                {AMFI_LATEST_STATISTICS.sipAumSharePercentage}% of Industry Assets
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-[#101C2A] rounded border border-slate-200 dark:border-[#33485D]">
              <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-medium">Net Equity Inflows</div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                ₹{AMFI_LATEST_STATISTICS.equityInflowInrCr.toLocaleString()} Cr
              </div>
              <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5">
                {AMFI_LATEST_STATISTICS.consecutivePositiveMonths} Consecutive Months
              </div>
            </div>
          </div>

          {/* Interactive SIP Compounding & Wealth Calculator */}
          <div className="bg-slate-50/70 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#26394C]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#168C83]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-[#E8EEF5]">
                  Client SIP Compounding & Wealth Projection Engine
                </h4>
              </div>
              <button
                onClick={() => openAiWithPrompt(`Explain how rupee cost averaging in SIPs outperforms lump-sum investing during volatile markets with mathematical examples.`)}
                className="inline-flex items-center gap-1 text-xs text-[#168C83] dark:text-[#2dd4bf] hover:underline font-medium cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Ask AI to Explain Compounding</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sliders / Inputs */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-[#A9BACB] mb-1">
                    <span>Monthly SIP Contribution:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">{formatINR(sipMonthly)}</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={100000}
                    step={1000}
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Number(e.target.value))}
                    className="w-full accent-[#168C83] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#8194A8] font-mono">
                    <span>₹1,000</span>
                    <span>₹50,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-[#A9BACB] mb-1">
                    <span>Investment Horizon (Tenure):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">{sipYears} Years ({sipYears * 12} Months)</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={sipYears}
                    onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full accent-[#168C83] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 dark:text-[#8194A8] font-mono">
                    <span>1 Yr</span>
                    <span>15 Yrs</span>
                    <span>30 Yrs</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-700 dark:text-[#A9BACB] mb-1">
                    <span>Expected Annual Return:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">{sipReturnRate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={22}
                    step={0.5}
                    value={sipReturnRate}
                    onChange={(e) => setSipReturnRate(Number(e.target.value))}
                    className="w-full accent-[#0f1e36] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>6% (Debt/Liquid)</span>
                    <span>12.5% (Flexi/Large)</span>
                    <span>20% (Small Cap)</span>
                  </div>
                </div>
              </div>

              {/* Computed Projections */}
              <div className="md:col-span-2 bg-white dark:bg-[#162638] rounded border border-slate-200 dark:border-[#33485D] p-3.5 flex flex-col justify-between space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 rounded bg-slate-50 dark:bg-[#101C2A] border border-slate-100 dark:border-[#26394C]">
                    <div className="text-slate-500 dark:text-[#8194A8] text-[11px]">Total Invested Capital</div>
                    <div className="font-mono text-base font-bold text-slate-900 dark:text-[#E8EEF5] mt-1">
                      {formatINR(sipCalculation.totalInvestedAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-[#8194A8] font-mono mt-0.5">
                      {sipYears * 12} Installments
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800">
                    <div className="text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">Estimated Wealth Gain</div>
                    <div className="font-mono text-base font-bold text-emerald-800 dark:text-emerald-400 mt-1">
                      +{formatINR(sipCalculation.estimatedWealthGain)}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      Compounded Growth
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-teal-50/60 dark:bg-[#101C2A] border border-teal-100 dark:border-teal-800 col-span-2 sm:col-span-1">
                    <div className="text-teal-700 dark:text-teal-300 text-[11px] font-medium">Projected Maturity Corpus</div>
                    <div className="font-mono text-lg font-bold text-[#142C45] dark:text-[#2dd4bf] mt-1">
                      {formatINR(sipCalculation.estimatedFutureValue)}
                    </div>
                    <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono mt-0.5">
                      {sipCalculation.wealthMultiplier}x Multiplier
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-[#8194A8] pt-2 border-t border-slate-100 dark:border-[#26394C]">
                  <span className="flex items-center gap-1 text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    LTCG taxed at 12.5% on gains over ₹1.25 Lakh per financial year (Section 112A)
                  </span>
                  <button
                    onClick={() => openAiWithPrompt(`Generate a personalized wealth creation memo for a client investing ${formatINR(sipMonthly)}/month for ${sipYears} years at ${sipReturnRate}% return.`)}
                    className="text-xs font-semibold text-[#168C83] dark:text-[#2dd4bf] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Generate Client Memo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AMFI Category Breakdown Table */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-[#E8EEF5] uppercase tracking-wider">
              AMFI Monthly Flow Breakdown by Mutual Fund Category (August 2026)
            </span>
            <div className="overflow-x-auto border border-slate-200 dark:border-[#33485D] rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] font-semibold border-b border-slate-200 dark:border-[#26394C]">
                  <tr>
                    <th className="py-2 px-3">Fund Category</th>
                    <th className="py-2 px-3 text-right">Net Monthly Inflow (₹ Cr)</th>
                    <th className="py-2 px-3 text-right">Share of Equity Flows</th>
                    <th className="py-2 px-3 text-right">3-Year Historical CAGR</th>
                    <th className="py-2 px-3 text-center">Consult AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#26394C] font-mono">
                  {AMFI_LATEST_STATISTICS.categoryBreakdown.map((cat) => (
                    <tr key={cat.category} className="hover:bg-slate-50/80 dark:hover:bg-[#192B3D] transition-colors">
                      <td className="py-2 px-3 font-sans font-medium text-slate-900 dark:text-[#E8EEF5]">
                        {cat.category}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-[#E8EEF5]">
                        ₹{cat.inflowCr.toLocaleString('en-IN', { maximumFractionDigits: 2 })} Cr
                      </td>
                      <td className="py-2 px-3 text-right text-slate-600 dark:text-[#A9BACB]">
                        {cat.sharePct}%
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                        {cat.avg3YrReturn}% p.a.
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        <button
                          onClick={() => openAiWithPrompt(`What are the risk factors and suitability guidelines for ${cat.category} under AMFI regulations?`)}
                          className="p-1 rounded hover:bg-slate-200 dark:hover:bg-[#192B3D] text-slate-600 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="Consult AI about category"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Treasury Advisory & Regulatory Compliance Footer */}
      <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200/80 dark:border-[#33485D] rounded p-3 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-700 dark:text-[#A9BACB]">
          <Info className="w-4 h-4 text-[#168C83] dark:text-[#2dd4bf] shrink-0" />
          <span>
            <strong className="text-slate-900 dark:text-[#E8EEF5]">Treasury & Wealth Advisory:</strong> 10Y Benchmark at 7.040% offers +14 bps valuation cushion for AFS SLR portfolios. Mutual fund SIP inflows hit a historic ₹32,297 Cr across 10.01 Cr folios.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-slate-500 dark:text-[#8194A8] shrink-0">
          <span>1M Forward Prem: 1.68% p.a.</span>
          <span>•</span>
          <span>CTS Settlement: Normal</span>
        </div>
      </div>

      {/* AI Banking Assistant Modal */}
      <AiBankingAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        initialQuery={aiInitialQuery}
      />
    </div>
  );
};
