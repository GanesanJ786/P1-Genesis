import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type ResultRow = {
  rank: number;
  name: string;
  school: string;
  result: string;
};

type LiveResultPayload = {
  event_key: string;
  event_name: string;
  category: string;
  gender?: string | null;
  event_type?: string | null;
  heat_label?: string | null;
  day?: number;
  sort_order?: number;
  status?: "upcoming" | "in_progress" | "completed";
  results?: ResultRow[];
  notes?: string | null;
};

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-webhook-secret");
  const expected = process.env.LIVE_WEBHOOK_SECRET;

  if (!expected || secret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { results?: LiveResultPayload[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rows = body.results;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No results provided" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("live_results").upsert(
    rows.map((r) => ({
      event_key: r.event_key,
      event_name: r.event_name,
      category: r.category,
      gender: r.gender ?? null,
      event_type: r.event_type ?? null,
      heat_label: r.heat_label ?? null,
      day: r.day ?? 1,
      sort_order: r.sort_order ?? 0,
      status: r.status ?? "upcoming",
      results: r.results ?? [],
      notes: r.notes ?? null,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "event_key" },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/live");
  return NextResponse.json({ ok: true });
}
