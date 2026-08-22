# Career Evidence Graph · CASCO

一个独立的、证据可追溯的岗位竞争力分析工作台，用于准备 CASCO「产品技术经理（智能作业方向）」面试。

> 这是求职准备与产品设计演示工具，不是录用概率预测器，也不是 CASCO 官方产品。公开 demo 使用脱敏/示例数据。Semantica 只提供公开的图谱、溯源和决策链设计启发，本项目不包含 Semantica 源码，也不代表双方存在关联。

## MVP

- 岗位雷达：逐条查看 JD 要求、匹配状态、证据覆盖率和待验证项
- 证据图谱：候选人经历 → 证据 → 岗位要求 → 缺口/行动的可解释关系
- 项目故事：用场景、行动、结果、取舍和复盘组织面试答案
- 14 天冲刺：按优先级、时长和完成证据安排准备任务
- 开源路线：评估能展示产品技术能力的最小项目
- 来源治理：区分事实、推断、未知和候选人自述
- JSON 数据导出、Markdown 一页纸导出、响应式布局

## 本地运行

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run preview
```

## 数据与隐私

`public/career-graph.json` 只包含公开脱敏 demo。完整简历、作品集和本地抽取结果应放在未纳入 Git 的 `private-local/`，当前 MVP 不会上传或自动调用模型。不要把联系方式、雇主机密、原始文件、API key 或内部材料放进 `public/`、源码、日志或构建产物。

## 部署

```bash
docker build -f deploy/Dockerfile -t career-evidence-graph .
docker run --rm -p 8080:8080 career-evidence-graph
```

仓库提供 [`deploy/sealos-manifest.yaml`](deploy/sealos-manifest.yaml) 和手动触发的 [`deploy-sealos.yml`](.github/workflows/deploy-sealos.yml)。启用前，在 GitHub Environment `production` 配置 `SEALOS_KUBECONFIG`（base64）和 `SEALOS_NAMESPACE` variable；运行 workflow 时必须输入 `DEPLOY`。它使用独立的 `casco-career-evidence` 应用名和域名，不会触碰政策调研项目。部署后检查首页、`/career-graph.json`、硬刷新、移动端和 CSP headers。

Sealos 部署前请根据目标集群填写环境变量和域名；不要把 token 写进镜像。若部署在子路径，设置 `VITE_BASE_PATH` 后重新构建。

## 参考

- [Semantica](https://github.com/semantica-agi/semantica)
- 本地参考项目：政策调研网页（只参考信息组织/交互，不是本项目代码基座）
