const STEPS = [
  { title: "ped-sim", body: "Definition file + sex-specific map → simulated pedigrees & VCF" },
  { title: "hap-IBD", body: "Call IBD on simulated genotypes (same caller as real data)" },
  { title: "Train", body: "PONDEROSA learns labeled classes → .classif.pkl" },
  { title: "Apply", body: "Load classifier on real SacMEGA hap-IBD pairs" },
];

export function SimulationFlow() {
  return (
    <div className="sim-flow" aria-label="Simulation training workflow">
      {STEPS.map((step, index) => (
        <article key={step.title} className="sim-card">
          <span>{String(index + 1).padStart(2, "0")}</span>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </article>
      ))}
    </div>
  );
}
