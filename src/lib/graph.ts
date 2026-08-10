export const REL_COLOR = {
  PO: "#D49A5F",
  FS: "#79BD8F",
  AV: "#7FB4E4",
  MHS: "#C29ADE",
  DUP: "#F06E61",
  OTHER: "#8F968B",
} as const;

export const REL_LABEL = {
  PO: "Parent-offspring",
  FS: "Full sibling",
  AV: "Avuncular",
  MHS: "Maternal half-sib",
  DUP: "Duplicate/MZ-like",
  OTHER: "Other relationship",
} as const;

export type Rel = keyof typeof REL_COLOR;

export type GraphEdge = {
  index: number;
  source: string | GraphNode;
  target: string | GraphNode;
  rel: Rel;
  predRel: string;
  degree: string;
  prob: number;
  ibd1: number;
  ibd2: number;
  segments: number;
  knownRel: string;
};

export type GraphNode = {
  id: string;
  deg: number;
  counts: Record<Rel, number>;
  edges: GraphEdge[];
  component?: number;
  componentSize?: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
};

export type GraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export const DUP_IBD2_THRESHOLD = 3500;

export function number(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function endpointId(value: string | GraphNode): string {
  return typeof value === "string" ? value : value.id;
}

export function relationshipCategory(row: Record<string, string>, threshold = DUP_IBD2_THRESHOLD): Rel {
  if (row.pred_rel === "FS" && number(row.ibd2) > threshold) return "DUP";
  return row.pred_rel in REL_COLOR ? (row.pred_rel as Rel) : "OTHER";
}

function emptyCounts(): Record<Rel, number> {
  return { PO: 0, FS: 0, AV: 0, MHS: 0, DUP: 0, OTHER: 0 };
}

function annotateComponents(nodes: GraphNode[], edges: GraphEdge[]) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const adjacency = new Map(nodes.map((node) => [node.id, [] as string[]]));

  edges.forEach((edge) => {
    const source = endpointId(edge.source);
    const target = endpointId(edge.target);
    adjacency.get(source)!.push(target);
    adjacency.get(target)!.push(source);
  });

  const seen = new Set<string>();
  let component = 0;

  nodes.forEach((start) => {
    if (seen.has(start.id)) return;
    const stack = [start.id];
    const members: string[] = [];
    seen.add(start.id);

    while (stack.length) {
      const id = stack.pop()!;
      members.push(id);
      adjacency.get(id)!.forEach((next) => {
        if (!seen.has(next)) {
          seen.add(next);
          stack.push(next);
        }
      });
    }

    component += 1;
    members.forEach((id) => {
      byId.get(id)!.component = component;
      byId.get(id)!.componentSize = members.length;
    });
  });
}

export function buildGraph(rows: Record<string, string>[], threshold = DUP_IBD2_THRESHOLD): GraphData {
  const nodeMap = new Map<string, GraphNode>();
  const edges = rows.map((row, index) => {
    const edge: GraphEdge = {
      index,
      source: row.id1,
      target: row.id2,
      rel: relationshipCategory(row, threshold),
      predRel: row.pred_rel,
      degree: row.degree || "",
      prob: number(row.prob),
      ibd1: number(row.ibd1),
      ibd2: number(row.ibd2),
      segments: number(row.n),
      knownRel: row.known_rel || "unknown",
    };

    [edge.source as string, edge.target as string].forEach((id) => {
      if (!nodeMap.has(id)) {
        nodeMap.set(id, { id, deg: 0, counts: emptyCounts(), edges: [] });
      }
      const node = nodeMap.get(id)!;
      node.deg += 1;
      node.counts[edge.rel] += 1;
      node.edges.push(edge);
    });

    return edge;
  });

  const nodes = [...nodeMap.values()];
  annotateComponents(nodes, edges);
  return { nodes, edges };
}

export function formatCm(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function formatProb(value: number): string {
  return value >= 0.9995 ? "1.000" : value.toFixed(3);
}

export function formatInt(value: number): string {
  return Math.round(value).toLocaleString();
}
