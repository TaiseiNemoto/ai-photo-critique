# Phase 2-4: データフロー最適化

## 課題概要

**問題箇所**: `src/lib/critique-core.ts:generateCritiqueCore` (L34, L44)

**詳細**:
- ❌ 画像を2回Buffer変換（AI処理用 + KV保存用）
- ❌ `file.arrayBuffer()`が重複実行されている
- ❌ アップロード時の処理済み画像データを再利用できていない

**具体的な重複箇所**:
1. L34: `const arrayBuffer = await file.arrayBuffer();` (AI処理用)
2. L44: `const arrayBuffer = await file.arrayBuffer();` (KV保存用)

**影響範囲**:
- パフォーマンス: 大きなファイルでは2回のBuffer変換が処理時間に影響
- メモリ使用量: 不要な重複メモリ割り当て

## 修正方針

**Next.jsベストプラクティス**:
- メモリ効率的なデータ処理
- 重複処理の排除
- 画像データの再利用による最適化

**アプローチ**:
1. 1回のBuffer変換で画像データを取得
2. AI処理用とKV保存用で同じBufferを再利用
3. Base64変換はBuffer.toString()で効率的に実行

## 具体的な修正内容

### src/lib/critique-core.ts

**修正前**:
```typescript
// L34: AI処理用
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// AI講評生成
const result = await generatePhotoCritiqueWithRetry(buffer, file.type, 1);

// L44: KV保存用（重複）
const arrayBuffer = await file.arrayBuffer();
const base64 = Buffer.from(arrayBuffer).toString("base64");
```

**修正後**:
```typescript
// 1回だけBuffer変換を実行
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// AI講評生成
const result = await generatePhotoCritiqueWithRetry(buffer, file.type, 1);

// KV保存用（既存のbufferを再利用）
const base64 = buffer.toString("base64");
```

## 実装手順

### 1. Red: 失敗するテストを作成
- [ ] Buffer変換回数を検証するテスト
- [ ] パフォーマンステスト（処理時間測定）

### 2. Green: 最小限の実装でテスト通過
- [ ] 重複`file.arrayBuffer()`の削除
- [ ] 既存bufferのBase64変換再利用

### 3. Refactor: 品質改善
- [ ] コメント整理
- [ ] 変数名の最適化

### 4. 境界値・異常系テスト
- [ ] 大きなファイルでのメモリ効率テスト
- [ ] Buffer変換エラー時の動作確認

## 期待効果

**パフォーマンス向上**:
- ファイルサイズ10MBの場合、約50%の処理時間短縮期待
- メモリ使用量の最適化

**メンテナビリティ向上**:
- DRY原則の遵守
- コードの可読性向上

**型安全性**:
- 既存の型安全性を維持

## 影響範囲

**修正ファイル**:
- ✏️ `src/lib/critique-core.ts` - Buffer変換重複解消

**テストファイル**:
- ✏️ `src/lib/critique-core.test.ts` - パフォーマンステスト追加

**新規作成**:
- なし

**削除**:
- なし

## 完了定義

- [ ] `npm run test` 全通過
- [ ] `npm run lint` エラーなし
- [ ] `npm run build` 成功
- [ ] 画像アップロード〜講評生成の動作確認
- [ ] 処理時間・メモリ使用量の改善確認
- [ ] Buffer変換が1回のみ実行されることの確認