import { test, expect } from "@playwright/test";

test.describe("共有機能E2Eテスト", () => {
  test.beforeEach(async ({ page }) => {
    // ベースURLを設定
    await page.goto("/");
  });

  test("共有ページが正しく表示される", async ({ page }) => {
    // デモ用の共有ページにアクセス
    await page.goto("/s/demo");

    // ページタイトルを確認
    await expect(page).toHaveTitle(/AI写真講評結果/);

    // 主要コンポーネントが表示されることを確認
    await expect(page.locator("h1")).toContainText("AI Photo Critique");
    await expect(page.locator('[alt="分析対象の写真"]')).toBeVisible();

    // 講評カードが表示されることを確認
    await expect(page.getByText("技術")).toBeVisible();
    await expect(page.getByText("構図")).toBeVisible();
    await expect(page.getByText("色彩")).toBeVisible();

    // EXIF情報が表示されることを確認
    await expect(page.getByText("撮影情報")).toBeVisible();
  });

  test("OGPメタデータが正しく設定される", async ({ page }) => {
    // 共有ページにアクセス
    await page.goto("/s/demo");

    // OGPメタタグの存在確認
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    const ogImage = page.locator('meta[property="og:image"]');
    const twitterCard = page.locator('meta[name="twitter:card"]');

    await expect(ogTitle).toHaveAttribute("content", /AI写真講評結果/);
    await expect(ogDescription).toHaveAttribute("content", /技術・構図・色彩/);
    await expect(ogImage).toHaveAttribute("content", /\/api\/ogp\?id=demo/);
    await expect(twitterCard).toHaveAttribute("content", "summary_large_image");
  });

  test("OGP画像が生成される", async ({ page }) => {
    // OGP画像エンドポイントにアクセス
    const response = await page.goto("/api/ogp?id=demo");

    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toBe("image/svg+xml");
  });

  test("OGP詳細画像が生成される", async ({ page }) => {
    // OGP詳細画像エンドポイントにアクセス
    const response = await page.goto("/api/ogp?id=demo&detail=true");

    expect(response?.status()).toBe(200);
    expect(response?.headers()["content-type"]).toBe("image/svg+xml");
  });

  test("存在しない共有IDでエラーページが表示される", async ({ page }) => {
    // 存在しない共有IDでアクセス
    await page.goto("/s/nonexistent-id");

    // エラーメッセージの確認
    await expect(page.getByText("データが見つかりません")).toBeVisible();
    await expect(page.getByText("新しい写真を分析する")).toBeVisible();

    // リンクが正しく動作することを確認
    await page.click("text=新しい写真を分析する");
    await expect(page).toHaveURL("/");
  });

  test("Call-to-Actionボタンが正しく動作する", async ({ page }) => {
    // 共有ページにアクセス
    await page.goto("/s/demo");

    // Call-to-Actionボタンを確認
    const ctaButton = page
      .locator("text=あなたの写真も分析してみませんか？")
      .first();
    await expect(ctaButton).toBeVisible();

    // ボタンをクリック（実際のクリックはアクションが定義されている場合のみ）
    if (await ctaButton.isVisible()) {
      const ctaLink = page.locator('a[href="/"]').first();
      if (await ctaLink.isVisible()) {
        await ctaLink.click();
        await expect(page).toHaveURL("/");
      }
    }
  });

  test("レスポンシブデザインが正しく動作する", async ({ page }) => {
    // モバイルビューポートでテスト
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/s/demo");

    // モバイルでも主要コンポーネントが表示されることを確認
    await expect(page.locator('[alt="分析対象の写真"]')).toBeVisible();
    await expect(page.getByText("技術")).toBeVisible();
    await expect(page.getByText("構図")).toBeVisible();
    await expect(page.getByText("色彩")).toBeVisible();

    // デスクトップビューポートでテスト
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.reload();

    // デスクトップでも正しく表示されることを確認
    await expect(page.locator('[alt="分析対象の写真"]')).toBeVisible();
    await expect(page.getByText("技術")).toBeVisible();
  });
});
