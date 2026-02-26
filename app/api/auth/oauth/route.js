import { NextResponse } from "next/server";
import { getSupabaseAnonClient } from "@/lib/supabase";

const SUPPORTED_PROVIDERS = ["google", "apple", "facebook"];

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const provider = searchParams.get("provider");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    return NextResponse.redirect(new URL("/login?error=Invalid+provider", appUrl));
  }

  const supabase = getSupabaseAnonClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/login?error=Auth+not+configured", appUrl));
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${appUrl}/api/auth/callback`,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error?.message || "OAuth failed")}`, appUrl),
    );
  }

  return NextResponse.redirect(data.url);
}
