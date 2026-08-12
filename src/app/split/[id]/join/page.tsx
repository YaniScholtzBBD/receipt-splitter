import { notFound } from "next/navigation";

import { JoinForm } from "@/components/JoinForm";
import { createClient } from "@/utils/supabase/server";

type JoinPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: split, error } = await supabase
    .from("splits")
    .select("id, restaurant_name, finalised_at")
    .eq("id", id)
    .single();

  if (error || !split) notFound();

  return (
    <JoinForm
      splitId={id}
      restaurantName={split.restaurant_name}
      isFinalised={Boolean(split.finalised_at)}
    />
  );
}