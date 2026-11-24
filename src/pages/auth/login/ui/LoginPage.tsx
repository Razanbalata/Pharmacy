import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router'
import { landingPathFor, useCurrentUser } from '@/entities/session'
import { LoginForm } from '@/features/auth/login'
import { paths } from '@/shared/config'
import { AuthShell } from '@/widgets/auth-shell'

export function LoginPage() {
  const { t } = useTranslation()
  const { data: user } = useCurrentUser()
  // Already signed in (e.g. opened /login from a bookmark): go straight in.
  if (user) return <Navigate to={landingPathFor(user)} replace />

  return (
    <AuthShell>
      <div>
        <h1 className="font-display text-display">{t('auth.login.title')}</h1>
        <p className="mt-1.5 text-body text-ink-muted">{t('auth.login.subtitle')}</p>
      </div>
      <LoginForm />
      <p className="text-center text-body text-ink-muted">
        {t('auth.login.newPharmacy')}{' '}
        <Link to={paths.join} className="font-semibold text-brand-strong hover:underline">
          {t('auth.login.join')}
        </Link>
      </p>
      <p className="text-center text-small text-ink-muted">{t('auth.login.staffNote')}</p>
    </AuthShell>
  )
}
