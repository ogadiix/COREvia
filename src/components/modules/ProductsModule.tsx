import React, { useState, useEffect, useMemo } from 'react';
import { BankingProduct } from '../../types';
import { bankingApi } from '../../lib/api';
import { formatINR } from '../../data/mockIndianBankingData';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
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
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <span>{p.name}</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Code: {p.productCode}
          </div>
          {p.description && (
            <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{p.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => {
        const categoryBadges: Record<string, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' }> = {
          CASA: { label: 'CASA / Deposits', variant: 'success' },
          ASSET_LOAN: { label: 'Credit / Loan', variant: 'warning' },
          CARDS: { label: 'Cards', variant: 'neutral' },
          WEALTH: { label: 'Wealth', variant: 'neutral' },
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
        <span className="font-mono text-xs text-slate-800">
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
          <span className="font-mono text-xs text-slate-700">
            {minVal > 0 ? formatINR(minVal) : 'Zero Balance'}
          </span>
        );
      },
    },
    {
      key: 'eligibility',
      header: 'Eligibility Criteria',
      render: (p) => (
        <div className="max-w-[220px] text-xs text-slate-600 truncate" title={p.eligibility || 'Standard Resident Individual / Entity'}>
          {p.eligibility || 'Standard KYC Onboarding'}
        </div>
      ),
    },
    {
      key: 'customerCount',
      header: 'Enrolled Clients',
      align: 'center',
      render: (p) => (
        <div className="flex items-center justify-center gap-1 font-mono text-xs font-semibold text-slate-800">
          <Users className="w-3.5 h-3.5 text-slate-400" />
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
          >
            Specs & Details
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Banking Product Offerings"
          value={String(totalProducts)}
          code="PRD-CAT-01"
          subtext="Standard Institutional Portfolio"
        />
        <StatCard
          label="Active Offerings"
          value={String(activeProducts)}
          code="PRD-ACT-02"
          subtext="Open for new customer enrollment"
        />
        <StatCard
          label="Relationship Subscriptions"
          value={String(totalCustomerEnrollments)}
          code="CUS-PRD-MAP"
          subtext="Active customer/product relationships"
        />
        <StatCard
          label="Catalog Compliance"
          value="100%"
          code="RBI-PRD-CIRC"
          subtext="Aligned to master lending directives"
        />
      </div>

      {/* Category Tabs */}
      <div className="bg-white border border-slate-200 rounded p-1 flex items-center gap-1 overflow-x-auto">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product name, code, features, or eligibility..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0f1e36]"
            />
          </div>
          <Button size="sm" variant="secondary" type="submit">
            Search
          </Button>
          {searchTerm && (
            <Button
              size="sm"
              variant="ghost"
              type="button"
              onClick={() => {
                setSearchTerm('');
                fetchProducts();
              }}
            >
              Clear
            </Button>
          )}
        </form>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded border-slate-300 text-[#0f1e36] focus:ring-slate-400"
            />
            <span>Active Offerings Only</span>
          </label>

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

      {/* Product Catalog Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Institutional Banking Products Catalog</h2>
            <p className="text-xs text-slate-500">
              Core relationship products persisted in PostgreSQL `products` table and mapped via `customer_products`.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Showing {products.length} products
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-400" />
            <p className="text-xs">Querying banking products from Cloud SQL...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 bg-red-50">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Package className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm">No banking products found matching the criteria.</p>
          </div>
        ) : (
          <Table
            data={products}
            columns={columns}
            keyExtractor={(p) => p.productCode}
            onRowClick={(p) => {
              setSelectedProduct(p);
              setIsDetailOpen(true);
            }}
          />
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedProduct(null);
          }}
          title={`Product Specifications: ${selectedProduct.name}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-slate-50 border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{selectedProduct.name}</h3>
                  <Badge variant={selectedProduct.isActive ? 'success' : 'neutral'} size="sm">
                    {selectedProduct.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 font-mono mt-0.5">
                  Code: {selectedProduct.productCode} • Category: {selectedProduct.category}
                </p>
              </div>

              <div className="text-right font-mono">
                <div className="text-xs text-slate-500">Active Enrollments</div>
                <div className="text-lg font-bold text-slate-900">{selectedProduct.customerCount || 0} Clients</div>
              </div>
            </div>

            {/* Grid specifications */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Pricing & Interest Rate Range
                </div>
                <div className="text-sm font-semibold font-mono text-slate-900">
                  {selectedProduct.interestRateRange || 'Market benchmark linked / Standard pricing'}
                </div>
              </div>

              <div className="p-3 bg-white border border-slate-200 rounded">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
                  Minimum Balance / Threshold
                </div>
                <div className="text-sm font-semibold font-mono text-slate-900">
                  {parseFloat(String(selectedProduct.minBalance || '0')) > 0
                    ? formatINR(parseFloat(String(selectedProduct.minBalance)))
                    : 'Zero Minimum Balance Requirement'}
                </div>
              </div>
            </div>

            {/* Description and Eligibility */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Product Description
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200">
                  {selectedProduct.description || 'Institutional core banking product designed for verified corporate and retail clients.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Eligibility & Relationship Requirements
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-200 font-mono">
                  {selectedProduct.eligibility || 'Standard Resident Individual / Entity KYC verification required.'}
                </p>
              </div>

              {selectedProduct.features && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Key Features & Relationship Privileges
                  </h4>
                  <div className="bg-slate-50 p-3 rounded border border-slate-200">
                    <ul className="text-xs text-slate-700 space-y-1 list-disc list-inside">
                      {selectedProduct.features.split(',').map((f, idx) => (
                        <li key={idx} className="font-sans">
                          {f.trim()}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <Button
                variant="secondary"
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
