"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type ClaimBoardProps = {
  splitId: string;
  billSubtotal: number;
  initialItems: Item[];
  participants: Participant[];
};

export function ClaimBoard({
  splitId,
  billSubtotal,
  initialItems,
  participants,
}: ClaimBoardProps) {
  const [items, setItems] = useState(initialItems);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [draftClaimants, setDraftClaimants] = useState<string[]>([]);

  const claimed = getClaimedSubtotal(items);
  const unclaimed = getUnclaimedSubtotal(items);
  const isFullyClaimed = unclaimed <= 0 && items.length > 0;
  const activeItem = items.find((item) => item.id === activeItemId) ?? null;

  useEffect(() => {
    if (!activeItemId) return;
    const itemId = activeItemId;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setActiveItemId(null);
        setDraftClaimants([]);
      }
      if (event.key === "Enter") {
        event.preventDefault();
        if (draftClaimants.length === 0) return;
        setItems((prev) => setItemClaimants(prev, itemId, draftClaimants));
        setActiveItemId(null);
        setDraftClaimants([]);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeItemId, draftClaimants]);

  function openSheet(item: Item) {
    setActiveItemId(item.id);
    setDraftClaimants([...item.claimed_by]);
  }

  function closeSheet() {
    setActiveItemId(null);
    setDraftClaimants([]);
  }

  function confirmSheet() {
    if (!activeItemId) return;
    setItems((prev) => setItemClaimants(prev, activeItemId, draftClaimants));
    closeSheet();
  }

  function toggleDraftClaimant(participantId: string) {
    setDraftClaimants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId],
    );
  }

  function handleSplitRemaining() {
    setItems((prev) => splitRemainingEvenly(prev, participants));
  }

  const confirmLabel = useMemo(() => {
    if (!activeItem || draftClaimants.length === 0) return "Confirm";
    if (draftClaimants.length === 1) {
      return `Confirm · ${formatRand(activeItem.price)}`;
    }
    const each = activeItem.price / draftClaimants.length;
    return `Confirm · ${formatRand(each)} each`;
  }, [activeItem, draftClaimants.length]);

  const bannerClass = isFullyClaimed
    ? "bg-success text-success-text"
    : "bg-warning text-warning-text";

  return (
    <AppShell>
      <nav className="mb-4 animate-fade-up" aria-label="Back">
        <BackLink href={`/split/${splitId}/participants`} label="Participants" />
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
        {items.length > 0 ? (
          items.map((item) => {
            const claimants = participants.filter((person) =>
              item.claimed_by.includes(person.id),
            );

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openSheet(item)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 rounded-2xl bg-surface px-5 py-4 text-left shadow-sm ring-1 ring-border/70 transition-colors hover:bg-background"
              >
                <h2 className="truncate text-base font-medium text-foreground">
                  {item.name}
                </h2>
                <p className="row-span-2 font-display text-base font-semibold text-foreground">
                  {formatRand(item.price)}
                </p>
                {claimants.length > 0 ? (
                  <ul className="flex flex-wrap items-center gap-1.5">
                    {claimants.map((person) => (
                      <li key={person.id}>
                        <span
                          className="inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium text-white"
                          style={{
                            backgroundColor: person.color ?? "var(--accent)",
                          }}
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
        {isFullyClaimed ? (
          <Link href={`/split/${splitId}/summary`} className="block">
            <Button fullWidth size="lg">
              Finalise
            </Button>
          </Link>
        ) : (
          <Button fullWidth size="lg" disabled>
            Finalise
          </Button>
        )}
      </footer>

      {activeItem ? (
        <ClaimSheet
          item={activeItem}
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
