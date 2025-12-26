/**
 * ログイン成功後のページ
 *
 * sessionStorage から投稿データを読み込み、
 * AfterLoginScreen コンポーネントを表示する。
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Main } from '@/components/Main';
import type { PhraseResponse } from '@/lib/api';

import { bodaiList } from '@/data/bodaiList';

/** デフォルトの場所コード（中京以外） */
const DEFAULT_PLACE = '0';

export default function AfterLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phraseData, setPhraseData] = useState<PhraseResponse | null>(null);
  const [mid, setMid] = useState<string>('');
  const [spot, setSpot] = useState<string>(DEFAULT_PLACE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // sessionStorage から投稿データと会員番号を読み込む
    const phraseJson = sessionStorage.getItem('installation2026.phrase');
    const savedMid = sessionStorage.getItem('installation2026.mid');

    if (!phraseJson || !savedMid) {
      // データがない場合はログインページにリダイレクト
      router.replace('/');
      return;
    }

    try {
      const data = JSON.parse(phraseJson) as PhraseResponse;
      setPhraseData(data);
      setMid(savedMid);

      // URLクエリから場所コードを取得（例: ?place=51）
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

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  // データがない場合は何も表示しない（リダイレクト中）
  if (!phraseData) {
    return null;
  }

  // メイン画面を表示
  return <Main phraseData={phraseData} bodai={bodaiList} mid={mid} spot={spot} />;
}
