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

// ============================================================
// 画像アップロード API
// ============================================================

/** 画像アップロード API の URL（環境変数で設定可能） */
export const UPLOAD_API_URL =
  process.env.NEXT_PUBLIC_UPLOAD_API_URL || '/api/upload';
  // process.env.NEXT_PUBLIC_UPLOAD_API_URL || 'https://rashinbanban.jp/2026/api/pub.php';

/** 画像アップロード時に送信するメタデータ */
export type UploadMetadata = {
  /** 会員番号（CA番号） */
  mid: string;
  /** 氏名 */
  name: string;
  /** 菩提心番号（1〜12） */
  bodai: string;
  /** 場所コード（中京=51など） */
  spot: string;
};

/** 画像アップロードのレスポンス */
export type UploadResponse = {
  success: boolean;
  message?: string;
  imageUrl?: string;
  error?: string;
};

/**
 * 切り抜き画像をサーバーにアップロードする
 *
 * @param imageBlob - 切り抜き画像の Blob
 * @param metadata - 会員情報などのメタデータ
 * @returns アップロード結果
 *
 * @example
 * const result = await uploadCutoutImage(blob, {
 *   mid: '12345678',
 *   name: '岡田 昇陽',
 *   bodai: '5',
 *   spot: '51',
 * });
 */
export async function uploadCutoutImage(
  imageBlob: Blob,
  metadata: UploadMetadata
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('image', imageBlob, 'cutout.png');
  formData.append('mid', metadata.mid);
  formData.append('name', metadata.name);
  formData.append('bodai', metadata.bodai);
  formData.append('spot', metadata.spot);

  try {
    const response = await fetch(UPLOAD_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `サーバーエラーが発生しました（${response.status}）`,
      };
    }

    const result = (await response.json()) as UploadResponse;
    return result;
  } catch (error) {
    console.error('アップロードに失敗しました:', error);
    // ブラウザのネイティブエラーメッセージを日本語に変換
    let errorMessage = '不明なエラーが発生しました';
    if (error instanceof Error) {
      if (error.message === 'Failed to fetch') {
        errorMessage = 'サーバーに接続できませんでした。ネットワーク接続を確認してください。';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'ネットワークエラーが発生しました。';
      } else if (error.message.includes('timeout')) {
        errorMessage = '接続がタイムアウトしました。';
      } else {
        errorMessage = error.message;
      }
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}
