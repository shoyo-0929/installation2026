/**
 * テキスト入力カードコンポーネント
 *
 * ログインフォームで使用する、カード形式のテキスト入力欄。
 * 上下で連結されたカードのデザインに対応（variant で切り替え）。
 */
'use client';

/**
 * 必須マーク
 * 入力欄のラベル下に表示される「*必須」の表示
 */
function RequiredMark() {
  return <p className="text-red-500 text-sm mb-3 ml-5">*必須</p>;
}

/**
 * フィールドエラー表示
 * 入力エラー時に表示されるエラーメッセージ
 */
function FieldError({
  children,
  className = 'mt-2 text-sm text-red-600',
}: {
  children: string;
  className?: string;
}) {
  return <p className={className}>{children}</p>;
}

/**
 * テキスト入力カード
 *
 * @param variant - カードの位置（'top': 上部カード, 'bottom': 下部カード）
 * @param label - 入力欄のラベル
 * @param value - 入力値
 * @param onChange - 値変更時のコールバック
 * @param placeholder - プレースホルダーテキスト
 * @param error - エラーメッセージ（null の場合は非表示）
 * @param errorClassName - エラーメッセージのカスタムスタイル
 */
export function TextFieldCard({
  variant,
  label,
  value,
  onChange,
  placeholder,
  error,
  errorClassName,
}: {
  variant: 'top' | 'bottom';
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  error: string | null;
  errorClassName?: string;
}) {
  // variant に応じてカードの角丸と border を切り替え
  const cardClassName =
    variant === 'top'
      ? 'bg-white rounded-t-3xl border border-b-0 border-[#d9d9d9] p-6 pb-0'
      : 'bg-white rounded-b-3xl border border-t-0 border-[#d9d9d9] p-6';

  return (
    <div className={cardClassName}>
      {/* ラベル（■ マーク付き） */}
      <div className="flex items-start gap-0.5 mb-1">
        <span className="text-black font-medium">■</span>
        <div>
          <span className="text-black font-medium">{label}</span>
        </div>
      </div>

      {/* 必須マーク */}
      <RequiredMark />

      {/* テキスト入力欄（数字キーボード対応） */}
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[#d9d9d9] rounded-lg px-4 py-3 text-gray-600 placeholder-gray-400 focus:outline-none focus:border-gray-400"
        required
      />

      {/* エラーメッセージ（あれば表示） */}
      {error ? <FieldError className={errorClassName}>{error}</FieldError> : null}
    </div>
  );
}
