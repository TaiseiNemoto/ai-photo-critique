# コーディングガイドライン

## t-wada流開発手法の適用

本プロジェクトでは、和田卓人（t-wada）氏が推奨する開発手法を採用します。以下のルールに従ってロジックを実装してください。

## 基本原則

### 1. テストファーストの徹底

**ルール**: 新しいロジックを実装する前に、必ずテストを先に書く

```typescript
// ❌ 悪い例: 実装を先に書く
export function extractExifData(file: File) {
  // 実装コードを先に書いてしまう
}

// ✅ 良い例: テストを先に書く
describe("extractExifData", () => {
  it("should extract EXIF data from JPEG file", async () => {
    const mockFile = new File([mockJpegData], "test.jpg", {
      type: "image/jpeg",
    });
    const result = await extractExifData(mockFile);

    expect(result.make).toBe("Canon");
    expect(result.model).toBe("EOS R5");
    expect(result.fNumber).toBe("f/2.8");
  });

  it("should handle files without EXIF data gracefully", async () => {
    const mockFile = new File([mockImageWithoutExif], "noexif.jpg", {
      type: "image/jpeg",
    });
    const result = await extractExifData(mockFile);

    expect(result).toEqual({});
  });
});
```

### 2. Red-Green-Refactorサイクル

**ルール**: 必ず以下の順序で開発を進める

1. **🔴 Red**: 失敗するテストを書く
2. **🟢 Green**: テストが通る最小限の実装を書く
3. **🔵 Refactor**: コードを改善する

```typescript
// Step 1: Red - 失敗するテストを書く
it("should extract ISO value from EXIF", async () => {
  const result = await extractExifData(mockFile);
  expect(result.iso).toBe("200");
}); // この時点ではテストは失敗する

// Step 2: Green - 最小限の実装
export function extractExifData(file: File) {
  return { iso: "200" }; // とりあえず固定値で通す
}

// Step 3: Refactor - 実際の実装に改善
export async function extractExifData(file: File) {
  const exif = await exifr.parse(file);
  return {
    iso: exif?.ISO?.toString() || "",
    // 他のフィールドも追加
  };
}
```

### 3. 小さなステップでの開発

**ルール**: 一度に大きな機能を実装せず、小さな単位で分割する

```typescript
// ❌ 悪い例: 大きな関数を一度に実装
export async function processImage(file: File) {
  // EXIF抽出、リサイズ、圧縮を一度に実装
  const exif = await extractExifData(file);
  const resized = await resizeImage(file);
  const compressed = await compressImage(resized);
  return { exif, processedImage: compressed };
}

// ✅ 良い例: 小さな関数に分解
export async function extractExifData(file: File): Promise<ExifData> {
  // EXIF抽出のみに集中
}

export async function resizeImage(file: File, maxSize: number): Promise<File> {
  // リサイズのみに集中
}

export async function compressImage(
  file: File,
  quality: number,
): Promise<File> {
  // 圧縮のみに集中
}
```

## 実装ルール

### 4. 境界値テストの徹底

**ルール**: 正常系だけでなく、境界値や異常系のテストを必ず書く

```typescript
describe("画像処理", () => {
  // 正常系
  it("should process valid JPEG file", async () => {
    /* ... */
  });

  // 境界値テスト
  it("should handle maximum file size (10MB)", async () => {
    /* ... */
  });
  it("should handle minimum file size (1KB)", async () => {
    /* ... */
  });

  // 異常系
  it("should throw error for unsupported file format", async () => {
    /* ... */
  });
  it("should throw error for corrupted file", async () => {
    /* ... */
  });
  it("should handle file with no EXIF data", async () => {
    /* ... */
  });
});
```

### 5. モック・スタブの適切な使用

**ルール**: 外部依存をモック化し、テストの独立性を保つ

```typescript
// ✅ 外部ライブラリをモック化
jest.mock("exifr", () => ({
  parse: jest.fn(),
}));

describe("extractExifData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call exifr.parse with correct parameters", async () => {
    const mockFile = new File([], "test.jpg");
    const mockExifData = { Make: "Canon", Model: "EOS R5" };

    (exifr.parse as jest.Mock).mockResolvedValue(mockExifData);

    await extractExifData(mockFile);

    expect(exifr.parse).toHaveBeenCalledWith(mockFile);
  });
});
```

### 6. エラーハンドリングのテスト

**ルール**: エラーケースも必ずテストする

```typescript
describe("エラーハンドリング", () => {
  it("should handle EXIF parsing error gracefully", async () => {
    const mockFile = new File([], "corrupt.jpg");
    (exifr.parse as jest.Mock).mockRejectedValue(new Error("Parse failed"));

    const result = await extractExifData(mockFile);

    expect(result).toEqual({}); // エラー時は空オブジェクトを返す
  });

  it("should throw meaningful error for invalid file type", async () => {
    const mockFile = new File([], "test.txt", { type: "text/plain" });

    await expect(extractExifData(mockFile)).rejects.toThrow(
      "Unsupported file type: text/plain",
    );
  });
});
```

## 開発フロー

### 実装時の必須ステップ

1. **要件定義** - 何を実装するか明確化
2. **テスト設計** - テストケースを洗い出し
3. **テスト実装** - 失敗するテストを書く
4. **最小実装** - テストが通る最小限のコード
5. **リファクタリング** - コード品質の向上
6. **統合テスト** - 他のコンポーネントとの連携確認

### コミット時のルール

```bash
# 各ステップでコミットを分ける
git commit -m "test: EXIF抽出機能のテストケース追加"
git commit -m "feat: EXIF抽出機能の最小実装"
git commit -m "refactor: EXIF抽出機能のエラーハンドリング改善"
```

## 品質基準

### テストカバレッジ

- **最低基準**: 80%以上
- **目標**: 90%以上
- **対象**: 新規実装のロジック部分

### テスト実行

```bash
# 実装前に必ず実行
npm run test

# カバレッジ確認
npm run test -- --coverage

# 特定ファイルのテスト
npm run test src/lib/exif.test.ts
```

## 禁止事項

❌ **やってはいけないこと**:

- テストを書かずに実装を始める
- 一度に大きな機能を実装する
- エラーハンドリングを後回しにする
- 外部依存のテストでモックを使わない
- テストが失敗した状態でコミットする

✅ **必ずやること**:

- Red-Green-Refactorサイクルの遵守
- 境界値・異常系のテスト
- 適切なモック・スタブの使用
- コードレビュー前のテスト実行
- 意味のあるテスト名とコミットメッセージ

---

**参考資料**:

- [t-wadaの「テスト駆動開発」](https://www.amazon.co.jp/dp/4274217884)
- [テスティングフレームワークVitestの使い方](https://vitest.dev/)
- [Jest Mockingのベストプラクティス](https://jestjs.io/docs/mock-functions)

**更新日**: 2025-07-29
**適用範囲**: 全てのロジック実装（UI コンポーネントを除く）
