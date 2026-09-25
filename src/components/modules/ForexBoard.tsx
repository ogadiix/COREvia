import React, { useState, useEffect, useMemo } from 'react';
import { ForexRateQuote, ForexRatesPayload } from '../../types';
import { forexService } from '../../services/forex.service';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import {
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Calculator,
  ShieldCheck,
  Building2,
  Clock,
  Download,
  CheckCircle2,
} from 'lucide-react';

interface ForexBoardProps {
  onSelectForConversion?: (currencyCode: string, quote: ForexRateQuote) => void;
  onRefreshCompleted?: () => void;
}

export const ForexBoard: React.FC<ForexBoardProps> = ({
  onSelectForConversion,
  onRefreshCompleted,
}) => {
  const [data, setData] = useState<ForexRatesPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'MAJOR' | 'GULF' | 'ASIAN'>('ALL');
  const [copiedQuote, setCopiedQuote] = useState<string | null>(null);

  const loadRates = async (force = false) => {
    try {
      if (force) setIsRefreshing(true);
      else setIsLoading(true);
      const res = await forexService.fetchLiveRates(force);
      setData(res);
      if (onRefreshCompleted) onRefreshCompleted();
    } catch (err) {
      console.error('Failed to load forex rates', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRates(false);
    // Refresh every 60 seconds
    const interval = setInterval(() => {
      loadRates(false);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredQuotes = useMemo(() => {
    if (!data?.quotes) return [];
    let list = data.quotes;

    if (categoryFilter === 'MAJOR') {
      list = list.filter((q) => ['USD', 'EUR', 'GBP', 'JPY'].includes(q.baseCurrency));
    } else if (categoryFilter === 'GULF') {
      list = list.filter((q) => ['AED', 'SAR', 'QAR'].includes(q.baseCurrency));
    } else if (categoryFilter === 'ASIAN') {
      list = list.filter((q) => ['JPY', 'SGD', 'CNY', 'AED'].includes(q.baseCurrency));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (item) =>
          item.baseCurrency.toLowerCase().includes(q) ||
          item.currencyName.toLowerCase().includes(q) ||
          item.pair.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, categoryFilter, searchQuery]);

  const handleCopyRate = (quote: ForexRateQuote) => {
    const text = `${quote.pair} | Mid: ₹${quote.midRate} | TT Buy: ₹${quote.ttBuyingRate} | TT Sell: ₹${quote.ttSellingRate} (FEDAI Card)`;
    navigator.clipboard.writeText(text);
    setCopiedQuote(quote.baseCurrency);
    setTimeout(() => setCopiedQuote(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Control Bar */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              Interbank Daily Foreign Exchange & FEDAI Card Rates
            </h2>
            <Badge variant="neutral" size="sm">
              Base: INR (₹)
            </Badge>
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span>Source: {data?.source || 'RBI Financial Markets & FEDAI Reference Feed'}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Sync: {data?.quotes?.[0]?.lastUpdated || 'Live'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => loadRates(true)}
            disabled={isRefreshing}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />}
          >
            {isRefreshing ? 'Refreshing Rates...' : 'Refresh Live Rates'}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                'Pair,Currency,RBI_Benchmark,Mid_Rate,TT_Buy,TT_Sell,Bill_Buy,Bill_Sell,Change_24h,Day_High,Day_Low\n' +
                (data?.quotes || [])
                  .map(
                    (q) =>
                      `"${q.pair}","${q.currencyName}",${q.rbiReferenceRate},${q.midRate},${q.ttBuyingRate},${q.ttSellingRate},${q.billBuyingRate},${q.billSellingRate},${q.change24h},${q.dayHigh},${q.dayLow}`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `COREvia_FEDAI_Forex_Rates_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export FEDAI Sheet
          </Button>
        </div>
      </div>

      {/* Corridor Quick Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {data?.quotes?.slice(0, 4).map((q) => {
          const isUp = q.change24h >= 0;
          return (
            <div
              key={q.baseCurrency}
              className="bg-white border border-slate-200 rounded p-3 hover:border-slate-300 transition-colors shadow-xs"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <span className="text-base leading-none">{q.flag}</span>
                  <span>{q.pair}</span>
                </span>
                <span
                  className={`inline-flex items-center text-[11px] font-medium font-mono ${
                    isUp ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {isUp ? '+' : ''}
                  {q.changePercent24h}%
                </span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="font-mono text-lg font-bold text-slate-900">
                  ₹{(Number(q?.midRate) || 0).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {(q?.unitMultiplier || 1) > 1 ? `per ${q.unitMultiplier}` : 'Spot Mid'}
                </span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-600">
                <span>TT Sell: ₹{(Number(q?.ttSellingRate) || 0).toFixed(2)}</span>
                <span>TT Buy: ₹{(Number(q?.ttBuyingRate) || 0).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'ALL', label: 'All Currencies' },
              { id: 'MAJOR', label: 'Major Corridors (USD, EUR, GBP, JPY)' },
              { id: 'GULF', label: 'Gulf CEPA (AED, SAR, QAR)' },
              { id: 'ASIAN', label: 'Asian Trade (JPY, SGD, CNY, AED)' },
            ] as const
          ).map((filter) => (
            <button
              key={filter.id}
              onClick={() => setCategoryFilter(filter.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                categoryFilter === filter.id
                  ? 'bg-[#0f1e36] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search currency code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded focus:outline-hidden focus:border-[#0f1e36] bg-slate-50/50"
          />
        </div>
      </div>

      {/* Main Rates Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Currency Pair</th>
                <th className="py-2.5 px-3 text-right">RBI Benchmark</th>
                <th className="py-2.5 px-3 text-right">Interbank Mid</th>
                <th className="py-2.5 px-3 text-right bg-blue-50/40 text-blue-900">
                  TT Selling (Import / Outward)
                </th>
                <th className="py-2.5 px-3 text-right bg-emerald-50/40 text-emerald-900">
                  TT Buying (Export / Inward)
                </th>
                <th className="py-2.5 px-3 text-right">Bill Selling</th>
                <th className="py-2.5 px-3 text-right">Bill Buying</th>
                <th className="py-2.5 px-3 text-center">24h Net</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-slate-400" />
                    Fetching latest FEDAI card rates & RBI benchmarks...
                  </td>
                </tr>
              ) : filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No currency pairs matched your search criteria.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((q) => {
                  const isUp = q.change24h >= 0;
                  return (
                    <tr
                      key={q.baseCurrency}
                      className="hover:bg-slate-50/80 transition-colors group font-mono"
                    >
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="text-lg leading-none shrink-0">{q.flag}</span>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5 font-mono">
                              <span>{q.pair}</span>
                              {q.unitMultiplier > 1 && (
                                <span className="text-[10px] text-slate-500 font-sans font-normal">
                                  ({q.unitMultiplier} {q.symbol})
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-sans">
                              {q.currencyName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        ₹{(Number(q?.rbiReferenceRate) || 0).toFixed(4)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                        ₹{(Number(q?.midRate) || 0).toFixed(4)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-blue-900 bg-blue-50/20">
                        ₹{(Number(q?.ttSellingRate) || 0).toFixed(4)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-bold text-emerald-900 bg-emerald-50/20">
                        ₹{(Number(q?.ttBuyingRate) || 0).toFixed(4)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ₹{(Number(q?.billSellingRate) || 0).toFixed(4)}
                      </td>

                      <td className="py-2.5 px-3 text-right text-slate-600">
                        ₹{(Number(q?.billBuyingRate) || 0).toFixed(4)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isUp
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {isUp ? '+' : ''}
                          {q.changePercent24h}%
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleCopyRate(q)}
                            title="Copy FEDAI Quote"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            {copiedQuote === q.baseCurrency ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <span className="text-[10px] uppercase font-mono font-medium text-slate-500">Copy</span>
                            )}
                          </button>

                          {onSelectForConversion && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectForConversion(q.baseCurrency, q)}
                              icon={<Calculator className="w-3 h-3" />}
                            >
                              Convert
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Institutional Regulatory Footnote */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Quoted pursuant to Foreign Exchange Dealers' Association of India (FEDAI) Rule 3 & RBI Master Direction No. 1/2016-17.
            </span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            Applicable for Export-Import & LRS Cross-Border Settlements
          </span>
        </div>
      </div>
    </div>
  );
};
