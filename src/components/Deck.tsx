import { useCallback, useEffect, useRef, useState } from "react";
import { SLIDES } from "../content/slides";
import { SectionNav } from "./SectionNav";
import { Slide } from "./Slide";
import { PipelineDiagram } from "./diagrams/PipelineDiagram";
import { SimulationFlow } from "./diagrams/SimulationFlow";
import { FixBeforeAfter } from "./diagrams/FixBeforeAfter";
import { ResultsBars } from "./diagrams/ResultsBars";
import { RelationshipGraph } from "./diagrams/RelationshipGraph";
import { V3Roadmap } from "./diagrams/V3Roadmap";

function Diagram({ kind }: { kind: NonNullable<(typeof SLIDES)[number]["diagram"]> }) {
  switch (kind) {
    case "pipeline":
      return <PipelineDiagram />;
    case "simulation":
      return <SimulationFlow />;
    case "fixes":
      return <FixBeforeAfter />;
    case "results":
      return <ResultsBars />;
    case "graph":
      return <RelationshipGraph />;
    case "v3":
      return <V3Roadmap />;
    default:
      return null;
  }
}

export function Deck() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(false);

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, index));
    const el = scrollerRef.current?.querySelectorAll<HTMLElement>(".slide")[clamped];
    if (!el) return;
    lockRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveIndex(clamped);
    window.setTimeout(() => {
      lockRef.current = false;
    }, 450);
  }, []);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const sections = Array.from(root.querySelectorAll<HTMLElement>(".slide"));
    const observer = new IntersectionObserver(
      (entries) => {
        if (lockRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const index = sections.indexOf(visible.target as HTMLElement);
        if (index >= 0) setActiveIndex(index);
      },
      { root, threshold: [0.55] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;

      if (event.key === "ArrowDown" || event.key === "j" || event.key === "PageDown" || (event.key === " " && !event.shiftKey)) {
        event.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (event.key === "ArrowUp" || event.key === "k" || event.key === "PageUp" || (event.key === " " && event.shiftKey)) {
        event.preventDefault();
        scrollToIndex(activeIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        scrollToIndex(0);
      } else if (event.key === "End") {
        event.preventDefault();
        scrollToIndex(SLIDES.length - 1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, scrollToIndex]);

  return (
    <div className="app-shell">
      <SectionNav
        slides={SLIDES}
        activeId={SLIDES[activeIndex].id}
        onSelect={(id) => {
          const index = SLIDES.findIndex((slide) => slide.id === id);
          if (index >= 0) scrollToIndex(index);
        }}
      />
      <div className="deck-scroller" ref={scrollerRef}>
        {SLIDES.map((slide, index) => (
          <Slide key={slide.id} id={slide.id} active={index === activeIndex}>
            {slide.id === "title" ? (
              <div className="title-slide">
                {slide.eyebrow ? <p className="eyebrow">{slide.eyebrow}</p> : null}
                <h1 className="brand-title">{slide.title}</h1>
                {slide.subtitle ? <p className="lede">{slide.subtitle}</p> : null}
                {slide.body?.map((line) => (
                  <p key={line} className="muted">
                    {line}
                  </p>
                ))}
                <div className="title-meta">
                  <span>SacMEGA case study</span>
                  <span>Simulation training</span>
                  <span>V3 roadmap</span>
                </div>
              </div>
            ) : (
              <>
                <header className="slide-header">
                  {slide.eyebrow ? <p className="eyebrow">{slide.eyebrow}</p> : null}
                  <h2>{slide.title}</h2>
                  {slide.subtitle ? <p className="lede">{slide.subtitle}</p> : null}
                </header>

                {slide.callouts ? (
                  <div className="callout-row">
                    {slide.callouts.map((item) => (
                      <div key={item.label} className="callout">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                        {item.note ? <em>{item.note}</em> : null}
                      </div>
                    ))}
                  </div>
                ) : null}

                {slide.diagram ? (
                  <div className="diagram-wrap">
                    <Diagram kind={slide.diagram} />
                  </div>
                ) : null}

                {slide.bullets ? (
                  <ul className="bullet-list">
                    {slide.bullets.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}

                {slide.body?.map((line) => (
                  <p key={line} className="muted">
                    {line}
                  </p>
                ))}
              </>
            )}
          </Slide>
        ))}
      </div>
      <div className="progress-bar" aria-hidden="true">
        <div style={{ width: `${((activeIndex + 1) / SLIDES.length) * 100}%` }} />
      </div>
    </div>
  );
}
