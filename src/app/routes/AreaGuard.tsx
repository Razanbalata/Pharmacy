import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { canAccess, useCurrentUser, type Area } from '@/entities/session'
import { paths } from '@/shared/config'
import { EmptyState } from '@/shared/ui/empty-state'

/**
 * Stops a role from opening a screen by typing its address. The sidebar already hides it;
 * this covers links and bookmarks. The server refuses the data too.
 */
export function AreaGuard({ area, children }: { area: Area; children: ReactNode }) {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  if (user && 'pharmacy' in user && !canAccess(user.role, area)) {
    return (
      <EmptyState
        icon={<Lock className="size-6" />}
        title={t('forbidden.title')}
        description={t('forbidden.body')}
        actions={
          <Link
            to={paths.dashboard}
            className="rounded-lg border border-border px-4 py-2 text-body"
          >
            {t('notFound.back')}
          </Link>
        }
      />
    )
  }
  return children
}
