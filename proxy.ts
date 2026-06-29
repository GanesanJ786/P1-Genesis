import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Renamed from `middleware.ts` (deprecated in Next 16). Proxy runs in the
 * Node.js runtime by default, which has a reliable `fetch` — this fixes the
 * intermittent "fetch failed" + multi-second hangs the Supabase `getUser()`
 * call hit inside the old Edge-runtime middleware sandbox.
 */
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on admin routes only; keep the public marketing site proxy-free.
  matcher: ["/admin/:path*"],
};
