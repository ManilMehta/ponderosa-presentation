import { useState } from "react";

const FIXES = [
  {
    id: "map",
    title: "hap-IBD genetic map",
    file: "data_loading.py",
    before: "load_pairs() never passed genetic_map → hap-IBD loader could not convert bp → cM.",
    after: "Build GeneticMap from map files and pass it into load_ibd_from_file when ibd_caller is hap-ibd.",
  },
  {
    id: "sibs",
    title: "Empty sibling pairs",
    file: "pedigree.py",
    before: "Siblings.from_pedigree_data assumed sibling_pairs was non-empty → NumPy index crash on sparse FAM.",
    after: "If sibling_pairs is empty, return an empty IBD feature matrix and continue.",
  },
  {
    id: "qda",
    title: "QDA collinearity",
    file: "classifiers.py",
    before: "QuadraticDiscriminantAnalysis failed: covariance of class GPAV not full rank on simulated features.",
    after: "Fit QDA with reg_param=1e-2 to shrink covariances toward identity and keep them invertible.",
  },
  {
    id: "truth",
    title: "No-truth evaluation",
    file: "core.py",
    before: "evaluation only defined inside the truth-file branch → crash when returning PonderosaResults.",
    after: "Initialize evaluation = None before the optional truth block.",
  },
  {
    id: "mask",
    title: "Inference row alignment",
    file: "classifiers.py",
    before: "NaN rows dropped for prediction but mask lost → 23,255 vs 23,375 shape mismatch.",
    after: "Return valid_mask; expand classifier probabilities back onto the full pair matrix.",
  },
];

export function FixBeforeAfter() {
  const [active, setActive] = useState(0);
  const fix = FIXES[active];

  return (
    <div className="fix-panel">
      <div className="fix-tabs" role="tablist" aria-label="Code fixes">
        {FIXES.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === active}
            className={index === active ? "is-active" : undefined}
            onClick={() => setActive(index)}
          >
            {item.title}
          </button>
        ))}
      </div>
      <div className="fix-body" role="tabpanel">
        <p className="fix-file">{fix.file}</p>
        <div className="fix-compare">
          <div className="fix-card before">
            <h3>Before</h3>
            <p>{fix.before}</p>
          </div>
          <div className="fix-arrow" aria-hidden="true">
            →
          </div>
          <div className="fix-card after">
            <h3>After</h3>
            <p>{fix.after}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
