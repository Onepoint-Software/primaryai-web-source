import { getAuthSession } from "@/lib/auth";
import { getSupabaseAdminClient } from "@/lib/supabase";

async function resolveSupabaseAuthUserIdByEmail(email?: string) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      return null;
    }

    const users = data?.users || [];
    const match = users.find((user) => String(user.email || "").trim().toLowerCase() === normalizedEmail);
    if (match?.id) {
      return match.id;
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return null;
}

export async function getCurrentUserSession() {
  // Prefer existing app session first so APIs stay aligned with login flow.
  const appSession = await getAuthSession();
  if (appSession?.userId) {
    return appSession;
  }

  try {
    const { auth } = await import("@/src/auth");
    const nextAuthSession = await auth();
    const nextAuthUser = nextAuthSession?.user as { id?: string; email?: string } | undefined;

    if (nextAuthUser?.id) {
      const supabaseAuthUserId = await resolveSupabaseAuthUserIdByEmail(nextAuthUser.email);
      if (!supabaseAuthUserId) {
        return null;
      }

      return {
        userId: supabaseAuthUserId,
        email: nextAuthUser.email ?? "",
        role: "authenticated",
      };
    }
  } catch {
    // NextAuth may not be configured in all environments; fall back to existing auth flow.
  }

  return null;
}
