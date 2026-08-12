"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState, type SubmitEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ParticipantsPage() {
  const params = useParams<{ id: string }>();
  const splitId = params.id;
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [people, setPeople] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    if (editingIndex === null) return;
    editInputRef.current?.focus();
    editInputRef.current?.select();
  }, [editingIndex]);

  function handleAdd(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setPeople((prev) => [...prev, trimmed]);
    setName("");
    inputRef.current?.focus();
  }

  function removePerson(index: number) {
    setPeople((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditName("");
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  }

  function startEditing(index: number) {
    setEditingIndex(index);
    setEditName(people[index]);
  }

  function cancelEditing() {
    setEditingIndex(null);
    setEditName("");
  }

  function saveEditing(index: number) {
    const trimmed = editName.trim();
    if (!trimmed) {
      cancelEditing();
      return;
    }

    setPeople((prev) =>
      prev.map((person, i) => (i === index ? trimmed : person)),
    );
    cancelEditing();
  }

  return (
    <AppShell>
      <nav className="mb-4 animate-fade-up" aria-label="Back">
        <BackLink href={`/split/${splitId}/review`} label="Review receipt" />
      </nav>

      <PageHeader
        align="center"
        stepLabel="Step 2 of 3"
        title="Who’s at the table?"
        description="Add everyone splitting the bill."
      />

      <form
        onSubmit={handleAdd}
        className="mb-6 flex gap-2 animate-fade-up-delay"
      >
        <Input
          ref={inputRef}
          name="participant"
          placeholder="Add a name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1"
          aria-label="Participant name"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Add person"
          disabled={!name.trim()}
        >
          <PlusIcon />
        </Button>
      </form>

      <section aria-label="People at the table" className="mb-8">
        {people.length > 0 ? (
          <>
            <h2 className="mb-3 text-xs font-semibold tracking-[0.08em] text-muted uppercase">
              At the table ({people.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {people.map((person, index) => (
                <li key={`${person}-${index}`}>
                  <article className="flex items-center gap-3 rounded-2xl bg-surface px-5 py-3.5 shadow-sm ring-1 ring-border/70">
                    {editingIndex === index ? (
                      <Input
                        ref={editInputRef}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveEditing(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            saveEditing(index);
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            cancelEditing();
                          }
                        }}
                        aria-label={`Edit name for ${person}`}
                        className="min-w-0 flex-1"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditing(index)}
                        className="min-w-0 flex-1 text-left text-base font-medium text-foreground"
                      >
                        {person}
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove ${person}`}
                      onClick={() => removePerson(index)}
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

      <footer className="mt-auto">
        {people.length > 0 ? (
          <Link href={`/split/${splitId}/claim`} className="block">
            <Button fullWidth size="lg">
              Next
            </Button>
          </Link>
        ) : (
          <Button fullWidth size="lg" disabled>
            Next
          </Button>
        )}
      </footer>
    </AppShell>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden
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
