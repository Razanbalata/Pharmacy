import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { ResetPasswordFlow } from '@/features/auth/reset-password'
import { paths } from '@/shared/config'
import { AuthShell } from '@/widgets/auth-shell'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  return (
    <AuthShell>
      <div className="flex flex-col gap-1.5">
        <Link to={paths.login} className="text-small text-brand-strong hover:underline">
          ← {t('auth.forgot.backToLogin')}
        </Link>
        <h1 className="font-display text-heading">{t('auth.forgot.title')}</h1>
      </div>
      <ResetPasswordFlow />
    </AuthShell>
  )
}
