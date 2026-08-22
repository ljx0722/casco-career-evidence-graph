import { useEffect, useMemo, useState } from "react";
import { BookOpen, CircleHelp, FileCheck2, GitBranch, Maximize2, Network, PanelRight, Search, ShieldCheck, SlidersHorizontal, Sparkles, Target, TimerReset, ZoomIn, ZoomOut } from "lucide-react";
import { EvidenceGraphCanvas } from "./graph/EvidenceGraphCanvas";
import { EvidenceInspector } from "./components/EvidenceInspector";
import { IntelligenceWorkspace } from "./workspaces/IntelligenceWorkspace";
import { RoleRadarWorkspace } from "./workspaces/RoleRadarWorkspace";
import { loadCareerGraph, NODE_META, relatedIds, searchNodes, toGraphology, type CareerGraphData, type CareerNode, type NodeType } from "./data/careerGraph";

const NAV = [
  { id: "overview", label: "总览", icon: Network },
  { id: "radar", label: "岗位雷达", icon: Target },
  { id: "graph", label: "证据图谱", icon: GitBranch },
  { id: "stories", label: "项目故事", icon: BookOpen },
  { id: "sprint", label: "面试冲刺", icon: TimerReset },
  { id: "projects", label: "开源路线", icon: Sparkles },
  { id: "sources", label: "来源治理", icon: ShieldCheck },
] as const;

type Workspace = typeof NAV[number]["id"];

type CameraAction = "in" | "out" | "fit" | null;

export default function App() {
  const [data, setData] = useState<CareerGraphData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<Workspace>("overview");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<NodeType | "all">("all");
  const [viewMode, setViewMode] = useState<"full" | "focused">("full");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showInspector, setShowInspector] = useState(true);
  const [cameraAction, setCameraAction] = useState<CameraAction>(null);

  useEffect(() => {
    loadCareerGraph().then(setData).catch((cause) => setError(cause instanceof Error ? cause.message : "职业图谱加载失败"));
  }, []);

  const nodes = useMemo(() => new Map((data?.nodes ?? []).map((node) => [node.id, node])), [data]);
  const filtered = useMemo(() => data ? searchNodes(data, query, typeFilter) : [], [data, query, typeFilter]);
  const visibleIds = useMemo(() => {
    if (!data) return new Set<string>();
    if (workspace !== "graph") return new Set(data.nodes.map((node) => node.id));
    const result = query || typeFilter !== "all" ? new Set(filtered.map((node) => node.id)) : new Set(data.nodes.map((node) => node.id));
    if (viewMode === "focused" && selectedId) return relatedIds(data, selectedId);
    return result;
  }, [data, filtered, query, typeFilter, viewMode, selectedId, workspace]);
  const graph = useMemo(() => data && workspace === "graph" ? toGraphology(data, visibleIds) : null, [data, visibleIds, workspace]);
  const selected = selectedId ? nodes.get(selectedId) ?? null : null;
  const focusedIds = useMemo(() => {
    if (!data || !selectedId) return new Set<string>();
    return relatedIds(data, selectedId);
  }, [data, selectedId]);
  const stats = useMemo(() => data ? {
    nodes: data.nodes.length,
    edges: data.edges.length,
    requirements: data.nodes.filter((node) => node.type === "requirement").length,
    evidence: data.nodes.filter((node) => node.type === "evidence").length,
    gaps: data.nodes.filter((node) => node.type === "gap").length,
  } : null, [data]);

  const focus = (id: string) => {
    setSelectedId(id);
    setShowInspector(true);
    if (workspace !== "graph") setWorkspace("graph");
  };
  const selectWorkspace = (next: Workspace) => {
    setWorkspace(next);
    if (next !== "graph") setCameraAction(null);
  };

  if (error) return <div className="load-state"><div className="load-state-card"><ShieldCheck size={26} /><h1>公开 demo 无法加载</h1><p>{error}</p><small>请确认部署输出中存在 career-graph.json，并检查 Vite base 路径。</small></div></div>;
  if (!data || !stats) return <div className="load-state"><div className="loading-orb" /><p>正在构建证据链……</p></div>;

  return <div className="app-shell">
    <aside className="side-nav">
      <button className="brand-mark" onClick={() => selectWorkspace("overview")} aria-label="返回总览"><Sparkles size={18} /></button>
      <nav className="nav-stack" aria-label="主要工作区">{NAV.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${workspace === id ? "active" : ""}`} onClick={() => selectWorkspace(id)}><Icon size={17} /><span>{label}</span></button>)}</nav>
      <button className="nav-item nav-bottom" onClick={() => selectWorkspace("sources")}><CircleHelp size={17} /><span>边界说明</span></button>
    </aside>

    <main className="workspace">
      <header className="top-bar">
        <div><div className="eyebrow">CAREER EVIDENCE GRAPH · CASCO</div><h1>产品技术经理 · 智能作业方向</h1></div>
        <div className="top-stats"><span><b>{stats.requirements}</b>岗位要求</span><span><b>{stats.evidence}</b>证据</span><span><b>{stats.gaps}</b>缺口</span><span><b>{stats.edges}</b>关系</span></div>
      </header>

      {workspace === "radar" ? <RoleRadarWorkspace data={data} onFocus={focus} /> : workspace === "graph" ? <GraphWorkspace data={data} graph={graph} selected={selected} nodes={nodes} visibleCount={visibleIds.size} filteredCount={filtered.length} query={query} setQuery={setQuery} typeFilter={typeFilter} setTypeFilter={setTypeFilter} viewMode={viewMode} setViewMode={setViewMode} selectedId={selectedId} focusedIds={focusedIds} hoveredId={hoveredId} setHoveredId={setHoveredId} showInspector={showInspector} setShowInspector={setShowInspector} cameraAction={cameraAction} setCameraAction={setCameraAction} setSelectedId={setSelectedId} onFocus={focus} /> : <IntelligenceWorkspace data={data} mode={workspace} onFocus={focus} />}
    </main>
  </div>;
}

interface GraphWorkspaceProps {
  data: CareerGraphData;
  graph: ReturnType<typeof toGraphology> | null;
  selected: CareerNode | null;
  nodes: Map<string, CareerNode>;
  visibleCount: number;
  filteredCount: number;
  query: string;
  setQuery: (value: string) => void;
  typeFilter: NodeType | "all";
  setTypeFilter: (value: NodeType | "all") => void;
  viewMode: "full" | "focused";
  setViewMode: (value: "full" | "focused") => void;
  selectedId: string | null;
  focusedIds: Set<string>;
  hoveredId: string | null;
  setHoveredId: (value: string | null) => void;
  showInspector: boolean;
  setShowInspector: (value: boolean | ((current: boolean) => boolean)) => void;
  cameraAction: CameraAction;
  setCameraAction: (value: CameraAction) => void;
  setSelectedId: (value: string | null) => void;
  onFocus: (id: string) => void;
}

function GraphWorkspace(props: GraphWorkspaceProps) {
  const {
    data, graph, selected, nodes, visibleCount, filteredCount, query, setQuery, typeFilter, setTypeFilter,
    viewMode, setViewMode, selectedId, focusedIds, hoveredId, setHoveredId, showInspector, setShowInspector,
    cameraAction, setCameraAction, setSelectedId, onFocus,
  } = props;
  return <section className="graph-workspace">
    <section className="command-bar"><Search size={16} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索岗位要求、项目、港口、调度、证据……" aria-label="搜索证据图谱" /><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as NodeType | "all")} aria-label="节点类型"><option value="all">全部类型</option>{Object.entries(NODE_META).map(([type, meta]) => <option key={type} value={type}>{meta.label}</option>)}</select><button className="command-button" onClick={() => { setQuery(""); setTypeFilter("all"); setViewMode("full"); }}>清除</button></section>
    <section className="graph-toolbar"><div className="toolbar-group"><button className={viewMode === "full" ? "selected" : ""} onClick={() => setViewMode("full")}><Maximize2 size={14} />全图</button><button className={viewMode === "focused" ? "selected" : ""} onClick={() => selectedId && setViewMode("focused")}><Target size={14} />聚焦关系</button><span className="toolbar-label"><SlidersHorizontal size={14} /> {filteredCount} 条匹配 · {visibleCount} 可见</span></div><div className="toolbar-group"><button onClick={() => setShowInspector((current) => !current)}><PanelRight size={14} />{showInspector ? "收起检查器" : "打开检查器"}</button></div></section>
    <section className={`graph-layout ${showInspector ? "with-inspector" : "full-canvas"}`}>
      <div className="canvas-shell"><EvidenceGraphCanvas graph={graph} selectedId={selectedId} focusedIds={focusedIds} dimmed={Boolean(selectedId || query)} cameraAction={cameraAction} onCameraActionDone={() => setCameraAction(null)} onNodeClick={(id) => { setSelectedId(id); setShowInspector(true); }} onNodeHover={setHoveredId} /><div className="canvas-status"><span className="live-dot" />{hoveredId ? nodes.get(hoveredId)?.label : "点击要求查看证据链 · 关系方向 · 缺口 · 下一步行动"}</div><div className="graph-legend">{Object.entries(NODE_META).map(([type, meta]) => <span key={type}><i style={{ background: meta.color }} />{meta.label}</span>)}</div><div className="zoom-controls"><button title="放大" onClick={() => setCameraAction("in")}><ZoomIn size={16} /></button><button title="缩小" onClick={() => setCameraAction("out")}><ZoomOut size={16} /></button><button title="适应视图" onClick={() => setCameraAction("fit")}><Maximize2 size={16} /></button></div></div>
      {showInspector && <EvidenceInspector node={selected} nodes={nodes} edges={data.edges} onFocus={onFocus} onClose={() => setShowInspector(false)} />}
    </section>
    <div className="graph-footnote"><FileCheck2 size={14} />结论按 deterministic-v1 规则计算；事实、推断和未知分层展示；公开 demo 不包含原始联系方式。</div>
  </section>;
}
