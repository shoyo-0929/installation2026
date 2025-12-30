import NextImage from 'next/image';
import iconRedo from '@/assets/img/icon_line-back.png';

type RedoButtonProps = {
  onClick: () => void;
};

export function RedoButton({ onClick }: RedoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-24 transition-transform hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
      aria-label="やり直す"
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-md">
        <NextImage
          src={iconRedo}
          alt="やり直す"
          sizes="103px"
          className="object-contain"
        />
      </div>
      <span className="text-[15px] font-bold text-black">やり直す</span>
    </button>
  );
}
