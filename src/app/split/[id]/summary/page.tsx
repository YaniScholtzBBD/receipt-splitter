import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/ui/Button";

type SummaryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <nav className="mb-4 animate-fade-up" aria-label="Back">
        <BackLink href={`/split/${id}/claim`} label="Claim items" />
      </nav>

      <section
        aria-label="Receipt summary"
        className="mb-8 rounded-2xl border border-border bg-surface px-5 py-4 animate-fade-up"
      >
        <dl className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Bill</dt>
          <dd className="font-medium text-foreground">R—.——</dd>
          <dt className="text-muted">VAT</dt>
          <dd className="font-medium text-foreground">R—.——</dd>
          <dt className="text-muted">Service charge</dt>
          <dd className="font-medium text-foreground">R—.——</dd>
          <dt className="text-muted">Tip</dt>
          <dd className="font-medium text-foreground">R—.——</dd>
          <dt className="border-t border-border pt-3 font-display text-lg font-semibold text-foreground">
            Grand total
          </dt>
          <dd className="border-t border-border pt-3 font-display text-lg font-semibold text-foreground">
            R—.——
          </dd>
        </dl>
      </section>

      <section aria-label="Per-person totals" className="mb-8 animate-fade-up-delay">
        <h2 className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          Each person pays
        </h2>

        <p className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center font-medium text-foreground">
          Person cards go here
        </p>
      </section>

      <footer className="mt-auto">
        <Link href="/" className="block">
          <Button fullWidth size="lg">
            Done
          </Button>
        </Link>
      </footer>
    </AppShell>
  );
}
