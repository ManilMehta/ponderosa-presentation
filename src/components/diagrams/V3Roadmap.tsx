const ITEMS = [
  {
    title: "Input validation",
    body: "Catch missing files, hap-IBD without a map, and sparse FAM before long jobs start.",
  },
  {
    title: "Dup / MZ QC",
    body: "Flag near-identical pairs and build connected components so FS is not misread.",
  },
  {
    title: "Validation CLI",
    body: "Compare predictions to KING or truth with FID_IID normalization and agreement tables.",
  },
  {
    title: "Reporting",
    body: "Emit Markdown run summaries for QC, inference, and validation in one place.",
  },
  {
    title: "Sim metadata",
    body: "Store provenance JSON beside simulation-trained .classif.pkl files.",
  },
  {
    title: "Workflows docs",
    body: "Document real-label, sparse-label, sim-train, and validation paths for any cohort.",
  },
];

export function V3Roadmap() {
  return (
    <div className="v3-grid" aria-label="PONDEROSA V3 roadmap">
      {ITEMS.map((item, index) => (
        <article key={item.title} className="v3-card">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}
