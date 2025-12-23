/**
 * ログインフォームコンポーネント
 *
 * インスタレーションのトップページに表示されるメインフォーム。
 * 会員番号と生年月日を入力し、認証を行う。
 */
'use client';

import Image from 'next/image';
import { sizeClamp } from '@/lib/css';
import { REMEMBER_TTL_DAYS } from '@/lib/storage';
import { useLoginForm } from '@/hooks/useLoginForm';
import { TextFieldCard } from './TextFieldCard';
import { BackgroundPattern } from './BackgroundPattern';

/**
 * ログインフォーム
 * - 会員番号（CA番号）入力
 * - 生年月日入力
 * - 「保存する」チェックボックス
 * - 送信ボタン
 */
export function LoginForm() {
  const {
    memberId,
    birthDate,
    rememberMe,
    isSubmitting,
    memberIdError,
    birthDateError,
    handleMemberIdChange,
    handleBirthDateChange,
    handleRememberMeChange,
    handleSubmit,
  } = useLoginForm();

  return (
    <div className="relative min-h-screen bg-[#fff462] overflow-hidden">
      {/* 背景のクロスパターン */}
      <BackgroundPattern />

      <main className="relative z-10 flex flex-col items-center px-4 py-4 min-h-screen">
        {/* ロゴ画像 */}
        <h1 style={{ width: sizeClamp(340, 500) }} className="mb-6">
          <Image
            src="/images/logo.png"
            alt="心の光を見つける 12の物語 インスタレーション"
            width={343}
            height={187}
            className="w-full h-auto"
            priority
          />
        </h1>

        {/* 認証フォーム */}
        <form onSubmit={handleSubmit} className="w-full max-w-120 space-y-0">
          {/* 会員番号入力欄（カードの上部） */}
          <TextFieldCard
            variant="top"
            label="会員番号(CA番号)を入力ください。"
            value={memberId}
            onChange={handleMemberIdChange}
            placeholder="会員番号(CA番号)を入力ください。"
            error={memberIdError}
          />

          {/* 生年月日入力欄（カードの下部） */}
          <TextFieldCard
            variant="bottom"
            label="生年月日を入力ください。"
            value={birthDate}
            onChange={handleBirthDateChange}
            placeholder="20251231"
            error={birthDateError}
            errorClassName="mt-3 text-center text-red-600 text-sm"
          />

          {/* 「保存する」チェックボックス */}
          <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => handleRememberMeChange(e.target.checked)}
              className="mt-1"
            />
            <span>
              次回以降の入力を省略するため、会員番号と生年月日をこの端末に保存する（
              {REMEMBER_TTL_DAYS}日後に自動削除）
            </span>
          </label>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-6 bg-[#2d9cdb] text-white font-medium py-4 rounded-full hover:bg-[#2589c5] transition-colors disabled:opacity-60 disabled:pointer-events-none"
          >
            {isSubmitting ? '送信中…' : '次へ'}
          </button>
        </form>
      </main>
    </div>
  );
}
