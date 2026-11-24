import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { shiftQueries } from '@/entities/shift'
import { CloseShiftForm } from '@/features/shift/close-shift'
import { OpenShiftForm } from '@/features/shift/open-shift'
import { TillHeader } from '@/widgets/till-header'
import { paths } from '@/shared/config'
import { buttonVariants } from '@/shared/ui/button'
import { PageSkeleton } from '@/shared/ui/skeleton'

/** Opens the shift at the start of the day, or closes it at the end. */
export function ShiftPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: current, isPending } = useQuery(shiftQueries.current())

  return (
    <div className="flex min-h-dvh flex-col bg-surface-200">
      <TillHeader />
      <main className="flex grow flex-col items-center gap-4 p-6">
        {isPending ? (
          <PageSkeleton variant="form" />
        ) : current?.shift ? (
          <>
            <CloseShiftForm
              onClosed={() => void navigate(paths.dashboard)}
              onShowHeld={() => void navigate(`${paths.pos}?held=1`)}
            />
            <Link to={paths.pos} className={buttonVariants({ variant: 'ghost' })}>
              {t('shift.backToSale')}
            </Link>
          </>
        ) : (
          <OpenShiftForm onOpened={() => void navigate(paths.pos)} />
        )}
      </main>
    </div>
  )
}
