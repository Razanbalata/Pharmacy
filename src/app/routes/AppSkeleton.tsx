import { useLocation } from 'react-router'
import { PageSkeleton, Skeleton } from '@/shared/ui/skeleton'
import { skeletonFor } from './skeletons'

/** The whole app's shape while it starts: dark sidebar, top bar, and the page's own skeleton. */
export function AppSkeleton() {
  const { pathname } = useLocation()
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-64 shrink-0 flex-col gap-3 border-e border-border bg-sidebar p-5 lg:flex">
        <div className="mb-4 h-9 w-36 rounded-md bg-surface-200" />
        {Array.from({ length: 12 }, (_, index) => (
          <div key={index} className="h-8 rounded-md bg-surface-200/70" />
        ))}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-border bg-surface-100 px-7">
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="ms-auto h-10 w-28" />
          <Skeleton className="size-9 rounded-pill" />
        </div>
        <div className="p-7">
          <PageSkeleton variant={skeletonFor(pathname)} />
        </div>
      </div>
    </div>
  )
}
