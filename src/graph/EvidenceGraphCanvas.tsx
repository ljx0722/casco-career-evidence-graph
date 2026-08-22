import { useEffect, useRef } from "react";
import type Graph from "graphology";
import Sigma from "sigma";
import type { NodeHoverDrawingFunction } from "sigma/rendering";

const drawHover: NodeHoverDrawingFunction = (context, data, settings) => {
  const label = String(data.label ?? "");
  const fontSize = settings.labelSize;
  context.font = `${settings.labelWeight} ${fontSize}px ${settings.labelFont}`;
  const textWidth = context.measureText(label).width;
  const x = data.x + data.size + 6;
  const y = data.y - fontSize / 2 - 5;
  const width = textWidth + 18;
  const height = fontSize + 14;
  context.beginPath();
  context.arc(data.x, data.y, data.size + 2.5, 0, Math.PI * 2);
  context.strokeStyle = "rgba(232,247,255,.92)";
  context.lineWidth = 1.5;
  context.stroke();
  context.beginPath();
  context.roundRect(x, y, width, height, 8);
  context.fillStyle = "rgba(6,17,29,.96)";
  context.strokeStyle = "rgba(114,224,197,.42)";
  context.lineWidth = 1;
  context.fill();
  context.stroke();
  context.fillStyle = "#f4f9ff";
  context.textBaseline = "middle";
  context.fillText(label, x + 9, y + height / 2);
};

interface Props {
  graph: Graph | null;
  selectedId: string | null;
  focusedIds: Set<string>;
  dimmed: boolean;
  cameraAction: "in" | "out" | "fit" | null;
  onCameraActionDone: () => void;
  onNodeClick: (id: string) => void;
  onNodeHover: (id: string | null) => void;
}

export function EvidenceGraphCanvas({
  graph,
  selectedId,
  focusedIds,
  dimmed,
  cameraAction,
  onCameraActionDone,
  onNodeClick,
  onNodeHover,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sigmaRef = useRef<Sigma | null>(null);
  const clickRef = useRef(onNodeClick);
  const hoverRef = useRef(onNodeHover);
  const cameraDoneRef = useRef(onCameraActionDone);

  useEffect(() => { clickRef.current = onNodeClick; }, [onNodeClick]);
  useEffect(() => { hoverRef.current = onNodeHover; }, [onNodeHover]);
  useEffect(() => { cameraDoneRef.current = onCameraActionDone; }, [onCameraActionDone]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !graph) return;
    const sigma = new Sigma(graph, container, {
      renderEdgeLabels: false,
      labelRenderedSizeThreshold: 6,
      labelFont: "Inter, 'Microsoft YaHei', system-ui, sans-serif",
      labelSize: 11,
      labelWeight: "500",
      labelColor: { color: "#e9f5ff" },
      defaultDrawNodeHover: drawHover,
      defaultNodeColor: "#72e0c5",
      defaultEdgeColor: "#54718e",
      zIndex: true,
      minCameraRatio: 0.06,
      maxCameraRatio: 5,
    });
    sigmaRef.current = sigma;
    const clickHandler = ({ node }: { node: string }) => clickRef.current(node);
    const enterHandler = ({ node }: { node: string }) => hoverRef.current(node);
    const leaveHandler = () => hoverRef.current(null);
    sigma.on("clickNode", clickHandler);
    sigma.on("enterNode", enterHandler);
    sigma.on("leaveNode", leaveHandler);
    return () => {
      sigma.off("clickNode", clickHandler);
      sigma.off("enterNode", enterHandler);
      sigma.off("leaveNode", leaveHandler);
      sigma.kill();
      if (sigmaRef.current === sigma) sigmaRef.current = null;
    };
  }, [graph]);

  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!sigma || !cameraAction) return;
    const camera = sigma.getCamera();
    if (cameraAction === "in") camera.animatedZoom({ duration: 220 });
    else if (cameraAction === "out") camera.animatedUnzoom({ duration: 220 });
    else camera.animatedReset({ duration: 280 });
    cameraDoneRef.current();
  }, [cameraAction]);

  useEffect(() => {
    const sigma = sigmaRef.current;
    if (!graph || !sigma) return;
    graph.forEachNode((node, attrs) => {
      const active = !dimmed || focusedIds.has(node) || selectedId === node;
      graph.setNodeAttribute(node, "color", active ? attrs.baseColor : "rgba(91,112,137,.17)");
      graph.setNodeAttribute(node, "forceLabel", selectedId === node || focusedIds.has(node));
      graph.setNodeAttribute(node, "zIndex", selectedId === node ? 3 : focusedIds.has(node) ? 2 : 1);
    });
    graph.forEachEdge((edge, attrs, source, target) => {
      const active = !dimmed || focusedIds.has(source) || focusedIds.has(target);
      graph.setEdgeAttribute(edge, "color", active ? attrs.baseColor : "rgba(69,90,112,.10)");
    });
    sigma.refresh();
  }, [graph, selectedId, focusedIds, dimmed]);

  return <div ref={containerRef} className="graph-canvas" role="img" aria-label="候选人证据与岗位要求关系图谱" />;
}
