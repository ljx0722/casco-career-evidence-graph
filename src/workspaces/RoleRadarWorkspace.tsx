import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed, Target } from "lucide-react";
import type { CareerGraphData } from "../data/careerGraph";
import { scoreRequirements } from "../data/careerGraph";

interface Props {
  data: CareerGraphData;
  onFocus: (id: string) => void;
}

const STATUS = {
  strong: { label: "强证据", icon: CheckCircle2, color: "#72e0c5" },
  partial: { label: "部分满足", icon: CircleDashed, color: "#f5bd72" },
  validate: { label: "待验证", icon: AlertTriangle, color: "#ff9d8d" },
  missing: { label: "缺口", icon: AlertTriangle, color: "#ff7f76" },
};

export function RoleRadarWorkspace({ data, onFocus }: Props) {
  const requirements = scoreRequirements(data).sort((a, b) => b.score - a.score);
  const weighted = Math.round(requirements.reduce((sum, item) => sum + item.score, 0) / Math.max(requirements.length, 1));
  const strong = requirements.filter((item) => item.status === "strong").length;
  const validate = requirements.filter((item) => item.status === "validate" || item.status === "missing").length;

  return <section className="page-workspace">
    <header className="workspace-heading">
      <div><div className="eyebrow">ROLE FIT · DETERMINISTIC V1</div><h2>岗位雷达</h2><p>把每一项岗位要求拆成证据、迁移能力、未知项与行动。分数只用于准备排序。</p></div>
      <div className="score-panel"><b>{weighted}</b><span>证据匹配指数</span><small>非录用概率</small></div>
    </header>

    <div className="metric-strip">
      <article><span>岗位要求</span><b>{requirements.length}</b></article>
      <article><span>强证据项</span><b>{strong}</b></article>
      <article><span>需专项验证</span><b>{validate}</b></article>
      <article><span>评分规则</span><b>v1</b></article>
    </div>

    <div className="requirement-grid">
      {requirements.map((item) => {
        const meta = STATUS[item.status];
        const Icon = meta.icon;
        return <button className={`requirement-card ${item.status}`} key={item.id} onClick={() => onFocus(item.id)}>
          <div className="requirement-top"><span className="priority-tag">{item.priority}</span><span className="status-copy" style={{ color: meta.color }}><Icon size={14} />{meta.label}</span></div>
          <div className="score-ring" style={{ "--score": `${item.score * 3.6}deg`, "--ring": meta.color } as React.CSSProperties}><b>{item.score}</b><small>/100</small></div>
          <div className="requirement-copy"><h3>{item.label}</h3><p>{item.rationale}</p></div>
          <div className="evidence-line"><span>{item.evidenceCount} 条证据</span><span>{item.unknowns} 个未知</span><ArrowRight size={14} /></div>
        </button>;
      })}
    </div>

    <div className="method-callout"><Target size={18} /><div><b>如何理解结果</b><p>强证据代表材料中存在直接、可定位的经历；部分满足代表可迁移但需重新表达；待验证代表需要补行业知识或证据。系统不推断最终录用结果。</p></div></div>
  </section>;
}
