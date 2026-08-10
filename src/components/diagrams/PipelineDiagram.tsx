const STEPS = [
  { id: "ibd", label: "IBD segments", detail: "phasedibd or hap-ibd" },
  { id: "fam", label: "FAM + map", detail: "pedigree + cM conversion" },
  { id: "feat", label: "Pair features", detail: "IBD1 · IBD2 · hap scores" },
  { id: "clf", label: "Classifiers", detail: "degree → subtypes" },
  { id: "out", label: "Predictions", detail: "pair TSV + artifacts" },
];

export function PipelineDiagram() {
  return (
    <div className="flow-diagram" aria-label="PONDEROSA pipeline">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flow-node-wrap">
          <div className="flow-node">
            <span className="flow-step">{String(index + 1).padStart(2, "0")}</span>
            <strong>{step.label}</strong>
            <span>{step.detail}</span>
          </div>
          {index < STEPS.length - 1 ? <div className="flow-arrow" aria-hidden="true" /> : null}
        </div>
      ))}
    </div>
  );
}
