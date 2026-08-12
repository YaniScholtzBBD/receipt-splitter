"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

const PALETTE = [
  "#F96167", // coral
  "#2F3C7E", // navy
  "#3B6D11", // leaf
  "#F9A826", // gold
  "#0EA5A5", // teal
  "#B14BB1", // magenta
];

type JoinFormProps = {
  splitId: string;
  restaurantName: string | null;
  isFinalised: boolean;
};

export function JoinForm({
  splitId,
  restaurantName,
  isFinalised,
}: JoinFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isFinalised) {
    return (
      <AppShell>
        <PageHeader
          align="center"
          stepLabel={restaurantName ?? "Split"}
          title="This split is already finalised"
          description="You can view the summary."
        />
        <Link href={`/split/${splitId}/summary`} className="block animate-fade-up-delay">
          <Button fullWidth size="lg">
            View summary
          </Button>
        </Link>
      </AppShell>
    );
  }

  async function handleJoin(event: React.FormEvent) {
  event.preventDefault();
  const trimmed = name.trim();
  if (!trimmed) return;

  setSubmitting(true);
  setError(null);
  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("participants")
    .select("id, name")
    .eq("split_id", splitId);

  if (fetchError) {
    setError(fetchError.message);
    setSubmitting(false);
    return;
  }
  const match = existing?.find(
    (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );

  if (match) {
    localStorage.setItem(`split-${splitId}-me`, match.id);
    router.push(`/split/${splitId}/claim`);
    return;
  }

  const colorIndex = (existing?.length ?? 0) % PALETTE.length;

  const { data: participant, error: insertError } = await supabase
    .from("participants")
    .insert({
      split_id: splitId,
      name: trimmed,
      color: PALETTE[colorIndex],
    })
    .select()
    .single();

  if (insertError || !participant) {
    setError(insertError?.message ?? "Could not join the split.");
    setSubmitting(false);
    return;
  }

  localStorage.setItem(`split-${splitId}-me`, participant.id);
  router.push(`/split/${splitId}/claim`);
}   
  return (
    <AppShell>
      <PageHeader
        align="center"
        stepLabel={restaurantName ?? "Split"}
        title="What's your name?"
        description="Tap the items you had. Your friends can too, on their own phones."
      />

      <form
        onSubmit={handleJoin}
        className="flex flex-col gap-3 animate-fade-up-delay"
      >
        <Input
          name="joiner-name"
          placeholder="e.g. Sarah"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          aria-label="Your name"
        />

        {error ? (
          <p
            role="alert"
            className="rounded-2xl bg-warning px-4 py-3 text-sm text-warning-text"
          >
            {error}
          </p>
        ) : null}

        <Button
          fullWidth
          size="lg"
          type="submit"
          disabled={!name.trim() || submitting}
        >
          {submitting ? "Joining…" : "Join split"}
        </Button>
      </form>
    </AppShell>
  );
}