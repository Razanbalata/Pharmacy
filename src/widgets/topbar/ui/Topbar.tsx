import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAlertSummary } from '@/entities/alert'
import { canAccess, type CurrentUser } from '@/entities/session'
import { LogoutButton } from '@/features/auth/logout'
import { LanguageSwitcher } from '@/features/switch-language'
import { ThemeSwitcher } from '@/features/switch-theme'
import { paths } from '@/shared/config'
import { ChevronDown, Menu, Plus, Search } from 'lucide-react'
import { AlertsMenu } from './AlertsMenu'

interface TopbarProps {
  user: CurrentUser
  /** Opens the menu on small screens, where the sidebar is hidden. */
  onOpenMenu: () => void
  /**
   * Opens the search palette. Passed in by the app layout: one widget may not import
   * another (Feature-Sliced Design), so the layout connects them.
   */
  onOpenSearch: () => void
}

function UserMenu({ user }: { user: CurrentUser }) {
  const { t } = useTranslation()
  return (
    <details className="group relative">
      <summary
        aria-label={t('shell.userMenu')}
        className="flex cursor-pointer list-none items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-200 [&::-webkit-details-marker]:hidden"
      >
        <span className="flex size-8 items-center justify-center rounded-pill bg-brand-soft font-display text-small font-semibold text-brand-strong">
          {user.name.slice(0, 1)}
        </span>
        <span className="hidden flex-col text-start leading-tight sm:flex">
          <span className="text-small font-semibold text-ink">{user.name}</span>
          <span className="text-caption text-ink-muted">{t(`role.${user.role}`)}</span>
        </span>
        <ChevronDown aria-hidden className="hidden size-4 text-ink-muted sm:block" />
      </summary>
      <div className="absolute end-0 top-full z-30 mt-2 flex w-72 flex-col gap-4 rounded-lg border border-border bg-surface-100 shadow-card p-4 shadow-pop">
        <div>
          <p className="text-body-strong">{user.name}</p>
          <p className="text-small text-ink-muted">
            {t(`role.${user.role}`)} · {user.pharmacy.name}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-ink-muted">{t('language.label')}</span>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-caption text-ink-muted">{t('theme.label')}</span>
          <ThemeSwitcher />
        </div>
        <LogoutButton />
      </div>
    </details>
  )
}

/** The bar above every page: search, new sale, alerts and the user's menu. */
export function Topbar({ user, onOpenMenu, onOpenSearch }: TopbarProps) {
  const { t } = useTranslation()
  const showAlerts = canAccess(user.role, 'alerts')
  const { data: alerts } = useAlertSummary()
  const unread = showAlerts ? (alerts?.unread ?? 0) : 0

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface-100/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label={t('nav.openMenu')}
        className="rounded-md p-2 hover:bg-surface-200 lg:hidden"
      >
        <Menu aria-hidden className="size-5" />
      </button>

      <button
        type="button"
        onClick={onOpenSearch}
        className="flex h-10 max-w-lg flex-1 items-center gap-2.5 rounded-lg border border-border bg-surface-0 px-3.5 text-start text-small text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
      >
        <Search aria-hidden className="size-4 shrink-0" />
        <span className="flex-1 truncate">{t('shell.search')}</span>
        <kbd className="tabular hidden rounded-sm border border-border bg-surface-100 px-1.5 text-caption sm:inline">
          Ctrl K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-2">
        <Link
          to={paths.pos}
          className="hidden h-10 items-center gap-2 rounded-lg bg-brand px-4 text-body font-semibold text-on-brand shadow-card transition-colors hover:bg-brand-strong sm:flex"
        >
          <Plus aria-hidden className="size-4" strokeWidth={2.5} />
          {t('shell.newSale')}
        </Link>
        {showAlerts && <AlertsMenu unread={unread} />}
        <UserMenu user={user} />
      </div>
    </header>
  )
}
