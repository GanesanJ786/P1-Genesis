import { NextResponse } from "next/server";
import { getLiveEventBySlug, getLiveItems, getAnnouncements } from "@/lib/queries";

/**
 * Polling fallback for the live event board: one cached payload covering both
 * schedule items and announcements. MUST stay statically cached — reading the
 * request (URL, headers, searchParams) would make it dynamic and turn every
 * 10s poll from every phone in the stadium into a direct Supabase hit.
 */
export const dynamic = "force-static";
export const revalidate = 10;

const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const event = await getLiveEventBySlug(slug);
  if (!event) {
    return NextResponse.json(
      { items: [], announcements: [] },
      { headers: CACHE_HEADERS },
    );
  }

  const [items, announcements] = await Promise.all([
    getLiveItems(event.id),
    getAnnouncements(event.id),
  ]);

  return NextResponse.json({ items, announcements }, { headers: CACHE_HEADERS });
}
