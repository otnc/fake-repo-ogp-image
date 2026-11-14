import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["satori"],
  outputFileTracingIncludes: {
    "/api/og": ["./src/lib/fonts/*.ttf"],
  },
};

export default nextConfig;
