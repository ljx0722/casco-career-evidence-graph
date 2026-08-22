import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { validateCareerGraph, scoreRequirements, type CareerGraphData } from "../src/data/careerGraph";

test("public graph fixture validates and exposes deterministic requirements", async () => {
  const raw = await readFile(new URL("../public/career-graph.json", import.meta.url), "utf8");
  const data = JSON.parse(raw) as CareerGraphData;
  validateCareerGraph(data);
  const requirements = scoreRequirements(data);
  assert.equal(requirements.length, 8);
  assert.ok(requirements.every((item) => item.score >= 0 && item.score <= 100));
  assert.ok(requirements.some((item) => item.status === "validate"));
});

test("schema validation fails for dangling edge", () => {
  const data: CareerGraphData = {
    schemaVersion: 1,
    graphId: "test",
    generatedAt: "2026-08-21",
    privacy: "public-demo",
    metadata: { candidateLabel: "x", roleLabel: "x", disclaimer: "x", scoringVersion: "v1", sources: [] },
    nodes: [{ id: "candidate", type: "candidate", label: "x", summary: "x", properties: {} }],
    edges: [{ id: "edge", source: "candidate", target: "missing", type: "related_to", label: "x" }],
  };
  assert.throws(() => validateCareerGraph(data), /关系端点不存在/);
});
