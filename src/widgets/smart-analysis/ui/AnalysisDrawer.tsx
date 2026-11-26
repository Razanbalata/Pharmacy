import { RefreshCw } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/ui/button'
import { Drawer } from '@/shared/ui/dialog'
import { SkeletonRows } from '@/shared/ui/skeleton'
import { analysisQuery } from '../api/analysis-api'
import { useActionLink } from '../model/use-action-link'

const TAG = {
  urgent: 'bg-danger-soft text-danger',
  week: 'bg-warning-soft text-warning',
  chance: 'bg-info-soft text-info',
} as const

const STATUS = {
  good: 'border-success/40 bg-success-soft',
  attention: 'border-warning/40 bg-warning-soft',
  bad: 'border-danger/40 bg-danger-soft',
} as const

/** A reading of the month: the overall state, a few points with a button each, and a summary. */
export function AnalysisDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const { data, isFetching, refetch } = useQuery({
    ...analysisQuery(i18n.language),
    enabled: open,
  })
  const link = useActionLink()
  const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-GB'
  const month = new Intl.DateTimeFormat(locale, { month: 'long' })
  const time = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    numberingSystem: 'latn',
  })

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t('assistant.analysis.title')}
      description={
        data
          ? t('assistant.analysis.subtitle', {
              month: month.format(new Date(data.at)),
              time: time.format(new Date(data.at)),
            })
          : undefined
      }
      footer={
        <Button variant="secondary" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className="size-4" />
          {t('assistant.analysis.refresh')}
        </Button>
      }
    >
      {!data ? (
        <SkeletonRows rows={5} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className={cn('rounded-lg border p-3', STATUS[data.status])}>
            <p className="text-caption text-ink-muted">{t('assistant.analysis.status')}</p>
            <p className="font-semibold">{data.headline}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {data.items.map((item) => {
              const { href, label } = link(item.action)
              return (
                <li
                  key={item.title}
                  className="flex flex-col gap-1.5 rounded-lg border border-border p-3"
                >
                  <span className={cn('self-start rounded-pill px-2 text-caption', TAG[item.tag])}>
                    {t(`assistant.analysis.tags.${item.tag}`)}
                  </span>
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-small text-ink-muted">{item.text}</span>
                  <Link
                    to={href}
                    onClick={onClose}
                    className="text-small font-semibold text-brand-strong hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <section aria-labelledby="analysis-summary" className="flex flex-col gap-1">
            <h3 id="analysis-summary" className="font-display text-body-strong">
              {t('assistant.analysis.summary')}
            </h3>
            <p className="text-small">{data.summary}</p>
          </section>
          <p className="rounded-md bg-surface-200/60 px-3 py-2 text-caption text-ink-muted">
            {t('assistant.analysis.note')}
          </p>
        </div>
      )}
    </Drawer>
  )
}
