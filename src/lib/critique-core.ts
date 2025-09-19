import { generatePhotoCritiqueWithRetry } from "@/lib/critique";
import { kvClient } from "@/lib/kv";
import type { CritiqueResult, ExifData } from "@/types/upload";
import { extractFileFromFormData, extractStringFromFormData } from "./form-utils";

/**
 * FormDataから画像ファイルを抽出し、基本的なバリデーションを行う
 */
function extractAndValidateFile(formData: FormData): File | null {
  const fileResult = extractFileFromFormData(formData, "image");

  if (!fileResult.success) {
    return null;
  }

  return fileResult.data;
}

/**
 * AI講評生成処理のコア関数（画像ファイル付き）
 *
 * @param formData - 講評対象の画像を含むFormData
 * @returns AI講評結果（成功時は3軸評価データ、失敗時はエラーメッセージ）
 */
export async function generateCritiqueCore(
  formData: FormData,
): Promise<CritiqueResult> {
  try {
    // ファイルの抽出と基本検証
    const file = extractAndValidateFile(formData);
    if (!file) {
      return {
        success: false,
        error: "ファイルが選択されていません",
      };
    }

    // ファイルの種類確認
    if (!file.type || !file.type.startsWith("image/")) {
      return {
        success: false,
        error: "画像ファイルを選択してください",
      };
    }

    // クライアントから送信されたEXIF情報を取得
    const exifDataResult = extractStringFromFormData(formData, "exifData", {
      optional: true,
    });
    let exifData: ExifData = {}; // デフォルト空オブジェクト

    if (exifDataResult.success && exifDataResult.data) {
      try {
        exifData = JSON.parse(exifDataResult.data);
        console.log("Using client-side EXIF data for critique");
      } catch (error) {
        console.warn(
          "Invalid EXIF data from client, using empty object:",
          error,
        );
        exifData = {}; // EXIF欠損を許容
      }
    } else {
      console.log("No client EXIF data provided for critique, using empty object");
    }

    // 画像をBufferに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // AI講評生成（再試行機能付き）
    const result = await generatePhotoCritiqueWithRetry(buffer, file.type, 1);

    // 講評が成功した場合、KVストレージに保存
    if (result.success && result.data) {
      // 共有用IDを生成
      const shareId = kvClient.generateId();

      // 画像をBase64データURLに変換
      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const imageData = `data:${file.type};base64,${base64}`;

      // 講評データを保存（画像データも含めて統合）
      await kvClient.saveCritique({
        id: shareId,
        filename: file.name,
        technique: result.data.technique,
        composition: result.data.composition,
        color: result.data.color,
        exifData: exifData as Record<string, unknown>,
        imageData: imageData,
        uploadedAt: new Date().toISOString(),
      });

      // 共有データを保存
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24時間後
      await kvClient.saveShare({
        id: shareId,
        critiqueId: shareId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      });

      // レスポンスにshareIdを追加
      const enhancedResult: CritiqueResult = {
        ...result,
        data: {
          ...result.data,
          shareId: shareId,
        },
      };

      return enhancedResult;
    }

    // 成功・失敗問わず、講評処理の結果をそのまま返す
    return result;
  } catch (error) {
    console.error("Critique core error:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "AI講評の生成中にエラーが発生しました";

    return {
      success: false,
      error: errorMessage,
    };
  }
}
