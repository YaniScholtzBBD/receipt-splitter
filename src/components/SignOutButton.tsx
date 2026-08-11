"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";

export function SignOutButton() {
  const [loading, setLoading] =
    useState(false);

  async function handleSignOut() {
    setLoading(true);

    const supabase = createClient();

    const { error } =
      await supabase.auth.signOut({
        scope: "local",
      });

    if (error) {
      console.error(
        "Sign-out failed:",
        error.message,
      );

      setLoading(false);
      return;
    }

    window.location.replace("/signin");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={loading}
    >
      {loading ? "Signing out..." : "Sign out"}
    </Button>
  );
}