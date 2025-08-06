import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Node.js環境（テスト）用のMSWサーバーセットアップ
export const server = setupServer(...handlers);

// テスト環境でのサーバー初期化
if (process.env.NODE_ENV === "test") {
  // テストセットアップでサーバーを開始
  server.listen({
    onUnhandledRequest: "error", // テスト環境ではハンドルされていないリクエストをエラーとする
  });
}
