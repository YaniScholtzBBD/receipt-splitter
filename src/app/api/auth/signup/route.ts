import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, password } =
      await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          error: "Email and password are required.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = await createClient();

    const { data, error } =
      await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 400,
        },
      );
    }

    const hasSession = Boolean(data.session);

    return NextResponse.json({
      success: true,
      hasSession,
      message: hasSession
        ? "Account created."
        : "Account created. Check your email to confirm it.",
    });
  } catch (error) {
    console.error("Signup error:", error);

    return NextResponse.json(
      {
        error: "Unable to create account.",
      },
      {
        status: 500,
      },
    );
  }
}