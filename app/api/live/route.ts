import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 10;

export async function GET() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("live_results")
    .select("*")
    .order("day", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json([], { status: 500 });
  }

  return NextResponse.json(data ?? [], {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=20" },
  });
}
