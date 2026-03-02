import { NextResponse } from "next/server";
import { LessonPackSchema } from "@/src/engine/schema";
import { lessonPackToPdfHtml, lessonPackToSlides, lessonPackToWorksheet } from "@/src/engine/exporters";

const FormatSchemaValues = ["slides-json", "worksheet-json", "printable-html"] as const;
type ExportFormat = (typeof FormatSchemaValues)[number];

function isExportFormat(value: string): value is ExportFormat {
  return (FormatSchemaValues as readonly string[]).includes(value);
}

export async function POST(req: Request) {
  const body = await req.json();
  const format = String(body?.format || "");

  if (!isExportFormat(format)) {
    return NextResponse.json(
      {
        error: "Invalid export format",
        allowed: FormatSchemaValues,
      },
      { status: 400 }
    );
  }

  const parsed = LessonPackSchema.safeParse(body?.pack);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid lesson pack payload",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const pack = parsed.data;

  if (format === "slides-json") {
    return NextResponse.json({ ok: true, format, data: lessonPackToSlides(pack) });
  }

  if (format === "worksheet-json") {
    return NextResponse.json({ ok: true, format, data: lessonPackToWorksheet(pack) });
  }

  return NextResponse.json({ ok: true, format, data: lessonPackToPdfHtml(pack) });
}
