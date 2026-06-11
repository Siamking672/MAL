import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Helps local Next.js dev work better with the Cloudflare adapter.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  images: {
    // Keeps deployment simple/free on Cloudflare Workers by avoiding a Cloudflare Images binding.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "*.myanimelist.net" },
      { protocol: "https", hostname: "images-cdn.myanimelist.net" }
    ]
  }
};

export default nextConfig;
