import type { NextConfig } from "next";

// In CI/production we deploy to GitHub Pages as a *project* site, served from
// https://<user>.github.io/<repo>. That requires a basePath equal to the repo
// name. Locally (next dev) we want no basePath so http://localhost:3000 works.
// The deploy workflow sets NEXT_PUBLIC_BASE_PATH; everywhere else it is empty.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Emit a fully static site into ./out so it can be served by any static host
  // (GitHub Pages today; trivially swappable for a server platform later).
  output: "export",
  basePath: basePath || undefined,
  // Pages has no trailing-slash rewriting, so generate index.html per route.
  trailingSlash: true,
  images: {
    // next/image optimization needs a server; static export uses raw <img>.
    unoptimized: true,
  },
};

export default nextConfig;
