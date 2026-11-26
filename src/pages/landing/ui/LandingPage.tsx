import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeft,
  BookUser,
  CalendarClock,
  Check,
  PackageSearch,
  Pill,
  ReceiptText,
  ScanBarcode,
  Sparkles,
  Timer,
  UserCog,
  WifiOff,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { LanguageToggle } from '@/features/switch-language'
import { ThemeToggle } from '@/features/switch-theme'
import { paths } from '@/shared/config'
import { cn } from '@/shared/lib/cn'
import { buttonVariants } from '@/shared/ui/button'

const FEATURES: {
  key: 'pos' | 'expiry' | 'stock' | 'debts' | 'shifts' | 'ai'
  icon: LucideIcon
}[] = [
  { key: 'pos', icon: ScanBarcode },
  { key: 'expiry', icon: CalendarClock },
  { key: 'stock', icon: PackageSearch },
  { key: 'debts', icon: BookUser },
  { key: 'shifts', icon: Timer },
  { key: 'ai', icon: Sparkles },
]
const ROLES: { key: 'manager' | 'pharmacist' | 'cashier'; icon: LucideIcon }[] = [
  { key: 'manager', icon: UserCog },
  { key: 'pharmacist', icon: Pill },
  { key: 'cashier', icon: ReceiptText },
]

function Logo() {
  const { t } = useTranslation()
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand font-display text-subheading font-bold text-on-brand">
        ف
      </span>
      <span className="font-display text-subheading font-bold text-ink">{t('app.name')}</span>
    </span>
  )
}

/** Arrow that points "forward" in both directions: left in Arabic, right in English. */
function Forward() {
  return <ArrowLeft aria-hidden className="size-4 ltr:-scale-x-100" />
}

/** The public page for visitors: what the product is, and the way in. */
export function LandingPage() {
  const { t } = useTranslation()
  const trust = t('landing.trust', { returnObjects: true }) as string[]
  const stats = t('landing.stats', { returnObjects: true }) as { value: string; label: string }[]
  const steps = t('landing.how', { returnObjects: true }) as { title: string; text: string }[]
  const section = 'mx-auto w-full max-w-6xl px-5 sm:px-8'

  return (
    <div className="min-h-dvh bg-surface-0 text-ink">
      <header className="sticky top-0 z-20 border-b border-border bg-surface-0/85 backdrop-blur">
        <div className={cn(section, 'flex h-16 items-center gap-6')}>
          <Logo />
          <nav aria-label={t('app.name')} className="hidden items-center gap-1 md:flex">
            {(['features', 'how', 'roles'] as const).map((key) => (
              <a
                key={key}
                href={`#${key}`}
                className="rounded-lg px-3 py-2 text-small font-medium text-ink-muted transition-colors hover:bg-surface-200 hover:text-ink"
              >
                {t(`landing.nav.${key}`)}
              </a>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              to={paths.login}
              className={cn(
                buttonVariants({ variant: 'secondary', size: 'sm' }),
                'ms-2 hidden sm:inline-flex',
              )}
            >
              {t('landing.nav.login')}
            </Link>
            <Link to={paths.join} className={cn(buttonVariants({ size: 'sm' }), 'ms-1')}>
              {t('landing.join')}
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 mx-auto h-[520px] max-w-4xl rounded-pill bg-brand/15 blur-3xl"
          />
          <div
            className={cn(
              section,
              'relative flex flex-col items-center pt-16 pb-10 text-center sm:pt-24',
            )}
          >
            <span className="inline-flex items-center gap-2 rounded-pill border border-brand/25 bg-brand-soft px-3.5 py-1.5 text-small font-semibold text-brand-strong">
              <WifiOff aria-hidden className="size-4" />
              {t('landing.badge')}
            </span>
            <h1 className="mt-6 max-w-4xl font-display text-[34px] leading-[1.3] font-bold tracking-tight text-balance sm:text-[52px]">
              {t('landing.title')}{' '}
              <span className="text-brand-strong">{t('landing.titleAccent')}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[17px] leading-8 text-ink-muted text-pretty">
              {t('landing.sub')}
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to={paths.join} className={buttonVariants({ size: 'lg' })}>
                {t('landing.join')}
                <Forward />
              </Link>
              <Link
                to={paths.login}
                className={buttonVariants({ variant: 'secondary', size: 'lg' })}
              >
                {t('landing.login')}
              </Link>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-small text-ink-muted">
              {trust.map((item) => (
                <li key={item} className="flex items-center gap-1.5">
                  <Check aria-hidden className="size-4 text-success" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className={cn(section, 'relative pb-16')}>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface-100 p-2 shadow-pop">
              <img
                src="/landing/dashboard-light.webp"
                alt={t('landing.shotAlt')}
                width={1440}
                height={900}
                className="w-full rounded-xl dark:hidden"
              />
              <img
                src="/landing/dashboard-dark.webp"
                alt={t('landing.shotAlt')}
                width={1440}
                height={900}
                className="hidden w-full rounded-xl dark:block"
              />
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section
          aria-label={t('landing.nav.features')}
          className="border-y border-border bg-surface-100"
        >
          <dl className={cn(section, 'grid grid-cols-2 gap-6 py-10 md:grid-cols-4')}>
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center gap-1 text-center">
                <dt className="order-2 text-small text-ink-muted">{stat.label}</dt>
                <dd className="font-display text-[30px] leading-tight font-bold text-brand-strong">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Features */}
        <section id="features" aria-labelledby="features-title" className="scroll-mt-20 py-20">
          <div className={section}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="features-title" className="font-display text-[30px] leading-snug font-bold">
                {t('landing.featuresTitle')}
              </h2>
              <p className="mt-3 text-body text-ink-muted">{t('landing.featuresSub')}</p>
            </div>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li
                  key={key}
                  className="group rounded-2xl border border-border bg-surface-100 p-6 shadow-card transition-shadow hover:shadow-pop"
                >
                  <span className="flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-strong">
                    <Icon aria-hidden className="size-5" strokeWidth={2} />
                  </span>
                  <h3 className="mt-4 font-display text-subheading font-semibold">
                    {t(`landing.features.${key}.title`)}
                  </h3>
                  <p className="mt-2 text-body leading-7 text-ink-muted">
                    {t(`landing.features.${key}.text`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how"
          aria-labelledby="how-title"
          className="scroll-mt-20 border-y border-border bg-surface-100 py-20"
        >
          <div className={section}>
            <h2
              id="how-title"
              className="text-center font-display text-[30px] leading-snug font-bold"
            >
              {t('landing.howTitle')}
            </h2>
            <ol className="mt-12 grid gap-5 md:grid-cols-3">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-border bg-surface-0 p-6"
                >
                  <span className="flex size-10 items-center justify-center rounded-pill bg-brand font-display text-body font-bold text-on-brand">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-subheading font-semibold">{step.title}</h3>
                  <p className="mt-2 text-body leading-7 text-ink-muted">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Roles and offline */}
        <section id="roles" aria-labelledby="roles-title" className="scroll-mt-20 py-20">
          <div className={cn(section, 'grid items-start gap-8 lg:grid-cols-[1.2fr_1fr]')}>
            <div>
              <h2 id="roles-title" className="font-display text-[30px] leading-snug font-bold">
                {t('landing.rolesTitle')}
              </h2>
              <ul className="mt-8 flex flex-col gap-3">
                {ROLES.map(({ key: role, icon: RoleIcon }) => (
                  <li
                    key={role}
                    className="flex items-start gap-4 rounded-xl border border-border bg-surface-100 p-5"
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-pill bg-brand-soft font-display text-small font-bold text-brand-strong">
                      <RoleIcon aria-hidden className="size-4.5" />
                    </span>
                    <div>
                      <h3 className="font-display text-body font-semibold">
                        {t(`landing.roles.${role}.title`)}
                      </h3>
                      <p className="mt-1 text-body text-ink-muted">
                        {t(`landing.roles.${role}.text`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface-100 p-8 shadow-card lg:mt-16">
              <span className="flex size-12 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <WifiOff aria-hidden className="size-6" />
              </span>
              <h3 className="mt-5 font-display text-heading font-bold">
                {t('landing.offlineTitle')}
              </h3>
              <p className="mt-3 text-body leading-7 text-ink-muted">{t('landing.offlineText')}</p>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section className="pb-20">
          <div className={section}>
            <div className="relative overflow-hidden rounded-3xl bg-brand px-8 py-14 text-center text-on-brand sm:px-14">
              <div
                aria-hidden
                className="absolute -end-20 -top-24 size-72 rounded-pill bg-white/10"
              />
              <h2 className="relative font-display text-[30px] leading-snug font-bold">
                {t('landing.ctaTitle')}
              </h2>
              <p className="relative mx-auto mt-3 max-w-xl text-body opacity-90">
                {t('landing.ctaText')}
              </p>
              <Link
                to={paths.join}
                className="relative mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 text-body font-semibold text-brand-strong shadow-card transition-opacity hover:opacity-90"
              >
                {t('landing.join')}
                <Forward />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className={cn(section, 'flex flex-wrap items-center justify-between gap-4 py-8')}>
          <Logo />
          <p className="text-small text-ink-muted">
            © 2026 {t('app.name')} · {t('landing.footer')}
          </p>
        </div>
      </footer>
    </div>
  )
}
