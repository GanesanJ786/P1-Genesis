import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";

/**
 * OpenNext Cloudflare adapter config.
 *
 * `r2IncrementalCache` persists the ISR / on-demand `revalidatePath` cache in an
 * R2 bucket (bound as NEXT_INC_CACHE_R2_BUCKET in wrangler.jsonc) so cached pages
 * survive across the distributed Workers — without it, `revalidate` and
 * `revalidatePath` (used heavily in lib/actions/admin.ts and the live webhook)
 * would not work correctly.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
});
