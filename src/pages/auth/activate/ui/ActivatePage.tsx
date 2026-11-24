import { useMutation, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { joinRequestQueries, resendActivation } from '@/entities/join-request'
import { ActivateForm } from '@/features/join/activate-account'
import { ApiError } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { Steps } from '@/shared/ui/steps'
import { toast } from '@/shared/ui/toast'
import { AuthShell } from '@/widgets/auth-shell'

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-11" />
      <Skeleton className="h-9 w-2/3" />
      {[0, 1, 2, 3].map((key) => (
        <div key={key} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10" />
        </div>
      ))}
      <Skeleton className="h-12" />
    </div>
  )
}

export function ActivatePage() {
  const { t } = useTranslation()
  const { token = '' } = useParams()
  const activation = useQuery(joinRequestQueries.activation(token))
  const resend = useMutation({
    mutationFn: () => resendActivation(token),
    onSuccess: () => toast.success(t('auth.activate.resent')),
  })
  const steps = [t('auth.steps.request'), t('auth.steps.activate'), t('auth.steps.pharmacy')]
  const error = activation.error instanceof ApiError ? activation.error : null

  return (
    <AuthShell headline={t('auth.activate.brandHeadline')} sub={t('auth.activate.brandSub')}>
      <Steps steps={steps} current={1} />
      {activation.isPending && <FormSkeleton />}
      {error?.isGone && (
        <EmptyState
          icon="⌛"
          tone="neutral"
          title={t('auth.activate.expiredTitle')}
          description={t('auth.activate.expiredBody')}
          actions={
            <Button onClick={() => resend.mutate()} disabled={resend.isPending || resend.isSuccess}>
              {t('auth.activate.resend')}
            </Button>
          }
        />
      )}
      {activation.isError && !error?.isGone && (
        <EmptyState
          icon="✕"
          title={t('auth.activate.unknownTitle')}
          description={t('auth.activate.unknownBody')}
        />
      )}
      {activation.data && (
        <>
          <p className="rounded-md bg-success-soft px-3.5 py-3 text-body text-success">
            ✓ {t('auth.activate.approved', { pharmacy: activation.data.pharmacyName })}
          </p>
          <div>
            <h1 className="font-display text-heading">{t('auth.activate.title')}</h1>
            <p className="mt-1.5 text-body text-ink-muted">{t('auth.activate.subtitle')}</p>
          </div>
          <ActivateForm token={token} info={activation.data} />
        </>
      )}
    </AuthShell>
  )
}
