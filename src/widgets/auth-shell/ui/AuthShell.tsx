import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/features/switch-language'
import { ThemeSwitcher } from '@/features/switch-theme'

interface AuthShellProps {
  children: ReactNode
  /** Big line on the dark panel; defaults to the product promise. */
  headline?: string
  sub?: string
  /** Something next to the form on wide screens, e.g. the "request sent" card. */
  aside?: ReactNode
}

/**
 * The frame of every screen before sign-in: the form on the start side,
 * the dark brand panel on the end side, language and theme at the top.
 */
export function AuthShell({ children, headline, sub, aside }: AuthShellProps) {
  const { t } = useTranslation()
  const points = t('auth.brandPoints', { returnObjects: true }) as string[]

  return (
    <div className="flex min-h-dvh bg-surface-0">
      <div className="flex flex-1 flex-col px-5 py-6 sm:px-10">
        <div className="flex flex-wrap justify-end gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
        <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center gap-8 py-8">
          <main className="flex w-full max-w-[440px] flex-col gap-5">{children}</main>
          {aside && <div className="hidden w-80 shrink-0 xl:block">{aside}</div>}
        </div>
      </div>
      <aside className="relative hidden w-[480px] shrink-0 flex-col gap-7 overflow-hidden bg-navy p-10 text-on-navy lg:flex">
        <div
          aria-hidden
          className="absolute -bottom-36 -start-28 size-[420px] rounded-pill bg-brand opacity-25"
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-md bg-brand font-display text-subheading text-on-brand">
            ف
          </span>
          <span className="font-display text-subheading font-bold">{t('app.name')}</span>
        </div>
        <div className="relative mt-auto">
          <p className="font-display text-[34px] leading-[48px] font-bold">
            {headline ?? t('auth.brandHeadline')}
          </p>
          <p className="mt-3 max-w-[420px] text-body opacity-75">{sub ?? t('auth.brandSub')}</p>
        </div>
        <ul className="relative flex flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex items-center gap-2.5 text-small opacity-90">
              <span
                aria-hidden
                className="flex size-6 items-center justify-center rounded-pill bg-navy-soft text-brand"
              >
                ✓
              </span>
              {point}
            </li>
          ))}
        </ul>
        <p className="relative text-caption opacity-50">© 2026 {t('app.name')}</p>
      </aside>
    </div>
  )
}
