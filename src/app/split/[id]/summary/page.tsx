import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/ui/Button";
import { formatRand } from "@/lib/format";
import type { PersonTotal, Split } from "@/lib/types";

type SummaryPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SummaryPage({ params }: SummaryPageProps) {
  const { id } = await params;
  // Placeholder until Supabase load is wired - keep as Split | null (not narrowed to null).
  const split = await loadSplit(id);
  const personTotals = await loadPersonTotals(id);
  const isFinalised = Boolean(split?.finalised_at);
  const tipAmount = split
    ? split.bill_total * (split.tip_percent / 100)
    : 0;

  return (
    <AppShell>
      <nav className="mb-4 animate-fade-up" aria-label="Back">
        <BackLink
          href={isFinalised ? "/" : `/split/${id}/claim`}
          label={isFinalised ? "Back to home" : "Claim items"}
        />
      </nav>

      <section
        aria-label="Receipt summary"
        className="mb-8 rounded-2xl border border-border bg-surface px-5 py-4 animate-fade-up"
      >
        <dl className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Bill</dt>
          <dd className="font-medium text-foreground">
            {split ? formatRand(split.bill_subtotal) : "R—.——"}
          </dd>
          <dt className="text-muted">VAT</dt>
          <dd className="font-medium text-foreground">
            {split ? formatRand(split.bill_vat) : "R—.——"}
          </dd>
          <dt className="text-muted">Service charge</dt>
          <dd className="font-medium text-foreground">
            {split ? formatRand(split.bill_service_charge) : "R—.——"}
          </dd>
          <dt className="text-muted">Tip</dt>
          <dd className="font-medium text-foreground">
            {split ? formatRand(tipAmount) : "R—.——"}
          </dd>
          <dt className="border-t border-border pt-3 font-display text-lg font-semibold text-foreground">
            Grand total
          </dt>
          <dd className="border-t border-border pt-3 font-display text-lg font-semibold text-foreground">
            {split ? formatRand(split.bill_total + tipAmount) : "R—.——"}
          </dd>
        </dl>
      </section>

      <section aria-label="Per-person totals" className="mb-8 animate-fade-up-delay">
        <h2 className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          Each person pays
        </h2>

        {personTotals.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {personTotals.map(({ participant, total, claimed_items }) => (
              <li key={participant.id}>
                <article className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-5 py-4 shadow-sm ring-1 ring-border/70">
                  <header className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: participant.color ?? "var(--accent)",
                      }}
                    />
                    <h3 className="min-w-0 truncate text-base font-medium text-foreground">
                      {participant.name}
                      <span className="mt-0 block truncate text-sm font-normal text-muted">
                        {claimed_items.length > 0
                          ? claimed_items.join(" + ")
                          : "No items claimed"}
                      </span>
                    </h3>
                  </header>
                  <p className="shrink-0 font-display text-base font-semibold text-foreground">
                    {formatRand(total)}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center font-medium text-foreground">
            Person cards go here
          </p>
        )}
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

async function loadSplit(_id: string): Promise<Split | null> {
  return null;
}

async function loadPersonTotals(_id: string): Promise<PersonTotal[]> {
  return [];
}
