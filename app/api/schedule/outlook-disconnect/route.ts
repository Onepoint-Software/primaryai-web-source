import { NextResponse } from "next/server";
import { disconnectOutlookCalendar } from "@/lib/outlook-sync";
import { getCurrentUserSession } from "@/lib/user-session";

export async function POST() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    await disconnectOutlookCalendar(session.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: String((error as Error)?.message || "Could not disconnect Outlook") },
      { status: 503 },
    );
  }
}
