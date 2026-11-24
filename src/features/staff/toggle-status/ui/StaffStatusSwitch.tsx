import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setStaffActive, staffQueries, type StaffMember } from '@/entities/staff-member'
import { ConfirmDialog } from '@/shared/ui/dialog'
import { Switch } from '@/shared/ui/switch'
import { toast } from '@/shared/ui/toast'

/** Staff are stopped, never deleted: their invoices keep their name. Stopping asks first and can be undone. */
export function StaffStatusSwitch({ member }: { member: StaffMember }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [confirming, setConfirming] = useState(false)
  const mutation = useMutation({
    mutationFn: (active: boolean) => setStaffActive(member.id, active),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: staffQueries.all })
      if (updated.active) toast.success(t('staff.activatedToast', { name: member.name }))
      else
        toast.success(t('staff.stoppedToast', { name: member.name }), {
          label: t('common.undo'),
          onClick: () => mutation.mutate(true),
        })
    },
  })

  return (
    <>
      <label className="flex items-center gap-2 text-small">
        <Switch
          aria-label={t('staff.toggleLabel', { name: member.name })}
          checked={member.active}
          disabled={mutation.isPending}
          onChange={() => (member.active ? setConfirming(true) : mutation.mutate(true))}
        />
        {member.active ? t('staff.active') : t('staff.stopped')}
      </label>
      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          mutation.mutate(false)
        }}
        tone="danger"
        title={t('staff.stopTitle', { name: member.name })}
        message={t('staff.stopBody')}
        confirmLabel={t('staff.stopConfirm')}
      />
    </>
  )
}
