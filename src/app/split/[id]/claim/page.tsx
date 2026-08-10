import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/ui/Button";

type ClaimPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { id } = await params;

  return (
    <AppShell>
      <nav className="mb-4 animate-fade-up" aria-label="Back">
        <BackLink href={`/split/${id}/participants`} label="Participants" />
      </nav>

      <aside
        aria-live="polite"
        className="mb-4 rounded-2xl bg-warning px-4 py-3 text-center text-sm text-warning-text animate-fade-up-delay"
      >
        <p>Claimed R0.00 / R—.—— | Unclaimed R—.——</p>
      </aside>

      <section
        aria-label="Line items"
        className="mb-6 flex flex-1 flex-col gap-2 animate-fade-up-delay"
      >
        <article className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center">
          <h2 className="text-base font-medium text-foreground">
            Items appear here
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tap an item to claim it once the receipt is parsed.
          </p>
        </article>
      </section>

      <footer className="mt-auto flex flex-col gap-2 pb-1">
        <Button variant="secondary" fullWidth size="lg" type="button" disabled>
          Split remaining evenly
        </Button>
        <Link href={`/split/${id}/summary`} className="block">
          <Button fullWidth size="lg">
            Finalise
          </Button>
        </Link>
      </footer>
    </AppShell>
  );
}
