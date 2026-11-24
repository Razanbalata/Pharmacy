import { cn } from '@/shared/lib/cn'

interface StepsProps {
  steps: string[]
  /** 0-based index of the current step; earlier ones show as done. */
  current: number
}

/** "1 Request — 2 Activation — 3 Pharmacy" at the top of multi-step flows. */
export function Steps({ steps, current }: StepsProps) {
  return (
    <ol className="flex items-center gap-2.5">
      {steps.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'next'
        return (
          <li key={label} className="flex flex-1 items-center gap-2.5 last:flex-none">
            <span
              {...(state === 'current' ? { 'aria-current': 'step' as const } : {})}
              className={cn(
                'flex items-center gap-2 text-small whitespace-nowrap',
                state === 'current' ? 'font-semibold text-ink' : 'text-ink-muted',
              )}
            >
              <span
                className={cn(
                  'tabular flex size-6.5 items-center justify-center rounded-pill text-caption',
                  state === 'done' && 'bg-brand-soft text-brand-strong',
                  state === 'current' && 'bg-brand text-on-brand',
                  state === 'next' && 'bg-surface-200 text-ink-muted',
                )}
              >
                {state === 'done' ? '✓' : index + 1}
              </span>
              {label}
            </span>
            {index < steps.length - 1 && (
              <span
                aria-hidden
                className={cn('h-px flex-1', index < current ? 'bg-brand' : 'bg-border')}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
