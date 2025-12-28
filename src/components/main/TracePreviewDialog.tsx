'use client'

import NextImage from 'next/image'

type TracePreviewDialogProps = {
  open: boolean
  previewUrl: string | null
  isGenerating: boolean
  isUploading?: boolean
  uploadError?: string | null
  onConfirm: () => void
  onRedo: () => void
}

export function TracePreviewDialog({
  open,
  previewUrl,
  isGenerating,
  isUploading = false,
  uploadError = null,
  onConfirm,
  onRedo,
}: TracePreviewDialogProps) {
  if (!open) return null

  const isDisabled = !previewUrl || isGenerating || isUploading

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-white/70 px-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-6 text-black shadow-xl ring-1 ring-black/10">
        <h2 className="text-lg font-bold mb-3 text-center">画像が完成しました！</h2>
        <p className="text-sm leading-relaxed text-center">
          この形で送信してよろしいですか？
        </p>
        <div className="mt-4 flex items-center justify-center">
          {previewUrl ? (
            <div className="relative h-56 w-56 overflow-hidden rounded-2xl border border-black/10">
              <NextImage
                src={previewUrl}
                alt="生成プレビュー"
                fill
                sizes="224px"
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-black/20 text-sm text-black/60">
              {isGenerating ? '生成中...' : 'プレビュー待機中'}
            </div>
          )}
        </div>
        {uploadError && (
          <div className="mt-3 text-center text-sm text-red-600">
            {uploadError}
          </div>
        )}
        <div className="mt-5 flex flex-col gap-4">
          <button
            onClick={onConfirm}
            disabled={isDisabled}
            className="w-full rounded-lg bg-[#1b6fd6] py-4 text-sm font-bold text-white shadow disabled:opacity-60"
          >
            {isUploading ? '送信中...' : 'OK'}
          </button>
          <button
            onClick={onRedo}
            disabled={isUploading}
            className="w-full rounded-lg border border-[#1b6fd6] py-4 text-sm font-bold text-[#1b6fd6] disabled:opacity-60"
          >
            やり直す
          </button>
        </div>
      </div>
    </div>
  )
}
