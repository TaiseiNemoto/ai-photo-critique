# H2: 状態管理の二重化・循環依存解消

**課題ID**: H2
**優先度**: 🟠 High ⭐⭐⭐
**作成日**: 2025-09-17
**ステータス**: 実装中

## 📋 課題概要

### 問題の詳細

同一データ（講評結果）をローカルStateとContext APIで重複管理している設計欠陥。

**問題箇所**:

```typescript
// page.tsx:84-96 - ローカル状態での管理
setUploadedImage((prev) => ({ ...prev, critique: data }));

// page.tsx:107-110 - Context APIでの重複管理
setCritiqueData({ image: uploadedImage, critique: data });
```

### 影響範囲

- **データ整合性**: 同期タイミングのズレで不整合リスク
- **Single Source of Truth**: 信頼できるデータソースが不明確
- **メモリ効率**: 同一データの重複保持（特に大きな画像データ）
- **保守性**: 状態管理の責務が曖昧

## 🎯 修正方針

### Next.js・React ベストプラクティス準拠

1. **Single Source of Truth確立**
   - Context APIを主軸とした状態管理に統一
   - ローカル状態は最小限に抑制

2. **責務分離の明確化**
   - ローカル状態: 画像アップロード〜講評生成前まで
   - Context API: 講評完了後のアプリケーション状態管理

3. **メモリ効率の改善**
   - データ重複排除
   - 未使用フィールドの削除

## 🔧 具体的な修正内容

### 修正対象ファイル

1. **`src/app/page.tsx`**
   - `uploadedImage`からcritique関連データ削除
   - Context APIのみでの講評データ管理
   - データ重複代入処理の削除

2. **`src/contexts/CritiqueContext.tsx`**
   - 未使用の`timestamp`フィールド削除
   - メモリリーク対策

3. **`src/types/upload.ts`** (必要に応じて)
   - ローカル状態用とContext用の型分離

## 📝 実装手順（TDD方式）

### Phase 1: Red（失敗テスト作成）

1. **Context API状態管理のテスト作成**

   ```typescript
   // tests/contexts/CritiqueContext.test.tsx
   describe("CritiqueContext - 状態管理統一", () => {
     it("講評データはContext APIのみで管理される", () => {
       // Context APIでの状態管理テスト
     });

     it("未使用timestampフィールドが削除されている", () => {
       // timestamp削除確認テスト
     });
   });
   ```

2. **page.tsx重複排除テスト作成**
   ```typescript
   // tests/app/page.test.tsx
   describe("UploadPage - 状態管理統一", () => {
     it("講評データはローカル状態に保持されない", () => {
       // ローカル状態の重複排除テスト
     });
   });
   ```

### Phase 2: Green（最小実装）

1. **CritiqueContext.tsx修正**
   - `timestamp`フィールド削除
   - 型定義の調整

2. **page.tsx修正**
   - `setUploadedImage`でのcritique代入削除
   - Context APIのみでの状態管理

### Phase 3: Refactor（品質改善）

1. **型安全性向上**
   - 不要な型定義削除
   - インターフェース最適化

2. **コード整理**
   - 不要なコメント削除
   - 処理の簡素化

## 🎯 期待効果

### パフォーマンス改善

- **メモリ使用量**: データ重複排除により約30%削減
- **状態同期処理**: 重複更新処理の削除

### 設計品質向上

- **Single Source of Truth**: データソースの一元化
- **責務分離**: 状態管理の明確化
- **保守性**: 状態管理ロジックの簡素化

### 開発者体験向上

- **デバッグ容易性**: 状態の追跡が簡単
- **テスタビリティ**: 状態管理テストの単純化

## 🔍 影響範囲

### 修正ファイル

- `src/app/page.tsx` - 重複状態管理の削除
- `src/contexts/CritiqueContext.tsx` - timestamp削除・最適化

### 削除対象

- ローカル状態でのcritique管理処理
- 未使用timestamp フィールド
- 重複データ代入処理

### 新規作成ファイル

- `tests/contexts/CritiqueContext.test.tsx` - Context統一テスト
- `tests/app/page-state-management.test.tsx` - 状態管理統一テスト

## ✅ 完了定義

### 必須条件

- [ ] 全テストが通過（`npm run test`）
- [ ] ESLintエラーなし（`npm run lint`）
- [ ] ビルド成功（`npm run build`）
- [ ] 機能動作確認（画像アップロード〜講評生成〜結果表示）

### 品質確認

- [ ] Context APIのみで講評データが管理されている
- [ ] ローカル状態でのcritique重複が排除されている
- [ ] timestamp等の未使用フィールドが削除されている
- [ ] メモリ使用量の改善が確認できる

### 回帰テスト

- [ ] 画像アップロード機能（正常・異常系）
- [ ] 講評生成機能（成功・失敗・リトライ）
- [ ] 結果表示機能（講評カード・EXIF表示）
- [ ] シェア機能（URL生成・OGP）

## 🚨 注意事項

### 既存機能への影響

- **UI表示**: 講評結果の表示ロジックは変更なし
- **データフロー**: 外部APIとの連携は影響なし
- **シェア機能**: 共有データの生成・取得は変更なし

### 互換性保持

- **型定義**: 既存のインターフェースとの互換性維持
- **プロップス**: コンポーネント間のデータ受け渡し形式維持

## 📊 実装後の検証指標

### メトリクス

- **メモリ使用量**: 重複データ排除による削減率測定
- **レンダリング回数**: 不要な再レンダリング削減確認
- **状態更新回数**: 重複更新処理の削減確認

### 品質指標

- **型安全性**: as演算子使用箇所の削減
- **コード複雑度**: 状態管理ロジックの簡素化
- **テストカバレッジ**: 状態管理部分の網羅性向上
