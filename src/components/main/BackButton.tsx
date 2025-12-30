type BackButtonProps = {
  onClick: () => void;
};

function BackArrowIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 背景の円 */}
      <circle cx="28" cy="28" r="28" fill="#2d9cdb" />
      {/* 左向き矢印 */}
      <path
        d="M33 18L23 28L33 38"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-24 transition-transform hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
      aria-label="戻る"
    >
      <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-md overflow-hidden">
        <BackArrowIcon />
      </div>
      <span className="text-[15px] font-bold text-black">戻る</span>
    </button>
  );
}
