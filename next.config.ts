import type { NextConfig } from "next";

// Allow next/image to load from the Supabase Storage public bucket.
// SUPABASE_URL host is whitelisted dynamically; falls back to a wildcard pattern.
const supabaseHost = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  // Version tag for every build. Next appends `?dpl=<id>` to asset requests and
  // sends `x-deployment-id`, which the OpenNext skew-protection layer (see
  // open-next.config.ts) uses to route requests for an older build's hashed
  // CSS/JS to the deployment that still serves them — instead of 404-ing after a
  // new deploy rotates the filenames and leaving the page unstyled. Cloudflare
  // Workers Builds exposes the commit SHA; the timestamp fallback (captured once
  // by `next build` and serialised into .next) keeps local/manual builds unique.
  deploymentId: process.env.WORKERS_CI_COMMIT_SHA || `build-${Date.now()}`,
  images: {
    // Cloudflare Workers has no built-in Vercel image optimizer, and Cloudflare
    // Images is a paid product. Images are already served as compressed WebP from
    // Supabase Storage, so we skip re-optimization and stay on the free tier while
    // keeping next/image's layout/lazy-loading benefits. remotePatterns is retained
    // so the URLs still validate.
    unoptimized: true,
    remotePatterns: [
      ...(supabaseHost
        ? [
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : []),
      // Generic Supabase pattern so deploys work before the env var is parsed.
      {
        protocol: "https" as const,
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
