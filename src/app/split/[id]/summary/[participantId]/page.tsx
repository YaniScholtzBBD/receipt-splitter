import { notFound } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { formatRand, VAT_PERCENT } from "@/lib/format";
import { getPersonTotals } from "@/lib/split-logic";
import type { Item, Participant, Split } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{ id: string; participantId: string }>;
};

export default async function PersonDetailPage({ params }: Props) {
  const { id, participantId } = await params;

  const supabase = await createClient();

  const [splitResult, participantResult, itemsResult] = await Promise.all([
    supabase.from("splits").select("*").eq("id", id).single(),
    supabase.from("participants").select("*").eq("id", participantId).single(),
    supabase.from("items").select("*").eq("split_id", id).order("position"),
  ]);

  if (!splitResult.data || !participantResult.data) notFound();

  const split = splitResult.data as Split;
  const participant = participantResult.data as Participant;
  const allItems = (itemsResult.data ?? []) as Item[];

  const claimedItems = allItems.filter((item) =>
    item.claimed_by.includes(participantId),
  );

  const { data: allParticipants } = await supabase
    .from("participants")
    .select("*")
    .eq("split_id", id);

  const personTotals = getPersonTotals(
    split,
    (allParticipants ?? []) as Participant[],
    allItems,
  );

  const myTotal = personTotals.find((pt) => pt.participant.id === participantId);
  if (!myTotal) notFound();

  const tipAmount = split.bill_total * (split.tip_percent / 100);
  const vatPercent = VAT_PERCENT;

  return (
    <AppShell>
      <nav
        className="mb-4 grid animate-fade-up"
        style={{ gridTemplateColumns: "2.25rem 1fr 2.25rem" }}
        aria-label="Back"
      >
        <BackLink href={`/split/${id}/summary`} label="Back to summary" />
        <span />
      </nav>

      <section
        aria-label="Itemised bill"
        className="mb-6 flex flex-col gap-2 animate-fade-up"
      >
        <h2
          className="text-md font-semibold tracking-[0.08em] uppercase"
          style={{ color: participant.color ?? "var(--accent)" }}
        >
          {participant.name}
        </h2>

        {claimedItems.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {groupByName(claimedItems).map(({ name, quantity, totalMyShare, shared, splitCount }) => (
              <li key={name}>
                <article className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-5 py-4 shadow-sm ring-1 ring-border/70">
                  <p className="min-w-0 flex items-center gap-2 truncate text-sm font-medium text-foreground">
                    {quantity > 1 && (
                      <span className="shrink-0 inline-flex items-center rounded-md bg-background px-1.5 py-0.5 text-xs font-semibold text-muted ring-1 ring-border">
                        ×{quantity}
                      </span>
                    )}
                    <span className="truncate">{name}</span>
                    {shared && (
                      <span className="shrink-0 text-xs font-normal text-muted">
                        (÷{splitCount})
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatRand(totalMyShare)}
                  </p>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-surface px-5 py-6 text-center text-sm text-muted">
            No items claimed
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-surface px-5 py-4 animate-fade-up-delay">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Items subtotal</dt>
          <dd className="font-medium text-foreground">
            {formatRand(myTotal.claimed_subtotal)}
          </dd>
          {myTotal.vat_share > 0 && (
            <>
              <dt className="text-muted">VAT included ({vatPercent}%)</dt>
              <dd className="text-foreground">{formatRand(myTotal.vat_share)}</dd>
            </>
          )}
          {myTotal.service_share > 0 && (
            <>
              <dt className="text-muted">Service charge share</dt>
              <dd className="font-medium text-foreground">
                {formatRand(myTotal.service_share)}
              </dd>
            </>
          )}
          {tipAmount > 0 && (
            <>
              <dt className="text-muted">Tip share</dt>
              <dd className="font-medium text-foreground">
                {formatRand(myTotal.tip_share)}
              </dd>
            </>
          )}
          <dt className="border-t border-border pt-3 font-display text-lg font-semibold text-foreground">
            Total
          </dt>
          <dd className="border-t border-border pt-3 font-display text-lg font-semibold text-foreground">
            {formatRand(myTotal.total)}
          </dd>
        </dl>
      </section>
    </AppShell>
  );
}

function groupByName(items: Item[]) {
  const map = new Map<string, { name: string; quantity: number; totalMyShare: number; shared: boolean; splitCount: number }>();
  for (const item of items) {
    const myShare = item.price / item.claimed_by.length;
    const existing = map.get(item.name);
    if (existing) {
      existing.quantity += 1;
      existing.totalMyShare += myShare;
    } else {
      map.set(item.name, {
        name: item.name,
        quantity: 1,
        totalMyShare: myShare,
        shared: item.claimed_by.length > 1,
        splitCount: item.claimed_by.length,
      });
    }
  }
  return Array.from(map.values());
}
