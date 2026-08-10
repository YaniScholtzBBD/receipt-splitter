"use client";

import { useMemo, useState, type SubmitEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Mode = "signin" | "signup";

export default function SignInPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signup";
  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !loading,
    [email, password, loading],
  );

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    // Auth wiring lands with the infra teammate's Supabase client.
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    setError("Email or password is incorrect.");
  }

  return (
    <AppShell>
      <section className="flex flex-1 flex-col justify-center py-10 animate-fade-up">
        <header className="mb-8 flex w-full justify-center">
          <BrandMark
            href={null}
            layout="stacked"
            subtitle="Fair splits, no shortfalls."
          />
        </header>

        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-2xl bg-warning px-4 py-3 text-sm text-warning-text"
          >
            {error}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <Input
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          <Button
            type="submit"
            fullWidth
            size="lg"
            className="mt-2"
            disabled={!canSubmit}
          >
            {loading ? <Spinner /> : isSignUp ? "Sign up" : "Sign in"}
          </Button>
        </form>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          size="lg"
          className="mt-3"
          disabled={loading}
        >
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-accent"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                }}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-medium text-accent"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
              >
                Sign up
              </button>
            </>
          )}
        </p>
      </section>
    </AppShell>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin"
    />
  );
}
