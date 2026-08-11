import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    // Exchange the Google code for a session
    const { error } =
      await supabase.auth.exchangeCodeForSession(
        code,
      );

    if (error) {
      const errorUrl =
        new URL("/signin", requestUrl.origin);

      errorUrl.searchParams.set(
        "error",
        "Google sign-in failed.",
      );

      return NextResponse.redirect(errorUrl);
    }
  }

  // Send the authenticated user home
  return NextResponse.redirect(
    new URL("/", requestUrl.origin),
  );
}