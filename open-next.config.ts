import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * OpenNext Cloudflare adapter config.
 *
 * `r2IncrementalCache` persists the ISR / on-demand `revalidatePath` cache in an
 * R2 bucket (bound as NEXT_INC_CACHE_R2_BUCKET in wrangler.jsonc) so cached pages
 * survive across the distributed Workers.
 *
 * On their own, `defineCloudflareConfig` defaults `tagCache`/`queue` to no-op
 * "dummy" implementations, so `revalidatePath`/`revalidateTag` (used heavily in
 * lib/actions/admin.ts and the live webhook) silently did nothing — admin edits
 * never invalidated already-cached pages. `doShardedTagCache`/`doQueue` back
 * those with Durable Objects (bound in wrangler.jsonc) so revalidation actually
 * takes effect.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: doShardedTagCache(),
  queue: doQueue,
});
