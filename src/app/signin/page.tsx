"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { AppShell } from "@/components/AppShell";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

type Mode = "signin" | "signup";

type AuthResponse = {
  success?: boolean;
  hasSession?: boolean;
  message?: string;
  error?: string;
};

export default function SignInPage() {
  const [mode, setMode] =
    useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [message, setMessage] =
    useState<string | null>(null);

  const isSignUp = mode === "signup";

  const canSubmit = useMemo(
    () =>
      email.trim().length > 0 &&
      password.length >= 6 &&
      !loading,
    [email, password, loading],
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const endpoint = isSignUp
        ? "/api/auth/signup"
        : "/api/auth/login";

      // Send credentials to our Next.js server
      const response = await fetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        // Allow the response to set cookies
        credentials: "same-origin",

        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result =
        (await response.json()) as AuthResponse;

      if (!response.ok) {
        setError(
          result.error ??
            "Authentication failed.",
        );

        return;
      }

      // Email confirmation may be required
      if (
        isSignUp &&
        result.hasSession === false
      ) {
        setMessage(
          result.message ??
            "Check your email to confirm your account.",
        );

        return;
      }

      // Cookie now exists, load the homepage
      window.location.replace("/");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              `${window.location.origin}/auth/callback`,
          },
        });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Google sign-in failed.",
      );

      setLoading(false);
    }
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setMessage(null);
    setPassword("");
  }

  return (
    <AppShell>
      <section className="flex flex-1 flex-col justify-center py-10 animate-fade-up">
        {/* Restore the original logo */}
        <header className="mb-8 flex w-full justify-center">
          {null}
        </header>

        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-2xl bg-warning px-4 py-3 text-sm text-warning-text"
          >
            {error}
          </p>
        ) : null}

        {message ? (
          <p
            role="status"
            className="mb-4 rounded-2xl bg-success px-4 py-3 text-sm text-success-text"
          >
            {message}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
        >
          <Input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            aria-label="Email address"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            disabled={loading}
            required
          />

          <Input
            name="password"
            type="password"
            autoComplete={
              isSignUp
                ? "new-password"
                : "current-password"
            }
            placeholder="••••••••"
            aria-label="Password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            minLength={6}
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
            {loading ? (
              <>
                <Spinner />
                Please wait...
              </>
            ) : isSignUp ? (
              "Create account"
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <Button
          type="button"
          variant="secondary"
          fullWidth
          size="lg"
          className="mt-3"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          Continue with Google
        </Button>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-medium text-accent hover:underline disabled:opacity-50"
                onClick={() =>
                  changeMode("signin")
                }
                disabled={loading}
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-medium text-accent hover:underline disabled:opacity-50"
                onClick={() =>
                  changeMode("signup")
                }
                disabled={loading}
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
      aria-hidden="true"
      className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white animate-spin"
    />
  );
}