import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  id: string;
  active?: boolean;
};

export function Slide({ children, id, active }: Props) {
  return (
    <section
      id={id}
      className={`slide${active ? " is-active" : ""}`}
      data-slide={id}
      aria-current={active ? "true" : undefined}
    >
      <div className="slide-inner">{children}</div>
    </section>
  );
}
