import { useMemo } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleHelp, ExternalLink, FileText, X } from "lucide-react";
import type { CareerEdge, CareerNode } from "../data/careerGraph";
import { NODE_META } from "../data/careerGraph";

interface Props {
  node: CareerNode | null;
  nodes: Map<string, CareerNode>;
  edges: CareerEdge[];
  onFocus: (id: string) => void;
  onClose: () => void;
}

const display = (value: unknown): string => {
  if (Array.isArray(value)) return value.join("、");
  if (typeof value === "number" && value > 0 && value < 1) return `${Math.round(value * 100)}%`;
  return String(value ?? "—");
};

const LABELS: Record<string, string> = {
  priority: "优先级",
  score: "证据匹配分",
  match_status: "匹配状态",
  evidence_count: "直接/迁移证据",
  unknown_count: "关键未知",
  hard_match: "硬匹配",
  transferability: "可迁移性",
  evidence_strength: "证据强度",
  domain_understanding: "领域理解",
  rationale: "判定说明",
  confidence: "置信度",
  claim_status: "结论类型",
  scale: "规模/结果",
  period: "时间",
  source_title: "来源标题",
  source_locator: "来源定位",
  evidence_status: "证据状态",
  last_verified_at: "最近核验",
  severity: "影响",
  owner: "负责人",
  status: "状态",
  days: "时间安排",
  duration: "预计用时",
  proof: "完成证据",
  mvp: "MVP",
  showcase: "展示能力",
  license: "许可/边界",
  source_type: "来源类型",
  transfer_signal: "迁移价值",
};

const labelFor = (key: string): string => LABELS[key] ?? key.replaceAll("_", " ");

export function EvidenceInspector({ node, nodes, edges, onFocus, onClose }: Props) {
  const relations = useMemo(() => {
    if (!node) return [];
    return edges
      .filter((edge) => edge.source === node.id || edge.target === node.id)
      .map((edge) => ({
        edge,
        direction: edge.source === node.id ? "out" as const : "in" as const,
        other: nodes.get(edge.source === node.id ? edge.target : edge.source),
      }))
      .filter((item): item is typeof item & { other: CareerNode } => Boolean(item.other));
  }, [node, nodes, edges]);

  if (!node) {
    return <aside className="inspector empty-inspector">
      <div className="empty-symbol"><CircleHelp size={24} /></div>
      <h2>从一条证据开始</h2>
      <p>点击图中的岗位要求、经历、证据或行动，查看它为什么被连接，以及还有哪些未知。</p>
    </aside>;
  }

  const meta = NODE_META[node.type];
  const properties = Object.entries(node.properties).filter(([key]) => !["private_note", "skill_tags"].includes(key));
  const sourceUrl = typeof node.properties.source_url === "string" ? node.properties.source_url : null;
  const claimStatus = String(node.properties.claim_status ?? "unknown");
  const confidence = String(node.properties.confidence ?? "unknown");
  const statusIcon = claimStatus === "fact" ? <CheckCircle2 size={14} /> : claimStatus === "inference" ? <AlertTriangle size={14} /> : <CircleHelp size={14} />;

  return <aside className="inspector">
    <header className="inspector-head">
      <div>
        <div className="node-kicker" style={{ color: meta.color }}>{meta.label} · {claimStatus}</div>
        <h2>{node.label}</h2>
        <code>{node.id}</code>
      </div>
      <button className="icon-button" onClick={onClose} aria-label="关闭证据检查器"><X size={16} /></button>
    </header>

    <div className="inspector-badges">
      <span className={`claim-badge ${claimStatus}`}>{statusIcon}{claimStatus === "fact" ? "材料事实" : claimStatus === "inference" ? "分析推断" : "尚未确认"}</span>
      <span className={`confidence-badge ${confidence}`}>置信度 {confidence}</span>
    </div>

    <section className="inspector-section">
      <h3>摘要</h3>
      <p className="summary-text">{node.summary}</p>
      {node.type === "requirement" && <p className="score-caveat">“证据匹配分”用于排序准备优先级，不是录用概率。缺失证据也不等于能力不存在。</p>}
    </section>

    <section className="inspector-section">
      <h3>结构化详情</h3>
      <dl className="property-list">
        {properties.map(([key, value]) => <div key={key} className={key === "rationale" ? "wide" : ""}>
          <dt>{labelFor(key)}</dt>
          <dd>{display(value)}</dd>
        </div>)}
      </dl>
    </section>

    {(node.type === "evidence" || node.type === "source") && <section className="inspector-section provenance-section">
      <h3><FileText size={13} />来源与溯源</h3>
      <p>来源定位：{display(node.properties.source_locator ?? node.properties.locator)}</p>
      <p>核验状态：{display(node.properties.status ?? node.properties.evidence_status)}</p>
      {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer">打开公开来源 <ExternalLink size={12} /></a>}
      <p className="privacy-note">公开演示只保留脱敏定位。完整原文和联系方式不会进入构建产物。</p>
    </section>}

    <section className="inspector-section">
      <h3>关系链 · {relations.length}</h3>
      <div className="relation-list">
        {relations.map(({ edge, direction, other }) => <button key={edge.id} className="relation-card" onClick={() => onFocus(other.id)}>
          <span className="relation-direction">{direction === "in" ? "来自" : "指向"}</span>
          <span className="relation-copy"><b>{other.label}</b><small>{edge.label} · {edge.type}</small></span>
          <ArrowRight size={14} />
        </button>)}
      </div>
    </section>
  </aside>;
}
