"use client";

import {
  useRef,
  useState,
  type SubmitEvent,
} from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Participant } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";
import { ShareLinkButton } from "@/components/ShareLinkButton";

const COLORS = [
  "#0F6B63",
  "#2563EB",
  "#9333EA",
  "#EA580C",
  "#DC2626",
  "#0891B2",
];

type ParticipantsFormProps = {
  splitId: string;
  initialParticipants: Participant[];
};

export function ParticipantsForm({
  splitId,
  initialParticipants,
}: ParticipantsFormProps) {
  const router = useRouter();
  const inputRef =
    useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [people, setPeople] =
    useState(initialParticipants);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleAdd(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);

    const duplicate = people.some(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase(),
    );

    if (duplicate) {
      setLoading(false);
      setError(`There's already a ${trimmed} in this split. Try a different name (e.g. "${trimmed} M").`);
      return;
    }

    const supabase = createClient();

    const { data, error } =
      await supabase
        .from("participants")
        .insert({
          split_id: splitId,
          name: trimmed,
          color:
            COLORS[
              people.length %
                COLORS.length
            ],
        })
        .select()
        .single();

    setLoading(false);

    if (error || !data) {
      setError(
        error?.message ??
          "The participant could not be added.",
      );
      return;
    }

    setPeople((current) => [
      ...current,
      data as Participant,
    ]);

    setName("");
    inputRef.current?.focus();
  }

  async function removePerson(
    participant: Participant,
  ) {
    setError(null);

    const supabase = createClient();

    const { error } = await supabase
      .from("participants")
      .delete()
      .eq("id", participant.id);

    if (error) {
      setError(error.message);
      return;
    }

    setPeople((current) =>
      current.filter(
        (person) =>
          person.id !== participant.id,
      ),
    );
  }

  async function goToClaims() {
    if (people.length === 0) return;

    router.push(
      `/split/${splitId}/claim`,
    );
    router.refresh();
  }

  return (
    <AppShell>
      <nav
        className="mb-4 animate-fade-up"
        aria-label="Back"
      >
        {`/split/${splitId}/review`}
      </nav>

      <PageHeader
        align="center"
        stepLabel="Step 2 of 3"
        title="Who’s at the table?"
        description="Add everyone splitting the bill."
      />

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-2xl bg-warning px-4 py-3 text-sm text-warning-text"
        >
          {error}
        </p>
      ) : null}

      
      
      <form
        onSubmit={handleAdd}
        className="mb-6 flex gap-2 animate-fade-up-delay"
      >
        <Input
          ref={inputRef}
          name="participant"
          placeholder="Add a name..."
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          className="flex-1"
          aria-label="Participant name"
          disabled={loading}
        />

        <Button
          type="submit"
          size="icon"
          aria-label="Add person"
          disabled={
            !name.trim() || loading
          }
        >
          <PlusIcon />
        </Button>
      </form>

      <section
        aria-label="People at the table"
        className="mb-8"
      >
        {people.length > 0 ? (
          <>
            <h2 className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
              At the table (
              {people.length})
            </h2>

            <ul className="flex flex-col gap-2">
              {people.map((person) => (
                <li key={person.id}>
                  <article className="flex items-center gap-3 rounded-2xl bg-surface px-5 py-3.5 shadow-sm ring-1 ring-border/70">
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          person.color ??
                          "var(--accent)",
                      }}
                    />

                    <p className="min-w-0 flex-1 truncate text-base font-medium text-foreground">
                      {person.name}
                    </p>

                    <button
                      type="button"
                      aria-label={`Remove ${person.name}`}
                      onClick={() =>
                        removePerson(person)
                      }
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-background hover:text-foreground"
                    >
                      <TrashIcon />
                    </button>
                  </article>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {people.length > 0 && (
      <div className="mb-3 flex justify-center animate-fade-up-delay">
          <ShareLinkButton splitId={splitId} label="Share link with group" />
      </div>
      )}

      <footer className="mt-auto">
        <Button
          type="button"
          fullWidth
          size="lg"
          disabled={people.length === 0}
          onClick={goToClaims}
        >
          Next
        </Button>
      </footer>
    </AppShell>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
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