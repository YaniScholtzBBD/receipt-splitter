import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Show a clear error if environment variables are missing
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables.",
    );
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseKey,
  );
}