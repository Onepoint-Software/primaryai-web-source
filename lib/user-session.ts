import { getAuthSession } from "@/lib/auth";

export async function getCurrentUserSession() {
  try {
    const { auth } = await import("@/src/auth");
    const nextAuthSession = await auth();
    const nextAuthUser = nextAuthSession?.user as { id?: string; email?: string } | undefined;

    if (nextAuthUser?.id) {
      return {
        userId: nextAuthUser.id,
        email: nextAuthUser.email ?? "",
        role: "authenticated",
      };
    }
  } catch {
    // NextAuth may not be configured in all environments; fall back to existing auth flow.
  }

  return getAuthSession();
}
