import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import {
  DUP_IBD2_THRESHOLD,
  REL_COLOR,
  REL_LABEL,
  buildGraph,
  endpointId,
  formatCm,
  formatInt,
  formatProb,
  type GraphData,
  type GraphEdge,
  type GraphNode,
  type Rel,
} from "../../lib/graph";

const TSV_URL = "/SAC_MEGA_real_inference_close_relatives.tsv";
const WIDTH = 980;
const HEIGHT = 420;

type Selection =
  | { kind: "intro" }
  | { kind: "sample"; node: GraphNode }
  | { kind: "edge"; edge: GraphEdge };

export function RelationshipGraph() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [data, setData] = useState<GraphData>({ nodes: [], edges: [] });
  const [status, setStatus] = useState("Loading SacMEGA close-relative TSV…");
  const [hint, setHint] = useState("Hover a sample or relationship line. Click to inspect.");
  const [activeRels, setActiveRels] = useState<Set<Rel>>(new Set(Object.keys(REL_COLOR) as Rel[]));
  const [selection, setSelection] = useState<Selection>({ kind: "intro" });
  const [search, setSearch] = useState("");

  const selectedId = selection.kind === "sample" ? selection.node.id : null;
  const selectedEdge = selection.kind === "edge" ? selection.edge : null;

  const counts = useMemo(() => {
    const tally: Record<Rel, number> = { PO: 0, FS: 0, AV: 0, MHS: 0, DUP: 0, OTHER: 0 };
    data.edges.forEach((edge) => {
      tally[edge.rel] += 1;
    });
    return tally;
  }, [data.edges]);

  useEffect(() => {
    let cancelled = false;
    d3.tsv(TSV_URL)
      .then((rows) => {
        if (cancelled) return;
        const graph = buildGraph(rows as unknown as Record<string, string>[], DUP_IBD2_THRESHOLD);
        setData(graph);
        setStatus(
          `Loaded SacMEGA close relatives: ${formatInt(graph.edges.length)} pairs, ${formatInt(graph.nodes.length)} samples.`,
        );
      })
      .catch((error: Error) => {
        if (cancelled) return;
        setStatus(`Could not load TSV: ${error.message}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || data.nodes.length === 0) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${WIDTH} ${HEIGHT}`);

    const root = svg.append("g");
    const linkG = root.append("g");
    const nodeG = root.append("g");
    const labelG = root.append("g");

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 5])
      .on("zoom", (event) => {
        root.attr("transform", event.transform.toString());
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    const visibleEdges = data.edges.filter((edge) => activeRels.has(edge.rel));
    const visibleIds = new Set<string>();
    visibleEdges.forEach((edge) => {
      visibleIds.add(endpointId(edge.source));
      visibleIds.add(endpointId(edge.target));
    });
    const visibleNodes = data.nodes.filter((node) => visibleIds.has(node.id));

    const sim = d3
      .forceSimulation<GraphNode>(visibleNodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphEdge>(visibleEdges)
          .id((node) => node.id)
          .distance((edge) => (edge.rel === "DUP" ? 30 : 72))
          .strength(0.55),
      )
      .force("charge", d3.forceManyBody().strength(-95))
      .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("x", d3.forceX(WIDTH / 2).strength(0.035))
      .force("y", d3.forceY(HEIGHT / 2).strength(0.035))
      .force(
        "collide",
        d3.forceCollide<GraphNode>().radius((node) => 6 + Math.min(node.deg, 12)),
      );

    const link = linkG
      .selectAll<SVGLineElement, GraphEdge>("line")
      .data(visibleEdges, (edge) => `${endpointId(edge.source)}-${endpointId(edge.target)}-${edge.index}`)
      .join("line")
      .attr("stroke", (edge) => REL_COLOR[edge.rel])
      .attr("stroke-width", (edge) => (edge.rel === "DUP" ? 1.1 : 1.8))
      .attr("stroke-opacity", (edge) => (edge.rel === "DUP" ? 0.24 : 0.6))
      .style("cursor", "pointer")
      .on("mouseenter", (_event, edge) => {
        setHint(
          `${endpointId(edge.source)} → ${endpointId(edge.target)}: ${REL_LABEL[edge.rel]}, IBD1 ${formatCm(edge.ibd1)} cM, IBD2 ${formatCm(edge.ibd2)} cM`,
        );
      })
      .on("mouseleave", () => setHint("Hover a sample or relationship line. Click to inspect."))
      .on("click", (_event, edge) => {
        setSelection({ kind: "edge", edge });
        setSearch("");
      });

    const node = nodeG
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(visibleNodes, (item) => item.id)
      .join("circle")
      .attr("r", (item) => 4 + Math.min(item.deg, 11))
      .attr("fill", (item) => (item.counts.DUP ? REL_COLOR.DUP : "#8F968B"))
      .attr("stroke", "#101411")
      .attr("stroke-width", 1.2)
      .style("cursor", "grab")
      .call(
        d3
          .drag<SVGCircleElement, GraphNode>()
          .on("start", (event, item) => {
            if (!event.active) sim.alphaTarget(0.3).restart();
            item.fx = item.x;
            item.fy = item.y;
          })
          .on("drag", (event, item) => {
            item.fx = event.x;
            item.fy = event.y;
          })
          .on("end", (event, item) => {
            if (!event.active) sim.alphaTarget(0);
            item.fx = null;
            item.fy = null;
          }),
      )
      .on("mouseenter", (_event, item) => {
        setHint(`${item.id}: ${item.deg} relationship(s), component of ${item.componentSize} sample(s).`);
      })
      .on("mouseleave", () => setHint("Hover a sample or relationship line. Click to inspect."))
      .on("click", (_event, item) => {
        setSelection({ kind: "sample", node: item });
        setSearch(item.id);
      });

    const label = labelG
      .selectAll<SVGTextElement, GraphNode>("text")
      .data(visibleNodes, (item) => item.id)
      .join("text")
      .attr("font-family", "'IBM Plex Mono', monospace")
      .attr("font-size", 10)
      .attr("fill", "#F3F0E7")
      .attr("paint-order", "stroke")
      .attr("stroke", "#101411")
      .attr("stroke-width", 3)
      .attr("opacity", 0)
      .text((item) => item.id);

    sim.on("tick", () => {
      link
        .attr("x1", (edge) => (edge.source as GraphNode).x ?? 0)
        .attr("y1", (edge) => (edge.source as GraphNode).y ?? 0)
        .attr("x2", (edge) => (edge.target as GraphNode).x ?? 0)
        .attr("y2", (edge) => (edge.target as GraphNode).y ?? 0);
      node.attr("cx", (item) => item.x ?? 0).attr("cy", (item) => item.y ?? 0);
      label.attr("x", (item) => (item.x ?? 0) + 10).attr("y", (item) => (item.y ?? 0) + 3);
    });

    (svgEl as SVGSVGElement & { __graph?: { link: typeof link; node: typeof node; label: typeof label; visibleEdges: GraphEdge[] } }).__graph = {
      link,
      node,
      label,
      visibleEdges,
    };

    return () => {
      sim.stop();
      svg.on(".zoom", null);
    };
  }, [data, activeRels]);

  useEffect(() => {
    const svgEl = svgRef.current as
      | (SVGSVGElement & {
          __graph?: {
            link: d3.Selection<SVGLineElement, GraphEdge, SVGGElement, unknown>;
            node: d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown>;
            label: d3.Selection<SVGTextElement, GraphNode, SVGGElement, unknown>;
            visibleEdges: GraphEdge[];
          };
        })
      | null;
    const graph = svgEl?.__graph;
    if (!graph) return;

    const neighborIds = selectedId
      ? new Set(
          graph.visibleEdges.flatMap((edge) => {
            const source = endpointId(edge.source);
            const target = endpointId(edge.target);
            if (source === selectedId) return [target];
            if (target === selectedId) return [source];
            return [];
          }),
        )
      : new Set<string>();

    const selectedPairKey = selectedEdge
      ? `${endpointId(selectedEdge.source)}-${endpointId(selectedEdge.target)}-${selectedEdge.index}`
      : null;

    graph.link
      .attr("stroke-opacity", (edge) => {
        const key = `${endpointId(edge.source)}-${endpointId(edge.target)}-${edge.index}`;
        if (selectedPairKey) return key === selectedPairKey ? 0.9 : 0.12;
        if (!selectedId) return edge.rel === "DUP" ? 0.24 : 0.6;
        return endpointId(edge.source) === selectedId || endpointId(edge.target) === selectedId ? 0.9 : 0.1;
      })
      .attr("stroke-width", (edge) => {
        const key = `${endpointId(edge.source)}-${endpointId(edge.target)}-${edge.index}`;
        if (selectedPairKey && key === selectedPairKey) return 3;
        if (selectedId && (endpointId(edge.source) === selectedId || endpointId(edge.target) === selectedId)) return 2.6;
        return edge.rel === "DUP" ? 1.1 : 1.8;
      });

    graph.node
      .attr("stroke", (item) => (item.id === selectedId ? "#F3F0E7" : "#101411"))
      .attr("stroke-width", (item) => (item.id === selectedId ? 2.4 : 1.2))
      .attr("opacity", (item) => {
        if (!selectedId && !selectedPairKey) return 1;
        if (selectedId) return item.id === selectedId || neighborIds.has(item.id) ? 1 : 0.25;
        if (!selectedEdge) return 0.25;
        return endpointId(selectedEdge.source) === item.id || endpointId(selectedEdge.target) === item.id ? 1 : 0.25;
      });

    graph.label.attr("opacity", (item) => (item.id === selectedId || neighborIds.has(item.id) ? 1 : 0));
  }, [selectedId, selectedEdge]);

  const toggleRel = (rel: Rel) => {
    setActiveRels((prev) => {
      const next = new Set(prev);
      if (next.has(rel)) next.delete(rel);
      else next.add(rel);
      return next;
    });
    setSelection({ kind: "intro" });
  };

  const selectSample = (id: string) => {
    const node = data.nodes.find((item) => item.id === id);
    if (!node) return;
    setSelection({ kind: "sample", node });
    setSearch(id);
  };

  const resetView = () => {
    setSelection({ kind: "intro" });
    setSearch("");
    if (svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(450).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="site-graph">
      <div className="site-graph-tools">
        <div>
          <label htmlFor="sample-search">Find a sample ID</label>
          <input
            id="sample-search"
            list="sample-options"
            value={search}
            placeholder="Example: 315_1007"
            onChange={(event) => {
              const value = event.target.value.trim();
              setSearch(event.target.value);
              if (data.nodes.some((node) => node.id === value)) selectSample(value);
            }}
          />
          <datalist id="sample-options">
            {data.nodes.map((node) => (
              <option key={node.id} value={node.id} />
            ))}
          </datalist>
        </div>
        <button type="button" onClick={resetView}>
          Reset view
        </button>
      </div>

      <div className="legend">
        {(Object.keys(REL_COLOR) as Rel[]).map((rel) => (
          <button
            key={rel}
            type="button"
            className={`chip${activeRels.has(rel) ? "" : " is-dim"}`}
            onClick={() => toggleRel(rel)}
          >
            <span className="dot" style={{ background: REL_COLOR[rel] }} />
            {REL_LABEL[rel]}
            <em>{counts[rel]}</em>
          </button>
        ))}
      </div>

      <div className="graph-frame">
        <svg ref={svgRef} width="100%" height={HEIGHT} role="img" aria-label="SacMEGA relatedness force graph" />
      </div>

      <p className="graph-hint">{hint}</p>
      <p className="status-line">{status}</p>

      <div className="graph-summary">
        <div className="mini">
          <div className="n">{formatInt(data.nodes.length)}</div>
          <div className="l">samples in map</div>
        </div>
        <div className="mini">
          <div className="n">{formatInt(data.edges.length)}</div>
          <div className="l">close-relative pairs</div>
        </div>
        <div className="mini">
          <div className="n">{formatInt(counts.DUP)}</div>
          <div className="l">duplicate-like flags</div>
        </div>
        <div className="mini">
          <div className="n">{formatInt(DUP_IBD2_THRESHOLD)}</div>
          <div className="l">IBD2 Dup threshold</div>
        </div>
      </div>

      <div className="inspector">
        {selection.kind === "intro" && (
          <>
            <h3>Map inspector</h3>
            <p>
              Same SacMEGA force graph as sacmega-site: every node is a sample, every edge is a PONDEROSA close-relative
              call. Red nodes sit in at least one duplicate/MZ-like edge (FS with IBD2 &gt; 3500 cM).
            </p>
            <div className="detail-grid">
              <div>
                <span>DUP rule</span>
                <strong>FS + IBD2 &gt; 3500 cM</strong>
              </div>
              <div>
                <span>Node size</span>
                <strong>number of called relatives</strong>
              </div>
              <div>
                <span>Interaction</span>
                <strong>drag · zoom · click inspect</strong>
              </div>
            </div>
          </>
        )}

        {selection.kind === "sample" && (
          <>
            <h3>{selection.node.id}</h3>
            <p>
              {selection.node.deg} called relationship(s) in component {selection.node.component}, which contains{" "}
              {selection.node.componentSize} sample(s).
            </p>
            <div className="detail-grid">
              {(Object.keys(REL_COLOR) as Rel[]).map((rel) => (
                <div key={rel}>
                  <span>{REL_LABEL[rel]}</span>
                  <strong>{selection.node.counts[rel] || 0}</strong>
                </div>
              ))}
            </div>
          </>
        )}

        {selection.kind === "edge" && (
          <>
            <h3>
              {endpointId(selection.edge.source)} → {endpointId(selection.edge.target)}
            </h3>
            <p>
              Map label {REL_LABEL[selection.edge.rel]} · PONDEROSA pred_rel {selection.edge.predRel}
            </p>
            <div className="detail-grid">
              <div>
                <span>Probability</span>
                <strong>{formatProb(selection.edge.prob)}</strong>
              </div>
              <div>
                <span>IBD1</span>
                <strong>{formatCm(selection.edge.ibd1)} cM</strong>
              </div>
              <div>
                <span>IBD2</span>
                <strong>{formatCm(selection.edge.ibd2)} cM</strong>
              </div>
              <div>
                <span>Segments</span>
                <strong>{formatInt(selection.edge.segments)}</strong>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
