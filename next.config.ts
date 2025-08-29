import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
  // パフォーマンス最適化
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000, // 1年
  },
  // フォントプリロードの最適化
  optimizeFonts: true,
  // Core Web Vitals改善
  swcMinify: true,
};

export default withBundleAnalyzer(nextConfig);
