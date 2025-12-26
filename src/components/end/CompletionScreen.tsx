'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { sizeClamp } from '@/lib/css';
import { BackgroundPattern } from '@/components/ui/BackgroundPattern';
import logo from '@/assets/img/logo.png';

import mainTitle from '@/assets/img/main-title.png';

type CompletionScreenProps = {
  onBackToTop?: () => void;
};

export function CompletionScreen({ onBackToTop }: CompletionScreenProps) {
  const router = useRouter();

  const handleBackToTop = () => {
    if (onBackToTop) {
      onBackToTop();
    } else {
      router.push('/');
    }
  };

  const handleViewOthers = () => {
    // リンク先は未定のためブランク
  };

  return (
    <div className="relative min-h-screen bg-[#fff462] overflow-hidden">
      {/* 背景のクロスパターン */}
      <BackgroundPattern />

      <main className="relative z-10 flex flex-col items-center px-4 pt-4 pb-8 min-h-screen">
        {/* ロゴ画像 */}
        <div style={{ width: sizeClamp(340, 500) }} className="mb-12">
          <Image
            src={mainTitle}
            alt="心の光を見つける 12の物語 インスタレーション"
            className="w-full h-auto"
            priority
          />
        </div>

        {/* 完了メッセージ */}
        <h2 className="text-[22px] font-bold text-[#171717] text-center mb-16 leading-relaxed">
          アートスペースに
          <br />
          功徳を送りました！
        </h2>

        {/* ボタン群 */}
        <div className="w-full max-w-[343px] space-y-4">
          {/* トップに戻るボタン（青系） */}
          <button
            onClick={handleBackToTop}
            className="w-full bg-[#2d9cdb] text-white font-medium py-4 rounded-full hover:bg-[#2589c5] transition-colors"
          >
            トップに戻る
          </button>

          {/* 他の人の功徳を送るボタン（オレンジ枠） */}
          <button
            onClick={handleViewOthers}
            className="w-full bg-white border-2 border-[#ef7314] text-[#ef7314] font-medium py-4 rounded-full hover:bg-[#fff8e6] transition-colors"
          >
            他の人の功徳を送る
          </button>
        </div>

        {/* GLAフッター */}
        <div className="mt-auto pt-8 w-[60px] mx-auto">
          <Image src={logo} alt="GLA" className="w-full h-auto" priority />
        </div>
      </main>
    </div>
  );
}
