import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { dismissOnboarding, pharmacyQueries } from '@/entities/pharmacy'
import { sessionQueries } from '@/entities/session'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'

export function DismissOnboardingButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: dismissOnboarding,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pharmacyQueries.all }),
        queryClient.invalidateQueries({ queryKey: sessionQueries.all }),
      ])
      void navigate(paths.dashboard)
    },
  })
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {t('auth.onboarding.hide')}
    </Button>
  )
}
