import { notFound } from "next/navigation";

import { ReceiptReviewForm } from "@/components/ReceiptReviewForm";
import type {
  Item,
  Split,
} from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type ReviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SplitReviewPage({
  params,
}: ReviewPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const [
    splitResult,
    itemsResult,
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

  return (
    <ReceiptReviewForm
      splitId={id}
      initialSplit={
        splitResult.data as Split
      }
      initialItems={
        (itemsResult.data ?? []) as Item[]
      }
    />
  );
}