import { NextResponse } from "next/server";
import { getCurrentUserSession } from "@/lib/user-session";
import { prisma } from "@/src/db/prisma";

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUserSession();
  if (!session?.userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.lessonPack.deleteMany({
      where: {
        id,
        userId: session.userId,
      },
    });
  } catch {
    return NextResponse.json({ error: "Library store unavailable" }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
