# Deploying to Cloudflare (Workers) + gsfteams.com

This app runs on **Cloudflare Workers** via the [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)
adapter — chosen over Cloudflare Pages / `next-on-pages` because the app needs the
Node.js runtime (Server Actions, ISR + on-demand revalidation, API route handlers,
`next/image`, dynamic OG images).

The code side is already wired up:
- `wrangler.jsonc` — Worker config (name `genesis-trackfest`, `nodejs_compat`, R2 cache binding).
- `open-next.config.ts` — OpenNext config with R2 incremental cache.
- `next.config.ts` — `images.unoptimized` (free-tier image handling).
- `package.json` scripts — `cf:build`, `cf:preview`, `cf:deploy`.
- `.dev.vars` (gitignored) — secrets for **local** preview only.

Local sanity check anytime: `npm run cf:preview` → open http://localhost:8788.

---

## One-time setup (owner actions in dashboards)

### 1. Cloudflare account + add the domain
1. Create a free account at https://dash.cloudflare.com.
2. **Add a site** → enter `gsfteams.com` → choose the **Free** plan.
3. Cloudflare shows **2 nameservers** (e.g. `xxx.ns.cloudflare.com`). Copy them.

### 2. Point the domain from Hostinger → Cloudflare
1. Hostinger → **Domains → gsfteams.com → DNS / Nameservers**.
2. Switch to **custom nameservers** and paste Cloudflare's two nameservers.
3. Save. Propagation is usually minutes to a few hours. Cloudflare emails you when
   the domain is **Active**. *(Safe: nothing is live on this domain yet — no downtime.)*

### 3. Create the R2 bucket (ISR cache)
1. Cloudflare dashboard → **R2** → **Create bucket**.
2. Name it exactly **`genesis-trackfest-cache`** (must match `wrangler.jsonc`).
3. Enabling R2 may ask for a payment method, but usage here is tiny (cache is a few
   KB) and stays well inside the **free tier**.

### 4. Connect the GitHub repo (auto-deploy on push)
1. Cloudflare dashboard → **Workers & Pages → Create → Workers → Import a repository**.
2. Authorize GitHub and pick **`GanesanJ786/P1-Genesis`**, branch **`main`**.
3. Set build settings:
   - **Build command:** `npx opennextjs-cloudflare build`
   - **Deploy command:** `npx opennextjs-cloudflare deploy`
   - **Build variables:** add `NODE_VERSION` = `22`
4. Every push to `main` now builds and deploys automatically.

### 5. Set environment variables & secrets on the Worker
Worker → **Settings → Variables**. Use the values from your local `.env.local`.

| Name | Type | Notes |
|------|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Plaintext var | Safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Plaintext var | Safe to expose |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret (encrypted)** | Bypasses RLS — never plaintext |
| `LIVE_WEBHOOK_SECRET` | **Secret (encrypted)** | Guards `/api/live/webhook`. Pick a strong value and use the same one in the Google Sheet script. *(Not in `.env.local` yet — create it.)* |
| `RESEND_API_KEY` | **Secret (encrypted)** | Sends contact-form email notifications via Resend. Optional — form still saves to DB without it. Requires a Resend account + `gsfteams.com` verified as a sending domain. |

### 6. Verify on the `*.workers.dev` URL first
After the first deploy, open the temporary `genesis-trackfest.<subdomain>.workers.dev`
URL and run the checklist below. Only then attach the real domain.

### 7. Attach the custom domain
Worker → **Settings → Domains & Routes → Add** → `gsfteams.com`. Add `www.gsfteams.com`
too and redirect it to the apex. Cloudflare provisions TLS automatically.

---

## External integrations to update (easy to forget)

### 8. Supabase Auth (so admin login works on the new origin)
Supabase dashboard → **Authentication → URL Configuration**:
- **Site URL:** `https://gsfteams.com`
- **Redirect URLs:** add `https://gsfteams.com/**`
  (add the `*.workers.dev` URL too while testing; keep the old `gsfcbe.com` entry
  temporarily during cutover so in-flight sessions/magic links don't break).

### 9. Google Sheets live-results webhook
In the Apps Script that pushes results, repoint the POST target to:
`https://gsfteams.com/api/live/webhook`
and set its secret header to the same `LIVE_WEBHOOK_SECRET` value from step 5.

---

## Preventing unstyled pages after a deploy (asset skew)

**Symptom:** occasionally a page (e.g. `/live`) loads as raw, unstyled HTML — giant
logo, bulleted nav, serif text — then a hard refresh fixes it.

**Cause:** every build content-hashes `_next/static/*` (the CSS/JS filenames
change). Cloudflare Workers Static Assets only serves the **current** deploy's
files, so the previous build's `*.css` returns 404. Meanwhile ISR HTML is served
with a long `stale-while-revalidate` window, so a browser / back-forward /
intermediary cache can hand a visitor **older HTML that points at the now-deleted
stylesheet** → it 404s → the page renders unstyled. It's intermittent because it
only bites around each deploy.

**Two-layer fix (already wired in code):**
1. **Client backstop** — `app/layout.tsx` runs a tiny head script that reloads
   once (guarded per session) if the theme stylesheet didn't apply. Works with no
   setup; masks the skew.
2. **Skew protection** — `next.config.ts` tags each build with a `deploymentId`
   (so assets get `?dpl=<id>`), and `open-next.config.ts` enables OpenNext skew
   protection, which routes requests for an *older* build's assets to that build's
   Worker version (via its preview URL) so they keep resolving for 7 days. This is
   the real fix and needs the one-time setup below.

### Enabling skew protection (one-time owner setup)
Skew protection stays **off** until all four vars below exist at build time — so
the current auto-deploy keeps working until you provision them (no broken deploys).

1. Worker → **Settings → Domains & Routes** (or **Preview URLs**): ensure
   **Preview URLs are enabled** (they are by default; skew routing needs them).
2. Create a Cloudflare API token (**My Profile → API Tokens → Create Token**) with
   **Account → Workers Scripts → Read** permission for this account.
3. Cloudflare → your Worker → **Settings → Build → Variables and secrets**, add as
   **build-time** vars/secrets (the build reads `process.env`, not just runtime):

   | Name | Type | Value |
   |------|------|-------|
   | `CF_ACCOUNT_ID` | Build var | Your Cloudflare account ID |
   | `CF_WORKER_NAME` | Build var | `genesis-trackfest` |
   | `CF_PREVIEW_DOMAIN` | Build var | Worker's preview subdomain (the `<name>.<CF_PREVIEW_DOMAIN>.workers.dev` middle part) |
   | `CF_WORKERS_SCRIPTS_API_TOKEN` | **Secret** | The token from step 2 |

4. Push (or re-run the deploy). The build logs should show skew protection active,
   and page HTML asset URLs will carry `?dpl=<commit-sha>`. `WORKERS_CI_COMMIT_SHA`
   (auto-provided by Workers Builds) becomes the `deploymentId`.

> Bonus, unrelated: on the Free plan check **Speed → Optimization** and keep
> **Rocket Loader** and **Auto Minify** OFF — they can intermittently break a
> Next app's assets.

---

## Post-deploy verification checklist
- [ ] Public pages render; images load (`/`, `/foundation`, `/events`, `/blog`).
- [ ] Dynamic OG image loads: `https://gsfteams.com/opengraph-image`.
- [ ] `sitemap.xml` / `robots.txt` show `gsfteams.com` URLs.
- [ ] Admin: `/admin` redirects to `/admin/login`; login works; a CRUD save updates
      the corresponding public page (ISR revalidation via R2).
- [ ] Live page updates in real time (Supabase Realtime) with 10s polling fallback.
- [ ] `POST /api/live/webhook` with the secret writes to Supabase and refreshes `/live`.

---

## Migrating to a new domain (e.g. gsfcbe.com → gsfteams.com)
This site previously ran on `gsfcbe.com`; it was migrated to `gsfteams.com`. If the
domain ever changes again, repeat this sequence:
1. Update `SITE.url` in `lib/constants.ts` (feeds `metadataBase`, sitemap, robots,
   canonical URLs, and OG/JSON-LD across the app).
2. Update `MAIL_FROM` and the notification email body in `lib/actions/contact.ts` —
   but only after the new domain is verified as a sending domain in Resend, or
   outgoing contact-form emails will silently stop (the DB save still succeeds).
3. Add the new domain in Cloudflare and attach it to the Worker (step 7 above),
   keeping the old domain attached in parallel during the transition.
4. Update Supabase Auth's Site URL and Redirect URLs (step 8), keeping the old
   entry until the cutover is confirmed stable so no sessions get locked out.
5. Repoint the Google Sheets Apps Script webhook (step 9).
6. Re-submit the sitemap for the new domain in Google Search Console.
7. Update this doc's domain references and this section's history note.

## Notes / decisions
- **No Vercel dependency was removed** — there wasn't one (no `vercel.json`, no
  `@vercel/*` packages). This was a first deploy, not a migration off a live site.
- **Middleware was removed.** Next 16's Proxy (renamed middleware) is Node-runtime
  only and can't be forced to Edge, which the Cloudflare adapter requires. Auth is
  still fully enforced: every admin page calls `requireAdmin()` (redirects signed-out
  users, blocks non-staff), backed by Supabase RLS. Token refresh happens via Server
  Actions and the browser client's auto-refresh.
- **Images are unoptimized** (served straight from Supabase Storage as WebP) to avoid
  Cloudflare's paid image product and stay on the free tier.
