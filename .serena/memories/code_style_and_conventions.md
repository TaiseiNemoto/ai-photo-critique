# コードスタイル・規約

## コード品質設定

- **ESLint**: Next.js設定 + TypeScript + Prettier連携
- **Prettier**: セミコロンあり、ダブルクォート、タブ幅2
- **TypeScript**: 厳格な型チェック有効

## 命名規則

- **コンポーネント**: PascalCase (`UploadZone`, `CritiqueCard`)
- **関数**: camelCase (`extractExifData`, `processImage`)
- **ファイル**: kebab-case or PascalCase (コンポーネントは PascalCase)
- **定数**: UPPER_SNAKE_CASE (`ERROR_MESSAGES`)

## ファイル構成パターン

```
components/
  common/     - 共通コンポーネント
  upload/     - アップロード画面用
  share/      - 共有画面用
  report/     - レポート画面用
  ui/         - shadcn/ui基盤コンポーネント

lib/
  exif.ts     - EXIF抽出ロジック
  image.ts    - 画像処理ロジック
  utils.ts    - 汎用ユーティリティ
```

## shadcn/ui 使用方針

- v0.dev でUIコンポーネント生成 → shadcn/ui コンポーネントインストール
- 既存のshadcn/uiコンポーネントを優先活用
- カスタムスタイルは Tailwind CSS で追加

## import文の順序

1. React関連
2. 外部ライブラリ
3. 内部ライブラリ (@/lib/\*)
4. コンポーネント (@/components/\*)
5. 型定義 (@/types/\*)

## その他の規約

- Server Components と Client Components の適切な使い分け
- OpenAI API通信は `lib/openai.ts` クライアント経由
- エラーハンドリングは統一的な方法で実装
