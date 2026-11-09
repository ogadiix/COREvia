import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Filter,
  Info,
  X,
  ExternalLink,
  ShieldCheck,
  Calendar,
  TrendingUp,
  LifeBuoy,
  WalletCards,
  Landmark,
  Package,
  MessageSquare,
  CheckSquare,
  FileSpreadsheet,
  UserCheck,
  FileText,
  AlertCircle,
  CheckCheck,
  Activity,
  Users2,
  Building2,
  Home,
  ArrowRight,
  List,
  GitFork,
  RefreshCw,
  Search,
  Sparkles,
  History,
  Navigation,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { bankingApi } from '../../lib/api.ts';
import { formatINR } from '../../data/mockIndianBankingData.ts';
import { useToast } from '../common/Toast';
import {
  GraphNodeDTO,
  GraphEdgeDTO,
  GraphEntityType,
  RelationshipGraphResponse,
  GraphWhatChangedItem,
  GraphPathResponse,
} from '../../types/relationshipGraph.types.ts';

interface RelationshipGraphProps {
  initialEntityType?: string;
  initialEntityId?: string | number;
  compact?: boolean;
  onOpenFullGraph?: (entityType: string, entityId: string | number) => void;
  onNavigateToModule?: (module: string, contextId?: string | number) => void;
}

// Semantic colors adhering to Institutional Clarity (no dark sci-fi neon)
const ENTITY_CONFIG: Record<
  GraphEntityType,
  { label: string; bg: string; border: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  CUSTOMER: { label: 'Customer', bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-900', icon: Users2 },
  HOUSEHOLD: { label: 'Household', bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-900', icon: Home },
  BUSINESS: { label: 'Business Group', bg: 'bg-indigo-50', border: 'border-indigo-400', text: 'text-indigo-900', icon: Building2 },
  ACCOUNT: { label: 'Deposit Account', bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900', icon: WalletCards },
  LOAN: { label: 'Credit Facility', bg: 'bg-teal-50', border: 'border-teal-400', text: 'text-teal-900', icon: Landmark },
  PRODUCT: { label: 'Banking Product', bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-900', icon: Package },
  OPPORTUNITY: { label: 'Deal / Pipeline', bg: 'bg-sky-50', border: 'border-sky-400', text: 'text-sky-900', icon: TrendingUp },
  SERVICE_CASE: { label: 'Service Case', bg: 'bg-rose-50', border: 'border-rose-400', text: 'text-rose-900', icon: LifeBuoy },
  INTERACTION: { label: 'Interaction', bg: 'bg-slate-50', border: 'border-slate-400', text: 'text-slate-800', icon: MessageSquare },
  TASK: { label: 'Officer Task', bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-900', icon: CheckSquare },
  RELATIONSHIP_REVIEW: { label: 'Relationship Review', bg: 'bg-violet-50', border: 'border-violet-400', text: 'text-violet-900', icon: FileSpreadsheet },
  ONBOARDING_APPLICATION: { label: 'Onboarding', bg: 'bg-cyan-50', border: 'border-cyan-400', text: 'text-cyan-900', icon: UserCheck },
  DOCUMENT: { label: 'Document', bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-900', icon: FileText },
  SIGNAL: { label: 'Risk / Signal', bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-900', icon: AlertCircle },
  COMMITMENT: { label: 'Commitment', bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-900', icon: CheckCheck },
  RELATIONSHIP_STATE: { label: 'Twin State', bg: 'bg-fuchsia-50', border: 'border-fuchsia-400', text: 'text-fuchsia-900', icon: Activity },
};

export const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  initialEntityType = 'CUSTOMER',
  initialEntityId = '1',
  compact = false,
  onOpenFullGraph,
  onNavigateToModule,
}) => {
  const { isDark } = useTheme();
  const toast = useToast();
  const [currentEntityType, setCurrentEntityType] = useState<string>(initialEntityType);
  const [currentEntityId, setCurrentEntityId] = useState<string | number>(initialEntityId);
  const [depth, setDepth] = useState<number>(compact ? 1 : 2);
  const [viewMode, setViewMode] = useState<'GRAPH' | 'LIST'>('GRAPH');

  const [graphData, setGraphData] = useState<RelationshipGraphResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected details
  const [selectedNode, setSelectedNode] = useState<GraphNodeDTO | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdgeDTO | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Filters
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [showWhatChangedModal, setShowWhatChangedModal] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Path finder state
  const [isPathFinderOpen, setIsPathFinderOpen] = useState<boolean>(false);
  const [pathTargetNodeId, setPathTargetNodeId] = useState<string>('');
  const [pathResult, setPathResult] = useState<GraphPathResponse | null>(null);
  const [searchingPath, setSearchingPath] = useState<boolean>(false);

  // Pan & Zoom
  const [zoom, setZoom] = useState<number>(compact ? 0.85 : 1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Load graph data
  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bankingApi.getRelationshipGraph(currentEntityType, currentEntityId, {
        depth,
        limit: compact ? 35 : 90,
        includeSignals: true,
      });
      setGraphData(res);
      setSelectedNode(res.root);
      setSelectedEdge(null);
    } catch (err: any) {
      setError(err?.message || 'Relationship graph could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [currentEntityType, currentEntityId, depth, compact]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  // Synchronize when initial props change
  useEffect(() => {
    if (initialEntityId) {
      setCurrentEntityId(initialEntityId);
    }
    if (initialEntityType) {
      setCurrentEntityType(initialEntityType);
    }
  }, [initialEntityId, initialEntityType]);

  // Filtered nodes and edges
  const filteredNodes = useMemo(() => {
    if (!graphData) return [];
    let list = graphData.nodes;
    if (selectedTypes.size > 0) {
      list = list.filter((n) => n.isRoot || selectedTypes.has(n.entityType));
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (n) =>
          n.label.toLowerCase().includes(q) ||
          n.code.toLowerCase().includes(q) ||
          n.entityType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [graphData, selectedTypes, searchTerm]);

  const visibleNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
  }, [graphData, visibleNodeIds]);

  // Deterministic Layout Positioning (Root at center, concentric categorized layers)
  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    if (!graphData || filteredNodes.length === 0) return map;

    const centerX = compact ? 320 : 500;
    const centerY = compact ? 220 : 360;

    // Root node at dead center
    map.set(graphData.root.id, { x: centerX, y: centerY });

    // Group remaining nodes by depth and category for structured banking layout
    const depth1Nodes = filteredNodes.filter((n) => !n.isRoot && n.depth === 1);
    const depth2Nodes = filteredNodes.filter((n) => !n.isRoot && n.depth >= 2);

    // Arrange depth 1 nodes in deterministic categorical quadrants
    const totalD1 = depth1Nodes.length;
    const radius1 = compact ? 150 : 250;

    depth1Nodes.forEach((node, i) => {
      // Deterministic angle based on index
      const angle = (2 * Math.PI * i) / Math.max(totalD1, 1) - Math.PI / 2;
      const x = centerX + radius1 * Math.cos(angle);
      const y = centerY + radius1 * Math.sin(angle);
      map.set(node.id, { x, y });
    });

    // Arrange depth 2 nodes around outer orbit
    const totalD2 = depth2Nodes.length;
    const radius2 = compact ? 260 : 420;

    depth2Nodes.forEach((node, j) => {
      const angle = (2 * Math.PI * j) / Math.max(totalD2, 1) - Math.PI / 3;
      const x = centerX + radius2 * Math.cos(angle);
      const y = centerY + radius2 * Math.sin(angle);
      map.set(node.id, { x, y });
    });

    return map;
  }, [graphData, filteredNodes, compact]);

  // Path nodes highlight set
  const pathNodeIds = useMemo(() => {
    if (!pathResult || !pathResult.found) return new Set<string>();
    return new Set(pathResult.nodes.map((n) => n.id));
  }, [pathResult]);

  const pathEdgeIds = useMemo(() => {
    if (!pathResult || !pathResult.found) return new Set<string>();
    return new Set(pathResult.edges.map((e) => e.id));
  }, [pathResult]);

  // Connected nodes to currently selected node (spotlight topology)
  const connectedNodeIds = useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const set = new Set<string>();
    for (const edge of filteredEdges) {
      if (edge.source === selectedNode.id) set.add(edge.target);
      if (edge.target === selectedNode.id) set.add(edge.source);
    }
    return set;
  }, [selectedNode, filteredEdges]);

  // Escape key to dismiss selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
        setIsPathFinderOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Find Path
  const handleFindPath = async () => {
    if (!pathTargetNodeId || !graphData) return;
    const targetNode = graphData.nodes.find((n) => n.id === pathTargetNodeId);
    if (!targetNode) return;

    setSearchingPath(true);
    try {
      const res = await bankingApi.getRelationshipPath(
        graphData.root.entityType,
        graphData.root.entityId,
        targetNode.entityType,
        targetNode.entityId
      );
      setPathResult(res);
    } catch (err: any) {
      toast.error(err.message || 'Error finding path between entities');
    } finally {
      setSearchingPath(false);
    }
  };

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.graph-interactive-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetView = () => {
    setZoom(compact ? 0.85 : 1);
    setPan({ x: 0, y: 0 });
    setSelectedEdge(null);
    if (graphData) setSelectedNode(graphData.root);
  };

  const toggleTypeFilter = (type: string) => {
    const next = new Set(selectedTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setSelectedTypes(next);
  };

  // Navigate directly to relevant module
  const handleOpenEntityModule = (node: GraphNodeDTO) => {
    if (!onNavigateToModule) return;
    switch (node.entityType) {
      case 'CUSTOMER':
        onNavigateToModule('customers', node.code);
        break;
      case 'ACCOUNT':
        onNavigateToModule('accounts', node.code);
        break;
      case 'LOAN':
        onNavigateToModule('lending', node.code);
        break;
      case 'OPPORTUNITY':
        onNavigateToModule('opportunities', node.code);
        break;
      case 'SERVICE_CASE':
        onNavigateToModule('cases', node.code);
        break;
      case 'TASK':
        onNavigateToModule('tasks', node.code);
        break;
      case 'INTERACTION':
      case 'RELATIONSHIP_REVIEW':
        onNavigateToModule('interactions', node.code);
        break;
      case 'DOCUMENT':
        onNavigateToModule('documents', node.code);
        break;
      case 'RELATIONSHIP_STATE':
        onNavigateToModule('relationship-twin', node.code);
        break;
      default:
        break;
    }
  };

  return (
    <div className={`relative flex flex-col bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-xl overflow-hidden shadow-xs ${compact ? 'h-[440px]' : 'h-[780px]'}`}>
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-[#0F1B2A] border-b border-slate-200 dark:border-[#33485D] text-xs gap-3">
        {/* Entity Info & Switcher */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#168C83]/10 dark:bg-[#168C83]/20 text-[#168C83] dark:text-[#46C3B2] rounded-md border border-[#168C83]/30">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-[#E8EEF5]">
              <span>{graphData?.root.label || 'Relationship Graph'}</span>
              {graphData?.root && (
                <span className="px-1.5 py-0.5 bg-slate-200 dark:bg-[#101C2A] text-slate-700 dark:text-[#A9BACB] border border-slate-300 dark:border-[#33485D] rounded text-[10px] font-mono">
                  {graphData.root.code}
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] flex items-center gap-2">
              <span>Depth: {depth}</span>
              <span>•</span>
              <span>{filteredNodes.length} nodes</span>
              <span>•</span>
              <span>{filteredEdges.length} connections</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Depth selector */}
          <div className="flex items-center bg-white dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-0.5 text-[11px]">
            <span className="px-2 text-slate-400 dark:text-[#A9BACB] font-medium">Depth:</span>
            {[1, 2, 3].map((d) => (
              <button
                key={d}
                onClick={() => setDepth(d)}
                className={`px-2 py-0.5 rounded font-mono cursor-pointer ${
                  depth === d ? 'bg-[#168C83] text-white font-bold' : 'text-slate-600 dark:text-[#A9BACB] hover:bg-slate-100 dark:hover:bg-[#26394C]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* View mode toggle (Canvas vs Accessible Table) */}
          <div className="flex items-center bg-white dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-0.5 text-[11px]">
            <button
              onClick={() => setViewMode('GRAPH')}
              className={`px-2.5 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer ${
                viewMode === 'GRAPH' ? 'bg-[#168C83]/10 dark:bg-[#168C83]/20 text-[#168C83] dark:text-[#46C3B2] font-semibold' : 'text-slate-600 dark:text-[#A9BACB] hover:bg-slate-100 dark:hover:bg-[#26394C]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Canvas</span>
            </button>
            <button
              onClick={() => setViewMode('LIST')}
              className={`px-2.5 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer ${
                viewMode === 'LIST' ? 'bg-[#168C83]/10 dark:bg-[#168C83]/20 text-[#168C83] dark:text-[#46C3B2] font-semibold' : 'text-slate-600 dark:text-[#A9BACB] hover:bg-slate-100 dark:hover:bg-[#26394C]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Filter dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`px-2.5 py-1.5 border rounded flex items-center gap-1.5 text-xs cursor-pointer ${
                selectedTypes.size > 0
                  ? 'bg-[#168C83]/10 dark:bg-[#168C83]/20 border-[#168C83]/40 text-[#168C83] dark:text-[#46C3B2]'
                  : 'bg-white dark:bg-[#101C2A] border-slate-200 dark:border-[#33485D] text-slate-700 dark:text-[#E8EEF5] hover:bg-slate-50 dark:hover:bg-[#26394C]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter{selectedTypes.size > 0 ? ` (${selectedTypes.size})` : ''}</span>
            </button>

            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg shadow-lg z-50 p-2.5 divide-y divide-slate-100 dark:divide-[#33485D] text-xs">
                <div className="pb-2 font-semibold text-slate-800 dark:text-[#E8EEF5] flex items-center justify-between">
                  <span>Entity Types</span>
                  {selectedTypes.size > 0 && (
                    <button
                      onClick={() => setSelectedTypes(new Set())}
                      className="text-[10px] text-[#168C83] dark:text-[#46C3B2] hover:underline cursor-pointer"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="pt-2 max-h-56 overflow-y-auto space-y-1">
                  {Object.entries(ENTITY_CONFIG).map(([typeKey, cfg]) => {
                    const count = graphData?.meta.entityTypeCounts[typeKey] || 0;
                    if (count === 0) return null;
                    const Icon = cfg.icon;
                    return (
                      <label
                        key={typeKey}
                        className="flex items-center justify-between p-1 hover:bg-slate-50 dark:hover:bg-[#101C2A] rounded cursor-pointer text-slate-700 dark:text-[#E8EEF5]"
                      >
                        <div className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            checked={selectedTypes.has(typeKey)}
                            onChange={() => toggleTypeFilter(typeKey)}
                            className="rounded border-slate-300 dark:border-[#33485D] text-[#168C83] focus:ring-0 cursor-pointer"
                          />
                          <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-[#A9BACB]" />
                          <span>{cfg.label}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 dark:text-[#A9BACB] bg-slate-100 dark:bg-[#101C2A] px-1 rounded">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Path explorer button */}
          {!compact && (
            <button
              onClick={() => setIsPathFinderOpen(!isPathFinderOpen)}
              className={`px-2.5 py-1.5 border rounded flex items-center gap-1.5 text-xs cursor-pointer ${
                isPathFinderOpen
                  ? 'bg-[#168C83] border-[#168C83] text-white font-semibold'
                  : 'bg-white dark:bg-[#101C2A] border-slate-200 dark:border-[#33485D] text-slate-700 dark:text-[#E8EEF5] hover:bg-slate-50 dark:hover:bg-[#26394C]'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Trace Path</span>
            </button>
          )}

          {/* What changed toggle */}
          {graphData?.whatChanged && graphData.whatChanged.items.length > 0 && (
            <button
              onClick={() => setShowWhatChangedModal(!showWhatChangedModal)}
              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 rounded flex items-center gap-1.5 text-xs hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>What Changed ({graphData.whatChanged.items.length})</span>
            </button>
          )}

          {/* Refresh button */}
          <button
            onClick={loadGraph}
            title="Refresh graph"
            className="p-1.5 text-slate-500 dark:text-[#A9BACB] hover:text-slate-800 dark:hover:text-[#E8EEF5] hover:bg-slate-200/60 dark:hover:bg-[#26394C] rounded cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Full graph open button if in compact mode */}
          {compact && onOpenFullGraph && graphData?.root && (
            <button
              onClick={() => onOpenFullGraph(graphData.root.entityType, graphData.root.code || graphData.root.entityId)}
              className="px-2.5 py-1 bg-[#168C83] hover:bg-[#127069] text-white rounded font-medium flex items-center gap-1 text-xs cursor-pointer"
            >
              <span>Full Graph</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-hidden bg-slate-50/60 dark:bg-[#0A121E]">
        {loading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/80 dark:bg-[#0A121E]/80 backdrop-blur-xs">
            <RefreshCw className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mb-2" />
            <span className="text-xs font-medium text-slate-600 dark:text-[#E8EEF5]">Loading relationship context...</span>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
            <h4 className="text-sm font-bold text-slate-800 mb-1">Relationship graph could not be loaded</h4>
            <p className="text-xs text-slate-500 max-w-md mb-4">{error}</p>
            <button
              onClick={loadGraph}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold"
            >
              Retry Loading
            </button>
          </div>
        )}

        {/* VIEW 1: Interactive Canvas / SVG Graph */}
        {viewMode === 'GRAPH' && (
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
          >
            {/* Canvas Navigation Controls overlay */}
            <div className="absolute left-3 bottom-3 z-20 flex items-center bg-white/90 dark:bg-[#162638]/90 border border-slate-200 dark:border-[#33485D] rounded shadow-xs p-1 gap-1 text-slate-600 dark:text-[#A9BACB]">
              <button
                onClick={() => setZoom((z) => Math.min(z + 0.15, 2.2))}
                title="Zoom in"
                className="p-1 hover:bg-slate-100 dark:hover:bg-[#26394C] rounded cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
                title="Zoom out"
                className="p-1 hover:bg-slate-100 dark:hover:bg-[#26394C] rounded cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetView}
                title="Reset view"
                className="p-1 hover:bg-slate-100 dark:hover:bg-[#26394C] rounded cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <div className="h-3 w-px bg-slate-200 dark:bg-[#33485D] mx-0.5" />
              <span className="text-[10px] font-mono px-1 text-slate-700 dark:text-[#E8EEF5]">{Math.round(zoom * 100)}%</span>
            </div>

            {/* Quick Search in Graph */}
            {!compact && (
              <div className="absolute left-3 top-3 z-20 w-64 bg-white/95 dark:bg-[#162638]/95 border border-slate-200 dark:border-[#33485D] rounded shadow-xs p-1.5 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-[#A9BACB]" />
                <input
                  type="text"
                  placeholder="Find node in graph..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs bg-transparent text-slate-900 dark:text-[#E8EEF5] focus:outline-none placeholder:text-slate-400 dark:placeholder:text-[#A9BACB]"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-[#E8EEF5] cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* SVG Elements Rendering with Transform */}
            <svg
              className="w-full h-full select-none"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
            >
              <defs>
                {/* Clean directional arrow markers */}
                <marker
                  id="edge-arrow"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={isDark ? '#465E77' : '#94a3b8'} />
                </marker>
                <marker
                  id="edge-arrow-active"
                  viewBox="0 0 10 10"
                  refX="18"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill={isDark ? '#46C3B2' : '#087F8C'} />
                </marker>
              </defs>

              {/* 1. Render Connectors / Edges */}
              {filteredEdges.map((edge) => {
                const sPos = nodePositions.get(edge.source);
                const tPos = nodePositions.get(edge.target);
                if (!sPos || !tPos) return null;

                const isSelected = selectedEdge?.id === edge.id;
                const isHovered =
                  hoveredNodeId === edge.source || hoveredNodeId === edge.target;
                const isConnectedToSelected = Boolean(
                  selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id)
                );
                const isPathEdge = pathEdgeIds.has(edge.id);
                const isDimmed = Boolean(
                  selectedNode && !isConnectedToSelected && !isSelected && !isPathEdge
                );

                return (
                  <g
                    key={edge.id}
                    className="cursor-pointer"
                    style={{
                      opacity: isDimmed ? 0.25 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <line
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke={
                        isPathEdge
                          ? '#059669'
                          : isSelected
                          ? (isDark ? '#46C3B2' : '#087F8C')
                          : isConnectedToSelected
                          ? (isDark ? '#46C3B2' : '#087F8C')
                          : isHovered
                          ? (isDark ? '#46C3B2' : '#087F8C')
                          : (isDark ? '#26394C' : '#cbd5e1')
                      }
                      strokeWidth={
                        isPathEdge ? 3.5 : isSelected ? 3 : isConnectedToSelected ? 2.5 : isHovered ? 2 : 1.25
                      }
                      strokeDasharray={edge.status === 'INACTIVE' ? '4 3' : undefined}
                      markerEnd={isPathEdge || isSelected || isConnectedToSelected ? 'url(#edge-arrow-active)' : 'url(#edge-arrow)'}
                      onClick={() => {
                        setSelectedEdge(edge);
                        setSelectedNode(null);
                      }}
                    />
                    {/* Invisible thicker hit-box line for easy clicking */}
                    <line
                      x1={sPos.x}
                      y1={sPos.y}
                      x2={tPos.x}
                      y2={tPos.y}
                      stroke="transparent"
                      strokeWidth={12}
                      onClick={() => {
                        setSelectedEdge(edge);
                        setSelectedNode(null);
                      }}
                    />
                  </g>
                );
              })}

              {/* 2. Render Nodes */}
              {filteredNodes.map((node) => {
                const pos = nodePositions.get(node.id);
                if (!pos) return null;

                const cfg = ENTITY_CONFIG[node.entityType] || ENTITY_CONFIG.CUSTOMER;
                const Icon = cfg.icon;
                const isRoot = node.isRoot;
                const isSelected = selectedNode?.id === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const isPathNode = pathNodeIds.has(node.id);
                const isPriority = node.operationalPriority === 'CRITICAL' || node.operationalPriority === 'HIGH';
                const isDimmed = Boolean(
                  selectedNode &&
                  selectedNode.id !== node.id &&
                  !isConnected &&
                  !isPathNode
                );

                const width = isRoot ? 170 : 140;
                const height = isRoot ? 54 : 44;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${pos.x - width / 2}, ${pos.y - height / 2})`}
                    className="graph-interactive-node cursor-pointer group"
                    style={{
                      opacity: isDimmed ? 0.35 : 1,
                      transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }}
                    onClick={() => {
                      setSelectedNode(node);
                      setSelectedEdge(null);
                    }}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  >
                    {/* Node Rectangle */}
                    <rect
                      width={width}
                      height={height}
                      rx={isRoot ? 8 : 6}
                      className={`${
                        isSelected
                          ? (isDark ? 'fill-[#163E48] stroke-[#46C3B2] stroke-2 shadow-md filter drop-shadow-sm' : 'fill-teal-50 stroke-[#087F8C] stroke-2 shadow-md filter drop-shadow-sm')
                          : isPathNode
                          ? (isDark ? 'fill-emerald-950/60 stroke-emerald-400 stroke-2' : 'fill-emerald-50 stroke-emerald-600 stroke-2')
                          : isRoot
                          ? (isDark ? 'fill-[#162638] stroke-[#8194A8] stroke-2 shadow-sm' : 'fill-white stroke-slate-800 stroke-2 shadow-sm')
                          : isConnected
                          ? (isDark ? 'fill-[#162638] stroke-[#168C83] stroke-1.5 shadow-2xs' : 'fill-white stroke-[#087F8C] stroke-1.5 shadow-2xs')
                          : (isDark ? 'fill-[#162638] stroke-[#33485D] stroke-1 hover:stroke-[#168C83] hover:shadow-xs' : 'fill-white stroke-slate-300 stroke-1 hover:stroke-[#087F8C] hover:shadow-xs')
                      } transition-all`}
                    />

                    {/* Left semantic indicator bar */}
                    <rect
                      x={0}
                      y={0}
                      width={4}
                      height={height}
                      rx={2}
                      className={
                        isPriority
                          ? 'fill-rose-500'
                          : isRoot
                          ? (isDark ? 'fill-[#46C3B2]' : 'fill-slate-900')
                          : isSelected
                          ? (isDark ? 'fill-[#46C3B2]' : 'fill-[#087F8C]')
                          : isConnected
                          ? (isDark ? 'fill-[#46C3B2]' : 'fill-[#087F8C]')
                          : (isDark ? 'fill-[#465E77]' : 'fill-slate-400')
                      }
                    />

                    {/* Icon and Type indicator */}
                    <foreignObject x={8} y={isRoot ? 8 : 6} width={width - 16} height={height - 12}>
                      <div className="flex items-center gap-2 overflow-hidden h-full">
                        <div
                          className={`p-1 rounded shrink-0 ${
                            isRoot ? (isDark ? 'bg-[#101C2A] text-[#46C3B2] border border-[#33485D]' : 'bg-slate-900 text-white') : cfg.bg + ' ' + cfg.text
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-bold text-slate-900 dark:text-[#E8EEF5] truncate leading-tight">
                            {node.label}
                          </div>
                          <div className="text-[9px] text-slate-500 dark:text-[#A9BACB] truncate flex items-center gap-1 font-mono">
                            <span>{node.code}</span>
                            {node.status && (
                              <span
                                className={`px-1 py-0 rounded text-[8px] uppercase font-sans ${
                                  node.status === 'ACTIVE' || node.status === 'STANDARD'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : node.status === 'CRITICAL' || node.status === 'REPLACEMENT_REQUIRED'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                                    : 'bg-slate-100 text-slate-700 dark:bg-[#101C2A] dark:text-[#A9BACB]'
                                }`}
                              >
                                {node.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* VIEW 2: Accessible Relationship Table Alternative (Section 30) */}
        {viewMode === 'LIST' && (
          <div className="w-full h-full overflow-y-auto p-4 bg-slate-50/60 dark:bg-[#0A121E]">
            <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-[#0F1B2A] border-b border-slate-200 dark:border-[#33485D] flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-[#E8EEF5] uppercase tracking-wider">
                    Institutional Relationship Ledger
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-[#A9BACB]">
                    Accessible, keyboard-navigable tabular inventory of connected entities and governance provenance
                  </p>
                </div>
                <span className="text-xs font-mono bg-slate-200/70 dark:bg-[#101C2A] text-slate-700 dark:text-[#A9BACB] border border-slate-300 dark:border-[#33485D] px-2 py-0.5 rounded">
                  {filteredNodes.length} Verified Records
                </span>
              </div>

              <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-[#33485D]" aria-label="Connected Banking Entities">
                <thead className="bg-slate-100/75 dark:bg-[#0F1B2A] text-slate-600 dark:text-[#A9BACB] font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th scope="col" className="px-4 py-2">Entity</th>
                    <th scope="col" className="px-3 py-2">Type</th>
                    <th scope="col" className="px-3 py-2">Code / ID</th>
                    <th scope="col" className="px-3 py-2">Status</th>
                    <th scope="col" className="px-3 py-2">Depth</th>
                    <th scope="col" className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#33485D]">
                  {filteredNodes.map((n) => {
                    const cfg = ENTITY_CONFIG[n.entityType] || ENTITY_CONFIG.CUSTOMER;
                    const Icon = cfg.icon;
                    return (
                      <tr
                        key={n.id}
                        className={`hover:bg-slate-50 dark:hover:bg-[#101C2A] transition-colors ${n.isRoot ? 'bg-indigo-50/40 dark:bg-indigo-950/20 font-semibold' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-[#A9BACB]" />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-[#E8EEF5]">{n.label}</span>
                              {n.sublabel && (
                                <div className="text-[10px] text-slate-500 dark:text-[#A9BACB]">{n.sublabel}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${cfg.bg} ${cfg.text}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-[#A9BACB]">{n.code}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                              n.status === 'ACTIVE' || n.status === 'STANDARD'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : n.status === 'CRITICAL' || n.status === 'REPLACEMENT_REQUIRED'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-bold'
                                : 'bg-slate-100 text-slate-700 dark:bg-[#101C2A] dark:text-[#A9BACB]'
                            }`}
                          >
                            {n.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-500 dark:text-[#A9BACB]">{n.depth === 0 ? 'Root (0)' : `Hop ${n.depth}`}</td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedNode(n);
                              setSelectedEdge(null);
                            }}
                            className="px-2 py-1 text-[11px] text-[#168C83] dark:text-[#46C3B2] hover:underline font-medium mr-2 cursor-pointer"
                          >
                            Inspect Details
                          </button>
                          <button
                            onClick={() => handleOpenEntityModule(n)}
                            className="px-2 py-1 text-[11px] bg-slate-100 dark:bg-[#101C2A] hover:bg-slate-200 dark:hover:bg-[#26394C] text-slate-700 dark:text-[#E8EEF5] border border-slate-200 dark:border-[#33485D] rounded font-medium inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* NODE DETAILS DRAWER (Section 13) */}
        {selectedNode && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 md:w-96 max-w-full bg-white dark:bg-[#162638] border-l border-slate-200 dark:border-[#33485D] shadow-xl z-30 flex flex-col animate-in slide-in-from-right duration-150">
            <div className="px-4 py-3 bg-slate-50 dark:bg-[#0F1B2A] border-b border-slate-200 dark:border-[#33485D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-[#168C83]/10 dark:bg-[#168C83]/20 text-[#168C83] dark:text-[#46C3B2] rounded">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5] leading-tight">Entity Inspection</h4>
                  <span className="text-[10px] text-slate-500 dark:text-[#A9BACB] font-mono">{selectedNode.code}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 dark:text-[#A9BACB] hover:text-slate-600 dark:hover:text-[#E8EEF5] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-800 dark:text-[#E8EEF5]">
              {/* Primary Header info */}
              <div className="p-3 bg-slate-50 dark:bg-[#101C2A] rounded-lg border border-slate-200 dark:border-[#33485D]">
                <span className="text-[10px] font-bold text-[#168C83] dark:text-[#46C3B2] uppercase tracking-wider">
                  {selectedNode.entityType}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5">{selectedNode.label}</h3>
                {selectedNode.sublabel && (
                  <p className="text-slate-600 dark:text-[#A9BACB] mt-1 text-[11px]">{selectedNode.sublabel}</p>
                )}
                <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#33485D] text-[11px]">
                  <span className="text-slate-500 dark:text-[#A9BACB]">Status:</span>
                  <span className="font-semibold text-slate-800 dark:text-[#E8EEF5]">{selectedNode.status}</span>
                </div>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-500 dark:text-[#A9BACB]">Distance from Root:</span>
                  <span className="font-mono text-slate-700 dark:text-[#E8EEF5]">{selectedNode.depth} hops</span>
                </div>
              </div>

              {/* Metrics if available */}
              {selectedNode.metrics && Object.keys(selectedNode.metrics).length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-700 dark:text-[#A9BACB] text-[11px] uppercase tracking-wider mb-1.5">
                    Operational Metrics
                  </h5>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedNode.metrics).map(([k, v]) => (
                      <div key={k} className="p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded">
                        <div className="text-[10px] text-slate-500 dark:text-[#A9BACB] capitalize">{k.replace(/([A-Z])/g, ' $1')}</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5] font-mono truncate">{String(v)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata if available */}
              {selectedNode.metadata && Object.keys(selectedNode.metadata).length > 0 && (
                <div>
                  <h5 className="font-bold text-slate-700 dark:text-[#A9BACB] text-[11px] uppercase tracking-wider mb-1.5">
                    Regulatory & Constitution Data
                  </h5>
                  <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5 space-y-1.5 text-[11px]">
                    {Object.entries(selectedNode.metadata).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-start gap-2">
                        <span className="text-slate-500 dark:text-[#A9BACB] capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                        <span className="font-medium text-slate-800 dark:text-[#E8EEF5] text-right">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Governance & Provenance */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Governed Core Banking Record</span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Entity verified in PostgreSQL. Access logged per banking audit trail policy.
                </p>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="p-3 bg-slate-50 dark:bg-[#0F1B2A] border-t border-slate-200 dark:border-[#33485D] space-y-2">
              <button
                onClick={() => handleOpenEntityModule(selectedNode)}
                className="w-full py-1.5 bg-[#168C83] hover:bg-[#127069] text-white rounded font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <span>Open {selectedNode.entityType.replace(/_/g, ' ')}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {!selectedNode.isRoot && (
                <button
                  onClick={() => {
                    setCurrentEntityType(selectedNode.entityType);
                    setCurrentEntityId(selectedNode.code || selectedNode.entityId);
                  }}
                  className="w-full py-1.5 bg-white dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] hover:bg-slate-100 dark:hover:bg-[#26394C] text-slate-700 dark:text-[#E8EEF5] rounded font-medium text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-center Graph on this Entity</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* EDGE DETAILS DRAWER (Section 14) */}
        {selectedEdge && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 md:w-96 max-w-full bg-white dark:bg-[#162638] border-l border-slate-200 dark:border-[#33485D] shadow-xl z-30 flex flex-col animate-in slide-in-from-right duration-150">
            <div className="px-4 py-3 bg-slate-50 dark:bg-[#0F1B2A] border-b border-slate-200 dark:border-[#33485D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-[#168C83]/10 dark:bg-[#168C83]/20 text-[#168C83] dark:text-[#46C3B2] rounded">
                  <GitFork className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5] leading-tight">Relationship Connection</h4>
                  <span className="text-[10px] text-slate-500 dark:text-[#A9BACB] font-mono">{selectedEdge.relationshipType}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-slate-400 dark:text-[#A9BACB] hover:text-slate-600 dark:hover:text-[#E8EEF5] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-800 dark:text-[#E8EEF5]">
              <div className="p-3 bg-slate-50 dark:bg-[#101C2A] rounded-lg border border-slate-200 dark:border-[#33485D] space-y-2">
                <div>
                  <span className="text-[10px] text-slate-500 dark:text-[#A9BACB] font-bold uppercase tracking-wider">
                    Relationship Type
                  </span>
                  <div className="text-xs font-bold text-[#168C83] dark:text-[#46C3B2] mt-0.5">
                    {selectedEdge.relationshipType.replace(/_/g, ' ')}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#A9BACB] font-bold uppercase tracking-wider">
                    Why This Relationship Exists
                  </span>
                  <p className="text-slate-700 dark:text-[#CBD5E1] mt-0.5 leading-relaxed">{selectedEdge.explanation}</p>
                </div>
              </div>

              {/* Provenance & Evidence */}
              <div>
                <h5 className="font-bold text-slate-700 dark:text-[#A9BACB] text-[11px] uppercase tracking-wider mb-1.5">
                  Provenance & Evidence
                </h5>
                <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5 space-y-2 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-[#A9BACB]">Provenance Type:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5] font-semibold">{selectedEdge.provenanceType}</span>
                  </div>
                  {selectedEdge.provenanceId && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-[#A9BACB]">Document / Ref ID:</span>
                      <span className="font-mono text-[#168C83] dark:text-[#46C3B2] font-bold">{selectedEdge.provenanceId}</span>
                    </div>
                  )}
                  {selectedEdge.evidence && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-[#33485D] text-slate-600 dark:text-[#CBD5E1]">
                      <span className="text-slate-400 dark:text-[#A9BACB] font-medium">Evidence Summary:</span>
                      <p className="mt-0.5">{selectedEdge.evidence}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-[#33485D]">
                    <span className="text-slate-500 dark:text-[#A9BACB]">Visibility Scope:</span>
                    <span className="font-mono text-slate-700 dark:text-[#E8EEF5]">{selectedEdge.visibilityScope}</span>
                  </div>
                </div>
              </div>

              {/* Audit Badge */}
              <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Audited Corevia Relationship</span>
                </div>
                <p className="text-emerald-800 dark:text-emerald-300">
                  Active connection verified against banking registry. No unverified or synthetic guesses.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PATH TRACER DRAWER (Section 17) */}
        {isPathFinderOpen && (
          <div className="absolute left-3 right-3 sm:right-auto top-14 sm:w-80 max-w-sm bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg shadow-xl z-30 p-3 space-y-3 text-xs text-slate-800 dark:text-[#E8EEF5]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#33485D]">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-[#E8EEF5]">
                <Navigation className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
                <span>Relationship Path Finder</span>
              </div>
              <button onClick={() => setIsPathFinderOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-[#A9BACB]">
              Discover shortest authorized connection path from <b>{graphData?.root.label}</b> to another entity.
            </p>

            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-[#A9BACB] uppercase">Target Entity:</label>
              <select
                value={pathTargetNodeId}
                onChange={(e) => setPathTargetNodeId(e.target.value)}
                className="w-full mt-1 p-1.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-slate-800 dark:text-[#E8EEF5] text-xs focus:outline-none focus:border-[#168C83]"
              >
                <option value="">Select target node...</option>
                {filteredNodes
                  .filter((n) => !n.isRoot)
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label} ({n.entityType})
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={handleFindPath}
              disabled={!pathTargetNodeId || searchingPath}
              className="w-full py-1.5 bg-[#168C83] hover:bg-[#127069] disabled:opacity-50 text-white font-medium rounded text-xs transition cursor-pointer"
            >
              {searchingPath ? 'Tracing Shortest Path...' : 'Find Path'}
            </button>

            {pathResult && (
              <div className="p-2.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-800 dark:text-[#E8EEF5] flex items-center justify-between">
                  <span>{pathResult.found ? `Path Found (${pathResult.pathLength} hops)` : 'No Path Found'}</span>
                  {pathResult.found && <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Active</span>}
                </div>
                <p className="text-slate-600 dark:text-[#CBD5E1]">{pathResult.explanation}</p>
                {pathResult.nodes.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-[#33485D] flex flex-wrap gap-1">
                    {pathResult.nodes.map((pn, idx) => (
                      <span
                        key={pn.id}
                        className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] rounded"
                      >
                        {pn.label}
                        {idx < pathResult.nodes.length - 1 ? ' →' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* WHAT CHANGED MODAL / DRAWER (Section 16) */}
        {showWhatChangedModal && graphData?.whatChanged && (
          <div className="absolute right-3 top-3 w-88 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg shadow-xl z-40 p-4 space-y-3 text-xs text-slate-800 dark:text-[#E8EEF5]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#33485D]">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-[#E8EEF5]">
                <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>What Changed in this Relationship</span>
              </div>
              <button onClick={() => setShowWhatChangedModal(false)} className="text-slate-400 dark:text-[#A9BACB] hover:text-slate-600 dark:hover:text-[#E8EEF5] cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-[#A9BACB]">
              Recent relationship events and intelligence movements recorded for {graphData.root.label}:
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2">
              {graphData.whatChanged.items.map((item) => (
                <div key={item.id} className="p-2.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-[#E8EEF5]">{item.title}</span>
                    <span className="text-[9px] font-mono text-slate-400 dark:text-[#A9BACB]">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-[#CBD5E1] leading-snug">{item.summary}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-[#A9BACB] pt-1">
                    <span>Engine: {item.sourceEngine || 'COREvia System'}</span>
                    <span className="font-semibold text-[#168C83] dark:text-[#46C3B2]">{item.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
