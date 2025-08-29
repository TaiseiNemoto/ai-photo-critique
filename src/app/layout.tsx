import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CritiqueProvider } from "@/contexts/CritiqueContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Photo-Critique - AI写真講評サービス",
  description:
    "あなたの写真を数秒でAI講評。技術・構図・色彩の3つの観点からプロレベルのフィードバックを瞬時に取得。",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Photo-Critique",
  },
};

export function generateViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    themeColor: "#f9fafb",
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Core Web Vitals最適化 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="//fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className={`${inter.className} tap-highlight-none`}>
        <CritiqueProvider>{children}</CritiqueProvider>
        <Toaster
          position="bottom-center"
          expand={false}
          richColors
          toastOptions={{
            style: {
              background: "white",
              border: "1px solid #e5e7eb",
              color: "#374151",
              borderRadius: "12px",
              fontSize: "14px",
              minHeight: "48px",
              padding: "12px 16px",
              width: "calc(100vw - 2rem)",
              maxWidth: "420px",
              margin: "0 1rem",
            },
            className: "shadow-lg touch-manipulation",
          }}
        />
      </body>
    </html>
  );
}
