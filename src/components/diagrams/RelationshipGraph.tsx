import { useMemo, useState } from "react";
import { DUP_CLUSTER_IDS, STATS } from "../../content/slides";

type Rel = "PO" | "FS" | "AV" | "MHS" | "DUP";

type Node = {
  id: string;
  x: number;
  y: number;
  group: "ordinary" | "dup";
};

type Edge = {
  source: string;
  target: string;
  rel: Rel;
};

/** Illustrative ordinary close-relative pairs (counts match validated summary; IDs are synthetic labels). */
function buildOrdinaryNetwork(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Compact families that mirror validated PO / FS / 2nd patterns without claiming real SacMEGA IDs.
  const families = [
    { prefix: "F1", members: 4, links: [["0", "1", "PO"], ["0", "2", "PO"], ["1", "2", "FS"], ["1", "3", "AV"]] as const },
    { prefix: "F2", members: 3, links: [["0", "1", "PO"], ["1", "2", "MHS"]] as const },
    { prefix: "F3", members: 3, links: [["0", "1", "FS"], ["0", "2", "AV"]] as const },
    { prefix: "F4", members: 2, links: [["0", "1", "PO"]] as const },
    { prefix: "F5", members: 2, links: [["0", "1", "MHS"]] as const },
  ];

  families.forEach((family, familyIndex) => {
    const cx = 170 + (familyIndex % 3) * 195;
    const cy = 120 + Math.floor(familyIndex / 3) * 200;
    for (let i = 0; i < family.members; i += 1) {
      const angle = (i / family.members) * Math.PI * 2 - Math.PI / 2;
      nodes.push({
        id: `${family.prefix}_${i}`,
        x: cx + Math.cos(angle) * 48,
        y: cy + Math.sin(angle) * 48,
        group: "ordinary",
      });
    }
    family.links.forEach(([a, b, rel]) => {
      edges.push({
        source: `${family.prefix}_${a}`,
        target: `${family.prefix}_${b}`,
        rel: rel as Rel,
      });
    });
  });

  return { nodes, edges };
}

function buildDupCluster(offsetX: number, offsetY: number): { nodes: Node[]; edges: Edge[] } {
  const n = DUP_CLUSTER_IDS.length;
  const nodes: Node[] = DUP_CLUSTER_IDS.map((id, index) => {
    const angle = (index / n) * Math.PI * 2 - Math.PI / 2;
    return {
      id,
      x: offsetX + Math.cos(angle) * 118,
      y: offsetY + Math.sin(angle) * 118,
      group: "dup" as const,
    };
  });

  // Show a subset of the complete graph so the SVG stays readable (full C(16,2)=120).
  const edges: Edge[] = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      if ((j - i) % 3 === 0 || j === i + 1 || (i === 0 && j === n - 1)) {
        edges.push({ source: DUP_CLUSTER_IDS[i], target: DUP_CLUSTER_IDS[j], rel: "DUP" });
      }
    }
  }

  return { nodes, edges };
}

const REL_COLORS: Record<Rel, string> = {
  PO: "#2f6fed",
  FS: "#1f9d6a",
  AV: "#c98512",
  MHS: "#9b5de5",
  DUP: "#d64545",
};

export function RelationshipGraph() {
  const [focus, setFocus] = useState<"all" | "ordinary" | "dup">("all");

  const { nodes, edges } = useMemo(() => {
    const ordinary = buildOrdinaryNetwork();
    const dup = buildDupCluster(820, 210);
    return {
      nodes: [...ordinary.nodes, ...dup.nodes],
      edges: [...ordinary.edges, ...dup.edges],
    };
  }, []);

  const nodeMap = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const visibleNodes = nodes.filter((node) => focus === "all" || node.group === focus);
  const visibleIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target));

  return (
    <div className="graph-panel">
      <div className="graph-toolbar">
        <div className="graph-legend">
          {(Object.keys(REL_COLORS) as Rel[]).map((rel) => (
            <span key={rel}>
              <i style={{ background: REL_COLORS[rel] }} />
              {rel === "DUP" ? "Dup/MZ-like" : rel}
            </span>
          ))}
        </div>
        <div className="graph-filters">
          {(
            [
              ["all", "All"],
              ["ordinary", "Ordinary relatives"],
              ["dup", "16-sample cluster"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={focus === value ? "is-active" : undefined}
              onClick={() => setFocus(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <svg className="relationship-graph" viewBox="0 0 1040 420" role="img" aria-label="Close relative network graph">
        <rect x="20" y="20" width="560" height="380" rx="18" className="graph-panel-bg" />
        <text x="40" y="48" className="graph-caption">
          Illustrative close-relative families
        </text>
        <rect x="620" y="20" width="400" height="380" rx="18" className="graph-panel-bg dup-panel" />
        <text x="640" y="48" className="graph-caption">
          Dup/MZ-like component · {STATS.dupClusterSize} samples · {STATS.fsDupCluster} FS pairs
        </text>

        {visibleEdges.map((edge) => {
          const a = nodeMap.get(edge.source);
          const b = nodeMap.get(edge.target);
          if (!a || !b) return null;
          return (
            <line
              key={`${edge.source}-${edge.target}-${edge.rel}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={REL_COLORS[edge.rel]}
              strokeWidth={edge.rel === "DUP" ? 1.2 : 2.2}
              opacity={edge.rel === "DUP" ? 0.35 : 0.85}
            />
          );
        })}

        {visibleNodes.map((node) => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <circle
              r={node.group === "dup" ? 11 : 13}
              className={node.group === "dup" ? "node-dup" : "node-ordinary"}
            />
            <title>{node.id}</title>
          </g>
        ))}
      </svg>

      <p className="graph-note">
        Left: schematic families for PO / FS / AV / MHS patterns. Right: the real SacMEGA 16-sample
        duplicate-like component from the report (every pair called FS; IBD pattern is Dup/MZ-like).
        Edge subset drawn for readability; full clique size is {STATS.fsDupCluster}.
      </p>
    </div>
  );
}
