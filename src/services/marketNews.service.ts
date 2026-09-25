export interface FinancialNewsItem {
  id: string;
  title: string;
  source: string;
  category: 'TREASURY_BONDS' | 'CURRENCY_FOREX' | 'MUTUAL_FUNDS_SIP' | 'RBI_POLICY';
  categoryLabel: string;
  publishedTime: string;
  summary: string;
  impactTag: 'High Impact' | 'Market Neutral' | 'Positive Inflow' | 'Prudential Alert';
  impactColor: 'rose' | 'slate' | 'emerald' | 'amber';
  url?: string;
  statsHighlight?: string;
}

export interface AmfiSipStatistics {
  monthlySipInflowInrCr: number;
  sipAumInrLakhCr: number;
  sipAumSharePercentage: number;
  contributingSipAccountsCrore: number;
  equityInflowInrCr: number;
  consecutivePositiveMonths: number;
  monthlyGrowthPercentage: number;
  yoyGrowthPercentage: number;
  categoryBreakdown: {
    category: string;
    inflowCr: number;
    sharePct: number;
    avg3YrReturn: number;
  }[];
}

export const AMFI_LATEST_STATISTICS: AmfiSipStatistics = {
  monthlySipInflowInrCr: 32297,
  sipAumInrLakhCr: 18.61,
  sipAumSharePercentage: 21.4,
  contributingSipAccountsCrore: 10.01,
  equityInflowInrCr: 29328,
  consecutivePositiveMonths: 66,
  monthlyGrowthPercentage: 3.8,
  yoyGrowthPercentage: 14.0,
  categoryBreakdown: [
    { category: 'Small-Cap Equity Funds', inflowCr: 7973.33, sharePct: 27.2, avg3YrReturn: 24.8 },
    { category: 'Mid-Cap Equity Funds', inflowCr: 6989.40, sharePct: 23.8, avg3YrReturn: 21.4 },
    { category: 'Flexi-Cap / Multi-Cap Funds', inflowCr: 5059.42, sharePct: 17.3, avg3YrReturn: 18.2 },
    { category: 'Large-Cap & Index Funds', inflowCr: 3824.10, sharePct: 13.0, avg3YrReturn: 14.6 },
    { category: 'Gold & Precious Metal ETFs', inflowCr: 2596.70, sharePct: 8.9, avg3YrReturn: 17.5 },
    { category: 'Sectoral / Thematic Funds', inflowCr: 2885.05, sharePct: 9.8, avg3YrReturn: 22.1 },
  ],
};

export const FINANCIAL_NEWS_HEADLINES: FinancialNewsItem[] = [
  {
    id: 'news-amfi-01',
    title: 'AMFI Data: Mutual Fund Monthly SIP Inflows Hit Record High of ₹32,297 Crore in August 2026',
    source: 'Livemint / AMFI Official Release',
    category: 'MUTUAL_FUNDS_SIP',
    categoryLabel: 'Mutual Funds & SIP',
    publishedTime: '10-Sep 17:30 IST',
    summary: 'Systematic Investment Plan contributions surged 3.8% MoM to breach the ₹32,000 Cr mark for the first time. Active contributing SIP accounts surpassed the historic 10 Crore milestone, reaching 10.01 Crore.',
    impactTag: 'Positive Inflow',
    impactColor: 'emerald',
    statsHighlight: '₹32,297 Cr / Month (10.01 Cr Folios)',
  },
  {
    id: 'news-bond-01',
    title: 'Benchmark 10-Year Indian Government Bond Yield Crosses 7.00% on Global Debt Selloff & Crude Rally',
    source: 'The Economic Times / CCIL',
    category: 'TREASURY_BONDS',
    categoryLabel: 'Treasury & G-Sec',
    publishedTime: '11-Sep 14:15 IST',
    summary: 'The 10-year benchmark yield reached 7.04% amid elevated Brent crude prices and rising US Treasury yields. However, domestic institutional demand and SLR rebalancing provided strong support near 7.05%.',
    impactTag: 'Prudential Alert',
    impactColor: 'amber',
    statsHighlight: '10Y Yield: 7.040% (+2.5 bps)',
  },
  {
    id: 'news-rbi-01',
    title: 'RBI Liquidity Strategy: Central Bank Plans ₹1 Lakh Crore OMO Bond Sales to Drain Banking System Surplus',
    source: 'Business Times / RBI FMD',
    category: 'RBI_POLICY',
    categoryLabel: 'RBI Monetary Policy',
    publishedTime: '11-Sep 11:45 IST',
    summary: 'To manage surplus liquidity following recent liquidity injections and ensure short-term overnight money market rates align with the 6.50% Repo Rate, the Reserve Bank announced targeted Open Market Operation bond auctions.',
    impactTag: 'High Impact',
    impactColor: 'rose',
    statsHighlight: '₹1,00,000 Cr OMO Absorption',
  },
  {
    id: 'news-fx-01',
    title: 'USD/INR Trades Around ₹83.94 - ₹84.27 as Dollar Index Gains; RBI Interventions Limit Volatility',
    source: 'NDTV Profit / Forex Interbank Desk',
    category: 'CURRENCY_FOREX',
    categoryLabel: 'Currency & Forex',
    publishedTime: '11-Sep 13:20 IST',
    summary: 'The Indian Rupee remained in a tight range against the US Dollar supported by RBI presence across spot and non-deliverable forwards. Exporter selling near 84.10 capped upward movement in the greenback.',
    impactTag: 'Market Neutral',
    impactColor: 'slate',
    statsHighlight: 'Spot: ₹83.9425 | RBI Ref: ₹83.94',
  },
  {
    id: 'news-equity-01',
    title: 'Equity Mutual Funds Mark 66 Consecutive Months of Positive Inflows with ₹29,328 Crore Invested in August',
    source: 'The Indian Express / AMFI',
    category: 'MUTUAL_FUNDS_SIP',
    categoryLabel: 'Mutual Funds & SIP',
    publishedTime: '10-Sep 18:00 IST',
    summary: 'Retail investor commitment remained resilient despite broader market swings, with Small-Cap (₹7,973 Cr) and Mid-Cap (₹6,989 Cr) schemes leading the equity allocations.',
    impactTag: 'Positive Inflow',
    impactColor: 'emerald',
    statsHighlight: '66 Months of Sustained Inflows',
  },
  {
    id: 'news-spread-01',
    title: 'India-US 10-Year Sovereign Yield Differential Remains Resilient at +278 Basis Points',
    source: 'Financial Express / Treasury Monitor',
    category: 'TREASURY_BONDS',
    categoryLabel: 'Treasury & G-Sec',
    publishedTime: '11-Sep 09:30 IST',
    summary: 'With US 10-year Treasury yields hovering around 4.26% and India 10Y at 7.04%, the sovereign spread of 278 bps continues to support steady foreign portfolio investor (FPI) allocations under the Fully Accessible Route (FAR).',
    impactTag: 'Market Neutral',
    impactColor: 'slate',
    statsHighlight: '+278 bps Sovereign Spread',
  },
];

class MarketNewsService {
  getLatestHeadlines(category?: string): FinancialNewsItem[] {
    if (!category || category === 'ALL') {
      return FINANCIAL_NEWS_HEADLINES;
    }
    return FINANCIAL_NEWS_HEADLINES.filter((item) => item.category === category);
  }

  getAmfiStatistics(): AmfiSipStatistics {
    return AMFI_LATEST_STATISTICS;
  }

  calculateSipProjection(monthlyInvestment: number, annualReturnRate: number, tenureYears: number) {
    const monthlyRate = annualReturnRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    const investedAmount = monthlyInvestment * totalMonths;

    // Compound Interest formula for SIP: FV = P * [ ((1 + r)^n - 1) / r ] * (1 + r)
    const futureValue =
      monthlyInvestment *
      ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) *
      (1 + monthlyRate);

    const estimatedWealthGain = futureValue - investedAmount;

    return {
      monthlyInvestment,
      tenureYears,
      expectedReturnPercentage: annualReturnRate,
      totalInvestedAmount: Math.round(investedAmount),
      estimatedFutureValue: Math.round(futureValue),
      estimatedWealthGain: Math.round(estimatedWealthGain),
      wealthMultiplier: Number((futureValue / investedAmount).toFixed(2)),
    };
  }
}

export const marketNewsService = new MarketNewsService();
