import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { paths, type PathKey } from '@/shared/config'
import { EmptyState } from '@/shared/ui/empty-state'

interface ComingSoonPageProps {
  /** Which screen, as its key in the sidebar (nav.<key>). */
  navKey: PathKey
  /** Which module in the plan builds this screen. */
  module: number
}

/**
 * Placeholder for screens whose module is not built yet, so every link in the
 * sidebar already works. Each one is replaced by the real page in its module.
 */
export function ComingSoonPage({ navKey, module }: ComingSoonPageProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-display">{t(`nav.${navKey}` as const)}</h1>
      <EmptyState
        icon="◔"
        tone="brand"
        title={t('comingSoon.title')}
        description={t('comingSoon.description', { module })}
        actions={
          <Link
            to={paths.dashboard}
            className="rounded-md border border-border-strong px-4 py-2 text-body hover:bg-surface-200"
          >
            {t('notFound.back')}
          </Link>
        }
      />
    </div>
  )
}
