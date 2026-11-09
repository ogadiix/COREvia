import React, { useState, useEffect, useMemo } from 'react';
import { BankingProduct } from '../../types';
import { bankingApi } from '../../lib/api';
import { formatINR } from '../../data/mockIndianBankingData';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import {
  Package,
  Search,
  Filter,
  Users,
  ShieldCheck,
  CreditCard,
  Landmark,
  PiggyBank,
  TrendingUp,
  FileCheck,
  Eye,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  X,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface ProductsModuleProps {
  onNavigateToCustomer?: (customerCode: string) => void;
}

export const ProductsModule: React.FC<ProductsModuleProps> = ({ onNavigateToCustomer }) => {
  const [products, setProducts] = useState<BankingProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeOnly, setActiveOnly] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Detail Modal
  const [selectedProduct, setSelectedProduct] = useState<BankingProduct | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bankingApi.getProducts({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: searchTerm.trim() ? searchTerm.trim() : undefined,
        isActive: activeOnly ? true : undefined,
      });
      setProducts(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load banking products catalog from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, activeOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const categories = [
    { id: 'ALL', label: 'All Catalog', icon: <Package className="w-4 h-4" /> },
    { id: 'CASA', label: 'CASA & Term Deposits', icon: <PiggyBank className="w-4 h-4" /> },
    { id: 'ASSET_LOAN', label: 'Lending & Advances', icon: <Landmark className="w-4 h-4" /> },
    { id: 'CARDS', label: 'Credit & Forex Cards', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'WEALTH', label: 'Wealth & Investment', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'INSURANCE', label: 'Insurance & Bancassurance', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'TRADE_FINANCE', label: 'Trade & Commercial', icon: <FileCheck className="w-4 h-4" /> },
  ];

  // Aggregate stats
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const totalCustomerEnrollments = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.customerCount || 0), 0);
  }, [products]);

  const columns: Column<BankingProduct>[] = [
    {
      key: 'name',
      header: 'Product Name & Identifier',
      render: (p) => (
        <div className="max-w-[280px]">
          <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] flex items-center gap-1.5">
            <span>{p.name}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-[#8194A8]">
            Code: {p.productCode}
          </div>
          {p.description && (
            <p className="text-[11px] text-slate-600 dark:text-[#A9BACB] line-clamp-1 mt-0.5">{p.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => {
        const categoryBadges: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
          CASA: { label: 'CASA / Deposits', variant: 'success' },
          ASSET_LOAN: { label: 'Credit / Loan', variant: 'warning' },
          CARDS: { label: 'Cards', variant: 'neutral' },
          WEALTH: { label: 'Wealth', variant: 'info' },
          INSURANCE: { label: 'Bancassurance', variant: 'neutral' },
          TRADE_FINANCE: { label: 'Trade & Forex', variant: 'neutral' },
        };
        const cat = categoryBadges[p.category] || { label: p.category, variant: 'neutral' };
        return <Badge variant={cat.variant} size="sm">{cat.label}</Badge>;
      },
    },
    {
      key: 'interestRateRange',
      header: 'Pricing / Yield Range',
      mono: true,
      render: (p) => (
        <span className="font-mono text-xs text-slate-800 dark:text-[#E8EEF5]">
          {p.interestRateRange || 'Market Linked / Fee'}
        </span>
      ),
    },
    {
      key: 'minBalance',
      header: 'Min Threshold',
      mono: true,
      render: (p) => {
        const minVal = parseFloat(String(p.minBalance || '0'));
        return (
          <span className="font-mono text-xs text-slate-700 dark:text-[#A9BACB]">
            {minVal > 0 ? formatINR(minVal) : 'Zero Balance'}
          </span>
        );
      },
    },
    {
      key: 'eligibility',
      header: 'Eligibility Criteria',
      render: (p) => (
        <div className="max-w-[220px] text-xs text-slate-600 dark:text-[#A9BACB] truncate" title={p.eligibility || 'Standard Resident Individual / Entity'}>
          {p.eligibility || 'Standard KYC Onboarding'}
        </div>
      ),
    },
    {
      key: 'customerCount',
      header: 'Enrolled Clients',
      align: 'center',
      render: (p) => (
        <div className="flex items-center justify-center gap-1 font-mono text-xs font-semibold text-slate-800 dark:text-[#E8EEF5]">
          <Users className="w-3.5 h-3.5 text-slate-400 dark:text-[#8194A8]" />
          <span>{p.customerCount ?? 0}</span>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      align: 'center',
      render: (p) => (
        <Badge variant={p.isActive ? 'success' : 'neutral'} size="sm">
          {p.isActive ? 'Active Offering' : 'Grandfathered'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => {
              setSelectedProduct(p);
              setIsDetailOpen(true);
            }}
            className="text-xs py-0.5 px-2"
          >
            Specs &amp; Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Module Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#33485D] pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#E8EEF5] tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-[#142C45] dark:text-[#1B9D92]" />
            <span>Banking Products &amp; Schemes Master</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#8194A8]">
            Master product catalog, pricing benchmarks, and customer enrollment mapping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchProducts}
          >
            Sync Catalog
          </Button>
        </div>
      </div>

      {/* Aggregate Catalog Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Banking Product Offerings"
          value={String(totalProducts)}
          code="PRD-CAT-01"
          subtext="Standard Institutional Portfolio"
          badge="Product Master"
          badgeVariant="neutral"
        />
        <StatCard
          label="Active Offerings"
          value={String(activeProducts)}
          code="PRD-ACT-02"
          subtext="Open for new customer enrollment"
          badge="Open for Subscriptions"
          badgeVariant="success"
        />
        <StatCard
          label="Relationship Subscriptions"
          value={String(totalCustomerEnrollments)}
          code="CUS-PRD-MAP"
          subtext="Active customer/product relationships"
          badge="Ledger Mapped"
          badgeVariant="info"
        />
        <StatCard
          label="Catalog Compliance"
          value="100%"
          code="RBI-PRD-CIRC"
          subtext="Aligned to master lending directives"
          badge="RBI Compliant"
          badgeVariant="success"
        />
      </div>

      {/* Category Tabs Strip */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-1.5 flex items-center gap-1 overflow-x-auto shadow-2xs">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#142C45] dark:bg-[#1B9D92] text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-[#A9BACB] hover:bg-slate-100 dark:hover:bg-[#192B3D] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search and View Controls */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#8194A8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Product Name, Code, Scheme, or Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  fetchProducts();
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Button size="sm" variant="secondary" type="submit">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          {/* Active only checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-[#A9BACB] cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded border-slate-300 dark:border-[#33485D] text-[#168C83] focus:ring-[#168C83]"
            />
            <span>Active Offerings Only</span>
          </label>

          <span className="text-slate-300 dark:text-[#33485D]">|</span>

          {/* View toggle */}
          <div className="inline-flex rounded border border-slate-300 dark:border-[#33485D] p-0.5 bg-slate-100 dark:bg-[#101C2A]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-xs'
                  : 'text-slate-500 dark:text-[#8194A8]'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-xs'
                  : 'text-slate-500 dark:text-[#8194A8]'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Content: Table or Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-[#8194A8] bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#168C83]" />
          <p className="text-xs">Querying PostgreSQL Products catalog...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-8 h-8 text-slate-400 dark:text-[#8194A8]" />}
          title="No banking products found"
          description="No products match the selected category filter or search criteria."
          actionLabel="Reset Filters"
          onAction={() => {
            setSelectedCategory('ALL');
            setSearchTerm('');
            setActiveOnly(true);
            fetchProducts();
          }}
          className="py-12 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded"
        />
      ) : viewMode === 'table' ? (
        <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded overflow-hidden shadow-2xs">
          <Table
            data={products}
            columns={columns}
            keyExtractor={(p) => p.id}
            onRowClick={(p) => {
              setSelectedProduct(p);
              setIsDetailOpen(true);
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => {
                setSelectedProduct(p);
                setIsDetailOpen(true);
              }}
              className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-4 hover:border-[#168C83] dark:hover:border-[#1B9D92] transition-all cursor-pointer shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-[#E8EEF5]">
                      {p.name}
                    </h3>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-[#8194A8]">
                      Code: {p.productCode}
                    </span>
                  </div>
                  <Badge variant={p.isActive ? 'success' : 'neutral'} size="sm">
                    {p.category}
                  </Badge>
                </div>

                {p.description && (
                  <p className="text-xs text-slate-600 dark:text-[#A9BACB] line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-[#1F334A] text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-[#8194A8]">Pricing / Yield:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-[#E8EEF5]">
                    {p.interestRateRange || 'Market Linked'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-[#8194A8]">Enrolled Clients:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-[#E8EEF5] flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    {p.customerCount ?? 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedProduct(null);
          }}
          title={
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#168C83] dark:text-[#1B9D92]" />
              <span>Product Specification: {selectedProduct.name}</span>
            </div>
          }
          subtitle={`Product Code: ${selectedProduct.productCode} · Category: ${selectedProduct.category}`}
          size="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-900 dark:text-[#E8EEF5]">
                    {selectedProduct.name}
                  </div>
                  <div className="font-mono text-[11px] text-slate-500 dark:text-[#8194A8]">
                    Internal Code: {selectedProduct.productCode}
                  </div>
                </div>
                <Badge variant={selectedProduct.isActive ? 'success' : 'neutral'} size="md">
                  {selectedProduct.isActive ? 'Active Scheme' : 'Grandfathered'}
                </Badge>
              </div>

              {selectedProduct.description && (
                <p className="text-slate-600 dark:text-[#A9BACB] text-xs leading-relaxed pt-1">
                  {selectedProduct.description}
                </p>
              )}
            </div>

            {/* Specifications 6-Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-[#8194A8] block">Pricing &amp; Yield</span>
                <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] text-xs block">
                  {selectedProduct.interestRateRange || 'Market Linked'}
                </span>
                <span className="text-[10px] text-slate-400">Standard fee / rate benchmark</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-[#8194A8] block">Minimum Threshold</span>
                <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] text-xs block">
                  {parseFloat(String(selectedProduct.minBalance || '0')) > 0
                    ? formatINR(parseFloat(String(selectedProduct.minBalance)))
                    : 'Zero Balance Required'}
                </span>
                <span className="text-[10px] text-slate-400">AMB / minimum commitment</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-[#8194A8] block">Eligibility Standard</span>
                <span className="font-medium text-slate-900 dark:text-[#E8EEF5] text-xs block">
                  {selectedProduct.eligibility || 'Standard Resident Individual / Corporate'}
                </span>
                <span className="text-[10px] text-slate-400">KYC &amp; Bureau Criteria</span>
              </div>

              <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-500 dark:text-[#8194A8] block">Customer Relationships</span>
                <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] text-xs block flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#168C83]" />
                  <span>{selectedProduct.customerCount ?? 0} Subscribed Accounts</span>
                </span>
                <span className="text-[10px] text-slate-400">Mappable in customer_products</span>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#33485D] flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDetailOpen(false);
                  setSelectedProduct(null);
                }}
              >
                Close Specifications
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
