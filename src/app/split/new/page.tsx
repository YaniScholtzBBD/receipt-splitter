"use client";

import {
  useState,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { BackLink } from "@/components/BackLink";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";

type ParseResponse = {
  success?: boolean;
  splitId?: string;
  error?: string;
};

export default function NewSplitPage() {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a receipt image.",
      );

      event.target.value = "";
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const image = await fileToBase64(file);

      const response = await fetch(
        "/api/parse-receipt",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            image,
            mediaType:
              file.type || "image/jpeg",
          }),
        },
      );

      const result =
        (await response.json()) as ParseResponse;

      if (!response.ok || !result.splitId) {
        throw new Error(
          result.error ??
            "The receipt could not be processed.",
        );
      }

      router.push(
        `/split/${result.splitId}/review`,
      );
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The receipt could not be processed.",
      );
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <AppShell>
      <nav
        className="mb-4 animate-fade-up"
        aria-label="Back"
      >
        /
      </nav>

      <PageHeader
        align="center"
        stepLabel="Step 1 of 3"
        title="Snap the receipt"
        description="Take a clear photo showing all items and totals."
      />

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-2xl bg-warning px-4 py-3 text-sm text-warning-text"
        >
          {error}
        </p>
      ) : null}

      <section
        aria-label="Capture receipt"
        className="flex flex-1 flex-col gap-3 animate-fade-up-delay"
      >
        <label
          className={[
            "flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center transition-colors",
            loading
              ? "cursor-wait opacity-70"
              : "cursor-pointer hover:border-accent",
          ].join(" ")}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            {loading ? (
              <Spinner />
            ) : (
              <CameraIcon />
            )}
          </span>

          <span className="font-medium text-foreground">
            {loading
              ? "Reading receipt..."
              : "Take a photo"}
          </span>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={loading}
            onChange={handleFile}
          />
        </label>

        <label
          className={[
            "inline-flex h-12 w-full items-center justify-center rounded-2xl border border-border bg-surface px-5 text-base font-medium text-foreground transition-colors",
            loading
              ? "cursor-wait opacity-60"
              : "cursor-pointer hover:bg-background",
          ].join(" ")}
        >
          {loading
            ? "Please wait..."
            : "Choose from gallery"}

          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={loading}
            onChange={handleFile}
          />
        </label>

        <footer className="mt-auto pt-8">
          <Button
            fullWidth
            size="lg"
            disabled
          >
            {loading
              ? "Processing receipt..."
              : "Select a receipt to continue"}
          </Button>
        </footer>
      </section>
    </AppShell>
  );
}

function fileToBase64(
  file: File,
): Promise<string> {
  return new Promise(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (
          typeof reader.result !== "string"
        ) {
          reject(
            new Error(
              "The selected image could not be read.",
            ),
          );

          return;
        }

        const commaIndex =
          reader.result.indexOf(",");

        if (commaIndex === -1) {
          reject(
            new Error(
              "The selected image is invalid.",
            ),
          );

          return;
        }

        resolve(
          reader.result.slice(
            commaIndex + 1,
          ),
        );
      };

      reader.onerror = () => {
        reject(
          new Error(
            "The selected image could not be read.",
          ),
        );
      };

      reader.readAsDataURL(file);
    },
  );
}

function CameraIcon() {
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-6 w-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin"
    />
  );
}