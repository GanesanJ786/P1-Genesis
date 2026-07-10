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
const config = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: doShardedTagCache(),
  queue: doQueue,
});

/**
 * Deploy-time skew protection.
 *
 * After a deploy, Cloudflare Workers Static Assets only serves the *current*
 * build's content-hashed files. A stale HTML document (held by a browser /
 * back-forward cache or an intermediary, kept alive by the ISR
 * stale-while-revalidate window) still points at the previous build's
 * `_next/static/*.css`, which now 404s — so the page renders as raw, unstyled
 * HTML. With skew protection, OpenNext routes those old-asset requests to the
 * prior Worker version via its preview URL, so they keep resolving for
 * `maxVersionAgeDays` after each deploy.
 *
 * It requires CF_ACCOUNT_ID, CF_WORKER_NAME, CF_PREVIEW_DOMAIN and
 * CF_WORKERS_SCRIPTS_API_TOKEN at deploy time, plus preview URLs enabled on the
 * Worker (see DEPLOY_CLOUDFLARE.md). Enabling it *without* those makes
 * `opennextjs-cloudflare deploy` exit(1), so we only switch it on once all four
 * are present — the current auto-deploy keeps working until they're provisioned.
 */
const skewReady = [
  "CF_ACCOUNT_ID",
  "CF_WORKER_NAME",
  "CF_PREVIEW_DOMAIN",
  "CF_WORKERS_SCRIPTS_API_TOKEN",
].every((key) => process.env[key]);

config.cloudflare = {
  ...config.cloudflare,
  skewProtection: {
    enabled: skewReady,
    maxNumberOfVersions: 20,
    maxVersionAgeDays: 7,
  },
};

export default config;
