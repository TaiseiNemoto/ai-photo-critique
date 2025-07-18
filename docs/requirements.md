## 1. 背景

写真SNSでは「いいね」は得やすい一方、撮影スキルの向上に直結する体系的なフィードバックを得る手段が限られている。OpenAI VisionとGPT‑4oの組み合わせにより、アップロード直後に日本語で簡潔かつ要点を押さえた講評を返す土台が整った。

## 2. 目的

利用者が**アップロードから数秒以内**に「技術・構図・色彩」の3軸コメント(各 2–3 行)を受け取り、撮影スキル向上のサイクルを高速化すること。

## 3. 用語定義

| 用語           | 説明                                                                  |
| -------------- | --------------------------------------------------------------------- |
| **MVP**        | Minimum Viable Product。今回の初期リリース範囲                        |
| **講評 API**   | OpenAI Vision → GPT‑4o を呼び出して講評 JSON を返すサーバーアクション |
| **シェア URL** | Vercel KV に保存されたレポートのキーを短縮 URL 化したもの             |
| **EXIF**       | 画像に埋め込まれた撮影設定メタデータ                                  |

## 4. スコープ

### 4.1 スコープ内（MVP）

- FR‑01 画像アップロード
- FR‑02 AI講評生成
- FR‑03 レポートUI表示
- FR‑04 シェアURL発行

### 4.2 スコープ外（将来リリース）

- 数値スコアリング (BRISQUE 等)
- ヒートマップ可視化
- Lightroom / Capture Oneプラグイン
- 多言語対応・フォトコンテストAPI連携
- ログイン/ユーザー管理

## 5. システム構成

### システム構成図

┌──────────────────────────────────────────────┐
│ ① ブラウザ（PC/スマホ） │
│ – React UI (Next.js) │
└──────────────┬─────────────────────────────┘
│ HTTPS
▼
┌──────────────────────────────────────────────┐
│ ② Next.js (App Router / RSC) │
│ ├─ Edge Runtime …… ページ描画・フォーム送信 │
│ └─ Server Actions │
│ • /api/upload → Edge Function │
│ • /api/critique → Node Function │
│ • /api/ogp → Edge Function │
└──────────────┬─────────────────────────────┘
│ (内部呼び出し)
▼
┌────────────────────────┐
│ ③ Edge Function │ 画像リサイズ＋EXIF
└────────┬───────────────┘
│ kv.set()
▼
┌────────────────────────┐
│ ④ Vercel KV │ 24h 期限付きメタデータ
└────────┬───────────────┘
│ kv.get()/set()
▼
┌────────────────────────┐
│ ⑤ Node Function │ Vision → GPT-4o
└────────┬───────────────┘
│ OpenAI API
▼
┌────────────────────────┐
│ ⑥ OpenAI API │ 画像＋講評生成
└────────────────────────┘

【運用】Vercel Cron (1 日 1 回) → KV 内の 24h 超データを削除

### コンポーネント一覧と役割

| ID  | コンポーネント                    | 主な責務                                    | 実装／デプロイ                            |
| --- | --------------------------------- | ------------------------------------------- | ----------------------------------------- |
| ①   | **ブラウザ UI**                   | 画像アップロード、講評カード表示、シェア    | Next.js 15 (App Router／RSC)              |
| ②   | **Next.js サーバー層**            | Server Actions 経由でバックエンド呼び出し   | Vercel Edge Runtime                       |
| ③   | **Edge Function `/api/upload`**   | 画像を 1024 px に縮小、EXIF 抽出、KV へ保存 | Vercel Edge Function                      |
| ④   | **Vercel KV**                     | 短縮 URL と講評 JSON を 24 h 保存           | 無料枠 3 GB                               |
| ⑤   | **Node Function `/api/critique`** | Vision → GPT-4o 呼び出し、講評 JSON 整形    | Vercel Node Function (`runtime='nodejs'`) |
| ⑥   | **OpenAI API**                    | 画像解析＋LLM で講評生成                    | 従量課金                                  |
| —   | **Edge Function `/api/ogp`**      | Satori＋Resvg で OGP 画像生成               | Vercel Edge Function                      |
| —   | **Vercel Cron**                   | 24 h 経過データの自動削除                   | 1 回/日 無料                              |

### リクエストフロー

- **アップロード**
  ユーザーが画像を選択 → `upload()` Server Action → Edge Function が縮小＋EXIF 抽出 → KV に暫定保存 → フロントへプレビュー返却
- **講評生成**
  フロントが `critique()` Server Action を呼び出し → Node Function が OpenAI Vision → GPT-4o へ送信 → 講評 JSON 受信 → KV 更新 → フロント 3 カード UI 描画
- **シェア**
  ユーザーが「シェア」クリック → `/api/ogp?id=…` で OGP PNG を Edge Function が生成 → ショートリンク (kv.get) をコピー表示
- **自動クリーンアップ**
  Vercel Cron が 24 h 以上前の KV キーを削除し、ストレージコストを抑制

## 6. 機能要件

| ID        | 要件             | 説明                                                                       | 優先度 | 受入条件 (Acceptance Criteria)                                                    |
| --------- | ---------------- | -------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------- |
| **FR-01** | 画像アップロード | PC: Drag&Drop, SP: Camera; 画像は即時 1,024 px にリサイズし⾃動プレビュー  | Must   | - 3000 × 2000px/5 MB の画像が < 1 s でプレビュー生成される- 複数選択は不可        |
| **FR-02** | EXIF 抽出        | JPEG/HEIC の主要タグを抽出 (`FNumber`, `ExposureTime`, `ISO`, `LensModel`) | Must   | - 抽出結果がレポート UI に表示される- EXIF なしの場合は「情報なし」を表示         |
| **FR-03** | AI 講評 API      | OpenAI Vision → GPT-4o (function calling) で講評 JSON を返却               | Must   | - 3 軸 × 各 2–3 行の日本語講評を返す- API 失敗時はリトライ 1 回後にエラートースト |
| **FR-04** | レポート UI      | shadcn/ui で講評カード 3 枚＋EXIF 表を表示                                 | Must   | - カードが Skeleton → Fade-in 表示- PC/モバイルでレスポンシブ                     |
| **FR-05** | シェア URL 発行  | Vercel KV に JSON を保存し、コード 8 桁で短縮 URL 生成                     | Should | - `/r/{code}` で公開ページが閲覧可能- OGP 画像（講評サマリ付き）が自動生成        |
| **FR-06** | GitHub OAuth     | NextAuth で GitHub ログイン／トークン保存                                  | Should | - `Sign in with GitHub` ボタンで認証- ゲスト閲覧時はアップロード以外を不可        |

## 7. 非機能要件

| カテゴリ             | ID     | 要件                            | 指標／基準                              |
| -------------------- | ------ | ------------------------------- | --------------------------------------- |
| **性能**             | NFR-01 | 画像 1 枚アップロード〜講評表示 | **P95 < 3 s**                           |
|                      | NFR-02 | 共有ページ初回表示              | **LCP < 2.5 s**                         |
| **信頼性**           | NFR-03 | アップタイム                    | **99.5 % / 月**                         |
| **セキュリティ**     | NFR-04 | 画像自動削除                    | **24 h 以内** (Cron)                    |
| **コスト**           | NFR-05 | OpenAI 月額                     | **USD 50 / 月** 上限                    |
| **可観測性**         | NFR-06 | ログ                            | Vercel Logs + Sentry                    |
| **アクセシビリティ** | NFR-07 | WCAG                            | **AA** (色コントラスト・キーボード操作) |

## 8. UI/UX要件

| デバイス区分      | サポート OS              | テスト対象ブラウザ               | 最低表示解像度・備考                                    |
| ----------------- | ------------------------ | -------------------------------- | ------------------------------------------------------- |
| **PC**            | Windows 11 / macOS 15    | Chrome / Edge / Firefox / Safari | 1280×720 px 以上                                        |
| **Smart-phone**   | iOS 18/17・Android 15/14 | Safari / Chrome                  | 横幅 360 px 以上（iPhone SE2 相当）<br>ダークモード対応 |
| **Tablet (参考)** | iPadOS 18/17             | 同上                             | 768 px 以上で PC レイアウト適用                         |
|                   |                          |                                  |                                                         |

> すべて **最新版ブラウザ** を対象とする。

## 9. リスクと対策

| リスク            | 対策                                                    |
| ----------------- | ------------------------------------------------------- |
| OpenAI API コスト | 1024 px へ縮小 / 結果を KV キャッシュ / 月額上限設定    |
| レスポンス遅延    | Edge Function + Vision/GPT 並列呼び出し                 |
| プライバシー      | 顔ぼかしオプション / 画像自動削除 (24 h) / 利用規約明示 |
