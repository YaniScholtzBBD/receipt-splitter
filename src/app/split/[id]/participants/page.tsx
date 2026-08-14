import { notFound } from "next/navigation";

import { ParticipantsForm } from "@/components/ParticipantsForm";
import type { Participant } from "@/lib/types";
import { createClient } from "@/utils/supabase/server";

type ParticipantsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParticipantsPage({
  params,
}: ParticipantsPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: split } = await supabase
    .from("splits")
    .select("id, restaurant_name")
    .eq("id", id)
    .single();

  if (!split) {
    notFound();
  }

  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("split_id", id)
    .order("created_at");

  if (error) {
    throw new Error(error.message);
  }

  return (
    <ParticipantsForm
      splitId={id}
      restaurantName={split.restaurant_name}
      initialParticipants={
        (data ?? []) as Participant[]
      }
    />
  );
}