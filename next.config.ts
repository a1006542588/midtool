import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone", // 开启独立部署模式
  /* config options here */
  // For Next.js 14/15/16 dev server allowed origins
  // Note: Server Actions allowedOrigins does not support wildcards. You must add the exact domain.
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "*.cpolar.top", "*.cpolar.cn", "*.cpolar.io"]
    }
  }
};

export default nextConfig;
