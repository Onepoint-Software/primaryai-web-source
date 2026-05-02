export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { isGoogleCalendarConfigured } from "@/lib/google-calendar";
import { isOutlookConfigured } from "@/lib/outlook-calendar";
import { getGoogleSyncStatus, syncGoogleCalendar } from "@/lib/google-sync";
import { getOutlookSyncStatus, syncOutlookCalendar } from "@/lib/outlook-sync";

export async function POST() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const results = {
    outlook: { attempted: false, refreshed: false, error: "" },
    google: { attempted: false, refreshed: false, error: "" },
  };

  if (isOutlookConfigured()) {
    try {
      const status = await getOutlookSyncStatus(session.userId);
      if (status.connected) {
        results.outlook.attempted = true;
        await syncOutlookCalendar(session.userId);
        results.outlook.refreshed = true;
      }
    } catch (error) {
      results.outlook.error = String((error as Error)?.message || "Could not refresh Outlook");
    }
  }

  if (isGoogleCalendarConfigured()) {
    try {
      const status = await getGoogleSyncStatus(session.userId);
      if (status.connected) {
        results.google.attempted = true;
        await syncGoogleCalendar(session.userId);
        results.google.refreshed = true;
      }
    } catch (error) {
      results.google.error = String((error as Error)?.message || "Could not refresh Google Calendar");
    }
  }

  return NextResponse.json({
    ok: true,
    ...results,
  });
}
