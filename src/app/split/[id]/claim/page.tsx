import { notFound, redirect } from "next/navigation";

import { ClaimBoard } from "@/components/ClaimBoard";
import type {
  Item,
  Participant,
  Split,
} from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type ClaimPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClaimPage({ params }: ClaimPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // Figure out who's viewing this page
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    splitResult,
    itemsResult,
    participantsResult,
  ] = await Promise.all([
    supabase
      .from("splits")
      .select("*")
      .eq("id", id)
      .single(),

    supabase
      .from("items")
      .select("*")
      .eq("split_id", id)
      .order("position"),

    supabase
      .from("participants")
      .select("*")
      .eq("split_id", id)
      .order("created_at"),
  ]);

  if (
    splitResult.error ||
    !splitResult.data
  ) {
    notFound();
  }

  if (itemsResult.error) {
    throw new Error(
      itemsResult.error.message,
    );
  }

  if (participantsResult.error) {
    throw new Error(
      participantsResult.error.message,
    );
  }

  const split = splitResult.data as Split;

  // If the split is already finalised, skip claim and go straight to summary
  if (split.finalised_at) {
    redirect(`/split/${id}/summary`);
  }

  // Payer = the user who created the split
  // Guests have no user, or a different user id
  const isPayer = Boolean(user && user.id === split.user_id);

  return (
    <ClaimBoard
      splitId={id}
      billSubtotal={split.bill_subtotal}
      initialItems={(itemsResult.data ?? []) as Item[]}
      participants={(participantsResult.data ?? []) as Participant[]}
      isPayer={isPayer}
    />
  );
}