import type { NextConfig } from "next";

// Static export so the site can be hosted on GitHub Pages.
// NEXT_PUBLIC_BASE_PATH is "/ohsococo" on GitHub Pages (project site) and
// empty on a custom domain or Vercel.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
