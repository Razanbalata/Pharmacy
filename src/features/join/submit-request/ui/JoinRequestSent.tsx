import { useTranslation } from 'react-i18next'

/** Shown after the join form is sent. */
export function JoinRequestSent({ reference, phone }: { reference: string; phone: string }) {
  const { t } = useTranslation()
  return (
    <section
      aria-live="polite"
      className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface-100 shadow-card p-6 text-center shadow-card"
    >
      <span
        aria-hidden
        className="flex size-14 items-center justify-center rounded-pill bg-success-soft text-heading text-success"
      >
        ✓
      </span>
      <h2 className="font-display text-subheading">{t('auth.join.sentTitle')}</h2>
      <p className="text-body text-ink-muted">
        {t('auth.join.sentBody', { last: phone.slice(-3) })}
      </p>
      <p className="tabular text-small text-ink-muted">{t('auth.join.reference', { reference })}</p>
    </section>
  )
}
