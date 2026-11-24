import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  resetStaffPassword,
  TemporaryPasswordDialog,
  type StaffMember,
} from '@/entities/staff-member'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/dialog'

/** For staff who forgot their password: the manager makes a new temporary one. */
export function ResetStaffPasswordButton({ member }: { member: StaffMember }) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const mutation = useMutation({ mutationFn: () => resetStaffPassword(member.id) })

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setConfirming(true)}
        disabled={!member.active}
      >
        {t('staff.newPassword')}
      </Button>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          mutation.mutate()
        }}
        title={t('staff.password.resetTitle', { name: member.name })}
        message={t('staff.password.resetBody')}
        confirmLabel={t('staff.password.resetConfirm')}
      />
      <TemporaryPasswordDialog
        member={mutation.data ? member : null}
        password={mutation.data?.temporaryPassword ?? null}
        onClose={() => mutation.reset()}
      />
    </>
  )
}
