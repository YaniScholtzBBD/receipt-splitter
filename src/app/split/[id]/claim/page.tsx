import { notFound } from "next/navigation";

import { ClaimBoard } from "@/components/ClaimBoard";
import type {
  Item,
  Participant,
  Split,
} from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type ClaimPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClaimPage({
  params,
}: ClaimPageProps) {
  const { id } = await params;

  const supabase = await createClient();

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

  const split =
    splitResult.data as Split;

  return (
    <ClaimBoard
      splitId={id}
      billSubtotal={
        split.bill_subtotal
      }
      initialItems={
        (itemsResult.data ?? []) as Item[]
      }
      participants={
        (participantsResult.data ??
          []) as Participant[]
      }
    />
  );
}