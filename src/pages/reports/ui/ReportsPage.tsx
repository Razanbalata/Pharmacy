import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { useCurrentUser } from '@/entities/session'
import { cn } from '@/shared/lib/cn'
import { REPORT_PERIODS, REPORT_TABS, type ReportPeriod, type ReportTab } from '../model/types'
import { DebtsView } from './DebtsView'
import { ProfitView } from './ProfitView'
import { SalesView } from './SalesView'
import { StockView } from './StockView'

/**
 * The four reports behind tabs. The tab and the period live in the address, so a report
 * can be bookmarked or sent as a link. Profit is the manager's only.
 */
export function ReportsPage() {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const [params, setParams] = useSearchParams()
  const tabs = REPORT_TABS.filter((tab) => tab !== 'profit' || user?.role === 'manager')
  const asked = params.get('tab') as ReportTab | null
  const tab: ReportTab = asked && tabs.includes(asked) ? asked : 'sales'
  const askedPeriod = params.get('period') as ReportPeriod | null
  const period: ReportPeriod =
    askedPeriod && REPORT_PERIODS.includes(askedPeriod) ? askedPeriod : 'month'

  const go = (next: { tab?: ReportTab; period?: ReportPeriod }) => {
    const query = new URLSearchParams(params)
    if (next.tab) query.set('tab', next.tab)
    if (next.period) query.set('period', next.period)
    setParams(query, { replace: true })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-display">{t(`reports.titles.${tab}`)}</h1>
        <p className="mt-1 text-body text-ink-muted">{t(`reports.subtitles.${tab}`)}</p>
      </div>
      <nav
        aria-label={t('reports.title')}
        className="flex gap-1 border-b border-border print:hidden"
      >
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            aria-current={key === tab ? 'page' : undefined}
            onClick={() => go({ tab: key })}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 text-body',
              key === tab
                ? 'border-brand font-semibold text-brand-strong'
                : 'border-transparent text-ink-muted hover:text-ink',
            )}
          >
            {t(`reports.tabs.${key}`)}
          </button>
        ))}
      </nav>
      <div className="print-area">
        {tab === 'sales' && (
          <SalesView period={period} onPeriod={(value) => go({ period: value })} />
        )}
        {tab === 'profit' && (
          <ProfitView period={period} onPeriod={(value) => go({ period: value })} />
        )}
        {tab === 'stock' && <StockView />}
        {tab === 'debts' && <DebtsView />}
      </div>
    </div>
  )
}
