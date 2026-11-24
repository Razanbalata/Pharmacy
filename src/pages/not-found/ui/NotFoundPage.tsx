import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="tabular text-number-xl text-border">404</p>
      <h1 className="font-display text-heading">{t('notFound.title')}</h1>
      <Link
        to="/"
        className="rounded-md bg-brand px-4 py-2 text-body text-on-brand hover:bg-brand-strong"
      >
        {t('notFound.back')}
      </Link>
    </main>
  )
}
