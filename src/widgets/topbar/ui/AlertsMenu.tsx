import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { AlertItem, alertQueries } from '@/entities/alert'
import { MarkAllReadButton, useMarkAlertRead } from '@/features/alert/mark-read'
import { paths } from '@/shared/config'

/** The bell: how many are new, and the latest few, each with its button. */
export function AlertsMenu({ unread }: { unread: number }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const { data } = useQuery({ ...alertQueries.list(), enabled: open })
  const markRead = useMarkAlertRead()
  // New ones first, then the rest, as the server orders them.
  const alerts = [...(data?.data ?? [])].sort((a, b) => Number(a.read) - Number(b.read))

  useEffect(() => {
    if (!open) return
    function close(event: MouseEvent | KeyboardEvent) {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !box.current?.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t('shell.alertsCount', { count: unread })}
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-md px-2.5 py-2 hover:bg-surface-200"
      >
        <span aria-hidden>🔔</span>
        {unread > 0 && (
          <span
            aria-hidden
            className="tabular absolute -top-0.5 -end-0.5 rounded-pill bg-danger px-1.5 text-caption text-surface-100"
          >
            {unread}
          </span>
        )}
      </button>
      {open && (
        <section
          aria-label={t('alerts.dropdown.title')}
          className="absolute end-0 top-full z-30 mt-2 flex w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-surface-100 shadow-pop"
        >
          <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <span className="flex items-center gap-2">
              <span className="font-display text-body-strong">{t('alerts.dropdown.title')}</span>
              {unread > 0 && (
                <span className="rounded-pill bg-danger-soft px-2 text-caption text-danger">
                  {t('alerts.dropdown.fresh', { count: unread })}
                </span>
              )}
            </span>
            <MarkAllReadButton disabled={unread === 0} />
          </header>
          <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
            {alerts.slice(0, 8).map((alert) => (
              <li key={alert.id}>
                <AlertItem
                  alert={alert}
                  compact
                  onOpen={(opened) => {
                    markRead(opened)
                    setOpen(false)
                  }}
                />
              </li>
            ))}
          </ul>
          <Link
            to={paths.alerts}
            onClick={() => setOpen(false)}
            className="border-t border-border px-4 py-3 text-center text-small font-semibold text-brand-strong hover:bg-surface-200"
          >
            {t('alerts.dropdown.all', { count: data?.summary.counts.all ?? 0 })}
          </Link>
        </section>
      )}
    </div>
  )
}
