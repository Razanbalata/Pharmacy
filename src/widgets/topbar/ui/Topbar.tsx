import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAlertSummary } from '@/entities/alert'
import { canAccess, type CurrentUser } from '@/entities/session'
import { LogoutButton } from '@/features/auth/logout'
import { LanguageToggle } from '@/features/switch-language'
import { ThemeToggle } from '@/features/switch-theme'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { useDismiss } from '@/shared/lib/dismiss'
import { ChevronDown, Menu, Plus, Search, Settings } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useDismiss(box, open, close)

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-label={t('shell.userMenu')}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-200"
      >
        <span className="flex size-9 items-center justify-center rounded-pill bg-brand-soft font-display text-small font-semibold text-brand-strong">
          {user.name.slice(0, 1)}
        </span>
        <span className="hidden flex-col text-start leading-tight sm:flex">
          <span className="text-small font-semibold text-ink">{user.name}</span>
          <span className="text-caption text-ink-muted">{t(`role.${user.role}`)}</span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            'hidden size-4 text-ink-muted transition-transform sm:block',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="absolute end-0 top-full z-30 mt-2 flex w-64 flex-col overflow-hidden rounded-xl border border-border bg-surface-100 shadow-pop">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-brand-soft font-display text-body font-semibold text-brand-strong">
              {user.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-body font-semibold text-ink">{user.name}</p>
              <p className="truncate text-caption text-ink-muted">
                {t(`role.${user.role}`)} · {user.pharmacy.name}
              </p>
            </div>
          </div>
          <div className="flex flex-col p-1.5">
            {canAccess(user.role, 'settings') && (
              <Link
                to={paths.settings}
                onClick={close}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-small font-medium text-ink transition-colors hover:bg-surface-200"
              >
                <Settings aria-hidden className="size-4 text-ink-muted" />
                {t('nav.settings')}
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
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
        <div className="flex items-center">
          <LanguageToggle />
          <ThemeToggle />
          {showAlerts && <AlertsMenu unread={unread} />}
        </div>
        <span aria-hidden className="mx-1 hidden h-7 w-px bg-border sm:block" />
        <UserMenu user={user} />
      </div>
    </header>
  )
}
