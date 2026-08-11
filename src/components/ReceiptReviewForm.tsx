"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { formatRand } from "@/lib/format";
import type { Item, Split } from "@/lib/types";

type EditableItem = {
  id: string;
  name: string;
  price: string;
};

const TIP_PERCENTAGES = [0, 10, 12.5, 15, 20] as const;

function toMoneyString(value: number) {
  return value.toFixed(2);
}

function parseMoney(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createEmptyItem(): EditableItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    price: "",
  };
}

function itemsFromSplit(items: Item[]): EditableItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: toMoneyString(item.price),
  }));
}

type ReceiptReviewFormProps = {
  splitId: string;
  initialSplit?: Split | null;
  initialItems?: Item[];
};

export function ReceiptReviewForm({
  splitId,
  initialSplit = null,
  initialItems = [],
}: ReceiptReviewFormProps) {
  const split = initialSplit;
  const [items, setItems] = useState<EditableItem[]>(() =>
    initialItems.length > 0
      ? itemsFromSplit(initialItems)
      : [createEmptyItem()],
  );
  const [vat, setVat] = useState(() =>
    split ? toMoneyString(split.bill_vat) : "",
  );
  const [serviceCharge, setServiceCharge] = useState(() =>
    split ? toMoneyString(split.bill_service_charge) : "",
  );
  const [tipPercent, setTipPercent] = useState<number | null>(() =>
    split ? split.tip_percent : null,
  );
  const [tipAmount, setTipAmount] = useState(() => {
    if (!split) return "";
    return toMoneyString(split.bill_subtotal * (split.tip_percent / 100));
  });

  const itemsSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + parseMoney(item.price), 0),
    [items],
  );

  useEffect(() => {
    if (tipPercent === null) return;
    setTipAmount(toMoneyString((itemsSubtotal * tipPercent) / 100));
  }, [itemsSubtotal, tipPercent]);

  const tipValue = parseMoney(tipAmount);
  const grandTotal =
    itemsSubtotal +
    parseMoney(vat) +
    parseMoney(serviceCharge) +
    tipValue;

  function updateItem(id: string, patch: Partial<EditableItem>) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function addItem() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function applyTipPercent(percent: number) {
    setTipPercent(percent);
    setTipAmount(toMoneyString((itemsSubtotal * percent) / 100));
  }

  function handleTipAmountChange(value: string) {
    setTipAmount(value);
    setTipPercent(null);
  }

  return (
    <AppShell>
      <nav className="mb-4 animate-fade-up" aria-label="Back">
        <BackLink href="/" label="Back to home" />
      </nav>

      <PageHeader
        align="center"
        stepLabel="Step 1 of 3"
        title="Review the receipt"
        description="Fix any misreads, then add tip, VAT, and service charge."
      />

      <section
        aria-label="Receipt items"
        className="mb-6 flex flex-col gap-2 animate-fade-up-delay"
      >
        <h2 className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          Items
        </h2>

        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              <article className="flex items-stretch gap-2 rounded-2xl bg-surface px-4 py-3 shadow-sm ring-1 ring-border/70">
                <fieldset className="m-0 flex min-w-0 flex-1 flex-col gap-2 border-0 p-0">
                  <legend className="sr-only">
                    {item.name.trim() || "Untitled item"}
                  </legend>
                  <Input
                    value={item.name}
                    onChange={(e) =>
                      updateItem(item.id, { name: e.target.value })
                    }
                    placeholder="Item name"
                    aria-label="Item name"
                  />
                  <Input
                    value={item.price}
                    onChange={(e) =>
                      updateItem(item.id, { price: e.target.value })
                    }
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label="Item price"
                  />
                </fieldset>
                <button
                  type="button"
                  aria-label={`Remove ${item.name || "item"}`}
                  onClick={() => removeItem(item.id)}
                  className="inline-flex w-10 shrink-0 items-center justify-center self-stretch rounded-xl text-muted transition-colors hover:bg-background hover:text-foreground"
                >
                  <TrashIcon />
                </button>
              </article>
            </li>
          ))}
        </ul>

        <Button type="button" variant="secondary" fullWidth onClick={addItem}>
          Add item
        </Button>
      </section>

      <section
        aria-label="Charges"
        className="mb-6 flex flex-col gap-3 animate-fade-up-delay"
      >
        <h2 className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          Charges
        </h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">VAT</span>
          <Input
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            Service charge
          </span>
          <Input
            value={serviceCharge}
            onChange={(e) => setServiceCharge(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
          />
        </label>

        <section aria-label="Tip" className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-foreground">Tip</h3>
          <ul
            aria-label="Tip percentage"
            className="flex flex-wrap gap-2"
          >
            {TIP_PERCENTAGES.map((percent) => (
              <li key={percent}>
                <Chip
                  selected={tipPercent === percent}
                  onClick={() => applyTipPercent(percent)}
                >
                  {percent}%
                </Chip>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted">
            Pick a % to calculate from items ({formatRand(itemsSubtotal)}), or
            type an amount.
          </p>
          <Input
            value={tipAmount}
            onChange={(e) => handleTipAmountChange(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            aria-label="Tip amount"
          />
        </section>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface px-5 py-4 animate-fade-up-delay">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Items</dt>
          <dd className="font-medium text-foreground">
            {formatRand(itemsSubtotal)}
          </dd>
          <dt className="text-muted">VAT</dt>
          <dd className="font-medium text-foreground">
            {formatRand(parseMoney(vat))}
          </dd>
          <dt className="text-muted">Service charge</dt>
          <dd className="font-medium text-foreground">
            {formatRand(parseMoney(serviceCharge))}
          </dd>
          <dt className="text-muted">Tip</dt>
          <dd className="font-medium text-foreground">
            {formatRand(tipValue)}
          </dd>
          <dt className="border-t border-border pt-3 font-display text-lg font-semibold text-foreground">
            Total
          </dt>
          <dd className="border-t border-border pt-3 font-display text-lg font-semibold text-foreground">
            {formatRand(grandTotal)}
          </dd>
        </dl>
      </section>

      <footer className="mt-auto">
        <Link href={`/split/${splitId}/participants`} className="block">
          <Button fullWidth size="lg" disabled={items.length === 0}>
            Next
          </Button>
        </Link>
      </footer>
    </AppShell>
  );
}

/** Loads receipt data for a draft split id (empty until Supabase is wired). */
export function ReceiptReviewPage({ splitId }: { splitId: string }) {
  return (
    <ReceiptReviewForm
      splitId={splitId}
      initialSplit={null}
      initialItems={[]}
    />
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
