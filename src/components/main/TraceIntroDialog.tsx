import NextImage from 'next/image';
import iconOperation from '@/assets/img/icon_operation.svg';

type TraceIntroDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function TraceIntroDialog({ open, onClose }: TraceIntroDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] flex flex-col items-center shadow-2xl animate-in zoom-in-95 duration-300">
        {/* コンテンツエリア (TraceHeaderの内容) */}
        <div className="flex items-center gap-3 mb-4 w-full">
          <p className="font-bold text-[16px] text-black leading-relaxed flex-1">
            想いを込めて、功徳をぐるっと囲う形を描いてみましょう。あなたの功徳が、描いた形で型取られ、アートスペースに送られます！
          </p>
          <div className="relative w-[90px] h-[105px] shrink-0">
            <NextImage
              src={iconOperation}
              alt="操作説明"
              fill
              sizes="90px"
              className="object-contain"
            />
          </div>
        </div>

        {/* OKボタン */}
        <button
          onClick={onClose}
          className="w-full bg-[#2d9cdb] text-white font-medium py-4 rounded-full hover:bg-[#2589c5] transition-colors disabled:opacity-60 disabled:pointer-events-none"
        >
          OK
        </button>
      </div>
    </div>
  );
}
