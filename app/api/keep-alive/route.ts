import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Minimal endpoint whose only job is to make a real Supabase query on
 * request — pinged daily by an external uptime monitor (cron-job.org) to
 * keep the free-tier project from auto-pausing after 7 days with no
 * database activity. Deliberately tiny (no caching, smallest possible query
 * and response) so a ping service's response-size limits never come into
 * play, unlike pinging a full rendered page.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { error } = await supabase.from("events").select("id").limit(1);
  return NextResponse.json({ ok: !error }, { status: error ? 500 : 200 });
}
