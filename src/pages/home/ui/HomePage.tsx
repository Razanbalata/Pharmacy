import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/features/switch-language'
import { ThemeSwitcher } from '@/features/switch-theme'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

/** Temporary page that shows the design system is wired. Replaced by the dashboard later. */
export function HomePage() {
  const { t } = useTranslation()

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-display">{t('app.name')}</h1>
        <div className="flex flex-wrap gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-surface-100 p-6 shadow-card">
        <h2 className="font-display text-heading">{t('home.title')}</h2>
        <p className="text-body text-ink-muted">{t('home.body')}</p>
        <div className="flex flex-wrap gap-2">
          <Button>{t('actions.newSale')}</Button>
          <Button variant="secondary">{t('actions.export')}</Button>
          <Button variant="ghost">{t('actions.viewAll')}</Button>
          <Button variant="danger">{t('actions.cancelInvoice')}</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="success">{t('status.inStock')}</Badge>
          <Badge tone="warning">{t('status.expiringSoon')}</Badge>
          <Badge tone="danger">{t('status.expired')}</Badge>
          <Badge>{t('status.outOfStock')}</Badge>
          <Badge tone="info">{t('status.draft')}</Badge>
          <Badge tone="brand">{t('role.pharmacist')}</Badge>
        </div>
        <p className="tabular text-number-xl">1,834 ₪</p>
      </section>
    </main>
  )
}
