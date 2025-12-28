/**
 * ログイン成功後のページ
 *
 * 機能:
 * - セッションストレージからログイン情報を取得・検証
 * - メインコンポーネントの表示
 * - URLパラメータによる設定（場所コードなど）の反映
 */
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Main } from '@/components/main/Main';
import type { PhraseResponse } from '@/lib/api';

import { bodaiList } from '@/data/bodaiList';

/** デフォルトの場所コード（中京以外として0を設定） */
const DEFAULT_PLACE = '0';

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-black font-bold text-xl">読み込み中...</div>
    </div>
  );
}

function AfterLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phraseData, setPhraseData] = useState<PhraseResponse | null>(null);
  const [mid, setMid] = useState<string>('');
  const [spot, setSpot] = useState<string>(DEFAULT_PLACE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // sessionStorage から投稿データと会員番号を読み込む
    // 注意: セッションストレージはブラウザを閉じると消える一時的な保管場所
    const phraseJson = sessionStorage.getItem('installation2026.phrase');
    const savedMid = sessionStorage.getItem('installation2026.mid');

    if (!phraseJson || !savedMid) {
      // 必須データがない場合は不正な遷移とみなし、ログインページへリダイレクト
      router.replace('/');
      return;
    }

    try {
      const data = JSON.parse(phraseJson) as PhraseResponse;
      setPhraseData(data);
      setMid(savedMid);

      // URLクエリパラメータから場所コードを取得（例: ?place=51）
      // 会場ごとの設定切り替えに使用
      const placeParam = searchParams.get('place');
      if (placeParam) {
        setSpot(placeParam);
      }
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      router.replace('/');
      return;
    } finally {
      setIsLoading(false);
    }
  }, [router, searchParams]);

  // データ読み込み中または検証中のローディング表示
  if (isLoading) {
    return <LoadingFallback />;
  }

  // データ検証失敗などによりデータがない場合は何も表示しない（リダイレクト待機）
  if (!phraseData) {
    return null;
  }

  // 検証成功後、メインアプリケーションコンポーネントを描画
  return (
    <Main phraseData={phraseData} bodai={bodaiList} mid={mid} spot={spot} />
  );
}

export default function AfterLoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AfterLoginPageContent />
    </Suspense>
  );
}
