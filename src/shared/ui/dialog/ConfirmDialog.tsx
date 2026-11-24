import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { Dialog } from './Dialog'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: ReactNode
  message: ReactNode
  confirmLabel?: string
  /** "danger" for things that cannot be undone, like cancelling an invoice. */
  tone?: 'primary' | 'danger'
  busy?: boolean
}

/** Asked before anything important. Says what will happen, not "are you sure?". */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  tone = 'primary',
  busy = false,
}: ConfirmDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={message}
      footer={
        <>
          <Button variant={tone} onClick={onConfirm} disabled={busy}>
            {confirmLabel ?? t('common.confirm')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('common.back')}
          </Button>
        </>
      }
    />
  )
}
