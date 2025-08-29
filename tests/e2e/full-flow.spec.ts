import { test, expect } from "@playwright/test";
import path from "path";

/**
 * 完全フローE2Eテスト
 * アップロード → 講評生成 → 共有機能の全体フローをテスト
 * t-wada手法: テストファースト、失敗→成功→リファクタリング
 */
test.describe("完全フローE2Eテスト", () => {
  const testImagePath = path.join(
    process.cwd(),
    "tests",
    "fixtures",
    "test-image.jpg",
  );

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("完全フロー: 画像アップロード → 講評生成 → 共有", async ({ page }) => {
    // Step 1: メインページの確認
    await expect(page.locator("h1")).toContainText("AI Photo Critique");
    await expect(page.getByText("写真をドラッグ&ドロップ")).toBeVisible();

    // Step 2: 画像アップロード
    // ファイル選択ボタンをクリック
    await page.getByText("ファイルを選択").click();

    // ファイルアップロード（実際のテスト画像を使用）
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // プレビューが表示されることを確認
    await expect(page.locator('img[alt="プレビュー画像"]')).toBeVisible();

    // EXIF情報が表示されることを確認
    await expect(page.getByText("撮影情報")).toBeVisible();

    // Step 3: 講評生成
    const generateButton = page.getByRole("button", {
      name: "AI講評を生成する",
    });
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // ローディング状態の確認
    await expect(page.getByText("分析中")).toBeVisible();

    // 講評結果の表示を待つ（最大30秒）
    await expect(page.getByText("技術")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("構図")).toBeVisible();
    await expect(page.getByText("色彩")).toBeVisible();

    // Step 4: 共有機能
    const shareButton = page.getByRole("button", { name: "共有" });
    await expect(shareButton).toBeEnabled();
    await shareButton.click();

    // 共有URLが生成されることを確認
    await expect(page.getByText("共有URL")).toBeVisible();
    const shareUrl = await page
      .locator('[data-testid="share-url"]')
      .textContent();
    expect(shareUrl).toMatch(/http.*\/s\/[a-z0-9]+/);

    // Step 5: 共有ページの確認
    if (shareUrl) {
      const shareId = shareUrl.split("/s/")[1];
      await page.goto(`/s/${shareId}`);

      // 共有ページの内容確認
      await expect(page.locator("h1")).toContainText("AI Photo Critique");
      await expect(page.locator('[alt="分析対象の写真"]')).toBeVisible();
      await expect(page.getByText("技術")).toBeVisible();
      await expect(page.getByText("構図")).toBeVisible();
      await expect(page.getByText("色彩")).toBeVisible();
    }
  });

  test("エラーハンドリング: 無効ファイル形式", async ({ page }) => {
    // 無効なファイル形式をアップロード
    const fileInput = page.locator('input[type="file"]');
    const invalidFile = path.join(process.cwd(), "package.json");
    await fileInput.setInputFiles(invalidFile);

    // エラーメッセージが表示されることを確認
    await expect(page.getByText("対応していないファイル形式")).toBeVisible();
  });

  test("エラーハンドリング: ファイルサイズ制限", async ({ page }) => {
    // 大きすぎるファイル（10MB以上）の場合のテスト
    // 実際の大容量ファイルは用意できないため、モック設定で対応予定

    // 制限サイズを超えた場合のエラーメッセージ確認
    // このテストは将来的にモックで実装する
    test.skip("大容量ファイルのテストは実装予定");
  });

  test("ネットワークエラー対応", async ({ page }) => {
    // ネットワークを無効化
    await page.context().setOffline(true);

    // 画像アップロードを試行
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // エラーメッセージが表示されることを確認
    const generateButton = page.getByRole("button", {
      name: "AI講評を生成する",
    });
    await generateButton.click();

    await expect(page.getByText("ネットワークエラー")).toBeVisible({
      timeout: 10000,
    });

    // ネットワークを復旧
    await page.context().setOffline(false);
  });

  test("講評生成タイムアウト対応", async ({ page }) => {
    // タイムアウトテストは実際のAPIを使用すると時間がかかるため、
    // モック設定で短いタイムアウトをシミュレート
    test.skip("タイムアウトテストは実装予定");
  });
});
