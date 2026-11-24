import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { logout } from '@/entities/session'
import { paths } from '@/shared/config'
import { Button } from '@/shared/ui/button'

/** Ends the session and clears every cached answer, so the next person sees nothing of it. */
export function LogoutButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear()
      void navigate(paths.login, { replace: true })
    },
  })
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {t('shell.logout')}
    </Button>
  )
}
