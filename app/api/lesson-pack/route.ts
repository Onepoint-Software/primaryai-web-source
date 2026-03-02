import { NextResponse } from "next/server";
import { generateLessonPackWithMeta } from "@/src/engine/orchestrate";
import { LessonPackRequestSchema, LessonPackSchema } from "@/src/engine/schema";
import { getCurrentUserSession } from "@/lib/user-session";
import { getOrCreateTeacherProfile, toEngineProfile } from "@/lib/memory";
import { prisma } from "@/src/db/prisma";

export async function POST(req: Request) {
  const start = Date.now();
  const body = await req.json();

  const session = await getCurrentUserSession();
  const userId = session?.userId ?? null;
  const profile = userId ? await getOrCreateTeacherProfile(userId) : null;

  const mergedBody = {
    ...body,
    year_group: String(body?.year_group || profile?.defaultYearGroup || ""),
    subject: String(body?.subject || profile?.defaultSubject || ""),
    profile: profile ? toEngineProfile(profile) : undefined,
  };

  const parsedRequest = LessonPackRequestSchema.safeParse(mergedBody);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        details: parsedRequest.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const generated = await generateLessonPackWithMeta(parsedRequest.data);
    const pack = generated.pack;

    const latencyMs = Date.now() - start;

    try {
      await prisma.generationLog.create({
        data: {
          userId,
          provider: generated.providerId,
          latencyMs,
          cacheHit: generated.cacheHit,
          success: true,
        },
      });
    } catch {
      // Logging should not block generation.
    }

    if (userId && profile?.autoSave) {
      try {
        await prisma.lessonPack.create({
          data: {
            userId,
            title: `${pack.subject} - ${pack.topic}`,
            yearGroup: pack.year_group,
            subject: pack.subject,
            topic: pack.topic,
            json: JSON.stringify(pack),
          },
        });
      } catch {
        // Auto-save should not block generation response.
      }
    }

    return NextResponse.json({ ...pack, _meta: { autoSaved: Boolean(userId && profile?.autoSave) } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    try {
      await prisma.generationLog.create({
        data: {
          userId,
          provider: "none",
          latencyMs: Date.now() - start,
          cacheHit: false,
          success: false,
          reason: message,
        },
      });
    } catch {
      // Best-effort only.
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const body = await req.json();
  const parsed = LessonPackSchema.safeParse(body?.pack ?? body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lesson pack payload" }, { status: 400 });
  }

  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const pack = parsed.data;

  const saved = await prisma.lessonPack.create({
    data: {
      userId: session.userId,
      title: `${pack.subject} - ${pack.topic}`,
      yearGroup: pack.year_group,
      subject: pack.subject,
      topic: pack.topic,
      json: JSON.stringify(pack),
    },
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
