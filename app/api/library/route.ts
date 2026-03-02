import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { prisma } from "@/src/db/prisma";
import { LessonPackSchema } from "@/src/engine/schema";

export async function GET() {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const packs = await prisma.lessonPack.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ ok: true, items: packs });
  } catch {
    return NextResponse.json({ error: "Library store unavailable" }, { status: 503 });
  }
}

export async function POST(req: Request) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = LessonPackSchema.safeParse(body?.pack ?? body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid lesson pack payload" }, { status: 400 });
  }

  const pack = parsed.data;

  try {
    const saved = await prisma.lessonPack.create({
      data: {
        userId: session.userId,
        title: typeof body?.title === "string" && body.title.trim() ? body.title.trim() : `${pack.subject} - ${pack.topic}`,
        yearGroup: pack.year_group,
        subject: pack.subject,
        topic: pack.topic,
        json: JSON.stringify(pack),
      },
    });

    return NextResponse.json({ ok: true, item: saved });
  } catch {
    return NextResponse.json({ error: "Library store unavailable" }, { status: 503 });
  }
}
