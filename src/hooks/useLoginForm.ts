/**
 * ログインフォームのカスタムフック
 *
 * 会員番号・生年月日の入力、バリデーション、API送信、
 * 認証情報の保存/読み込みなど、フォームのロジックをまとめて管理する
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPhrase } from '@/lib/api';
import { getPreferredLang } from '@/lib/lang';
import { playButtonSound } from '@/lib/sound';
import {
  clearRememberedCredentials,
  loadRememberedCredentials,
  saveRememberedCredentials,
} from '@/lib/storage';
import { is8DigitNumber } from '@/lib/validators';

/**
 * ログインフォームの状態とハンドラを提供するフック
 *
 * @returns フォームの状態と各種ハンドラ
 */
export function useLoginForm(searchParams: URLSearchParams | null) {
  const router = useRouter();

  // ----- フォームの状態 -----
  const [memberId, setMemberId] = useState(''); // 会員番号（CA番号）
  const [birthDate, setBirthDate] = useState(''); // 生年月日（YYYYMMDD）
  const [rememberMe, setRememberMe] = useState(false); // 「保存する」チェック状態
  const [isSubmitting, setIsSubmitting] = useState(false); // 送信中フラグ

  // ----- エラー状態 -----
  const [memberIdError, setMemberIdError] = useState<string | null>(null);
  const [birthDateError, setBirthDateError] = useState<string | null>(null);

  // 重複送信防止用の AbortController
  const submitAbortRef = useRef<AbortController | null>(null);

  // ----- 初期化: 保存済み認証情報の読み込み -----
  useEffect(() => {
    const saved = loadRememberedCredentials();
    if (!saved) return;

    // 保存データがあればフォームに自動入力
    setRememberMe(true);
    if (saved.mid) setMemberId(saved.mid);
    if (saved.birthDate) setBirthDate(saved.birthDate);
  }, []);

  // ----- 入力ハンドラ -----

  /** 会員番号の変更ハンドラ（入力時にエラーをクリア） */
  const handleMemberIdChange = (next: string) => {
    setMemberId(next);
    if (memberIdError) setMemberIdError(null);
  };

  /** 生年月日の変更ハンドラ（入力時にエラーをクリア） */
  const handleBirthDateChange = (next: string) => {
    setBirthDate(next);
    if (birthDateError) setBirthDateError(null);
  };

  /** 「保存する」チェックボックスの変更ハンドラ */
  const handleRememberMeChange = (checked: boolean) => {
    setRememberMe(checked);
    // チェックを外した瞬間に保存データを削除
    if (!checked) {
      clearRememberedCredentials();
    }
  };

  // ----- フォーム送信 -----

  /**
   * フォーム送信ハンドラ
   * 1. 入力バリデーション
   * 2. API呼び出し
   * 3. 結果に応じた処理（成功→次画面、エラー→表示）
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const mid = memberId.trim();
    const birth = birthDate.trim();

    // ----- バリデーション -----
    if (!is8DigitNumber(mid)) {
      setMemberIdError('会員番号（CA番号）は8桁の数字で入力してください。');
      setBirthDateError(null);
      return;
    }
    if (!is8DigitNumber(birth)) {
      setBirthDateError('生年月日は8桁で入力してください。');
      return;
    }

    // ----- 重複送信防止 -----
    // 前回のリクエストが残っていたら中断
    submitAbortRef.current?.abort();
    const abortController = new AbortController();
    submitAbortRef.current = abortController;

    // ----- 送信開始 -----
    playButtonSound();
    setIsSubmitting(true);
    setBirthDateError(null);
    setMemberIdError(null);

    try {
      const result = await fetchPhrase(mid, abortController.signal);

      // ----- エラーハンドリング -----
      if (!result.ok) {
        // 400: 投稿が見つからない → 外部ページへリダイレクト
        if (result.status === 400) {
          const lang = getPreferredLang();
          window.location.assign(`https://rashinbanban.jp/2026/${lang}/`);
          return;
        }
        // 401: 会員番号が存在しない
        if (result.status === 401) {
          setMemberIdError('会員番号が見つかりませんでした。入力内容をご確認ください。');
          setBirthDateError(null);
          return;
        }
        // その他のエラー
        setBirthDateError('通信に失敗しました。時間をおいて再度お試しください。');
        return;
      }

      // ----- 成功処理 -----
      // 次画面で使用するため sessionStorage に保存
      sessionStorage.setItem('installation2026.mid', mid);
      sessionStorage.setItem('installation2026.birthDate', birth);
      sessionStorage.setItem('installation2026.phrase', JSON.stringify(result.data));

      // 「保存する」にチェックがある場合は localStorage にも保存
      if (rememberMe) {
        saveRememberedCredentials(mid, birth);
      }

      // ログイン成功後の画面に遷移（クエリパラメータを引き継ぐ）
      const queryString = searchParams?.toString();
      router.push(queryString ? `/main?${queryString}` : '/main');
    } catch (err) {
      // AbortError は重複送信防止で中断しただけなので無視
      if ((err as { name?: string } | null)?.name !== 'AbortError') {
        // ブラウザのネイティブエラーメッセージを日本語に変換
        const error = err as Error | null;
        if (error?.message === 'Failed to fetch') {
          setBirthDateError('サーバーに接続できませんでした。ネットワーク接続を確認してください。');
        } else {
          setBirthDateError('通信に失敗しました。時間をおいて再度お試しください。');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----- 公開する状態とハンドラ -----
  return {
    // 状態
    memberId,
    birthDate,
    rememberMe,
    isSubmitting,
    memberIdError,
    birthDateError,
    // ハンドラ
    handleMemberIdChange,
    handleBirthDateChange,
    handleRememberMeChange,
    handleSubmit,
  };
}
