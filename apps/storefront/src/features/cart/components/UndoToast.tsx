import { useEffect } from 'react'

/** "Removed <name> · Undo" (inverted colours), above the phone's sticky bar; it goes away on its own. */
export function UndoToast({ name, onUndo, onClose }: { name: string; onUndo: () => void; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [name, onClose])

  return (
    <div
      role="status"
      className="toast-in fixed bottom-[104px] left-1/2 z-40 flex max-w-[calc(100%-32px)] items-center gap-4 rounded-full bg-toast py-1.5 pl-[18px] pr-1.5 text-sm text-on-toast shadow-lifted md:bottom-7 md:gap-[18px] md:py-2.5 md:pl-[22px] md:pr-2.5"
    >
      <span className="min-w-0 truncate">Removed {name}</span>
      <button
        type="button"
        onClick={onUndo}
        className="h-10 shrink-0 rounded-full px-4 font-bold underline md:bg-brand md:font-semibold md:text-on-brand md:no-underline"
      >
        Undo
      </button>
    </div>
  )
}
