/**
 * Phrase API クライアント
 * 会員の投稿情報を取得するための API 呼び出しを行う
 */

/** API のベース URL */
export const PHRASE_API_BASE = 'https://printmyphrase-77mwry67iq-an.a.run.app/';

/**
 * Phrase API のレスポンス型
 * 成功時に返される会員の投稿情報
 */
export type PhraseResponse = {
  /** 言語コード（ja: 日本語, en: 英語, pt: ポルトガル語） */
  lang: 'ja' | 'en' | 'pt' | string;
  /** 会員の投稿データ */
  myPhrase: {
    /** 菩提（カテゴリID） */
    bodai: number;
    /** 投稿テキスト */
    text1: string;
    /** 会員名 */
    name: string;
    /** 支部コード */
    branch: number;
  };
};

/**
 * 会員の投稿情報を取得する
 *
 * @param mid - 会員番号（CA番号）
 * @param signal - リクエストのキャンセル用 AbortSignal
 * @returns 成功時は { ok: true, data } 、失敗時は { ok: false, status }
 *
 * @example
 * const result = await fetchPhrase('12345678');
 * if (result.ok) {
 *   console.log(result.data.myPhrase.text1);
 * }
 */
export async function fetchPhrase(
  mid: string,
  signal?: AbortSignal
): Promise<{ ok: true; data: PhraseResponse } | { ok: false; status: number }> {
  const url = new URL(PHRASE_API_BASE);
  url.searchParams.set('mid', mid);

  const res = await fetch(url.toString(), { signal });

  if (!res.ok) {
    return { ok: false, status: res.status };
  }

  const data = (await res.json()) as PhraseResponse;
  return { ok: true, data };
}
