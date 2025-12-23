/**
 * 言語設定ユーティリティ
 * ブラウザの言語設定から適切な表示言語を判定する
 */
'use client';

/** 対応言語の型定義 */
export type InstallationLang = 'ja' | 'en' | 'pt';

/**
 * ユーザーの優先言語を取得する
 *
 * ブラウザの言語設定（navigator.languages）を参照し、
 * 対応言語（日本語・英語・ポルトガル語）のうち最初に一致したものを返す。
 * 一致するものがなければ日本語をデフォルトとする。
 *
 * 主な用途: API が 400 エラー（投稿なし）を返した場合に、
 * リダイレクト先の言語を決定するために使用
 *
 * @returns 'ja' | 'en' | 'pt'
 */
export function getPreferredLang(): InstallationLang {
  // SSR 環境では navigator が存在しないため日本語をデフォルト
  if (typeof navigator === 'undefined') return 'ja';

  // ブラウザの言語設定を取得（優先順位順）
  const langs = (navigator.languages?.length
    ? navigator.languages
    : [navigator.language]
  ).map((l) => l.toLowerCase());

  // 対応言語を優先順にチェック
  for (const l of langs) {
    if (l.startsWith('ja')) return 'ja';
    if (l.startsWith('pt')) return 'pt';
    if (l.startsWith('en')) return 'en';
  }

  return 'ja';
}
