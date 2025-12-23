/**
 * バリデーション関数
 * フォーム入力値の検証に使用する
 */

/**
 * 8桁の数字かどうかを判定する
 * 会員番号（CA番号）と生年月日（YYYYMMDD）の形式チェックに使用
 *
 * @param value - 検証する文字列
 * @returns 8桁の数字であれば true
 */
export function is8DigitNumber(value: string): boolean {
  return /^\d{8}$/.test(value);
}
