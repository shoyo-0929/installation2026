'use client'

type DialogAction = {
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary'
}

type DialogShellProps = {
  title: string
  description: string
  actions: DialogAction[]
}

const DialogShell = ({ title, description, actions }: DialogShellProps) => (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-white/70 px-6 backdrop-blur-sm">
    <div className="w-full max-w-sm rounded-2xl bg-white/95 p-6 text-black shadow-xl ring-1 ring-black/10">
      <h2 className="text-lg text-red-500 text-center font-bold mb-3">{title}</h2>
      <p className="text-sm leading-relaxed">{description}</p>
      <div className="mt-5 flex flex-col gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={
              action.variant === 'primary'
                ? 'w-full rounded-lg bg-red-500 py-4 text-sm font-bold text-white shadow'
                : 'w-full rounded-lg border border-red-500 py-4 text-sm font-bold text-red-500'
            }
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  </div>
)

type SafeZoneDialogsProps = {
  warningRatio: number | null
  resetOpen: boolean
  unclosedOpen: boolean
  onRestart: () => void
  onContinueUnsafe: () => void
  onConfirmReset: () => void
}

export function SafeZoneDialogs({
  warningRatio,
  resetOpen,
  unclosedOpen,
  onRestart,
  onContinueUnsafe,
  onConfirmReset,
}: SafeZoneDialogsProps) {
  return (
    <>
      {warningRatio !== null && (
        <DialogShell
          title="文字に重なりすぎています"
          description="文字が読みづらくなる可能性があります。やり直すか、このまま続けるか選んでください。"
          actions={[
            { label: 'やり直す', onClick: onRestart, variant: 'primary' },
            {
              label: 'このまま続ける',
              onClick: onContinueUnsafe,
              variant: 'secondary',
            },
          ]}
        />
      )}
      {resetOpen && (
        <DialogShell
          title="文字の中心に近すぎます"
          description="文字が見えなくなるため、もう一度やり直してください。"
          actions={[
            { label: 'やり直す', onClick: onConfirmReset, variant: 'primary' },
          ]}
        />
      )}
      {unclosedOpen && (
        <DialogShell
          title="囲い切れていません"
          description="文字エリアが囲われていないため、もう一度やり直してください。"
          actions={[
            { label: 'やり直す', onClick: onConfirmReset, variant: 'primary' },
          ]}
        />
      )}
    </>
  )
}
