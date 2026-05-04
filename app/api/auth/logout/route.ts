import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(request: Request) {
  try {
    const { sessionId } = await auth();
    if (sessionId) {
      const clerk = await clerkClient();
      await clerk.sessions.revokeSession(sessionId);
    }
  } catch {
    // proceed to redirect even if revocation fails
  }
  return NextResponse.redirect(new URL("/", request.url));
}
