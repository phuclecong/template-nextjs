import type { NextConfig } from "next"

const apiUrl = process.env.API_URL

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/api"],
  // When a real backend is configured, proxy the browser's `/api/*` requests
  // to it server-side (no CORS). In mock mode (`API_URL` unset) this returns
  // nothing and the in-browser MSW worker serves `/api/*` instead.
  async rewrites() {
    if (!apiUrl) return []
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }]
  },
}

export default nextConfig
