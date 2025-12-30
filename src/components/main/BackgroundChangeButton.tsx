import NextImage from 'next/image';
import changeIcon from '@/assets/img/icon_change.svg';

type BackgroundChangeButtonProps = {
  onClick: () => void;
};

export function BackgroundChangeButton({
  onClick,
}: BackgroundChangeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-24 transition-transform hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
      aria-label="背景を変更"
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center">
        <NextImage
          src={changeIcon}
          alt=""
          className="max-w-full max-h-full"
        />
      </div>
      <span className="text-[15px] font-bold text-black">背景チェンジ</span>
    </button>
  );
}
