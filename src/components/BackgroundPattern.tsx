/**
 * 背景パターンコンポーネント
 *
 * ページ背景に表示される装飾用のクロス（十字）パターン画像。
 * 画面中央上部に固定配置され、ユーザー操作を妨げないよう pointer-events: none を設定。
 */
import Image from 'next/image';

export function BackgroundPattern() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-10 flex pointer-events-none min-w-150.5 max-w-200 w-[95%]">
      <Image
        src="/images/bigcross.png"
        className="w-full h-auto"
        alt="" // 装飾画像のため alt は空
        width={602}
        height={620}
        priority // LCP 対策のため優先読み込み
      />
    </div>
  );
}
