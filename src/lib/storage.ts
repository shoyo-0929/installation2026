/**
 * 認証情報のローカルストレージ管理
 *
 * 「次回以降の入力を省略する」機能のために、
 * 会員番号と生年月日を端末内に保存する。
 * 展示/共有端末の可能性があるため、TTL（有効期限）で自動削除する。
 */
'use client';

/** localStorage のキー定義 */
const LS_KEYS = {
  remember: 'installation2026.remember', // 保存同意フラグ
  mid: 'installation2026.savedMid', // 会員番号
  birth: 'installation2026.savedBirthDate', // 生年月日
  savedAt: 'installation2026.savedAt', // 保存日時（TTL計算用）
} as const;

/** 保存データの有効期限（日数） */
export const REMEMBER_TTL_DAYS = 1;

/** 有効期限（ミリ秒） */
const REMEMBER_TTL_MS = REMEMBER_TTL_DAYS * 24 * 60 * 60 * 1000;

/**
 * 保存された認証情報をすべて削除する
 * ユーザーが「保存する」のチェックを外した時に呼ばれる
 */
export function clearRememberedCredentials() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(LS_KEYS.remember);
  localStorage.removeItem(LS_KEYS.mid);
  localStorage.removeItem(LS_KEYS.birth);
  localStorage.removeItem(LS_KEYS.savedAt);
}

/**
 * 認証情報を localStorage に保存する
 *
 * @param mid - 会員番号（CA番号）
 * @param birthDate - 生年月日（YYYYMMDD形式）
 */
export function saveRememberedCredentials(mid: string, birthDate: string) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LS_KEYS.remember, '1');
  localStorage.setItem(LS_KEYS.mid, mid);
  localStorage.setItem(LS_KEYS.birth, birthDate);
  localStorage.setItem(LS_KEYS.savedAt, String(Date.now()));
}

/**
 * 保存された認証情報を読み込む
 *
 * - 同意済み（remember フラグあり）かつ TTL 内なら保存値を返す
 * - 期限切れの場合は自動削除して null を返す
 *
 * @returns 保存データがあれば { mid, birthDate }、なければ null
 */
export function loadRememberedCredentials(): { mid: string; birthDate: string } | null {
  if (typeof localStorage === 'undefined') return null;

  // 保存同意フラグをチェック
  const remember = localStorage.getItem(LS_KEYS.remember) === '1';
  if (!remember) return null;

  // TTL（有効期限）をチェック
  const savedAtRaw = localStorage.getItem(LS_KEYS.savedAt);
  const savedAt = savedAtRaw ? Number(savedAtRaw) : NaN;
  if (!Number.isFinite(savedAt) || Date.now() - savedAt > REMEMBER_TTL_MS) {
    // 期限切れなので削除
    clearRememberedCredentials();
    return null;
  }

  const mid = localStorage.getItem(LS_KEYS.mid) ?? '';
  const birthDate = localStorage.getItem(LS_KEYS.birth) ?? '';
  return { mid, birthDate };
}
