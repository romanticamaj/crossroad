import type { NextConfig } from "next";

// CRO-4 introduces the first server-side features — auth, a database, and
// Stripe webhooks — so the app can no longer be a fully static export. We now
// build for a Node server runtime (the default). The GitHub Pages static-export
// deploy from M0.1 is therefore retired; see ARCHITECTURE.md ("Deployment") for
// the hosting migration.
const nextConfig: NextConfig = {
  // next/image optimization is fine on a server runtime, but we keep it
  // unoptimized to avoid an image-optimization service dependency for now.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
