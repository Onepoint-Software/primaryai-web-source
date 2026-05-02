export const runtime = 'edge';
import { NextResponse } from "next/server";
import { disconnectGoogleCalendar } from "@/lib/google-sync";
import { getCurrentUserSession } from "@/lib/user-session";

export async function POST() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await disconnectGoogleCalendar(session.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: String((error as Error)?.message || "Could not disconnect Google Calendar") },
      { status: 503 },
    );
  }
}
