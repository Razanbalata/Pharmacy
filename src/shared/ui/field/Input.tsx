import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

const base =
  'w-full rounded-md border border-border-strong bg-surface-100 px-3 text-body text-ink placeholder:text-ink-muted ' +
  'focus:border-brand focus:ring-3 focus:ring-brand-soft focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-ink-muted ' +
  'aria-invalid:border-danger aria-invalid:focus:ring-danger-soft'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, 'h-10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, 'min-h-20 py-2', className)} {...props} />
}
