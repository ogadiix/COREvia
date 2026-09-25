import React, { useState, useEffect, useMemo } from 'react';
import { TradeFinanceItem, ForexRateQuote, ForexRatesPayload } from '../../types';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { Tabs } from '../common/Tabs';
import { ForexBoard } from './ForexBoard';
import { CrossBorderFxCalculator } from './CrossBorderFxCalculator';
import { forexService } from '../../services/forex.service';
import { formatINR } from '../../data/mockIndianBankingData';
import {
  Globe2,
  FileCheck,
  ShieldCheck,
  Building,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Landmark,
  Calculator,
  RefreshCw,
  TrendingUp,
  Coins,
  FileSpreadsheet,
} from 'lucide-react';

interface TradeFinanceModuleProps {
  tradeItems: TradeFinanceItem[];
  onOpenNewLC: () => void;
}

export const TradeFinanceModule: React.FC<TradeFinanceModuleProps> = ({
  tradeItems,
  onOpenNewLC,
}) => {
  const [activeTab, setActiveTab] = useState<'instruments' | 'forex-rates' | 'calculator' | 'nostro'>('instruments');
  const [activeItem, setActiveItem] = useState<TradeFinanceItem | null>(null);
  const [selectedCurrencyForCalc, setSelectedCurrencyForCalc] = useState<string>('USD');
  const [forexData, setForexData] = useState<ForexRatesPayload | null>(null);
  const [isRatesLoading, setIsRatesLoading] = useState<boolean>(false);

  // Fetch live Forex rates
  const loadForexRates = async (force = false) => {
    try {
      setIsRatesLoading(true);
      const data = await forexService.fetchLiveRates(force);
      setForexData(data);
    } catch (err) {
      console.error('Failed to load forex rates in TradeFinanceModule', err);
    } finally {
      setIsRatesLoading(false);
    }
  };

  useEffect(() => {
    loadForexRates(false);
  }, []);

  // Quick lookup map for FX rates against INR
  const rateMap = useMemo(() => {
    const map: Record<string, ForexRateQuote> = {};
    forexData?.quotes?.forEach((q) => {
      map[q.baseCurrency] = q;
    });
    return map;
  }, [forexData]);

  // Helper to convert to approximate INR
  const getInrValue = (amount: number, currency: string): { inrAmount: number; rate: number } => {
    if (currency === 'INR') return { inrAmount: amount, rate: 1.0 };
    const quote = rateMap[currency];
    if (!quote) return { inrAmount: amount * 83.94, rate: 83.94 };
    const effectiveRate = quote.unitMultiplier > 1 ? quote.midRate / quote.unitMultiplier : quote.midRate;
    return {
      inrAmount: amount * effectiveRate,
      rate: quote.midRate,
    };
  };

  // Nostro Accounts with live INR calculation
  const nostroDesks = useMemo(() => {
    const usdRate = rateMap['USD']?.midRate || 83.94;
    const eurRate = rateMap['EUR']?.midRate || 91.32;
    const gbpRate = rateMap['GBP']?.midRate || 107.48;
    const jpyRate = (rateMap['JPY']?.midRate || 57.65) / 100;

    const usdVal = 18420000;
    const eurVal = 9140500;
    const gbpVal = 4850200;
    const jpyVal = 142000000;

    const totalInr =
      usdVal * usdRate +
      eurVal * eurRate +
      gbpVal * gbpRate +
      jpyVal * jpyRate;

    return {
      usd: { amount: usdVal, inr: usdVal * usdRate, rate: usdRate },
      eur: { amount: eurVal, inr: eurVal * eurRate, rate: eurRate },
      gbp: { amount: gbpVal, inr: gbpVal * gbpRate, rate: gbpRate },
      jpy: { amount: jpyVal, inr: jpyVal * jpyRate, rate: rateMap['JPY']?.midRate || 57.65 },
      totalInr,
    };
  }, [rateMap]);

  const columns: Column<TradeFinanceItem>[] = [
    {
      key: 'referenceNumber',
      header: 'Reference #',
      mono: true,
      render: (t) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{t.referenceNumber}</span>
          <div className="text-[10px] text-slate-500 font-sans">
            {t.instrumentType.replace(/_/g, ' ')}
          </div>
        </div>
      ),
    },
    {
      key: 'applicantName',
      header: 'Applicant → Beneficiary',
      render: (t) => (
        <div className="max-w-[240px]">
          <div className="font-semibold text-slate-900 truncate">{t.applicantName}</div>
          <div className="text-[11px] text-slate-500 truncate">
            to: {t.beneficiaryName}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Value & Live FX Converted (INR)',
      align: 'right',
      mono: true,
      render: (t) => {
        const { inrAmount, rate } = getInrValue(t.amount, t.currency);
        return (
          <div>
            <div className="font-mono font-bold text-slate-900">
              {t.currency} {t.amount.toLocaleString()}
            </div>
            {t.currency !== 'INR' && (
              <div className="text-[11px] text-emerald-700 font-mono font-medium">
                ≈ {formatINR(inrAmount)}
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  (@ ₹{(Number(rate) || 83.94).toFixed(2)})
                </span>
              </div>
            )}
            <div className="text-[10px] text-slate-500 font-mono">
              Margin: {t.cashMarginPercentage}% Lien
            </div>
          </div>
        );
      },
    },
    {
      key: 'expiryDate',
      header: 'Validity Period',
      align: 'right',
      mono: true,
      render: (t) => (
        <div className="text-right">
          <span className="font-mono text-slate-900">{t.expiryDate}</span>
          <div className="text-[10px] text-slate-400">Issued: {t.issueDate}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (t) => {
        if (t.status === 'ISSUED' || t.status === 'ACCEPTED') {
          return <Badge variant="success" size="sm">{t.status}</Badge>;
        }
        return <Badge variant="neutral" size="sm">{t.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (t) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveItem(t)}
            icon={<Eye className="w-3 h-3" />}
          >
            Inspect
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Real-Time Forex Ticker Ribbon */}
      <div className="bg-slate-900 text-slate-100 rounded px-3 py-2 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-300">
            Live Interbank Forex Feed:
          </span>
        </div>

        {/* Live Ticker Items */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {forexData?.quotes?.slice(0, 5).map((q) => {
            const isUp = q.change24h >= 0;
            return (
              <button
                key={q.baseCurrency}
                onClick={() => {
                  setSelectedCurrencyForCalc(q.baseCurrency);
                  setActiveTab('calculator');
                }}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer bg-slate-800/60 hover:bg-slate-800 px-2 py-0.5 rounded border border-slate-700/50"
                title={`Click to convert ${q.pair} with FEDAI Card spread`}
              >
                <span>{q.flag}</span>
                <span className="font-semibold text-slate-200">{q.pair}:</span>
                <span className="text-white font-bold">₹{(Number(q?.midRate) || 0).toFixed(2)}</span>
                <span
                  className={`text-[10px] flex items-center ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                  {isUp ? '+' : ''}
                  {q?.changePercent24h ?? 0}%
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadForexRates(true)}
            disabled={isRatesLoading}
            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isRatesLoading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* High-Level Statutory Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Active LC & BG Exposure"
          value="₹61.85 Cr"
          code="CONTINGENT-LIAB"
          subtext="Non-fund based contingent books"
        />

        <StatCard
          label="Cash Margin Collateral"
          value="₹55.20 Cr"
          code="LIEN-DEPOSITS"
          subtext="100% lien against deposits"
          regulatoryBadge={{
            text: 'Secured',
            status: 'compliant',
          }}
        />

        <StatCard
          label="Nostro Total Mirror Valuation"
          value={`₹${((nostroDesks?.totalInr || 0) / 10000000).toFixed(2)} Cr`}
          code="NOSTRO-INR"
          subtext="USD, EUR, GBP, JPY revalued live"
          regulatoryBadge={{
            text: 'Live Revalued',
            status: 'compliant',
          }}
        />

        <StatCard
          label="FEMA 1999 Compliance"
          value="100% LODGED"
          code="EDPMS-IDPMS"
          subtext="RBI automated regulatory lodgement"
          regulatoryBadge={{
            text: 'RBI Audited',
            status: 'compliant',
          }}
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <Tabs
        tabs={[
          {
            id: 'instruments',
            label: 'Letters of Credit & Bank Guarantees',
            badge: tradeItems.length,
            icon: <Landmark className="w-3.5 h-3.5" />,
          },
          {
            id: 'forex-rates',
            label: 'Live Daily Forex Rates & FEDAI Card',
            badge: 'LIVE',
            icon: <Coins className="w-3.5 h-3.5 text-emerald-600" />,
          },
          {
            id: 'calculator',
            label: 'Cross-Border FX Converter & Margin',
            icon: <Calculator className="w-3.5 h-3.5 text-blue-600" />,
          },
          {
            id: 'nostro',
            label: 'Correspondent Nostro Desks',
            badge: '4 Desks',
            icon: <Globe2 className="w-3.5 h-3.5 text-indigo-600" />,
          },
        ]}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as any)}
      />

      {/* TAB 1: Instruments Register */}
      {activeTab === 'instruments' && (
        <div className="bg-white border border-slate-200 rounded">
          <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                Letters of Credit & Bank Guarantee Register
              </h2>
              <span className="font-mono text-xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                Live Revaluation Active
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveTab('calculator')}
                icon={<Calculator className="w-3.5 h-3.5" />}
              >
                FX Margin Calculator
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={onOpenNewLC}
                icon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                Issue Trade Instrument
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            data={tradeItems}
            keyExtractor={(t) => t.referenceNumber}
            onRowClick={(t) => setActiveItem(t)}
          />
        </div>
      )}

      {/* TAB 2: Live Daily Forex Rates & FEDAI Card */}
      {activeTab === 'forex-rates' && (
        <ForexBoard
          onSelectForConversion={(code) => {
            setSelectedCurrencyForCalc(code);
            setActiveTab('calculator');
          }}
          onRefreshCompleted={() => {
            // Re-render
          }}
        />
      )}

      {/* TAB 3: Cross-Border FX Calculator & Margin Estimator */}
      {activeTab === 'calculator' && (
        <CrossBorderFxCalculator
          initialCurrency={selectedCurrencyForCalc}
          onApplyToInstrument={(result) => {
            onOpenNewLC();
          }}
        />
      )}

      {/* TAB 4: Correspondent Nostro Desks */}
      {activeTab === 'nostro' && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-slate-700" />
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  Correspondent Foreign Exchange (Nostro) Desks & Mirror Ledgers
                </h3>
                <p className="text-[11px] text-slate-500">
                  Real-time valuation against interbank spot benchmark fixing
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">SWIFT: CRVIINBBMUM</span>
              <Badge variant="success" size="sm">
                Total: ₹{((nostroDesks?.totalInr || 0) / 10000000).toFixed(2)} Cr
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* USD Desk */}
            <div className="p-3 rounded border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-colors shadow-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="text-base">🇺🇸</span> USD Desk
                </span>
                <span className="font-mono text-[11px] bg-slate-200/70 px-1.5 py-0.5 rounded">CITIUS33</span>
              </div>
              <div className="mt-2 font-mono font-bold text-slate-900 text-base">
                ${nostroDesks?.usd?.amount?.toLocaleString() || '18,420,000'}
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5">
                ≈ {formatINR(nostroDesks?.usd?.inr || 0)}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200 flex justify-between">
                <span>Citibank N.A., New York</span>
                <span className="font-mono">@ ₹{(Number(nostroDesks?.usd?.rate) || 83.94).toFixed(2)}</span>
              </div>
            </div>

            {/* EUR Desk */}
            <div className="p-3 rounded border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-colors shadow-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="text-base">🇪🇺</span> EUR Desk
                </span>
                <span className="font-mono text-[11px] bg-slate-200/70 px-1.5 py-0.5 rounded">DEUTDEDD</span>
              </div>
              <div className="mt-2 font-mono font-bold text-slate-900 text-base">
                €{nostroDesks?.eur?.amount?.toLocaleString() || '9,140,500'}
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5">
                ≈ {formatINR(nostroDesks?.eur?.inr || 0)}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200 flex justify-between">
                <span>Deutsche Bank AG, Frankfurt</span>
                <span className="font-mono">@ ₹{(Number(nostroDesks?.eur?.rate) || 91.32).toFixed(2)}</span>
              </div>
            </div>

            {/* GBP Desk */}
            <div className="p-3 rounded border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-colors shadow-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="text-base">🇬🇧</span> GBP Desk
                </span>
                <span className="font-mono text-[11px] bg-slate-200/70 px-1.5 py-0.5 rounded">BARCGB22</span>
              </div>
              <div className="mt-2 font-mono font-bold text-slate-900 text-base">
                £{nostroDesks?.gbp?.amount?.toLocaleString() || '4,850,200'}
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5">
                ≈ {formatINR(nostroDesks?.gbp?.inr || 0)}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200 flex justify-between">
                <span>Barclays Bank PLC, London</span>
                <span className="font-mono">@ ₹{(Number(nostroDesks?.gbp?.rate) || 107.48).toFixed(2)}</span>
              </div>
            </div>

            {/* JPY Desk */}
            <div className="p-3 rounded border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 transition-colors shadow-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="text-base">🇯🇵</span> JPY Desk
                </span>
                <span className="font-mono text-[11px] bg-slate-200/70 px-1.5 py-0.5 rounded">BOTKJPJT</span>
              </div>
              <div className="mt-2 font-mono font-bold text-slate-900 text-base">
                ¥{nostroDesks?.jpy?.amount?.toLocaleString() || '142,000,000'}
              </div>
              <div className="text-[11px] font-mono text-emerald-700 font-semibold mt-0.5">
                ≈ {formatINR(nostroDesks?.jpy?.inr || 0)}
              </div>
              <div className="text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-200 flex justify-between">
                <span>MUFG Bank Ltd, Tokyo</span>
                <span className="font-mono">@ ₹{(Number(nostroDesks?.jpy?.rate) || 57.65).toFixed(2)} / 100¥</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded bg-blue-50/50 border border-blue-100 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-700" />
              <span>
                Correspondent account balances are reconciled daily with SWIFT MT940 / MT950 Electronic Customer Statements.
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveTab('calculator')}
              icon={<Calculator className="w-3.5 h-3.5" />}
            >
              Open FX Settlement Desk
            </Button>
          </div>
        </div>
      )}

      {/* Instrument Inspection Modal */}
      {activeItem && (
        <Modal
          isOpen={!!activeItem}
          onClose={() => setActiveItem(null)}
          title={`Trade Instrument Master — ${activeItem.referenceNumber}`}
          subtitle={`Instrument: ${activeItem.instrumentType.replace(/_/g, ' ')}`}
          referenceId={activeItem.referenceNumber}
          maxWidth="xl"
          footerActions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCurrencyForCalc(activeItem.currency);
                  setActiveItem(null);
                  setActiveTab('calculator');
                }}
                icon={<Calculator className="w-3 h-3" />}
              >
                Calculate Settlement in FX Desk
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveItem(null)}
              >
                Close Record
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            {/* Value card with live FX conversion */}
            {(() => {
              const { inrAmount, rate } = getInrValue(activeItem.amount, activeItem.currency);
              const marginAmount = (inrAmount * activeItem.cashMarginPercentage) / 100;
              return (
                <div className="bg-slate-50 border border-slate-200 rounded p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 uppercase tracking-wide text-[10px]">
                      Instrument Face Value & Live Revaluation
                    </span>
                    <Badge variant="success" size="sm">{activeItem.status}</Badge>
                  </div>
                  <div className="font-mono text-xl font-bold text-slate-900 mt-1 flex items-baseline gap-2">
                    <span>
                      {activeItem.currency} {activeItem.amount.toLocaleString()}
                    </span>
                    {activeItem.currency !== 'INR' && (
                      <span className="text-sm font-semibold text-emerald-700">
                        (≈ {formatINR(inrAmount)})
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px] mt-1 flex justify-between">
                    <span>
                      Cash Margin Lien: {activeItem.cashMarginPercentage}% (≈ {formatINR(marginAmount)} marked against CASA/FD)
                    </span>
                    {activeItem.currency !== 'INR' && (
                      <span className="text-slate-600">Spot Rate: ₹{(Number(rate) || 83.94).toFixed(4)}</span>
                    )}
                  </div>
                </div>
              );
            })()}

            <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Applicant:</span>
                <span className="font-semibold text-slate-900">{activeItem.applicantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiary:</span>
                <span className="font-semibold text-slate-900">{activeItem.beneficiaryName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Advising Bank (SWIFT / IFSC):</span>
                <span className="font-mono text-slate-800">{activeItem.advisingBankIfscOrSwift}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Underlying Shipment / Contract:</span>
                <span className="font-medium text-slate-800 text-right max-w-[280px]">
                  {activeItem.underlyingGoods}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100">
                <span className="text-slate-500">FEMA Compliance:</span>
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified & Lodged with RBI EDPMS / IDPMS
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
