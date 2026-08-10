import Link from "next/link";

type BrandMarkProps = {
  href?: string | null;
  layout?: "inline" | "stacked";
  subtitle?: string;
};

export function BrandMark({
  href = "/",
  layout = "inline",
  subtitle,
}: BrandMarkProps) {
  const logo = (
    <span
      aria-hidden
      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent font-display text-2xl font-semibold text-white"
    >
      S
    </span>
  );

  const content =
    layout === "stacked" ? (
      <p className="flex w-full flex-col items-center gap-3 text-center">
        {logo}
        <span>
          <strong className="font-display text-[1.65rem] font-semibold tracking-tight text-foreground">
            Split
          </strong>
          {subtitle ? (
            <span className="mt-1 block text-[15px] font-normal text-muted">
              {subtitle}
            </span>
          ) : null}
        </span>
      </p>
    ) : (
      <p className="inline-flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-display text-lg font-semibold text-white">
          S
        </span>
        <strong className="font-display text-[1.65rem] font-semibold tracking-tight text-foreground">
          Split
        </strong>
      </p>
    );

  if (href === null || href === undefined) return content;

  return (
    <Link href={href} className="w-fit transition-opacity hover:opacity-80">
      {content}
    </Link>
  );
}
