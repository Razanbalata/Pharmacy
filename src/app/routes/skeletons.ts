import { paths } from '@/shared/config'
import type { PageSkeletonVariant } from '@/shared/ui/skeleton'

/** Which loading shape each screen shows, so the skeleton looks like the page that is coming. */
const SKELETON_BY_PATH: Record<string, PageSkeletonVariant> = {
  [paths.dashboard]: 'dashboard',
  [paths.pos]: 'detail',
  [paths.assistant]: 'detail',
  [paths.settings]: 'form',
  [paths.setup]: 'form',
  [paths.gettingStarted]: 'dashboard',
  [paths.productNew]: 'form',
  [paths.productLabels]: 'form',
  [paths.productImport]: 'form',
}

/** Addresses with an id: /products/12 shows details, /products/12/edit a form. */
const SKELETON_BY_PATTERN: [RegExp, PageSkeletonVariant][] = [
  [/^\/products\/\d+$/, 'detail'],
  [/^\/products\/\d+\/edit$/, 'form'],
  [/^\/suppliers\/\d+$/, 'detail'],
  [/^\/purchases\/(new|\d+)$/, 'form'],
  [/^\/purchases\/\d+\/receive$/, 'form'],
]

export function skeletonFor(pathname: string): PageSkeletonVariant {
  const exact = SKELETON_BY_PATH[pathname]
  if (exact) return exact
  return SKELETON_BY_PATTERN.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'list'
}
