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
}

export function skeletonFor(pathname: string): PageSkeletonVariant {
  return SKELETON_BY_PATH[pathname] ?? 'list'
}
