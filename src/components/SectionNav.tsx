import type { Slide as SlideData } from "../content/slides";

type Props = {
  slides: SlideData[];
  activeId: string;
  onSelect: (id: string) => void;
};

export function SectionNav({ slides, activeId, onSelect }: Props) {
  return (
    <nav className="section-nav" aria-label="Presentation sections">
      <div className="nav-brand">PONDEROSA</div>
      <ol>
        {slides.map((slide, index) => (
          <li key={slide.id}>
            <button
              type="button"
              className={slide.id === activeId ? "is-active" : undefined}
              onClick={() => onSelect(slide.id)}
            >
              <span className="nav-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="nav-label">{slide.navLabel}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="nav-hint">↓ ↑ · j k · Space</p>
    </nav>
  );
}
