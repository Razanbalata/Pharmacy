import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { JoinRequestForm, JoinRequestSent } from '@/features/join/submit-request'
import { paths } from '@/shared/config'
import { Steps } from '@/shared/ui/steps'
import { AuthShell } from '@/widgets/auth-shell'

export function JoinPage() {
  const { t } = useTranslation()
  const [sent, setSent] = useState<{ reference: string; phone: string } | null>(null)
  const steps = [t('auth.steps.request'), t('auth.steps.activate'), t('auth.steps.pharmacy')]

  return (
    <AuthShell headline={t('auth.join.brandHeadline')} sub={t('auth.join.brandSub')}>
      <Steps steps={steps} current={sent ? 1 : 0} />
      {sent ? (
        <JoinRequestSent reference={sent.reference} phone={sent.phone} />
      ) : (
        <>
          <div>
            <h1 className="font-display text-heading">{t('auth.join.title')}</h1>
            <p className="mt-1.5 text-body text-ink-muted">{t('auth.join.subtitle')}</p>
          </div>
          <JoinRequestForm onSent={setSent} />
        </>
      )}
      <p className="text-center text-body text-ink-muted">
        {t('auth.join.haveAccount')}{' '}
        <Link to={paths.login} className="font-semibold text-brand-strong hover:underline">
          {t('auth.join.signIn')}
        </Link>
      </p>
    </AuthShell>
  )
}
