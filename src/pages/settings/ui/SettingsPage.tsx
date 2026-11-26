import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { backupDownloadUrl, pharmacyQueries } from '@/entities/pharmacy'
import { useCurrentUser } from '@/entities/session'
import { SettingRow, SettingsForm, SettingsSection } from '@/features/settings/edit-settings'
import { LanguageSwitcher } from '@/features/switch-language'
import { ThemeSwitcher } from '@/features/switch-theme'
import { cn } from '@/shared/lib/cn'
import { daysUntil } from '@/shared/lib/date'
import { PageSkeleton } from '@/shared/ui/skeleton'

const SECTIONS = ['pharmacy', 'sale', 'stock', 'print', 'plan', 'backup', 'look'] as const
const PLANS = [
  { key: 'basic', period: 'perMonth' },
  { key: 'pro', period: 'perMonth' },
  { key: 'yearly', period: 'perYear' },
] as const

function PlanSection() {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  const pharmacy = user && 'pharmacy' in user ? user.pharmacy : null
  return (
    <SettingsSection id="plan" title={t('settings.sections.plan')}>
      {pharmacy?.plan === 'trial' && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-warning-soft px-4 py-3 text-body text-warning">
          <span>{t('settings.trial', { days: Math.max(0, daysUntil(pharmacy.planEndsAt)) })}</span>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={cn(
              'rounded-lg border p-4 text-small',
              plan.key === 'pro' ? 'border-2 border-brand' : 'border-border',
            )}
          >
            <p className="flex items-center gap-2 font-display text-body-strong">
              {t(`settings.plans.${plan.key}.name`)}
              {plan.key === 'pro' && (
                <span className="rounded-pill bg-brand-soft px-2 text-caption text-brand-strong">
                  {t('settings.recommended')}
                </span>
              )}
            </p>
            <p className="tabular my-1.5 text-subheading">
              {t('settings.pricePending')} {t(`settings.${plan.period}`)}
            </p>
            <p className="text-ink-muted">{t(`settings.plans.${plan.key}.features`)}</p>
          </div>
        ))}
      </div>
      <p className="pt-2 text-caption text-ink-muted">{t('settings.pricesNote')}</p>
    </SettingsSection>
  )
}

function BackupSection({ lastBackupAt }: { lastBackupAt: string | null }) {
  const { t, i18n } = useTranslation()
  const when = lastBackupAt
    ? new Intl.DateTimeFormat(i18n.language === 'ar' ? 'ar-PS' : 'en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        numberingSystem: 'latn',
      }).format(new Date(lastBackupAt))
    : '—'
  return (
    <SettingsSection id="backup" title={t('settings.sections.backup')}>
      <SettingRow label={t('settings.autoBackup')} hint={t('settings.lastBackup', { when })}>
        <span className="text-small font-semibold text-success">{t('settings.done')}</span>
      </SettingRow>
      <SettingRow label={t('settings.download')} hint={t('settings.downloadHint')}>
        <a
          href={backupDownloadUrl}
          className="flex h-10 items-center rounded-md border border-border-strong px-4 text-body hover:bg-surface-200"
        >
          {t('settings.downloadCta')}
        </a>
      </SettingRow>
    </SettingsSection>
  )
}

function LookSection() {
  const { t } = useTranslation()
  return (
    <SettingsSection id="look" title={t('settings.sections.look')}>
      <SettingRow label={t('language.label')} hint={t('settings.languageHint')}>
        <LanguageSwitcher />
      </SettingRow>
      <SettingRow label={t('theme.label')}>
        <ThemeSwitcher />
      </SettingRow>
    </SettingsSection>
  )
}

export function SettingsPage() {
  const { t } = useTranslation()
  const profile = useQuery(pharmacyQueries.profile())
  const settings = useQuery(pharmacyQueries.settings())

  if (!profile.data || !settings.data) return <PageSkeleton variant="form" />

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-display text-display">{t('settings.title')}</h1>
        <p className="mt-1 text-body text-ink-muted">{t('settings.subtitle')}</p>
      </div>
      <div className="flex items-start gap-5">
        <nav
          aria-label={t('settings.title')}
          className="sticky top-4 hidden w-52 shrink-0 flex-col rounded-lg border border-border bg-surface-100 shadow-card p-2 lg:flex"
        >
          {SECTIONS.map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className="rounded-md px-3 py-2 text-body hover:bg-surface-200"
            >
              {t(`settings.sections.${section}`)}
            </a>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <SettingsForm profile={profile.data} settings={settings.data}>
            <PlanSection />
            <BackupSection lastBackupAt={settings.data.backup.lastBackupAt} />
            <LookSection />
          </SettingsForm>
        </div>
      </div>
    </div>
  )
}
