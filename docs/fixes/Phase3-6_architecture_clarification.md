# Phase 3-6: アーキテクチャの明確化

## 📋 課題概要

**課題ID**: Phase 3-6
**優先度**: 🔵 Low
**カテゴリ**: 設計改善

### 問題の詳細

現在のアプリケーションは5層の複雑な構造になっており、処理の流れが追いづらい状態です：

```
1. UI層: page.tsx
2. Custom Hook層: useUploadFlow
3. Custom Hook層: useCritiqueGeneration
4. Server Actions層: uploadImageWithCritique
5. Processing Helpers + Core Functions層: executeUploadAndCritique → uploadImageCore/generateCritiqueCore
```

**具体的な問題**:

- ❌ 責任の境界が不明確
- ❌ 5層にわたって処理が分散
- ❌ どのレイヤーが何を担当するかが分かりにくい設計
- ❌ 保守性・テスタビリティの低下

### 影響範囲

- 開発効率の低下（どこを修正すべきかが不明確）
- 新規開発者のオンボーディング困難
- バグ修正時の影響範囲把握困難

## 🎯 修正方針

### Next.jsベストプラクティス適用

**3層のシンプル構造**に整理し、責任分離を明確化：

```
1. 【UI層】: Components (Presentation Layer)
   - ユーザーインターフェース
   - 状態表示・ユーザー操作のみ

2. 【Service層】: Business Logic (Application Layer)
   - アップロード＋講評生成の統合処理
   - エラーハンドリング・状態管理
   - ビジネスルール

3. 【Infrastructure層】: Implementation (Infrastructure Layer)
   - 実際のAPI呼び出し・データ処理
   - 外部サービス連携
   - データ永続化
```

### アーキテクチャ設計原則

1. **Single Responsibility Principle**: 各層は単一の責任のみ
2. **Dependency Inversion**: 上位層は下位層に依存、その逆はない
3. **Interface Segregation**: 必要最小限のインターフェース公開

## 🔧 具体的な修正内容

### 1. Service層の新設と統合

**新規作成**: `src/services/upload-service.ts`

- `useCritiqueGeneration`と`useUploadFlow`の統合
- ビジネスロジックの集約
- 統一されたエラーハンドリング
- 状態管理の一元化

```typescript
// 新しいService層のインターフェース
export interface UploadService {
  uploadImage: (image: UploadedImageWithFormData) => void;
  generateCritique: () => Promise<void>;
  resetUpload: () => void;
  state: UploadState;
}
```

### 2. UI層の簡素化

**修正**: `src/app/page.tsx`

- Service層の直接利用
- プレゼンテーション責任のみに集中

```typescript
// 修正後のUI層
export default function UploadPage() {
  const uploadService = useUploadService();

  return (
    // UI表示のみ、ビジネスロジックはService層に委譲
  );
}
```

### 3. Server Actionsの簡素化

**修正**: `src/app/actions.ts`

- Infrastructure層への薄いラッパーに変更
- 複雑なロジックはService層に移動

### 4. Processing Helpersの削除

**削除**: `src/lib/processing-helpers.ts`

- 責任をService層に移動
- 中間レイヤーの除去

## 📝 実装手順（TDD方式）

### Step 1: テスト設計

- [ ] `src/services/upload-service.test.ts`のテスト設計
- [ ] 既存テストの動作確認

### Step 2: Service層実装 (Red-Green-Refactor)

- [ ] **Red**: 失敗するテストケース作成
- [ ] **Green**: Service層基本実装
- [ ] **Refactor**: コード品質改善

### Step 3: UI層修正

- [ ] `src/app/page.tsx`のService層統合
- [ ] Hook依存関係の更新

### Step 4: Infrastructure層整理

- [ ] Server Actionsの簡素化
- [ ] Processing Helpersの削除
- [ ] 不要なファイルのクリーンアップ

### Step 5: テスト・品質確認

- [ ] 全テスト通過確認
- [ ] Lint・フォーマット確認
- [ ] 動作テスト実施

## 🎉 期待効果

### 保守性の向上

- **明確な責任分離**: どこを修正すべきかが明確
- **レイヤー間結合度低減**: 変更影響範囲の限定

### 開発効率の向上

- **理解しやすい構造**: 新規開発者のオンボーディング向上
- **テストしやすい設計**: 単体テスト作成容易

### パフォーマンス

- **レイヤー数削減**: 処理フローの簡素化
- **無駄な中間処理除去**: 実行効率向上

## 📊 影響範囲

### 修正ファイル

- ✏️ `src/app/page.tsx` - Service層統合対応
- ✏️ `src/app/actions.ts` - 簡素化
- ➕ `src/services/upload-service.ts` - 新規Service層
- ❌ `src/hooks/useUploadFlow.ts` - Service層に移行
- ❌ `src/hooks/useCritiqueGeneration.ts` - Service層に移行
- ❌ `src/lib/processing-helpers.ts` - 削除

### テストファイル

- ➕ `src/services/upload-service.test.ts` - 新規テスト
- ✏️ `src/app/page.test.tsx` - Service層対応
- ❌ `src/hooks/useUploadFlow.test.ts` - 削除
- ❌ `src/hooks/useCritiqueGeneration.test.ts` - 削除
- ❌ `src/lib/processing-helpers.test.ts` - 削除

## ✅ 完了定義

### 必須条件

- [ ] `npm run test` - 全テスト通過
- [ ] `npm run lint` - エラーなし
- [ ] `npm run build` - ビルド成功
- [ ] 画像アップロード→講評生成の動作確認

### 品質条件

- [ ] 3層構造への整理完了
- [ ] 責任分離の明確化
- [ ] テストカバレッジ維持
- [ ] TypeScript型安全性維持

## 📚 参考資料

- [Next.js App Router Best Practices](https://nextjs.org/docs/app/building-your-application)
- [Clean Architecture in React](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [現在のCLAUDE.md](../CLAUDE.md) - TDD開発手法
