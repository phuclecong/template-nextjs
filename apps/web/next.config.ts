import type { NextConfig } from "next"

const apiUrl = process.env.API_URL

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/api", "@workspace/shared-lib"],
  // The dashboard index has no content of its own — land on Tasks. Done here
  // (not in a page component) so it is a real HTTP redirect before render,
  // rather than a client-side meta-tag redirect that races with reloads.
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/tasks",
        permanent: false,
      },
    ]
  },
  // When a real backend is configured, proxy the browser's `/api/*` requests
  // to it server-side (no CORS). In mock mode (`API_URL` unset) this returns
  // nothing and the in-browser MSW worker serves `/api/*` instead.
  async rewrites() {
    if (!apiUrl) return []
    return [{ source: "/api/:path*", destination: `${apiUrl}/:path*` }]
  },
}

export default nextConfig
