import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  return (
    <AppShell>
      <header className="mb-5 flex items-center justify-between animate-fade-up">
        <BrandMark href={null} />
        <Button variant="ghost" size="sm">
          Sign out
        </Button>
      </header>

      <header className="mb-6 flex items-center justify-between animate-fade-up">
        <h1 className="font-display text-[1.75rem] font-semibold tracking-tight text-foreground sm:text-3xl">
          Your splits
        </h1>
        <button
          type="button"
          aria-label="Refresh"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-foreground"
        >
          <RefreshIcon />
        </button>
      </header>

      <Link href="/split/new" className="mb-8 block animate-fade-up-delay">
        <Button fullWidth size="lg">
          <ReceiptIcon />
          Start a new split
        </Button>
      </Link>

      <section aria-label="Recent splits" className="animate-fade-up-delay">
        <h2 className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          Recent
        </h2>

        <p className="rounded-2xl border border-dashed border-border bg-surface/60 px-5 py-12 text-center font-medium text-foreground">
          No splits yet
        </p>
      </section>
    </AppShell>
  );
}

function ReceiptIcon() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2-3-2-3 2-3-2z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}
