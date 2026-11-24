import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface EmptyStateProps {
  icon?: ReactNode
  title: ReactNode
  /** What to do next, in one short line. */
  description?: ReactNode
  /** Buttons for the next step. */
  actions?: ReactNode
  tone?: 'neutral' | 'brand' | 'success'
  className?: string
}

const toneClass = {
  neutral: 'bg-surface-200 text-ink-muted',
  brand: 'bg-brand-soft text-brand-strong',
  success: 'bg-success-soft text-success',
}

/** Never a blank page: say why it is empty and what to do next. */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  tone = 'neutral',
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-8 text-center',
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden
          className={cn(
            'flex size-13 items-center justify-center rounded-lg text-2xl',
            toneClass[tone],
          )}
        >
          {icon}
        </span>
      )}
      <p className="text-body-strong text-ink">{title}</p>
      {description && <p className="max-w-sm text-small text-ink-muted">{description}</p>}
      {actions && <div className="mt-2 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}
