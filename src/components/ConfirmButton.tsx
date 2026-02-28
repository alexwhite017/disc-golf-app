import { useState } from 'react'

interface Props {
  onConfirm: () => void
  label?: string
  className?: string
}

export default function ConfirmButton({ onConfirm, label = 'Delete', className = '' }: Props) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs">
        <button
          onClick={() => { onConfirm(); setConfirming(false) }}
          className="text-red-400 hover:text-red-300 transition-colors"
        >
          Confirm
        </button>
        <span className="text-slate-600">·</span>
        <button
          onClick={() => setConfirming(false)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <button onClick={() => setConfirming(true)} className={className}>
      {label}
    </button>
  )
}
