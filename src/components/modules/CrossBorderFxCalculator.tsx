import React, { useState, useEffect } from 'react';
import {
  ForexRateQuote,
  ForexSettlementType,
  CrossBorderConversionResult,
  TradeInstrument,
} from '../../types';
import { forexService } from '../../services/forex.service';
import { formatINR } from '../../data/mockIndianBankingData';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Calculator,
  ArrowRightLeft,
  ShieldCheck,
  Building,
  Copy,
  CheckCircle2,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

interface CrossBorderFxCalculatorProps {
  initialCurrency?: string;
  onApplyToInstrument?: (result: CrossBorderConversionResult) => void;
}

export const CrossBorderFxCalculator: React.FC<CrossBorderFxCalculatorProps> = ({
  initialCurrency = 'USD',
  onApplyToInstrument,
}) => {
  const [currency, setCurrency] = useState<string>(initialCurrency);
  const [amount, setAmount] = useState<number>(250000);
  const [settlementType, setSettlementType] = useState<ForexSettlementType>('TT_SELLING');
  const [instrumentType, setInstrumentType] = useState<string>('LETTER_OF_CREDIT');
  const [cashMarginPct, setCashMarginPct] = useState<number>(15);
  const [availableQuotes, setAvailableQuotes] = useState<ForexRateQuote[]>([]);
  const [conversionResult, setConversionResult] = useState<CrossBorderConversionResult | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Load available live quotes
  useEffect(() => {
    forexService.fetchLiveRates().then((res) => {
      setAvailableQuotes(res.quotes);
      if (initialCurrency && !currency) {
        setCurrency(initialCurrency);
      }
    });
  }, [initialCurrency]);

  // Recalculate on input changes
  useEffect(() => {
    if (amount <= 0 || !currency) return;

    forexService
      .calculateConversion({
        fromCurrency: currency,
        toCurrency: 'INR',
        amount,
        settlementType,
        tradeInstrument: instrumentType as TradeInstrument,
        cashMarginPercentage: cashMarginPct,
      })
      .then((res) => {
        setConversionResult(res);
      });
  }, [currency, amount, settlementType, instrumentType, cashMarginPct]);

  const activeQuote = availableQuotes.find((q) => q.baseCurrency === currency) || availableQuotes[0];

  const handleCopySummary = () => {
    if (!conversionResult) return;
    const appliedRateStr = (Number(conversionResult.appliedRate) || 0).toFixed(4);
    const text = `COREvia BANKING - CROSS-BORDER FX SETTLEMENT MEMO
Reference Date: ${new Date().toLocaleDateString('en-IN')}
Instrument: ${instrumentType}
Currency & Face Value: ${currency} ${amount.toLocaleString()}
FEDAI Rate Applied (${conversionResult.rateTypeLabel}): ₹${appliedRateStr}
Gross INR Value: ${formatINR(conversionResult.grossTargetAmount)}
GST on FX Conversion (CGST Rule 32(2)): ₹${conversionResult.gstOnForexInr.toLocaleString('en-IN')}
Net Settlement Value: ${formatINR(conversionResult.totalSettlementInr)}
Cash Margin Collateral Required (${cashMarginPct}%): ${conversionResult.cashMarginRequiredInr ? formatINR(conversionResult.cashMarginRequiredInr) : 'N/A'}
Statutory Compliance: ${conversionResult.femaComplianceCategory}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-900 rounded border border-blue-100">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Cross-Border Trade FX Conversion & Margin Estimator
            </h3>
            <p className="text-[11px] text-slate-500">
              Compute real-time settlement equivalents, statutory GST (Rule 32(2)), and cash margin liens
            </p>
          </div>
        </div>

        <Badge variant="neutral" size="sm">
          FEDAI Rule 3 Compliant
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Form: Parameter Inputs */}
        <div className="lg:col-span-5 space-y-3.5 text-xs">
          {/* Instrument Type */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Cross-Border Trade Instrument / Remittance Type
            </label>
            <select
              value={instrumentType}
              onChange={(e) => {
                const val = e.target.value;
                setInstrumentType(val);
                // Adjust appropriate rate type automatically
                if (val === 'LETTER_OF_CREDIT' || val === 'IMPORT_COLLECTION' || val === 'OUTWARD_REMITTANCE_A2') {
                  setSettlementType('TT_SELLING');
                } else if (val === 'EXPORT_REALIZATION' || val === 'INLAND_BILL_DISCOUNTING') {
                  setSettlementType('TT_BUYING');
                }
              }}
              className="w-full p-2 border border-slate-200 rounded bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#0f1e36]"
            >
              <option value="LETTER_OF_CREDIT">Import Letter of Credit (Outward LC Settlement)</option>
              <option value="BANK_GUARANTEE">Bank Guarantee / SBLC (Performance / Financial)</option>
              <option value="EXPORT_REALIZATION">Export Proceeds Realization (FIRC / Inward)</option>
              <option value="IMPORT_COLLECTION">Import Bill under Collection (Bill Selling)</option>
              <option value="INLAND_BILL_DISCOUNTING">Export Bill Discounting / Purchase (Bill Buying)</option>
              <option value="OUTWARD_REMITTANCE_A2">Outward Remittance (Form A2 / LRS Capital Account)</option>
            </select>
          </div>

          {/* Currency & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Foreign Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#0f1e36] font-mono font-medium"
              >
                {availableQuotes.map((q) => (
                  <option key={q.baseCurrency} value={q.baseCurrency}>
                    {q.flag} {q.baseCurrency} — {q.currencyName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Foreign Face Value</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-500">
                  {activeQuote?.symbol || '$'}
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-7 pr-2.5 py-2 border border-slate-200 rounded bg-slate-50/50 focus:bg-white focus:outline-hidden focus:border-[#0f1e36] font-mono font-bold text-slate-900"
                  placeholder="250000"
                />
              </div>
            </div>
          </div>

          {/* Quick Amount Presets */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[10px] text-slate-400 font-medium">Quick Amount:</span>
            {[50000, 100000, 250000, 500000, 1000000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                  amount === preset
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ${preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}k`}
              </button>
            ))}
          </div>

          {/* Rate Type Selector */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Applicable FEDAI Card Rate Type
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'TT_SELLING', label: 'TT Selling', desc: 'Outward / Import LC' },
                { id: 'TT_BUYING', label: 'TT Buying', desc: 'Inward / Export' },
                { id: 'BILL_SELLING', label: 'Bill Selling', desc: 'Import Bills' },
                { id: 'BILL_BUYING', label: 'Bill Buying', desc: 'Export Discounting' },
              ].map((rate) => (
                <button
                  key={rate.id}
                  type="button"
                  onClick={() => setSettlementType(rate.id as ForexSettlementType)}
                  className={`p-2 text-left rounded border transition-colors cursor-pointer ${
                    settlementType === rate.id
                      ? 'border-[#0f1e36] bg-blue-50/50 text-[#0f1e36] font-semibold ring-1 ring-[#0f1e36]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-semibold text-[11px]">{rate.label}</div>
                  <div className="text-[10px] text-slate-500">{rate.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Margin Requirement */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">
                Cash Margin Lien Collateral
              </label>
              <span className="font-mono font-bold text-slate-900">{cashMarginPct}% Lien</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={cashMarginPct}
              onChange={(e) => setCashMarginPct(Number(e.target.value))}
              className="w-full accent-[#0f1e36] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-0.5">
              <span>0% (Clean Facility)</span>
              <span>15% (Standard LC)</span>
              <span>25%</span>
              <span>100% (Cash Covered)</span>
            </div>
          </div>
        </div>

        {/* Right Panel: Statutory Settlement Breakdown */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Settlement Cost Summary
              </span>
              <span className="font-mono text-xs text-slate-600 flex items-center gap-1">
                Rate: ₹{conversionResult?.appliedRate?.toFixed(4) || '—'} / {currency}
              </span>
            </div>

            {/* Big Net Result Display */}
            <div className="bg-white border border-slate-200 rounded p-3 text-center space-y-1">
              <div className="text-[11px] text-slate-500 font-medium">
                Gross Converted INR Counter-Value
              </div>
              <div className="font-mono text-2xl font-bold text-slate-900">
                {conversionResult ? formatINR(conversionResult.grossTargetAmount) : '—'}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Equivalent to {currency} {amount.toLocaleString()} @ ₹{conversionResult?.appliedRate?.toFixed(4) || '0.00'}
              </div>
            </div>

            {/* Cost & Tax Breakdown Rows */}
            <div className="bg-white border border-slate-200 rounded p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Interbank Mid Benchmark:</span>
                <span className="font-mono font-medium text-slate-800">
                  ₹{activeQuote?.midRate?.toFixed(4) || '—'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">
                  FEDAI Bank Spread ({conversionResult?.bankSpreadPercentage || 0}%):
                </span>
                <span className="font-mono font-medium text-slate-800">
                  + ₹{conversionResult?.spreadAmountInr?.toLocaleString('en-IN') || '0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <span className="text-slate-700 font-medium">GST on Foreign Exchange:</span>
                  <span
                    className="text-slate-400 hover:text-slate-600 cursor-help"
                    title="Computed under CGST Rule 32(2) based on transaction value slab"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </span>
                </div>
                <span className="font-mono font-bold text-blue-900">
                  ₹{conversionResult?.gstOnForexInr?.toLocaleString('en-IN') || '0.00'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 bg-slate-50/50 -mx-3 px-3 py-1">
                <span className="font-semibold text-slate-900">Total Net Outflow (INR):</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  {conversionResult ? formatINR(conversionResult.totalSettlementInr) : '—'}
                </span>
              </div>

              {/* Cash Margin Lien (if selected) */}
              {conversionResult?.cashMarginRequiredInr !== undefined && conversionResult.cashMarginRequiredInr > 0 && (
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-amber-200 text-amber-900 bg-amber-50/40 -mx-3 px-3 py-1">
                  <span className="font-semibold">Required Cash Margin Lien ({cashMarginPct}%):</span>
                  <span className="font-mono font-bold">
                    {formatINR(conversionResult.cashMarginRequiredInr)}
                  </span>
                </div>
              )}
            </div>

            {/* FEMA & Regulatory Tag */}
            <div className="p-2 rounded bg-emerald-50/60 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Regulatory Classification:</span>{' '}
                {conversionResult?.femaComplianceCategory}
                <div className="text-[10px] text-emerald-700 font-mono mt-0.5">
                  IDPMS / EDPMS Remittance Code Lodged Automatically
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopySummary}
              icon={isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {isCopied ? 'Summary Copied!' : 'Copy Settlement Memo'}
            </Button>

            {onApplyToInstrument && conversionResult && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => onApplyToInstrument(conversionResult)}
                icon={<Building className="w-3.5 h-3.5" />}
              >
                Apply to Trade Instrument
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
