import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  stepLabel?: string;
  align?: "left" | "center";
  action?: ReactNode;
};

export function PageHeader({
  title,
  description,
  stepLabel,
  align = "center",
  action,
}: PageHeaderProps) {
  const centered = align === "center";

  return (
    <header
      className={
        centered
          ? "mb-6 flex w-full flex-col items-center text-center animate-fade-up"
          : "mb-6 flex items-start justify-between gap-3 animate-fade-up"
      }
    >
      <section className={centered ? "w-full" : "min-w-0 flex-1"}>
        {stepLabel ? (
          <p className="mb-1 text-sm text-muted">{stepLabel}</p>
        ) : null}
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
            {description}
          </p>
        ) : null}
      </section>
      {action ? <aside className="shrink-0 pt-1">{action}</aside> : null}
    </header>
  );
}
