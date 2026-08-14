"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { Button } from "@/components/ui/Button";
import { formatRand } from "@/lib/format";
import {
  getClaimedSubtotal,
  getUnclaimedSubtotal,
  initialsForName,
  setItemClaimants,
  splitRemainingEvenly,
} from "@/lib/split-logic";
import type { Item, Participant } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";
import { ShareLinkButton } from "@/components/ShareLinkButton";

type ClaimBoardProps = {
  splitId: string;
  billSubtotal: number;
  initialItems: Item[];
  participants: Participant[];
  isPayer: boolean;
};

export function ClaimBoard({
  splitId,
  billSubtotal,
  initialItems,
  participants: initialParticipants,
  isPayer,
}: ClaimBoardProps) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [items, setItems] = useState(initialItems);
  const [activeGroupIds, setActiveGroupIds] = useState<string[]>([]);
  const [draftClaimants, setDraftClaimants] = useState<string[]>([]);
  const router = useRouter();

  // Group consecutive items by name for display
  const groups = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      const existing = map.get(item.name);
      if (existing) existing.push(item);
      else map.set(item.name, [item]);
    }
    return Array.from(map.values());
  }, [items]);

  const activeGroup = useMemo(
    () => groups.find((g) => g.some((i) => activeGroupIds.includes(i.id))) ?? null,
    [groups, activeGroupIds],
  );

  const claimed = getClaimedSubtotal(items);
  const unclaimed = getUnclaimedSubtotal(items);
  const isFullyClaimed = unclaimed <= 0 && items.length > 0;

  useEffect(() => {
    if (activeGroupIds.length === 0) return;
    const groupIds = activeGroupIds;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveGroupIds([]);
        setDraftClaimants([]);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (draftClaimants.length === 0) return;
        setItems((prev) =>
          groupIds.reduce((acc, id) => setItemClaimants(acc, id, draftClaimants), prev),
        );
        setActiveGroupIds([]);
        setDraftClaimants([]);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGroupIds, draftClaimants]);

   useEffect(() => {
    const supabase = createClient();

    async function loadItems() {
      const { data } = await supabase
        .from("items")
        .select("*")
        .eq("split_id", splitId)
        .order("position");
      if (data) setItems(data as Item[]);
    }

    async function loadParticipants() {
      const { data } = await supabase
        .from("participants")
        .select("*")
        .eq("split_id", splitId)
        .order("created_at");
      if (data) setParticipants(data as Participant[]);
    }

    const channel = supabase
      .channel(`split-${splitId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "items",
          filter: `split_id=eq.${splitId}`,
        },
        () => {
          // A claim can come from someone who joined after this page loaded,
          // so refresh the roster too or their name chip has nobody to match
          void Promise.all([loadItems(), loadParticipants()]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "participants",
          filter: `split_id=eq.${splitId}`,
        },
        () => {
          void loadParticipants();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "splits",
          filter: `id=eq.${splitId}`,
        },
        (payload) => {
          const next = payload.new as { finalised_at: string | null };
          if (next.finalised_at) {
            router.replace(`/split/${splitId}/summary`);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [splitId, router]);


  function openSheet(group: Item[]) {
    setActiveGroupIds(group.map((i) => i.id));
    setDraftClaimants([...group[0].claimed_by]);
  }

  function closeSheet() {
    setActiveGroupIds([]);
    setDraftClaimants([]);
  }

  async function confirmSheet() {
    if (activeGroupIds.length === 0) return;

    setSaveError(null);

    const supabase = createClient();

    const results = await Promise.all(
      activeGroupIds.map((id) =>
        supabase.from("items").update({ claimed_by: draftClaimants }).eq("id", id),
      ),
    );

    const failed = results.find((r) => r.error);
    if (failed?.error) {
      setSaveError(failed.error.message);
      return;
    }

    setItems((current) =>
      activeGroupIds.reduce(
        (acc, id) => setItemClaimants(acc, id, draftClaimants),
        current,
      ),
    );

    closeSheet();
  }

  async function handleFinalise() {
    const supabase = createClient();
    await supabase
      .from("splits")
      .update({ finalised_at: new Date().toISOString() })
      .eq("id", splitId);
    router.push(`/split/${splitId}/summary`);
  }

  function toggleDraftClaimant(participantId: string) {
    setDraftClaimants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId],
    );
  }

  async function handleSplitRemaining() {
    const updated = splitRemainingEvenly(
      items,
      participants,
    );

    const changedItems = updated.filter(
      (updatedItem) => {
        const original = items.find(
          (item) =>
            item.id === updatedItem.id,
        );

        return (
          original &&
          original.claimed_by.length === 0 &&
          updatedItem.claimed_by.length > 0
        );
      },
    );

    setSaveError(null);

    const supabase = createClient();

    const results = await Promise.all(
      changedItems.map((item) =>
        supabase
          .from("items")
          .update({
            claimed_by: item.claimed_by,
          })
          .eq("id", item.id),
      ),
    );

    const failed = results.find(
      (result) => result.error,
    );

    if (failed?.error) {
      setSaveError(
        failed.error.message,
      );
      return;
    }

    setItems(updated);
  }
  const confirmLabel = useMemo(() => {
    if (!activeGroup || draftClaimants.length === 0) return "Confirm";
    const totalPrice = activeGroup.reduce((sum, i) => sum + i.price, 0);
    if (draftClaimants.length === 1) return `Confirm · ${formatRand(totalPrice)}`;
    const each = totalPrice / draftClaimants.length;
    return `Confirm · ${formatRand(each)} each`;
  }, [activeGroup, draftClaimants.length]);

  const bannerClass = isFullyClaimed
    ? "bg-success text-success-text"
    : "bg-warning text-warning-text";

  return (
    <AppShell>
      <nav
        className="mb-4 flex items-center justify-between gap-2 animate-fade-up"
        aria-label="Back"
      >
        {isPayer ? (
          <BackLink href={`/split/${splitId}/participants`} label="Participants" />
        ) : (
          <span />
        )}
        {isPayer && <ShareLinkButton splitId={splitId} />}
      </nav>

      <aside
        aria-live="polite"
        className={`mb-4 rounded-2xl px-4 py-3 text-center text-sm animate-fade-up-delay ${bannerClass}`}
      >
        <p>
          Claimed {formatRand(claimed)} / {formatRand(billSubtotal)} | Unclaimed{" "}
          {formatRand(unclaimed)}
        </p>
      </aside>

      <section
        aria-label="Line items"
        className="mb-6 flex flex-1 flex-col gap-2 animate-fade-up-delay"
      >
        {groups.length > 0 ? (
          groups.map((group) => {
            const totalPrice = group.reduce((sum, i) => sum + i.price, 0);
            const quantity = group.length;
            // Claimants present on any item in the group
            const claimantIds = [...new Set(group.flatMap((i) => i.claimed_by))];
            const claimants = participants.filter((p) => claimantIds.includes(p.id));

            return (
              <button
                key={group[0].id}
                type="button"
                onClick={() => openSheet(group)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-2xl bg-surface px-5 py-4 text-left shadow-sm ring-1 ring-border/70 transition-colors hover:bg-background"
              >
                <h2 className="truncate text-base font-medium text-foreground">
                  {group[0].name}
                  {quantity > 1 && (
                    <span className="ml-2 text-sm font-normal text-muted">×{quantity}</span>
                  )}
                </h2>
                <p className="row-span-2 font-display text-base font-semibold text-foreground">
                  {formatRand(totalPrice)}
                </p>
                {claimants.length > 0 ? (
                  <ul className="flex flex-wrap items-center gap-1.5">
                    {claimants.map((person) => (
                      <li key={person.id}>
                        <span
                          className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium text-white"
                          style={{ backgroundColor: person.color ?? "var(--accent)" }}
                        >
                          {person.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">Tap to claim</p>
                )}
              </button>
            );
          })
        ) : (
          <article className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center">
            <h2 className="text-base font-medium text-foreground">
              Items appear here
            </h2>
            <p className="mt-1 text-sm text-muted">
              Tap an item to claim it once the receipt is parsed.
            </p>
          </article>
        )}
      </section>
      {saveError ? (
        <p
          role="alert"
          className="mb-4 rounded-2xl bg-warning px-4 py-3 text-sm text-warning-text"
        >
          {saveError}
        </p>
      ) : null}

      <footer className="mt-auto flex flex-col gap-2 pb-1">
        <Button
          variant="secondary"
          fullWidth
          size="lg"
          type="button"
          disabled={unclaimed <= 0 || participants.length === 0}
          onClick={handleSplitRemaining}
        >
          Split remaining evenly
        </Button>
        {isPayer ? (
          isFullyClaimed ? (
            <Button fullWidth size="lg" onClick={handleFinalise}>
              Finalise
            </Button>
          ) : (
            <Button fullWidth size="lg" disabled>
              Finalise
            </Button>
          )
        ) : (
          <p className="text-center text-sm text-muted">
            Waiting for the payer to finalise…
          </p>
        )}
      </footer>

      {activeGroup ? (
        <ClaimSheet
          item={{
            ...activeGroup[0],
            price: activeGroup.reduce((sum, i) => sum + i.price, 0),
          }}
          participants={participants}
          selectedIds={draftClaimants}
          confirmLabel={confirmLabel}
          onToggle={toggleDraftClaimant}
          onCancel={closeSheet}
          onConfirm={confirmSheet}
        />
      ) : null}
    </AppShell>
  );
}

type ClaimSheetProps = {
  item: Item;
  participants: Participant[];
  selectedIds: string[];
  confirmLabel: string;
  onToggle: (participantId: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
};

function ClaimSheet({
  item,
  participants,
  selectedIds,
  confirmLabel,
  onToggle,
  onCancel,
  onConfirm,
}: ClaimSheetProps) {
  return (
    <dialog
      open
      aria-labelledby="claim-sheet-title"
      className="fixed inset-0 z-50 m-0 flex h-dvh max-h-none w-full max-w-none items-end justify-center border-0 bg-transparent p-0 md:items-center"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
    >
      <button
        type="button"
        aria-label="Close claim sheet"
        className="absolute inset-0 bg-foreground/40"
        onClick={onCancel}
      />

      <article className="relative z-10 flex w-full max-w-md flex-col rounded-t-3xl bg-surface p-5 shadow-lg md:rounded-3xl">
        <header className="mb-4 flex items-start justify-between gap-3">
          <h2
            id="claim-sheet-title"
            className="min-w-0 font-display text-xl font-semibold text-foreground"
          >
            Who had the {item.name.toLowerCase()}?
            <span className="mt-1 block text-sm font-normal text-muted">
              Tap all who shared it. Cost splits evenly.
            </span>
          </h2>
          <p className="shrink-0 font-display text-lg font-semibold text-foreground">
            {formatRand(item.price)}
          </p>
        </header>

        <ul className="mb-5 flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {participants.map((person) => {
            const selected = selectedIds.includes(person.id);
            return (
              <li key={person.id}>
                <button
                  type="button"
                  onClick={() => onToggle(person.id)}
                  className={[
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors",
                    selected
                      ? "bg-accent-soft ring-1 ring-accent/30"
                      : "bg-background ring-1 ring-border/70",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: person.color ?? "var(--accent)" }}
                  >
                    {initialsForName(person.name)}
                  </span>
                  <span className="min-w-0 flex-1 font-medium text-foreground">
                    {person.name}
                  </span>
                  <span
                    aria-hidden
                    className={[
                      "inline-flex h-6 w-6 items-center justify-center rounded-full border-2",
                      selected
                        ? "border-accent bg-accent text-white"
                        : "border-border bg-surface",
                    ].join(" ")}
                  >
                    {selected ? <CheckIcon /> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <footer className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            size="lg"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="flex-[1.4]"
            size="lg"
            disabled={selectedIds.length === 0}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </footer>
      </article>
    </dialog>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
