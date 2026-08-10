import { STATS } from "../../content/slides";

const BARS = [
  { label: "PO", value: STATS.po, tone: "po", note: "All KING-validated" },
  { label: "FS · KING", value: STATS.fsKingSupported, tone: "fs", note: "Ordinary siblings" },
  { label: "FS · Dup/MZ", value: STATS.fsDupMzKing, tone: "dup", note: "KING Dup/MZ" },
  { label: "FS · cluster", value: STATS.fsDupCluster, tone: "cluster", note: "16-sample component" },
  { label: "AV", value: STATS.av, tone: "av", note: "KING 2nd" },
  { label: "MHS", value: STATS.mhs, tone: "mhs", note: "KING 2nd" },
];

export function ResultsBars() {
  const max = Math.max(...BARS.map((bar) => bar.value));

  return (
    <div className="results-panel">
      <div className="bar-chart" aria-label="Close-relative prediction counts">
        {BARS.map((bar) => (
          <div key={bar.label} className="bar-row">
            <div className="bar-meta">
              <strong>{bar.label}</strong>
              <span>{bar.note}</span>
            </div>
            <div className="bar-track">
              <div
                className={`bar-fill tone-${bar.tone}`}
                style={{ width: `${(bar.value / max) * 100}%` }}
              />
            </div>
            <div className="bar-value">{bar.value}</div>
          </div>
        ))}
      </div>
      <aside className="results-aside">
        <h3>How to read FS</h3>
        <p>
          Raw PONDEROSA FS = {STATS.fsTotal}. Only {STATS.fsKingSupported} match KING FS.
          Another {STATS.fsDupMzKing} are KING Dup/MZ, and {STATS.fsDupCluster} sit in one
          duplicate-like cluster (IBD1≈0, IBD2≈genome-wide).
        </p>
        <ul>
          <li>PO: {STATS.po}/{STATS.po} vs KING</li>
          <li>2nd degree: {STATS.secondDegree} (AV+MHS) vs KING 2nd</li>
          <li>Pairs analyzed: {STATS.pairsAnalyzed.toLocaleString()}</li>
        </ul>
      </aside>
    </div>
  );
}
