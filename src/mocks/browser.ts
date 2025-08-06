import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// ブラウザ用のMSWワーカーセットアップ
export const worker = setupWorker(...handlers);

// 開発環境でのMSWワーカー初期化
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // ブラウザ環境かつ開発モードの場合のみワーカーを開始
  worker.start({
    onUnhandledRequest: "warn", // ハンドルされていないリクエストを警告
  });
}
