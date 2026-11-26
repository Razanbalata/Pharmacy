import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { logout } from '@/entities/session'
import { paths } from '@/shared/config'
import { LogOut } from 'lucide-react'

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
    <button
      type="button"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-start text-small font-medium text-danger transition-colors hover:bg-danger-soft disabled:opacity-60"
    >
      <LogOut aria-hidden className="size-4 rtl:-scale-x-100" />
      {t('shell.logout')}
    </button>
  )
}
