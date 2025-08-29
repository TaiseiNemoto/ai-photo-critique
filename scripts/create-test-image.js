/**
 * テスト用画像作成スクリプト
 * E2Eテスト用の小さなJPEG画像を生成
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function createTestImage() {
  const outputDir = path.join(__dirname, "..", "tests", "fixtures");
  const outputPath = path.join(outputDir, "test-image.jpg");

  // ディレクトリが存在することを確認
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // 300x200pxの小さなテスト画像を作成
    const testImage = sharp({
      create: {
        width: 300,
        height: 200,
        channels: 3,
        background: { r: 100, g: 150, b: 200 },
      },
    });

    // JPEG形式で保存（基本的なEXIFメタデータ付き）
    await testImage
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toFile(outputPath);

    console.log("✅ テスト画像を作成しました:", outputPath);
    console.log("📏 サイズ: 300x200px");

    // ファイルサイズを確認
    const stats = fs.statSync(outputPath);
    console.log("📦 ファイルサイズ:", Math.round(stats.size / 1024), "KB");
  } catch (error) {
    console.error("❌ テスト画像の作成に失敗しました:", error);
    process.exit(1);
  }
}

createTestImage();
