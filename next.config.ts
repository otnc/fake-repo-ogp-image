import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/og": ["./src/lib/fonts/*.ttf"],
  },
};

export default nextConfig;
