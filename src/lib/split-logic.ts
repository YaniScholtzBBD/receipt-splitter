import type {
  Item,
  Participant,
  PersonTotal,
  ReconciliationState,
  Split,
} from "@/lib/types";

/** Proportional share of `amount` based on claimed vs bill subtotal. */
function shareOf(
  amount: number,
  claimedSubtotal: number,
  billSubtotal: number,
) {
  if (billSubtotal <= 0) return 0;
  return (amount * claimedSubtotal) / billSubtotal;
}

export function getClaimedSubtotal(items: Item[]) {
  return items.reduce((sum, item) => {
    if (item.claimed_by.length === 0) return sum;
    return sum + item.price;
  }, 0);
}

export function getUnclaimedSubtotal(items: Item[]) {
  return items.reduce((sum, item) => {
    if (item.claimed_by.length > 0) return sum;
    return sum + item.price;
  }, 0);
}

export function getReconciliation(
  split: Split,
  items: Item[],
): ReconciliationState {
  const claimed_subtotal = getClaimedSubtotal(items);
  const difference = claimed_subtotal - split.bill_subtotal;
  let status: ReconciliationState["status"] = "matched";
  if (claimed_subtotal < split.bill_subtotal) status = "unclaimed";
  if (claimed_subtotal > split.bill_subtotal) status = "over-claimed";

  return {
    claimed_subtotal,
    bill_subtotal: split.bill_subtotal,
    difference,
    status,
  };
}

export function getPersonTotals(
  split: Split,
  participants: Participant[],
  items: Item[],
): PersonTotal[] {
  const tipAmount = split.bill_total * (split.tip_percent / 100);

  return participants.map((participant) => {
    const claimedItems = items.filter((item) =>
      item.claimed_by.includes(participant.id),
    );

    const claimed_subtotal = claimedItems.reduce(
      (sum, item) => sum + item.price / item.claimed_by.length,
      0,
    );

    const claimed_items = claimedItems.map((item) =>
      item.claimed_by.length > 1 ? `${item.name} share` : item.name,
    );

    const vat_share = shareOf(
      split.bill_vat,
      claimed_subtotal,
      split.bill_subtotal,
    );
    const service_share = shareOf(
      split.bill_service_charge,
      claimed_subtotal,
      split.bill_subtotal,
    );
    const tip_share = shareOf(
      tipAmount,
      claimed_subtotal,
      split.bill_subtotal,
    );

    return {
      participant,
      claimed_subtotal,
      claimed_items,
      vat_share,
      service_share,
      tip_share,
      total: claimed_subtotal + vat_share + service_share + tip_share,
    };
  });
}

export function toggleItemClaim(
  items: Item[],
  itemId: string,
  participantId: string,
): Item[] {
  return items.map((item) => {
    if (item.id !== itemId) return item;
    const alreadyClaimed = item.claimed_by.includes(participantId);
    return {
      ...item,
      claimed_by: alreadyClaimed
        ? item.claimed_by.filter((id) => id !== participantId)
        : [...item.claimed_by, participantId],
    };
  });
}

export function setItemClaimants(
  items: Item[],
  itemId: string,
  claimantIds: string[],
): Item[] {
  return items.map((item) =>
    item.id === itemId ? { ...item, claimed_by: claimantIds } : item,
  );
}

export function splitRemainingEvenly(
  items: Item[],
  participants: Participant[],
): Item[] {
  const everyone = participants.map((person) => person.id);
  if (everyone.length === 0) return items;

  return items.map((item) =>
    item.claimed_by.length === 0
      ? { ...item, claimed_by: [...everyone] }
      : item,
  );
}

export function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[1][0]!).toUpperCase();
}
