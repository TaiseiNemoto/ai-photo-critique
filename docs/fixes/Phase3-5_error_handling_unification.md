# Phase3-5 エラーハンドリング戦略統一 修正計画

## 📋 課題概要

### 問題の詳細
- **分散エラーハンドリング**: フロントエンド・Server Actions・Core Functionsで異なるエラー処理
- **統一されていないエラー型**: 一部で文字列、一部でAppError型
- **不一致なエラー伝播ルール**: レイヤー間でのエラー処理方針が不統一

### 影響範囲
- メンテナンス性の悪化
- デバッグ効率の低下
- エラー処理の重複コード
- 一貫性のないユーザー体験

## 🎯 修正方針

### Next.jsベストプラクティスに基づく統一戦略
1. **統一エラー型**: AppError型をベースとした型安全なエラー処理
2. **レイヤー別責任分離**: 各レイヤーでの明確なエラー処理ルール
3. **ErrorHandlerクラス活用**: 既存の統一ハンドラーの完全活用

## 🔧 具体的な修正内容

### 1. フロントエンドhooks統一化
**対象ファイル**: `src/hooks/useCritiqueGeneration.ts`

- **Before**: `handleCritiqueError`、`handleNetworkError`独自関数
- **After**: ErrorHandlerクラスベースの統一処理

### 2. Core Functions統一化
**対象ファイル**:
- `src/lib/critique-core.ts`
- `src/lib/upload.ts`
- `src/lib/gemini.ts`

- **Before**: 個別try-catch + 文字列エラー
- **After**: AppError型ベースの統一処理

### 3. エラー伝播ルール確立
**新規ファイル**: `src/lib/error-propagation.ts`

- 各レイヤー間のエラー変換ルール
- 統一されたエラー伝播フロー

## 📝 実装手順 (TDD方式)

### Step 1: RED - 失敗するテストを作成
1. フロントエンドhooksのErrorHandler統合テスト
2. Core FunctionsのAppError型対応テスト
3. エラー伝播フローテスト

### Step 2: GREEN - 最小限の実装でテスト通過
1. useCritiqueGenerationのErrorHandler対応
2. Core FunctionsのAppError対応
3. エラー伝播ルール実装

### Step 3: REFACTOR - 品質改善・コード整理
1. 重複コード削除
2. 型安全性向上
3. パフォーマンス最適化

## 🎉 期待効果

### 保守性の向上
- **統一エラー処理**: 1箇所での修正で全体に反映
- **型安全性**: TypeScriptによるコンパイル時エラー検出
- **コード削減**: 重複エラー処理コードの統合

### 開発効率の向上
- **デバッグ効率**: 一貫したエラーログ形式
- **テスタビリティ**: 統一されたモック作成
- **ドキュメント化**: 明確なエラー処理フロー

### ユーザー体験の向上
- **一貫したエラーメッセージ**: 統一された日本語メッセージ
- **適切なリトライ戦略**: エラー種別に応じた自動リトライ
- **エラー追跡**: 詳細なエラー情報とタイムスタンプ

## 📂 影響範囲

### 修正ファイル
- ✏️ `src/hooks/useCritiqueGeneration.ts` - ErrorHandler統合
- ✏️ `src/lib/critique-core.ts` - AppError型対応
- ✏️ `src/lib/upload.ts` - AppError型対応
- ✏️ `src/lib/gemini.ts` - AppError型対応

### 新規作成ファイル
- ➕ `src/lib/error-propagation.ts` - エラー伝播ルール
- ➕ `src/lib/error-propagation.test.ts` - エラー伝播テスト

### テスト更新ファイル
- ✏️ `src/hooks/useCritiqueGeneration.test.ts` (新規作成)
- ✏️ `src/lib/critique-core.test.ts` - AppError対応
- ✏️ `src/lib/upload.test.ts` - AppError対応
- ✏️ `src/lib/gemini.test.ts` - AppError対応

## ✅ 完了定義

### 機能要件
- [ ] 全エラー処理でAppError型使用
- [ ] ErrorHandlerクラスの完全活用
- [ ] 統一されたエラー伝播フロー

### 品質要件
- [ ] `npm run test` 全通過
- [ ] `npm run lint` エラーなし
- [ ] `npm run build` 成功
- [ ] テストカバレッジ80%以上維持

### パフォーマンス要件
- [ ] エラー処理オーバーヘッド最小化
- [ ] メモリリーク防止
- [ ] 処理時間への影響最小化

## 🔍 検証方法

1. **単体テスト**: 各レイヤーでの統一エラー処理
2. **統合テスト**: レイヤー間エラー伝播
3. **E2Eテスト**: エンドツーエンドエラーハンドリング
4. **手動テスト**: 画像アップロード〜講評生成フロー

---

**修正担当**: Claude Code
**レビュー対象**: エラーハンドリング統一化
**優先度**: Phase 3 (長期的改善)