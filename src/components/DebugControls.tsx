import NextImage from 'next/image';

type DebugControlsProps = {
  isGenerating: boolean;
  onGenerate: () => void;
  previewUrl: string | null;
  displayBodaiId: number;
};

export function DebugControls({
  isGenerating,
  onGenerate,
  previewUrl,
  displayBodaiId,
}: DebugControlsProps) {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-2">
      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="rounded-md bg-white/90 px-3 py-2 text-sm font-bold text-black shadow disabled:opacity-50"
      >
        {isGenerating ? '生成中...' : 'PNG生成'}
      </button>
      {previewUrl && (
        <div className="flex flex-col items-start gap-2">
          <a
            href={previewUrl}
            download={`phrase-${displayBodaiId}.png`}
            className="rounded-md bg-white/90 px-3 py-1 text-xs font-bold text-black shadow"
          >
            ダウンロード
          </a>
          <div className="relative h-20 w-20 overflow-hidden rounded-md border border-white/70">
            <NextImage
              src={previewUrl}
              alt="生成プレビュー"
              fill
              sizes="80px"
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
