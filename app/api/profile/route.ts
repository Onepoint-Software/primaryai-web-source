import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { getOrCreateTeacherProfile, updateTeacherProfile } from "@/lib/memory";

export async function GET() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const profile = await getOrCreateTeacherProfile(session.userId);
    return NextResponse.json({ ok: true, profile });
  } catch {
    return NextResponse.json({ error: "Profile store unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const profile = await updateTeacherProfile(session.userId, {
      defaultYearGroup: typeof body?.defaultYearGroup === "string" ? body.defaultYearGroup : undefined,
      defaultSubject: typeof body?.defaultSubject === "string" ? body.defaultSubject : undefined,
      tone: typeof body?.tone === "string" ? body.tone : undefined,
      schoolType: typeof body?.schoolType === "string" ? body.schoolType : undefined,
      sendFocus: typeof body?.sendFocus === "boolean" ? body.sendFocus : undefined,
      autoSave: typeof body?.autoSave === "boolean" ? body.autoSave : undefined,
      formatPrefs: typeof body?.formatPrefs === "string" ? body.formatPrefs : undefined,
      classNotes: typeof body?.classNotes === "string" ? body.classNotes : (body?.classNotes === null ? null : undefined),
      teachingApproach: typeof body?.teachingApproach === "string" ? body.teachingApproach : undefined,
      abilityMix: typeof body?.abilityMix === "string" ? body.abilityMix : undefined,
    });

    return NextResponse.json({ ok: true, profile });
  } catch {
    return NextResponse.json({ error: "Profile store unavailable" }, { status: 503 });
  }
}
