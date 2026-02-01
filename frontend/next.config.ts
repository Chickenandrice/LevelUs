import type { NextConfig } from "next";
const env = process.env.NODE_ENV || "development";
const nextConfig: NextConfig = {
  output: "standalone",
  rewrites: () => {
    return [
      {
        source: "/api/:path*",
        destination: env === "development" ? "http://localhost:8000/:path*" : "http://levelus-backend:8000/:path*"
      }
    ];
  }
};

export default nextConfig;
