/** @type {import('next').NextConfig} */

const backendOrigin = (
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000"
).replace(/\/+$/, "")

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  turbopack: {
    root: process.cwd(),
  },

  // Proxy API to backend — same-origin fetch avoids CORS and extension interference
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${backendOrigin}/api/:path*` },
      { source: "/health", destination: `${backendOrigin}/health` },
    ]
  },
}

export default nextConfig