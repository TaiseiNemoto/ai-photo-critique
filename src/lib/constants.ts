/**
 * アプリケーション全体で使用する定数定義
 * タイミング、メッセージ等の一元管理
 */

export const TIMING = {
  TOAST_SUCCESS_DURATION: 1500,
  TOAST_INFO_DURATION: 2000,
  TOAST_ERROR_DURATION: 3000,
  NAVIGATION_DELAY: 1500,
} as const;

export const MESSAGES = {
  CRITIQUE_LOADING: "AI講評を生成中...",
  CRITIQUE_LOADING_DESC: "技術・構図・色彩を分析しています",
  CRITIQUE_SUCCESS: "講評が完了しました",
  CRITIQUE_SUCCESS_DESC: "結果ページに移動します",
  CRITIQUE_ERROR: "講評生成に失敗しました",
  CRITIQUE_NETWORK_ERROR: "ネットワークエラーが発生しました",
  CRITIQUE_NETWORK_DESC: "ネットワーク接続を確認してください",
} as const;
