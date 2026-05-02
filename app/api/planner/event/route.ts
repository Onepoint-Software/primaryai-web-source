export const runtime = 'edge';
import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { trackEvent, type PlannerEventType, type PlannerEventPayload } from "@/lib/planner-telemetry";

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  const userId = session?.userId ?? null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  let body: { eventType: PlannerEventType; payload?: PlannerEventPayload; planId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { eventType, payload = {}, planId } = body;
  if (!eventType) {
    return NextResponse.json({ error: "eventType required" }, { status: 400 });
  }

  trackEvent(userId, eventType, payload, planId);
  return NextResponse.json({ ok: true });
}
