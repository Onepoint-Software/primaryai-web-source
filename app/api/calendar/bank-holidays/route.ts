import { NextResponse } from "next/server";

type GovBankHolidayResponse = {
  ["england-and-wales"]?: {
    events?: Array<{ title?: string; date?: string; notes?: string }>;
  };
  ["united-kingdom"]?: {
    events?: Array<{ title?: string; date?: string; notes?: string }>;
  };
};

function normaliseIso(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : "";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = normaliseIso(searchParams.get("from") || "");
  const to = normaliseIso(searchParams.get("to") || "");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required in YYYY-MM-DD format" }, { status: 400 });
  }

  try {
    const response = await fetch("https://www.gov.uk/bank-holidays.json", {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!response.ok) {
      return NextResponse.json({ ok: true, events: [] });
    }

    const data = await response.json().catch(() => null) as GovBankHolidayResponse | null;
    const events = data?.["england-and-wales"]?.events ?? data?.["united-kingdom"]?.events ?? [];

    return NextResponse.json(
      {
        ok: true,
        events: events
          .filter((event) => {
            const iso = normaliseIso(event?.date || "");
            return Boolean(iso) && iso >= from && iso <= to;
          })
          .map((event) => ({
            id: `bank-holiday-${event?.date}-${String(event?.title || "bank-holiday").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
            lesson_pack_id: null,
            title: String(event?.title || "Bank Holiday"),
            subject: "Bank Holiday",
            year_group: "All Years",
            scheduled_date: String(event?.date || ""),
            start_time: "00:00:00",
            end_time: "23:59:00",
            notes: event?.notes ? String(event.notes) : null,
            event_type: "custom",
            event_category: "bank_holiday",
            all_day: true,
          })),
      },
      { headers: { "Cache-Control": "no-store, private" } },
    );
  } catch {
    return NextResponse.json({ ok: true, events: [] });
  }
}
