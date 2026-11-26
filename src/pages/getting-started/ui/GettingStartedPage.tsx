import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { pharmacyQueries, type OnboardingStepKey } from '@/entities/pharmacy'
import { useCurrentUser } from '@/entities/session'
import { DismissOnboardingButton } from '@/features/pharmacy/dismiss-onboarding'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { PageSkeleton } from '@/shared/ui/skeleton'

/** Where each checklist step leads. */
const STEP_LINK: Record<OnboardingStepKey, string | null> = {
  account: null,
  profile: paths.setup,
  products: `${paths.products}?import=1`,
  openingStock: paths.stockCounts,
  staff: `${paths.staff}?new=1`,
  payments: paths.settings,
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const { t } = useTranslation()
  const percent = Math.round((done / total) * 100)
  return (
    <div className="relative">
      <span className="sr-only">{t('auth.onboarding.progress', { done, total })}</span>
      <div
        aria-hidden
        className="flex size-19 items-center justify-center rounded-pill"
        style={{
          background: `conic-gradient(var(--color-brand) 0 ${percent}%, var(--color-navy-soft) ${percent}% 100%)`,
        }}
      >
        <span className="tabular flex size-15 items-center justify-center rounded-pill bg-navy text-subheading">
          {done}/{total}
        </span>
      </div>
    </div>
  )
}

/** The six steps a new pharmacy goes through before the dashboard has real numbers. */
export function GettingStartedPage() {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const { data: onboarding, isPending } = useQuery(pharmacyQueries.onboarding())

  if (isPending || !onboarding || !user || !('pharmacy' in user))
    return <PageSkeleton variant="dashboard" />

  const done = onboarding.steps.filter((step) => step.done).length
  const firstOpen = onboarding.steps.find((step) => !step.done)?.key

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center justify-between gap-6 rounded-lg bg-navy p-7 text-on-navy">
        <div>
          <h1 className="font-display text-heading">
            {t('auth.onboarding.greeting', { name: user.name, pharmacy: user.pharmacy.name })}
          </h1>
          <p className="mt-1.5 text-body opacity-75">{t('auth.onboarding.body')}</p>
        </div>
        <ProgressRing done={done} total={onboarding.steps.length} />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="overflow-hidden rounded-lg border border-border bg-surface-100 shadow-card">
          <ol>
            {onboarding.steps.map((step, index) => {
              const isNext = step.key === firstOpen
              const link = STEP_LINK[step.key]
              return (
                <li
                  key={step.key}
                  className={cn(
                    'flex items-center gap-4 border-b border-surface-200 px-5 py-4',
                    isNext && 'bg-brand-soft/30',
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      'tabular flex size-8 shrink-0 items-center justify-center rounded-pill text-small',
                      step.done && 'bg-success-soft text-success',
                      !step.done && isNext && 'bg-brand text-on-brand',
                      !step.done && !isNext && 'bg-surface-200 text-ink-muted',
                    )}
                  >
                    {step.done ? '✓' : index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn('text-body-strong', step.done && 'text-ink-muted line-through')}
                    >
                      <span className="sr-only">{step.done ? '✓ ' : ''}</span>
                      {t(`auth.onboarding.steps.${step.key}.title`)}
                    </p>
                    <p className="text-small text-ink-muted">
                      {t(`auth.onboarding.steps.${step.key}.body`)}
                    </p>
                  </div>
                  {!step.done && link && (
                    <Link
                      to={link}
                      className={cn(
                        'rounded-md px-3.5 py-2 text-small font-semibold whitespace-nowrap',
                        isNext ? 'bg-brand text-on-brand' : 'border border-border-strong text-ink',
                      )}
                    >
                      {t(`auth.onboarding.steps.${step.key}.cta`)}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-small text-ink-muted">
            <span>{t('auth.onboarding.hideNote')}</span>
            <DismissOnboardingButton />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-surface-100 shadow-card p-5">
            <p className="font-display text-body-strong">{t('auth.onboarding.tryTitle')}</p>
            <p className="mt-1 text-small text-ink-muted">{t('auth.onboarding.tryBody')}</p>
            <Link
              to={paths.pos}
              className="mt-2 inline-block text-small font-semibold text-brand-strong hover:underline"
            >
              {t('auth.onboarding.tryCta')} ←
            </Link>
          </div>
          <div className="rounded-lg border border-border bg-surface-100 shadow-card p-5">
            <p className="font-display text-body-strong">{t('auth.onboarding.shortcutsTitle')}</p>
            <p className="mt-2 flex justify-between text-small">
              <span>{t('auth.onboarding.shortcutSearch')}</span>
              <kbd className="tabular rounded-sm border border-border px-1.5">Ctrl K</kbd>
            </p>
          </div>
          <div className="rounded-lg bg-brand-soft p-5 text-brand-strong">
            <p className="font-semibold">{t('auth.onboarding.helpTitle')}</p>
            <p className="mt-1 text-small">{t('auth.onboarding.helpBody')}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
