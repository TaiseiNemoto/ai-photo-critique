import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Photo-Critique - AI写真講評サービス",
  description: "あなたの写真を数秒でAI講評。技術・構図・色彩の3つの観点からプロレベルのフィードバックを瞬時に取得。",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
        <Toaster
          position="bottom-right"
          expand={false}
          richColors
          toastOptions={{
            style: {
              background: 'white',
              border: '1px solid #e5e7eb',
              color: '#374151',
              borderRadius: '8px',
              fontSize: '14px',
            },
            className: 'shadow-lg',
          }}
        />
      </body>
    </html>
  )
}
