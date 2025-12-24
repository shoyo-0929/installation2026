/**
 * ログイン成功後のページ
 *
 * sessionStorage から投稿データを読み込み、
 * AfterLoginScreen コンポーネントを表示する。
 */
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Main } from '@/components/Main';
import type { PhraseResponse } from '@/lib/api';

import { bodaiList } from '@/data/bodaiList';

export default function AfterLoginPage() {
  const router = useRouter();
  const [phraseData, setPhraseData] = useState<PhraseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // sessionStorage から投稿データを読み込む
    const phraseJson = sessionStorage.getItem('installation2026.phrase');

    if (!phraseJson) {
      // データがない場合はログインページにリダイレクト
      router.replace('/');
      return;
    }

    try {
      const data = JSON.parse(phraseJson) as PhraseResponse;
      setPhraseData(data);
    } catch (error) {
      console.error('データの取得に失敗しました:', error);
      router.replace('/');
      return;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
  return <Main phraseData={phraseData} bodai={bodaiList} />;
}
