type RedoButtonProps = {
  onClick: () => void;
};

export function RedoButton({ onClick }: RedoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="transition-transform hover:scale-105 active:scale-95 flex flex-col items-center gap-1"
      aria-label="やり直す"
    >
      <div className="w-14 h-14 rounded-full bg-white/80 flex items-center justify-center shadow-md">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-gray-700"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </div>
      <span className="text-[15px] font-bold text-black">やり直す</span>
    </button>
  );
}
