export type SlideId =
  | "title"
  | "what"
  | "how"
  | "problems"
  | "simulation"
  | "ideas"
  | "sacmega"
  | "changes"
  | "results"
  | "graph"
  | "v3"
  | "takeaways";

export type Slide = {
  id: SlideId;
  navLabel: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  body?: string[];
  bullets?: string[];
  callouts?: { label: string; value: string; note?: string }[];
  diagram?:
    | "pipeline"
    | "simulation"
    | "fixes"
    | "results"
    | "graph"
    | "v3";
};

/** SacMEGA close-relative summary numbers from the final technical report. */
export const STATS = {
  individuals: 839,
  pairsAnalyzed: 23375,
  closeRelatives: 257,
  po: 28,
  fsTotal: 184,
  fsKingSupported: 31,
  fsDupMzKing: 33,
  fsDupCluster: 120,
  mhs: 24,
  av: 21,
  secondDegree: 45,
  dupClusterSize: 16,
} as const;

/** 16-sample duplicate-like component IDs from the SacMEGA report. */
export const DUP_CLUSTER_IDS = [
  "315_1007",
  "316_1008",
  "317_1010",
  "318_1011",
  "358_1094",
  "377_1157",
  "502_1410",
  "52_141",
  "598_1556",
  "61_156",
  "627_1605",
  "63_159",
  "685_1780",
  "700_1868",
  "780_2710",
  "879_3408",
] as const;

export const SLIDES: Slide[] = [
  {
    id: "title",
    navLabel: "Title",
    eyebrow: "Henn Lab · UC Davis",
    title: "PONDEROSA",
    subtitle:
      "Relationship inference from IBD — SacMEGA case study, patches that made it run, and where V3 goes next.",
    body: [
      "A live scrollable deck for supervisors and peers. Use the left nav or keyboard to move section by section.",
    ],
  },
  {
    id: "what",
    navLabel: "What it is",
    eyebrow: "Overview",
    title: "What is PONDEROSA?",
    subtitle:
      "Parent OffspriNg peDigree infErence RObuSt to endogAmy — a Python tool that classifies genetic relationships from Identity-by-Descent (IBD) segments.",
    bullets: [
      "Takes IBD segments (phasedibd or hap-ibd), a FAM pedigree file, and a genetic map.",
      "Trains machine-learning classifiers on labeled relationship examples (or loads a pretrained model).",
      "Infers close relationships such as PO, FS, HS, AV, GP subtypes — not just crude kinship coefficients.",
      "Designed for cohorts where pedigree labels may be incomplete and endogamy can blur IBD patterns.",
    ],
  },
  {
    id: "how",
    navLabel: "How it works",
    eyebrow: "Pipeline",
    title: "How PONDEROSA works",
    subtitle:
      "From raw IBD sharing to a hierarchical relationship call for every pair above the IBD threshold.",
    diagram: "pipeline",
    bullets: [
      "Load IBD segments and pair features (IBD1, IBD2, haplotype scores, segment counts).",
      "Build pedigree labels from FAM when available; otherwise use pretrained / simulation-trained classifiers.",
      "Run a hierarchy of classifiers (degree → finer subtypes).",
      "Write pair predictions, optional evaluation against truth, and classifier artifacts.",
    ],
  },
  {
    id: "problems",
    navLabel: "Problems",
    eyebrow: "Before our changes",
    title: "What blocked real cohort use",
    subtitle:
      "SacMEGA exposed gaps that are common on real SNP-array datasets — not SacMEGA-only quirks.",
    bullets: [
      "Sparse / empty FAM: not enough labeled relatives to train from the real pedigree.",
      "hap-IBD genetic map was never passed into the loader → failed bp→cM conversion.",
      "Empty sibling sets crashed pedigree construction.",
      "QDA crashed on collinear simulated features (covariance not full rank).",
      "No-truth inference could crash after predictions when evaluation was undefined.",
      "NaN feature filtering broke probability row alignment during real inference.",
      "No Dup/MZ class: near-identical samples get forced into FS.",
    ],
  },
  {
    id: "simulation",
    navLabel: "Simulation",
    eyebrow: "Training strategy",
    title: "Simulation-based training",
    subtitle:
      "SacMEGA’s real FAM had no usable labeled relatives for training. We simulated labeled pedigrees, trained classifiers, then applied them to real hap-IBD pairs.",
    diagram: "simulation",
    callouts: [
      { label: "Slurm job", value: "19289731", note: "COMPLETED · ~2 min · ~629 MB" },
      { label: "Artifact", value: "sim_training.classif.pkl", note: "Used for real inference" },
      {
        label: "Classes seen",
        value: "AV · MGP · MHS · PGP · PHS",
        note: "From ped-sim labeled output",
      },
    ],
  },
  {
    id: "ideas",
    navLabel: "Patches",
    eyebrow: "What we changed to run",
    title: "Patches that made the pipeline work",
    subtitle:
      "Minimal, targeted fixes in a private patched copy on HIVE — later generalized into PONDEROSA V3 modules.",
    bullets: [
      "Pass GeneticMap into hap-IBD loading in data_loading.py.",
      "Handle zero sibling pairs in pedigree.py.",
      "Add QDA reg_param=1e-2 for stable covariance in classifiers.py.",
      "Initialize evaluation = None for no-truth runs in core.py.",
      "Return valid_mask during inference and expand probabilities to full pair matrix.",
      "Isolate HIVE runs in a private venv + PYTHONPYCACHEPREFIX.",
    ],
  },
  {
    id: "sacmega",
    navLabel: "SacMEGA run",
    eyebrow: "Real cohort inference",
    title: "Running PONDEROSA on SacMEGA",
    subtitle:
      "Simulation-trained classifiers applied to real hap-IBD output from the SacMEGA SNP-array cohort on HIVE.",
    callouts: [
      { label: "Individuals", value: String(STATS.individuals) },
      { label: "IBD-sharing pairs", value: STATS.pairsAnalyzed.toLocaleString() },
      { label: "Known FAM relationships", value: "0" },
      { label: "Close-relative pairs", value: String(STATS.closeRelatives) },
    ],
    bullets: [
      "IBD: SAC_MEGA_phased_hapibd.ibd.gz (hap-ibd mode + genetic map).",
      "FAM: FID_IID format for ID consistency with IBD.",
      "Classifier: SAC_MEGA_sim_training.classif.pkl.",
      "Real inference Slurm job 19292798 · COMPLETED · ~2 min · ~619 MB.",
    ],
  },
  {
    id: "changes",
    navLabel: "Fixes",
    eyebrow: "Before → after",
    title: "Each change, highlighted",
    subtitle:
      "Five failure modes we hit on the path from broken inputs to a finished SacMEGA inference run.",
    diagram: "fixes",
  },
  {
    id: "results",
    navLabel: "Results",
    eyebrow: "Predictions + KING",
    title: "SacMEGA results",
    subtitle:
      "PONDEROSA recovered close relatives, but FS must be split: true siblings vs Dup/MZ-like sharing.",
    diagram: "results",
    callouts: [
      { label: "PO (KING-validated)", value: String(STATS.po) },
      { label: "FS (KING-supported)", value: String(STATS.fsKingSupported) },
      { label: "2nd (AV + MHS)", value: String(STATS.secondDegree) },
      { label: "FS → Dup/MZ (KING)", value: String(STATS.fsDupMzKing) },
    ],
  },
  {
    id: "graph",
    navLabel: "Node graph",
    eyebrow: "Network view",
    title: "Close-relative network",
    subtitle: `Ordinary close relatives plus one ${STATS.dupClusterSize}-sample duplicate-like component (${STATS.fsDupCluster} FS pairs = C(${STATS.dupClusterSize}, 2)) with IBD1≈0 and IBD2≈whole genome.`,
    diagram: "graph",
  },
  {
    id: "v3",
    navLabel: "V3",
    eyebrow: "Generalized next steps",
    title: "PONDEROSA V3 — what we want to implement",
    subtitle:
      "SacMEGA is the motivating case study. V3 modules are dataset-agnostic so any cohort can reuse the same workflows.",
    diagram: "v3",
    bullets: [
      "Pre-run input validation (files, hap-IBD map, sparse pedigree warnings).",
      "Duplicate / MZ-like QC with connected components.",
      "KING / truth validation CLI with ID normalization.",
      "Human-readable Markdown run reports.",
      "Simulation-training metadata next to .classif.pkl artifacts.",
      "Documented workflows: real labels, sparse labels, sim training, external validation.",
    ],
  },
  {
    id: "takeaways",
    navLabel: "Takeaways",
    eyebrow: "For the room",
    title: "What to remember",
    bullets: [
      "PONDEROSA can run on SacMEGA via simulation-trained classifiers + hap-IBD.",
      "Close relatives: 28 PO, 31 KING-supported FS, 45 second-degree (21 AV + 24 MHS).",
      "184 FS predictions are not all siblings — 33 match KING Dup/MZ; 120 form one 16-sample duplicate-like cluster.",
      "Patches that unblocked the run are now the seed of generalized V3 tooling.",
      "Next: QC-aware Dup/MZ handling before interpreting FS, cleaner reports, and reusable validation for other datasets.",
    ],
  },
];
