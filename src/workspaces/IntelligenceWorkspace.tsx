import { ArrowRight, Building2, CheckCircle2, Clock3, Download, Layers3, Lightbulb, Route, ShieldAlert } from "lucide-react";
import type { CareerGraphData, CareerNode, NodeType } from "../data/careerGraph";
import { NODE_META } from "../data/careerGraph";

interface Props {
  data: CareerGraphData;
  mode: "overview" | "stories" | "sprint" | "projects" | "sources";
  onFocus: (id: string) => void;
}

const COPY = {
  overview: { eyebrow: "CAREER INTELLIGENCE", title: "CASCO 求职作战台", subtitle: "从岗位事实，到个人证据，再到缺口行动——所有结论都可回链。" },
  stories: { eyebrow: "PROJECT STORIES", title: "项目故事库", subtitle: "把复杂项目压缩成面试可讲清的场景、行动、结果、取舍与复盘。" },
  sprint: { eyebrow: "14-DAY SPRINT", title: "面试冲刺", subtitle: "优先补影响大、证据弱、两周内可以验证的事项。" },
  projects: { eyebrow: "OPEN-SOURCE ROUTE", title: "开源项目路线", subtitle: "只做能直接展示产品技术能力和证据治理思维的最小闭环。" },
  sources: { eyebrow: "SOURCE GOVERNANCE", title: "来源治理", subtitle: "区分岗位原文、候选人自述、分析推断和仍未知的公司信息。" },
};

const get = (data: CareerGraphData, types: NodeType[]) => data.nodes.filter((node) => types.includes(node.type));
const text = (value: unknown) => Array.isArray(value) ? value.join("、") : String(value ?? "—");

function downloadBrief(data: CareerGraphData) {
  const requirements = data.nodes.filter((node) => node.type === "requirement");
  const gaps = data.nodes.filter((node) => node.type === "gap");
  const actions = data.nodes.filter((node) => node.type === "action");
  const lines = [
    "# CASCO 产品技术经理 · 证据型求职简报",
    `> ${data.metadata.disclaimer}`,
    "",
    "## 岗位匹配",
    ...requirements.map((node) => `- **${node.label}**：${text(node.properties.score)}/100 · ${text(node.properties.match_status)}\n  - ${text(node.properties.rationale)}`),
    "",
    "## 关键缺口",
    ...gaps.map((node) => `- **${node.label}**：${node.summary}`),
    "",
    "## 下一步行动",
    ...actions.map((node) => `- **${node.label}**（${text(node.properties.days)} / ${text(node.properties.duration)}）：${node.summary}`),
    "",
    "> 本简报用于面试准备，不代表 CASCO 官方评估，也不预测录用概率。",
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "CASCO-求职证据简报.md";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function IntelligenceWorkspace({ data, mode, onFocus }: Props) {
  const copy = COPY[mode];
  return <section className="page-workspace">
    <header className="workspace-heading"><div><div className="eyebrow">{copy.eyebrow}</div><h2>{copy.title}</h2><p>{copy.subtitle}</p></div>{mode === "overview" && <button className="primary-action" onClick={() => downloadBrief(data)}><Download size={15} />导出一页纸</button>}</header>
    {mode === "overview" ? <Overview data={data} onFocus={onFocus} /> : mode === "stories" ? <Stories data={data} onFocus={onFocus} /> : mode === "sprint" ? <Sprint data={data} onFocus={onFocus} /> : mode === "projects" ? <Projects data={data} onFocus={onFocus} /> : <Sources data={data} onFocus={onFocus} />}
  </section>;
}

function Overview({ data, onFocus }: Omit<Props, "mode">) {
  const requirements = get(data, ["requirement"]);
  const evidence = get(data, ["evidence"]);
  const gaps = get(data, ["gap"]);
  const actions = get(data, ["action"]);
  const topEvidence = evidence.slice(0, 4);
  return <>
    <div className="hero-grid">
      <article className="hero-card primary-hero"><div className="hero-icon"><Layers3 size={20} /></div><span>当前主叙事</span><h3>铁路工业数字化产品经验，可以迁移到智能作业产品</h3><p>已有需求、方案、数据、测试、交付和跨组织协同的完整证据链。最大的准备重点不是“从零证明产品能力”，而是补齐物流园/港口作业语言和商业化表达。</p><button onClick={() => onFocus("req-rail-port")}>查看关键缺口 <ArrowRight size={14} /></button></article>
      <article className="hero-card"><span>岗位要求</span><b>{requirements.length}</b><small>其中 {requirements.filter((node) => node.properties.match_status === "strong").length} 项具强证据</small></article>
      <article className="hero-card"><span>可定位证据</span><b>{evidence.length}</b><small>来源可回链、可人工修正</small></article>
      <article className="hero-card risk"><span>高优先缺口</span><b>{gaps.filter((node) => node.properties.priority === "P0").length}</b><small>先做领域速记和价值故事</small></article>
    </div>
    <div className="split-grid">
      <section className="content-block"><header><div><div className="section-kicker">EVIDENCE</div><h3>最强证据</h3></div><span>{topEvidence.length} 条</span></header><div className="compact-list">{topEvidence.map((node) => <button key={node.id} onClick={() => onFocus(node.id)}><i style={{ background: NODE_META[node.type].color }} /><span><b>{node.label}</b><small>{node.summary}</small></span><ArrowRight size={14} /></button>)}</div></section>
      <section className="content-block"><header><div><div className="section-kicker">NEXT ACTION</div><h3>接下来做什么</h3></div><span>{actions.length} 项</span></header><div className="compact-list">{actions.slice(0, 4).map((node) => <button key={node.id} onClick={() => onFocus(node.id)}><span className="day-chip">{text(node.properties.days)}</span><span><b>{node.label}</b><small>{text(node.properties.proof)}</small></span><ArrowRight size={14} /></button>)}</div></section>
    </div>
    <div className="decision-flow"><div><span>岗位原文</span><b>Requirements</b></div><ArrowRight /><div><span>候选人材料</span><b>Evidence</b></div><ArrowRight /><div><span>确定性规则</span><b>Assessment</b></div><ArrowRight /><div><span>未知与缺口</span><b>Gaps</b></div><ArrowRight /><div><span>最短验证</span><b>Actions</b></div></div>
  </>;
}

function Stories({ data, onFocus }: Omit<Props, "mode">) {
  const experiences = get(data, ["experience"]);
  return <div className="story-grid">{experiences.map((node, index) => <article className="story-card" key={node.id}><header><span>CASE {String(index + 1).padStart(2, "0")}</span><button onClick={() => onFocus(node.id)}>查看证据链 <ArrowRight size={13} /></button></header><h3>{node.label}</h3><p>{node.summary}</p><dl><div><dt>规模 / 结果</dt><dd>{text(node.properties.scale)}</dd></div><div><dt>面试价值</dt><dd>{text(node.properties.transfer_signal ?? "需求—方案—协同—交付的完整产品故事")}</dd></div></dl><footer><span>建议回答结构</span><b>场景 → 关键判断 → 协同动作 → 结果 → 复盘</b></footer></article>)}</div>;
}

function Sprint({ data, onFocus }: Omit<Props, "mode">) {
  const actions = get(data, ["action"]);
  return <><div className="sprint-banner"><Clock3 size={18} /><div><b>两周策略</b><p>先补 P0 领域语言，再整理可追问的项目证据，最后用开源 demo 证明产品化与技术理解。</p></div></div><div className="timeline-list">{actions.map((node, index) => <button key={node.id} className="timeline-item" onClick={() => onFocus(node.id)}><span className="timeline-index">{String(index + 1).padStart(2, "0")}</span><div><span>{text(node.properties.days)} · {text(node.properties.duration)}</span><h3>{node.label}</h3><p>{node.summary}</p><small>完成证据：{text(node.properties.proof)}</small></div><span className={`task-state ${text(node.properties.status)}`}>{text(node.properties.status)}</span></button>)}</div><section className="content-block interview-prompts"><header><div><div className="section-kicker">MOCK INTERVIEW</div><h3>优先模拟题</h3></div></header><ol><li>请讲一个你从模糊业务问题拆成产品方案，并推动研发和客户达成共识的项目。</li><li>如果铁路物流园出现车辆等待、堆场拥堵和设备冲突，你会如何定义“智能作业”MVP？</li><li>需求、进度和现场条件冲突时，你如何确定优先级和验收边界？</li><li>你如何支持销售把技术方案转成客户可理解、可量化的价值？</li><li>产品上线后出现数据质量与业务口径问题，你会如何组织闭环？</li></ol></section></>;
}

function Projects({ data, onFocus }: Omit<Props, "mode">) {
  const projects = get(data, ["project"]);
  const gaps = get(data, ["gap"]);
  return <><div className="project-feature">{projects.map((node) => <article key={node.id}><div className="project-mark"><Route size={22} /></div><div><span>RECOMMENDED MVP</span><h3>{node.label}</h3><p>{node.summary}</p><div className="project-meta"><span><b>MVP</b>{text(node.properties.mvp)}</span><span><b>证明什么</b>{text(node.properties.showcase)}</span><span><b>许可证</b>{text(node.properties.license)}</span></div><button className="primary-action" onClick={() => onFocus(node.id)}>查看项目关系 <ArrowRight size={14} /></button></div></article>)}</div><section className="content-block"><header><div><div className="section-kicker">DESIGN PRINCIPLE</div><h3>项目如何直接补岗位证据</h3></div></header><div className="gap-project-map">{gaps.map((node) => <button key={node.id} onClick={() => onFocus(node.id)}><ShieldAlert size={16} /><span><b>{node.label}</b><small>{node.summary}</small></span></button>)}</div></section></>;
}

function Sources({ data, onFocus }: Omit<Props, "mode">) {
  const sources = get(data, ["source"]);
  const inferred = data.nodes.filter((node) => node.properties.claim_status === "inference");
  const unknown = data.nodes.filter((node) => node.properties.claim_status === "unknown");
  return <><div className="governance-grid"><article><CheckCircle2 /><span>已核验材料来源</span><b>{sources.length}</b><p>用户提供的岗位职责、简历与作品集脱敏摘要。</p></article><article><Lightbulb /><span>分析推断</span><b>{inferred.length}</b><p>由岗位与证据关系推导，必须允许人工修正。</p></article><article><ShieldAlert /><span>尚未确认</span><b>{unknown.length}</b><p>CASCO 内部产品、岗位权重和面试流程不得被当成事实。</p></article></div><section className="content-block"><header><div><div className="section-kicker">PROVENANCE</div><h3>来源清单</h3></div></header><div className="source-table">{sources.map((node) => <button key={node.id} onClick={() => onFocus(node.id)}><Building2 size={16} /><span><b>{node.label}</b><small>{node.summary}</small></span><em>{text(node.properties.status)}</em></button>)}</div></section><div className="privacy-callout"><ShieldAlert size={18} /><div><b>隐私边界</b><p>原始 DOCX/PPTX、联系方式和完整文本仅在 Git 忽略的 private-local 中。公开构建不保存浏览器持久化数据、不启用 analytics、不发起第三方请求。</p></div></div></>;
}
