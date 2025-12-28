'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/start/LoginForm';

/**
 * トップページ（ログイン画面）
 * ユーザーはまずこの画面からスタートし、会員番号とパスワードを入力する
 */
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fff462]" />}>
      <LoginForm />
    </Suspense>
  );
}
