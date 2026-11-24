import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { SetupPharmacyForm } from '@/features/pharmacy/setup-pharmacy'
import { PageSkeleton } from '@/shared/ui/skeleton'
import { Steps } from '@/shared/ui/steps'

/** Step 3 of joining, right after activation. Full width, no sidebar yet. */
export function SetupPage() {
  const { t } = useTranslation()
  const steps = [t('auth.steps.request'), t('auth.steps.activate'), t('auth.steps.pharmacy')]
  return (
    <div className="min-h-dvh bg-surface-0 px-5 py-8 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <span className="font-display text-subheading font-bold">{t('app.name')}</span>
          <div className="w-full max-w-lg">
            <Steps steps={steps} current={2} />
          </div>
        </header>
        <Suspense fallback={<PageSkeleton variant="form" />}>
          <SetupPharmacyForm />
        </Suspense>
      </div>
    </div>
  )
}
