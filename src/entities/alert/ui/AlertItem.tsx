import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { cn } from '@/shared/lib/cn'
import { formatMoney } from '@/shared/lib/money'
import { alertLink } from '../model/link'
import type { Alert } from '../model/types'

const DOT = {
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  neutral: 'bg-ink-muted',
} as const

/** The alert's two lines, worded from its kind and numbers. */
function useAlertText(alert: Alert): { title: string; detail: string } {
  const { t } = useTranslation()
  switch (alert.kind) {
    case 'expiredInStock': {
      const { batches, names } = alert.params
      return {
        title:
          batches === 1
            ? t('alerts.kinds.expiredInStock.titleOne')
            : t('alerts.kinds.expiredInStock.title', { count: batches }),
        detail: t('alerts.kinds.expiredInStock.detail', { names }),
      }
    }
    case 'expiringSoon':
      return {
        title: t('alerts.kinds.expiringSoon.title', alert.params),
        detail: t('alerts.kinds.expiringSoon.detail', alert.params),
      }
    case 'expiringMore':
      return {
        title: t('alerts.kinds.expiringMore.title', alert.params),
        detail: t('alerts.kinds.expiringMore.detail', {
          value: formatMoney(alert.params.value),
        }),
      }
    case 'lowUrgent': {
      const { draft, ...params } = alert.params
      return {
        title: t('alerts.kinds.lowUrgent.title', params),
        detail: draft
          ? t('alerts.kinds.lowUrgent.detailDraft', { ...params, number: draft.number })
          : t('alerts.kinds.lowUrgent.detail', params),
      }
    }
    case 'lowMore':
      return {
        title: t('alerts.kinds.lowMore.title', alert.params),
        detail: t('alerts.kinds.lowMore.detail'),
      }
    case 'debtOverLimit':
      return {
        title: t('alerts.kinds.debtOverLimit.title', alert.params),
        detail: t('alerts.kinds.debtOverLimit.detail', {
          ...alert.params,
          debt: formatMoney(alert.params.debt),
          limit: formatMoney(alert.params.limit),
        }),
      }
    case 'debtLate':
      return {
        title: t('alerts.kinds.debtLate.title', alert.params),
        detail: t('alerts.kinds.debtLate.detail', { debt: formatMoney(alert.params.debt) }),
      }
    case 'orderSent':
      return {
        title: t('alerts.kinds.orderSent.title', alert.params),
        detail: t('alerts.kinds.orderSent.detail', alert.params),
      }
    case 'orderPartial':
      return {
        title: t('alerts.kinds.orderPartial.title', alert.params),
        detail: t('alerts.kinds.orderPartial.detail', alert.params),
      }
    case 'trialEnding':
      return {
        title: t('alerts.kinds.trialEnding.title', alert.params),
        detail: t('alerts.kinds.trialEnding.detail'),
      }
  }
}

interface AlertItemProps {
  alert: Alert
  /** "Today", "Yesterday" or a date; left out in the bell's short list. */
  when?: string
  /** Called as the button is followed, to mark the alert read. */
  onOpen?: (alert: Alert) => void
  compact?: boolean
}

/** One alert: a coloured dot, what is wrong, and the button that fixes it. */
export function AlertItem({ alert, when, onOpen, compact = false }: AlertItemProps) {
  const { t } = useTranslation()
  const { title, detail } = useAlertText(alert)
  const { href, action } = alertLink(alert)
  return (
    <div
      className={cn(
        'flex items-start gap-3',
        compact ? 'px-4 py-3' : 'px-4 py-3.5',
        !alert.read && 'bg-brand-soft/40',
      )}
    >
      <span aria-hidden className={cn('mt-2 size-2 shrink-0 rounded-pill', DOT[alert.severity])} />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-semibold">
          {title}
          {!alert.read && <span className="sr-only"> · {t('alerts.new')}</span>}
        </span>
        <span className="text-small text-ink-muted">{detail}</span>
      </span>
      {when && <span className="shrink-0 pt-0.5 text-caption text-ink-muted">{when}</span>}
      <Link
        to={href}
        onClick={() => onOpen?.(alert)}
        aria-label={`${t(`alerts.actions.${action}`)}: ${title}`}
        className="shrink-0 rounded-md border border-border px-2.5 py-1 text-small font-semibold text-brand-strong hover:border-brand"
      >
        {t(`alerts.actions.${action}`)}
      </Link>
    </div>
  )
}
