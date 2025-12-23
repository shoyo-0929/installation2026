/**
 * ログイン成功後の画面コンポーネント
 *
 * ユーザーの投稿内容を表示し、点線をなぞって「稲穂の心」を
 * アートスペースに送る画面。
 */
'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { PhraseResponse } from '@/lib/api';

export interface AfterLoginScreenProps {
  /** 会員の投稿情報 */
  phraseData: PhraseResponse;
}

/**
 * ログイン成功後のメイン画面
 *
 * 機能:
 * - 投稿内容の表示
 * - 稲穂のアイコン表示
 * - 背景チェンジボタン
 * - 点線のトレース領域
 */
export function Main({ phraseData }: AfterLoginScreenProps) {
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  // 背景のカラーバリエーション（デザインに合わせて追加可能）
  const backgrounds = [
    'bg-gradient-to-b from-[#ffa366] to-[#ff9966]', // オレンジグラデーション
    'bg-gradient-to-b from-[#dbeaee] to-[#b8d4e0]', // 水色グラデーション
    'bg-gradient-to-b from-[#ffd4e5] to-[#ffb3d9]', // ピンクグラデーション
  ];

  const handleBackgroundChange = () => {
    setBackgroundIndex((prev) => (prev + 1) % backgrounds.length);
  };

  const { myPhrase } = phraseData;

  return (
    <div
      className={`relative min-h-screen ${backgrounds[backgroundIndex]} overflow-hidden transition-colors duration-500`}
    >
      <main className="relative flex flex-col items-center px-4 py-9 min-h-screen">
        {/* 上部のメッセージボックス */}
        <div className="bg-white rounded-[13px] px-4 py-4 mb-4 max-w-100 w-full">
          <p className="text-center text-[16px] md:text-[18px] leading-relaxed text-black">
            「稲穂の心」を育んでいただいた功徳を<br/>アートスペースに送りましょう！
          </p>
        </div>

        {/* スマートフォンと指示テキスト */}
        <div className="flex items-center gap-4 mb-12 max-w-[343px] w-full">
          {/* スマートフォンのイラスト */}
          <div className="relative w-[103px] h-[102px] flex-shrink-0">
            <Image
              src="/images/smartphone-illustration.png"
              alt=""
              width={103}
              height={102}
              className="w-full h-full object-contain"
            />
          </div>

          {/* 指示テキスト */}
          <div className="flex-1">
            <p className="text-[23px] font-bold text-[#262626] leading-snug">
              想いを込めて
              <br />
              点線をなぞって
              <br />
              みましょう！
            </p>
          </div>
        </div>

        {/* 投稿内容カード（点線枠付き） */}
        <div className="relative max-w-[343px] w-full mb-auto">
          {/* 点線の枠 */}
          <div
            className="absolute inset-0 rounded-[80px] border-4 border-dashed border-white/70 pointer-events-none"
            style={{ padding: '20px' }}
          />

          {/* カード内容 */}
          <div className="relative py-12 px-8 flex flex-col items-center">
            {/* 稲穂のアイコン */}
            <div className="w-[102px] h-[102px] mb-6">
              <Image
                src="/images/inaho-icon.png"
                alt="稲穂のアイコン"
                width={102}
                height={102}
                className="w-full h-full object-contain"
              />
            </div>

            {/* 投稿テキスト */}
            <div className="text-center mb-4">
              <p className="text-[19px] text-[#6d4000] leading-relaxed whitespace-pre-wrap">
                {myPhrase.text1}
              </p>
            </div>

            {/* 会員名 */}
            <p className="text-[22px] font-bold text-[#262626] mb-1">
              {myPhrase.name}
            </p>

            {/* 支部（今後実装: 支部コードから支部名に変換） */}
            <p className="text-[22px] font-bold text-[#262626]">
              支部コード: {myPhrase.branch}
            </p>
          </div>
        </div>

        {/* 背景チェンジボタン */}
        <button
          onClick={handleBackgroundChange}
          className="fixed bottom-8 right-8 flex flex-col items-center gap-2 transition-transform hover:scale-110 active:scale-95"
          aria-label="背景を変更"
        >
          {/* アイコン */}
          <div className="w-14 h-14 bg-[#ff6b35] rounded-full flex items-center justify-center shadow-lg">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M12 4V2M12 22v-2M20 12h2M4 12H2M17.657 6.343l1.414-1.414M4.929 19.071l1.414-1.414M17.657 17.657l1.414 1.414M4.929 4.929l1.414 1.414"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="4" fill="currentColor" />
            </svg>
          </div>

          {/* ラベル */}
          <span className="text-[15px] font-bold text-black">
            背景チェンジ
          </span>
        </button>
      </main>
    </div>
  );
}
