"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type SubmitEvent } from "react";

import { AppShell } from "@/components/AppShell";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/utils/supabase/client";

type AuthResponse = {
  success?: boolean;
  hasSession?: boolean;
  message?: string;
  error?: string;
};

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const isSignUp = searchParams.get("mode") === "signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const endpoint = isSignUp
        ? "/api/auth/signup"
        : "/api/auth/login";

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
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="flex flex-1 flex-col justify-center py-10 animate-fade-up">
        <header className="mb-8 flex w-full flex-col items-center gap-4 text-center">
          <BrandMark href={null} layout="stacked" />
          <div>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {isSignUp
                ? "Sign up with email to start splitting bills."
                : "Sign in to continue to Split."}
            </p>
          </div>
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
            placeholder="Please enter email address"
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
            placeholder="Please enter password"
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
            disabled={loading}
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
            <>Already have an account?{" "}
              <Link href="/signin" className="font-medium text-accent underline-offset-2 hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>Don&apos;t have an account?{" "}
              <Link href="/signin?mode=signup" className="font-medium text-accent underline-offset-2 hover:underline">
                Sign up
              </Link>
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