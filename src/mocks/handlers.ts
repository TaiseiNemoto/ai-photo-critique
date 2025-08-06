import { http, HttpResponse } from "msw";
import type { CritiqueData, CritiqueResult } from "@/types/upload";

// モックレスポンスデータ
const mockCritiqueData: CritiqueData = {
  technique:
    "F値2.8で背景をよくぼかせています。シャッタースピードも適切で手ブレがありません。ISO感度も低く抑えられており、ノイズの少ないクリアな画質を実現できています。",
  composition:
    "三分割法を使って被写体を配置しており、バランスの取れた構図になっています。前景・中景・後景の使い分けも効果的で、奥行きのある写真に仕上がっています。",
  color:
    "暖色系の色温度設定で温かみのある雰囲気を演出できています。色彩の統一感があり、見る人に心地よい印象を与えます。明暗のコントラストも適度で立体感があります。",
};

const mockCritiqueError: CritiqueResult = {
  success: false,
  error: "AI講評の生成中にエラーが発生しました",
  processingTime: 1500,
};

const mockCritiqueSuccess: CritiqueResult = {
  success: true,
  data: mockCritiqueData,
  processingTime: 3200,
};

// 異なるテストケース用のモックデータ
const mockCritiqueVariations = {
  landscape: {
    technique:
      "広角レンズを活用して壮大な風景を捉えています。絞りF8でパンフォーカスを実現し、全体にピントが合った鮮明な画像です。朝の光を活かした露出設定も適切です。",
    composition:
      "地平線を三分割法に沿って配置し、空と大地のバランスが美しい構図です。手前の岩や草を前景に入れることで奥行き感を演出し、視線の誘導も効果的です。",
    color:
      "朝焼けの暖色と空の寒色が美しいグラデーションを作り出しています。自然な色調で現実感があり、見る人の心に響く色彩表現になっています。",
  },
  portrait: {
    technique:
      "被写体に対する焦点が正確で、特に目にシャープなピントが合っています。F1.8の開放値で背景を美しくぼかし、被写体を際立たせる技術が光ります。",
    composition:
      "被写体の配置が絶妙で、視線の方向も考慮された構図です。余白の使い方が上手く、被写体の表情や雰囲気を効果的に引き立てています。",
    color:
      "肌色の再現が自然で健康的な印象を与えます。背景の色調も被写体を引き立てる役割を果たし、全体的に調和の取れた色彩バランスです。",
  },
  macro: {
    technique:
      "マクロ撮影の難しい被写界深度を上手くコントロールしています。細部まで鮮明に写っており、照明や露出の調整も適切で被写体の質感が良く表現されています。",
    composition:
      "被写体を中央に配置しながらも単調にならず、背景の選択と角度の工夫で魅力的な構図を作り出しています。画面全体のバランスも良好です。",
    color:
      "被写体の自然な色合いを忠実に再現しており、背景とのコントラストも効果的です。色の飽和度も適切で、見た目に美しい仕上がりになっています。",
  },
};

// MSWハンドラー定義
export const handlers = [
  // Gemini API モック（成功レスポンス）
  http.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    () => {
      return HttpResponse.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify(mockCritiqueData),
                },
              ],
            },
          },
        ],
      });
    },
  ),

  // Gemini API モック（エラーレスポンス）
  http.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    () => {
      return new HttpResponse(null, {
        status: 429,
        statusText: "Too Many Requests",
      });
    },
  ),

  // Server Action モック（講評生成成功）
  http.post("/api/critique", () => {
    return HttpResponse.json(mockCritiqueSuccess);
  }),

  // Server Action モック（講評生成失敗）
  http.post("/api/critique-error", () => {
    return HttpResponse.json(mockCritiqueError);
  }),
];

// テスト用ユーティリティ関数
export const mockResponses = {
  success: mockCritiqueSuccess,
  error: mockCritiqueError,
  variations: mockCritiqueVariations,
};

// ハンドラーのオーバーライド用ヘルパー
export const createMockCritiqueHandler = (response: CritiqueResult) =>
  http.post("/api/critique", () => {
    return HttpResponse.json(response);
  });

export const createMockGeminiHandler = (critiqueData: CritiqueData) =>
  http.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    () => {
      return HttpResponse.json({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify(critiqueData),
                },
              ],
            },
          },
        ],
      });
    },
  );

// エラーケース用のハンドラー
export const errorHandlers = {
  networkError: http.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    () => {
      return HttpResponse.error();
    },
  ),

  timeout: http.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    async () => {
      await new Promise((resolve) => setTimeout(resolve, 30000)); // 30秒タイムアウト
      return HttpResponse.json({ error: "Request timeout" });
    },
  ),

  rateLimited: http.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    () => {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 429,
            message: "Quota exceeded. Please try again later.",
            status: "RESOURCE_EXHAUSTED",
          },
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    },
  ),

  invalidApiKey: http.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent",
    () => {
      return new HttpResponse(
        JSON.stringify({
          error: {
            code: 401,
            message: "Invalid API key provided.",
            status: "UNAUTHENTICATED",
          },
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    },
  ),
};
