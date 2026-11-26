import type { JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from './Skeleton'

export type PageSkeletonVariant = 'list' | 'dashboard' | 'detail' | 'form'

function HeaderBlock() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}

function ListBody() {
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {['w-16', 'w-22', 'w-18', 'w-24', 'w-20'].map((width) => (
          <Skeleton key={width} className={`h-9 rounded-pill ${width}`} />
        ))}
      </div>
      <div className="flex flex-col gap-0 overflow-hidden rounded-lg border border-border bg-surface-100 shadow-card">
        <Skeleton className="h-11 rounded-none" />
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="flex items-center gap-4 border-t border-surface-200 px-4 py-3"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-[3]" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-16 rounded-pill" />
          </div>
        ))}
      </div>
    </>
  )
}

function DashboardBody() {
  return (
    <>
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} className="h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 rounded-lg lg:col-span-2" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </>
  )
}

function DetailBody() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Skeleton className="h-40 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
      <Skeleton className="h-80 rounded-lg" />
    </div>
  )
}

function FormBody() {
  return (
    <div className="flex max-w-3xl flex-col gap-5 rounded-lg border border-border bg-surface-100 shadow-card p-6">
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10" />
          </div>
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

const bodies: Record<PageSkeletonVariant, () => JSX.Element> = {
  list: ListBody,
  dashboard: DashboardBody,
  detail: DetailBody,
  form: FormBody,
}

/**
 * The shape of a whole page while it loads: header, then the body the page will have.
 * Every page shows one of these instead of a spinner.
 */
export function PageSkeleton({ variant = 'list' }: { variant?: PageSkeletonVariant }) {
  const { t } = useTranslation()
  const Body = bodies[variant]
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <output className="sr-only">{t('common.loading')}</output>
      <HeaderBlock />
      <Body />
    </div>
  )
}
