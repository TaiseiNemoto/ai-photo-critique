import { NextRequest } from "next/server";
import { kvClient } from "@/lib/kv";
import { ErrorHandler } from "@/lib/error-handling";

export const runtime = "edge";

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

function createFontFamily(): string {
  return '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", "Yu Gothic", "Meiryo", Arial, sans-serif';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const detail = searchParams.get("detail") === "true";

    let title = "AI による写真講評サービス";
    let subtitle = "写真をアップロードしてAIによる講評を受けてみましょう";
    let filename = "";
    let critiqueData = null;

    // IDが有効な場合、講評データを取得してOGP画像をカスタマイズ
    if (id && id.trim() && id.length > 0) {
      try {
        critiqueData = await kvClient.getCritique(id);
        if (critiqueData) {
          title = `写真講評レポート - ${critiqueData.filename}`;
          subtitle = "技術・構図・色彩の3軸で分析した結果をご覧ください";
          filename = critiqueData.filename;
        } else {
          title = "写真講評レポート";
          subtitle = "AI による写真講評サービス";
        }
      } catch (error) {
        console.warn("講評データ取得エラー:", error);
        title = "写真講評レポート";
        subtitle = "AI による写真講評サービス";
      }
    }

    // SVGベースのOGP画像を生成
    let svg = "";

    if (detail && critiqueData) {
      // 詳細講評表示モード - 改善されたフォントとレイアウト
      const fontFamily = createFontFamily();

      svg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#gradient)" />
          
          <!-- メインタイトル -->
          <text x="600" y="60" text-anchor="middle" fill="white" font-family="${fontFamily}" font-size="36" font-weight="bold">AI Photo Critique</text>
          <text x="600" y="95" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="${fontFamily}" font-size="18">📸 ${escapeHtml(truncateText(critiqueData.filename, 40))}</text>
          
          <!-- 装飾的な区切り線 -->
          <rect x="400" y="110" width="400" height="2" fill="rgba(255,255,255,0.3)" />
          
          <!-- 講評内容 -->
          <text x="80" y="150" fill="rgba(255,255,255,0.95)" font-family="${fontFamily}" font-size="20" font-weight="bold">📊 技術</text>
          <text x="80" y="175" fill="rgba(255,255,255,0.85)" font-family="${fontFamily}" font-size="16">${escapeHtml(truncateText(critiqueData.technique, 70))}</text>
          
          <text x="80" y="230" fill="rgba(255,255,255,0.95)" font-family="${fontFamily}" font-size="20" font-weight="bold">🎯 構図</text>
          <text x="80" y="255" fill="rgba(255,255,255,0.85)" font-family="${fontFamily}" font-size="16">${escapeHtml(truncateText(critiqueData.composition, 70))}</text>
          
          <text x="80" y="310" fill="rgba(255,255,255,0.95)" font-family="${fontFamily}" font-size="20" font-weight="bold">🎨 色彩</text>
          <text x="80" y="335" fill="rgba(255,255,255,0.85)" font-family="${fontFamily}" font-size="16">${escapeHtml(truncateText(critiqueData.color, 70))}</text>
          
          <!-- 装飾要素 -->
          <rect x="60" y="130" width="4" height="230" fill="rgba(255,255,255,0.2)" />
          <circle cx="1050" cy="200" r="100" fill="rgba(255,255,255,0.03)" />
          <circle cx="1080" cy="450" r="60" fill="rgba(255,255,255,0.05)" />
        </svg>
      `;
    } else {
      // 標準OGP画像 - 改善されたフォントとレイアウト
      const fontFamily = createFontFamily();

      svg = `
        <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#gradient)" />
          
          <!-- メインタイトル -->
          <text x="600" y="240" text-anchor="middle" fill="white" font-family="${fontFamily}" font-size="48" font-weight="bold">AI Photo Critique</text>
          
          <!-- サブタイトル -->
          <text x="600" y="310" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-family="${fontFamily}" font-size="28">${escapeHtml(truncateText(title, 35))}</text>
          
          <!-- 詳細テキスト -->
          <text x="600" y="370" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-family="${fontFamily}" font-size="20">${escapeHtml(truncateText(subtitle, 50))}</text>
          
          ${
            filename
              ? `
          <!-- ファイル名（表示する場合）-->
          <text x="600" y="430" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-family="${fontFamily}" font-size="16">📸 ${escapeHtml(truncateText(filename, 45))}</text>
          `
              : ""
          }
          
          <!-- 装飾的な要素 -->
          <circle cx="200" cy="150" r="50" fill="rgba(255,255,255,0.08)" />
          <circle cx="1000" cy="480" r="70" fill="rgba(255,255,255,0.08)" />
          <rect x="80" y="520" width="100" height="80" fill="rgba(255,255,255,0.05)" rx="10" />
          
          <!-- 追加装飾 -->
          <rect x="450" y="180" width="300" height="2" fill="rgba(255,255,255,0.2)" />
        </svg>
      `;
    }

    return new Response(svg, {
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": "public, max-age=3600",
      },
    });
  } catch (error) {
    const errorResult = ErrorHandler.handleAPIRouteError(error);
    return new Response("Failed to generate OGP image", { status: errorResult.status });
  }
}
