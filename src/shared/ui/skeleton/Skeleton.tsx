import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'

/** Grey placeholder in the shape of the content, instead of a spinner in the middle. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-surface-200', className)} />
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
