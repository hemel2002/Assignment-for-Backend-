import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async rewrites() {
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`
      }
    ];
  }
};

export default nextConfig;
