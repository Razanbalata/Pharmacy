/* A native checkbox already exposes its checked state; aria-checked would only go stale. */
/* oxlint-disable jsx-a11y/role-has-required-aria-props */
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'>

/**
 * On/off for a setting. A real checkbox announced as a switch, so it works with the
 * keyboard (Space) and with React Hook Form's register().
 */
export function Switch({ className, ...props }: SwitchProps) {
  return (
    <span className={cn('relative inline-flex h-6 w-11 shrink-0', className)}>
      <input
        type="checkbox"
        role="switch"
        {...props}
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-pill bg-border transition-colors peer-checked:bg-brand peer-focus-visible:outline-3 peer-focus-visible:outline-focus peer-disabled:opacity-50"
      />
      <span
        aria-hidden
        className="absolute top-0.75 start-0.75 size-4.5 rounded-pill bg-surface-100 shadow-card transition-transform peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
      />
    </span>
  )
}
