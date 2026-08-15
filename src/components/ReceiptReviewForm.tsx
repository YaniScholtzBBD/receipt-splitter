"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Input } from "@/components/ui/Input";
import { formatRand, VAT_PERCENT } from "@/lib/format";
import type { Item, Split } from "@/lib/types";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type EditableItem = {
  id: string;
  name: string;
  price: string;
  unitPrice: number;
  quantity: string;
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
    unitPrice: 0,
    quantity: "1",
  };
}

function itemsFromSplit(items: Item[]): EditableItem[] {
  const groups = new Map<string, Item[]>();
  for (const item of items) {
    const existing = groups.get(item.name);
    if (existing) existing.push(item);
    else groups.set(item.name, [item]);
  }

  return Array.from(groups.values()).map((group) => {
    const unitPrice = group[0].price;
    const quantity = group.length;
    return {
      id: group[0].id,
      name: group[0].name,
      unitPrice,
      quantity: String(quantity),
      price: toMoneyString(unitPrice * quantity),
    };
  });
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
  const vatPercent = VAT_PERCENT;

  const [items, setItems] = useState<EditableItem[]>(() =>
    initialItems.length > 0
      ? itemsFromSplit(initialItems)
      : [createEmptyItem()],
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

  const router = useRouter();

  const [saving, setSaving] =
    useState(false);

  const [saveError, setSaveError] =
    useState<string | null>(null);

  const itemsSubtotal = useMemo(
    () => items.reduce((sum, item) => sum + parseMoney(item.price), 0),
    [items],
  );

  useEffect(() => {
    if (tipPercent === null) return;
    setTipAmount(toMoneyString((itemsSubtotal * tipPercent) / 100));
  }, [itemsSubtotal, tipPercent]);

  const tipValue = parseMoney(tipAmount);
  const vatAmount = itemsSubtotal * vatPercent / (100 + vatPercent);
  const grandTotal =
    itemsSubtotal +
    parseMoney(serviceCharge) +
    tipValue; // VAT is inclusive in item prices — don't add it again

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

  async function saveAndContinue() {
    const validItems = items
      .map((item) => ({
        name: item.name.trim(),
        unitPrice: item.unitPrice > 0 ? item.unitPrice : parseMoney(item.price) / (parseInt(item.quantity, 10) || 1),
        quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
      }))
      .filter((item) => item.name.length > 0 && item.unitPrice >= 0);

    if (validItems.length === 0) {
      setSaveError(
        "Add at least one receipt item.",
      );
      return;
    }

    setSaving(true);
    setSaveError(null);

    const supabase = createClient();

    try {
      const derivedTipPercent =
        itemsSubtotal > 0
          ? (tipValue / itemsSubtotal) * 100
          : 0;

      // Update the split totals
      const { error: splitError } =
        await supabase
          .from("splits")
          .update({
            bill_subtotal: itemsSubtotal,
            bill_vat: itemsSubtotal * vatPercent / (100 + vatPercent),
            bill_service_charge: parseMoney(serviceCharge),
            bill_total: itemsSubtotal + parseMoney(serviceCharge),
            tip_percent:
              tipPercent ??
              Number(
                derivedTipPercent.toFixed(2),
              ),
          })
          .eq("id", splitId);

      if (splitError) {
        throw splitError;
      }

      /*
       * Replace the existing item rows with
       * the reviewed list.
       */
      const { error: deleteError } =
        await supabase
          .from("items")
          .delete()
          .eq("split_id", splitId);

      if (deleteError) {
        throw deleteError;
      }

      const { error: insertError } =
        await supabase
          .from("items")
          .insert(
            validItems.flatMap((item, groupIndex) =>
              Array.from({ length: item.quantity }, (_, i) => ({
                split_id: splitId,
                name: item.name,
                price: item.unitPrice,
                claimed_by: [],
                position: groupIndex * 100 + i,
              })),
            ),
          );

      if (insertError) {
        throw insertError;
      }

      router.push(
        `/split/${splitId}/participants`,
      );
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "The receipt could not be saved.",
      );
    } finally {
      setSaving(false);
    }
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
        description="Fix any misreads, then add tip and service charge."
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
              <article className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-sm ring-1 ring-border/70">
                <div className="w-16 shrink-0">
                  <Input
                    value={item.quantity}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const newQty = parseInt(raw, 10);
                      updateItem(item.id, {
                        quantity: raw,
                        ...(newQty >= 1 && {
                          price: toMoneyString(item.unitPrice * newQty),
                        }),
                      });
                    }}
                    onBlur={() => {
                      const q = parseInt(item.quantity, 10);
                      const clamped = isNaN(q) || q < 1 ? 1 : q;
                      updateItem(item.id, {
                        quantity: String(clamped),
                        price: toMoneyString(item.unitPrice * clamped),
                      });
                    }}
                    type="number"
                    min={1}
                    inputMode="numeric"
                    aria-label="Quantity"
                    className="px-2 text-center"
                  />
                </div>
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
                    onChange={(e) => {
                      const newPrice = e.target.value;
                      updateItem(item.id, {
                        price: newPrice,
                        unitPrice: parseMoney(newPrice) / (parseInt(item.quantity, 10) || 1),
                      });
                    }}
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label="Item price"
                  />
                </fieldset>
                <button
                  type="button"
                  aria-label={`Remove ${item.name || "item"}`}
                  onClick={() => removeItem(item.id)}
                  className="inline-flex h-12 w-10 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-background hover:text-foreground"
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
          <p className="text-sm text-muted">
            Pick a % to calculate from items ({formatRand(itemsSubtotal)}), or
            type an amount.
          </p>
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
          <div className="relative flex items-center">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-4 select-none text-base text-muted"
            >
              R
            </span>
            <Input
              value={tipAmount}
              onChange={(e) => handleTipAmountChange(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              aria-label="Tip amount in rands"
              className="pl-8"
            />
          </div>
        </section>
      </section>

      <section className="mb-6 rounded-2xl border border-border bg-surface px-5 py-4 animate-fade-up-delay">
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted">Items</dt>
          <dd className="font-medium text-foreground">
            {formatRand(itemsSubtotal)}
          </dd>
          <dt className="text-muted">VAT included ({vatPercent}%)</dt>
          <dd className="text-foreground">
            {formatRand(vatAmount)}
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
        {saveError ? (
          <p
            role="alert"
            className="mb-3 rounded-2xl bg-warning px-4 py-3 text-sm text-warning-text"
          >
            {saveError}
          </p>
        ) : null}

        <Button
          type="button"
          fullWidth
          size="lg"
          disabled={
            items.length === 0 || saving
          }
          onClick={saveAndContinue}
        >
          {saving
            ? "Saving receipt..."
            : "Next"}
        </Button>
      </footer>
    </AppShell>
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
