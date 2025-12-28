/**
 * デバッグ用ページ
 *
 * 認証フローを通さずにメインコンポーネントの動作確認を行うための画面。
 * 以下の機能を提供する：
 * - 菩提（Bodai）の切り替え
 * - 背景パターンの切り替え（Mainコンポーネント内の機能）
 * - モックデータを使用した表示確認
 */
'use client';

import { useState } from 'react';
import { Main } from '@/components/main/Main';
import { bodaiList } from '@/data/bodaiList';

export default function DebugPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentBodai = bodaiList[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bodaiList.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bodaiList.length) % bodaiList.length);
  };

  /** モック用の投稿データ */
  const mockPhraseData = {
    lang: 'ja',
    myPhrase: {
      bodai: currentBodai.id,
      text1:
        '今年は自分から出会い、心を開く大切さを教えていただきました！\n\n来年も頑張ります！',
      name: '岡田 昇陽',
      branch: 3, // 東京本部
    },
  };

  return (
    <>
      <Main
        key={currentBodai.id} // 菩提切り替え時に強制再レンダリング
        phraseData={mockPhraseData}
        bodai={bodaiList}
        mid="99999999"
        spot="51"
        showDebugControls // デバッグ用コントロール（背景切り替え等）を有効化
      />

      {/* デバッグ用ナビゲーションコントロール（菩提切り替え） */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
        <button
          onClick={handlePrev}
          className="bg-black/50 text-white px-4 py-2 rounded-full hover:bg-black/70 backdrop-blur-sm"
        >
          ← 前の菩提
        </button>
        <span className="bg-black/50 text-white px-4 py-2 rounded-full backdrop-blur-sm">
          {currentIndex + 1} / {bodaiList.length}: {currentBodai.name}
        </span>
        <button
          onClick={handleNext}
          className="bg-black/50 text-white px-4 py-2 rounded-full hover:bg-black/70 backdrop-blur-sm"
        >
          次の菩提 →
        </button>
      </div>
    </>
  );
}
