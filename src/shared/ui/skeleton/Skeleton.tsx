import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'

/** Grey placeholder in the shape of the content, with a soft shimmer, instead of a spinner. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-md bg-surface-200',
        'after:absolute after:inset-0 after:animate-[ps-shimmer_1.4s_ease-in-out_infinite]',
        'after:bg-gradient-to-l after:from-transparent after:via-surface-100/60 after:to-transparent',
        'motion-reduce:after:hidden',
        className,
      )}
    />
  )
}

/** Placeholder rows for a table or list while it loads. */
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <span className="sr-only">{t('common.loading')}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-10 w-full" />
      ))}
    </div>
  )
}
