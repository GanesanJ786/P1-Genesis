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
