import { createServerClient } from "@supabase/ssr";
import {
  type NextRequest,
  NextResponse,
} from "next/server";

export async function updateSession(
  request: NextRequest,
) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables.",
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          // Update cookies on the request
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            },
          );

          response = NextResponse.next({
            request,
          });

          // Send updated cookies to the browser
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options,
              );
            },
          );
        },
      },
    },
  );

  // Validate the logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  const isProtectedPage =
    path === "/" || path.startsWith("/split");

  const isSignInPage =
    path === "/signin";

  // Logged-out user opening a protected page
  if (!user && isProtectedPage) {
    const redirectUrl =
      request.nextUrl.clone();

    redirectUrl.pathname = "/signin";

    return NextResponse.redirect(
      redirectUrl,
    );
  }

  // Logged-in user opening the sign-in page
  if (user && isSignInPage) {
    const redirectUrl =
      request.nextUrl.clone();

    redirectUrl.pathname = "/";

    return NextResponse.redirect(
      redirectUrl,
    );
  }

  return response;
}