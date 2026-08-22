import Graph from "graphology";
import forceAtlas2 from "graphology-layout-forceatlas2";

export type NodeType =
  | "candidate"
  | "experience"
  | "evidence"
  | "requirement"
  | "gap"
  | "action"
  | "project"
  | "domain"
  | "source";

export type Confidence = "high" | "medium" | "low" | "unknown";
export type ClaimStatus = "fact" | "inference" | "unknown";
export type MatchStatus = "strong" | "partial" | "validate" | "missing";

export interface CareerNode {
  id: string;
  type: NodeType;
  label: string;
  summary: string;
  properties: Record<string, unknown>;
}

export interface CareerEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label: string;
  weight?: number;
  properties?: Record<string, unknown>;
}

export interface CareerGraphData {
  schemaVersion: 1;
  graphId: string;
  generatedAt: string;
  privacy: "public-demo" | "private-local";
  nodes: CareerNode[];
  edges: CareerEdge[];
  metadata: {
    candidateLabel: string;
    roleLabel: string;
    disclaimer: string;
    scoringVersion: string;
    sources: string[];
  };
}

export const NODE_META: Record<NodeType, { label: string; color: string; shape: string }> = {
  candidate: { label: "候选人", color: "#72e0c5", shape: "circle" },
  experience: { label: "经历", color: "#79b8ff", shape: "circle" },
  evidence: { label: "证据", color: "#a98cff", shape: "diamond" },
  requirement: { label: "岗位要求", color: "#f5bd72", shape: "square" },
  gap: { label: "能力缺口", color: "#ff9d8d", shape: "triangle" },
  action: { label: "行动", color: "#e4cf72", shape: "square" },
  project: { label: "项目", color: "#6ed0e6", shape: "diamond" },
  domain: { label: "领域概念", color: "#a5b9d4", shape: "circle" },
  source: { label: "来源", color: "#7390ae", shape: "circle" },
};

export const EDGE_COLORS: Record<string, string> = {
  demonstrates: "#6ed0e6",
  supports: "#72e0c5",
  transfers_to: "#a98cff",
  derived_from: "#8da9c9",
  needs_validation: "#ffb26f",
  mitigates: "#e4cf72",
  enables: "#79b8ff",
  contradicts: "#ff8e86",
  related_to: "#607b99",
};

export function validateCareerGraph(data: CareerGraphData): void {
  if (data.schemaVersion !== 1) throw new Error(`不支持的图谱版本：${String(data.schemaVersion)}`);
  if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error("图谱必须包含 nodes 和 edges");
  const ids = new Set<string>();
  for (const node of data.nodes) {
    if (!node.id || ids.has(node.id)) throw new Error(`节点 ID 重复或缺失：${node.id}`);
    if (!(node.type in NODE_META)) throw new Error(`未知节点类型：${node.type}`);
    if (!node.label || !node.summary) throw new Error(`节点字段不完整：${node.id}`);
    ids.add(node.id);
  }
  const edgeIds = new Set<string>();
  for (const edge of data.edges) {
    if (!edge.id || edgeIds.has(edge.id)) throw new Error(`关系 ID 重复或缺失：${edge.id}`);
    if (!ids.has(edge.source) || !ids.has(edge.target)) throw new Error(`关系端点不存在：${edge.id}`);
    edgeIds.add(edge.id);
  }
  if (!data.nodes.some((node) => node.type === "candidate")) throw new Error("图谱缺少候选人节点");
  if (!data.nodes.some((node) => node.type === "requirement")) throw new Error("图谱缺少岗位要求节点");
}

export async function loadCareerGraph(): Promise<CareerGraphData> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}career-graph.json?v=1`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`数据文件加载失败：${response.status}`);
    const data = (await response.json()) as CareerGraphData;
    validateCareerGraph(data);
    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("图谱加载超时，请检查静态资源路径");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function toGraphology(data: CareerGraphData, visibleIds?: Set<string>): Graph {
  const graph = new Graph({ type: "directed", multi: true, allowSelfLoops: false });
  const selected = visibleIds ?? new Set(data.nodes.map((node) => node.id));
  const degree = new Map<string, number>();
  for (const edge of data.edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
  }
  data.nodes.filter((node) => selected.has(node.id)).forEach((node, index) => {
    const meta = NODE_META[node.type];
    const confidence = String(node.properties.confidence ?? "unknown");
    graph.addNode(node.id, {
      label: node.label,
      x: Math.cos(index * 2.13) * (150 + (index % 4) * 48),
      y: Math.sin(index * 2.13) * (120 + (index % 5) * 38),
      size: node.type === "candidate" ? 11 : 5 + Math.min(degree.get(node.id) ?? 0, 9) * 1.1,
      color: meta.color,
      baseColor: meta.color,
      nodeType: node.type,
      confidence,
    });
  });
  const nodeMap = new Map(data.nodes.map((node) => [node.id, node]));
  for (const edge of data.edges.filter((item) => selected.has(item.source) && selected.has(item.target))) {
    graph.addDirectedEdgeWithKey(edge.id, edge.source, edge.target, {
      label: edge.label,
      size: Math.max(0.8, Math.min(edge.weight ?? 1, 3)),
      color: EDGE_COLORS[edge.type] ?? EDGE_COLORS.related_to,
      baseColor: EDGE_COLORS[edge.type] ?? EDGE_COLORS.related_to,
      edgeType: edge.type,
      sourceType: nodeMap.get(edge.source)?.type,
      targetType: nodeMap.get(edge.target)?.type,
    });
  }
  if (graph.order > 1 && graph.size > 0) {
    forceAtlas2.assign(graph, {
      iterations: 90,
      settings: { gravity: 0.75, scalingRatio: 18, strongGravityMode: true, slowDown: 8, barnesHutOptimize: true },
    });
  }
  return graph;
}

export function searchNodes(data: CareerGraphData, query: string, type: NodeType | "all"): CareerNode[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  return data.nodes.filter((node) => {
    if (type !== "all" && node.type !== type) return false;
    if (!terms.length) return true;
    const values = Object.values(node.properties).flatMap((value) => Array.isArray(value) ? value : [value]);
    const haystack = [node.label, node.summary, ...values].join(" ").toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function scoreRequirements(data: CareerGraphData) {
  return data.nodes
    .filter((node) => node.type === "requirement")
    .map((node) => ({
      id: node.id,
      label: node.label,
      status: String(node.properties.match_status ?? "validate") as MatchStatus,
      score: Number(node.properties.score ?? 0),
      priority: String(node.properties.priority ?? "P1"),
      evidenceCount: Number(node.properties.evidence_count ?? 0),
      unknowns: Number(node.properties.unknown_count ?? 0),
      rationale: String(node.properties.rationale ?? ""),
    }));
}

export function relatedIds(data: CareerGraphData, id: string): Set<string> {
  const result = new Set([id]);
  for (const edge of data.edges) {
    if (edge.source === id) result.add(edge.target);
    if (edge.target === id) result.add(edge.source);
  }
  return result;
}
