import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatPhone } from '@/shared/lib/validation'
import { Button } from '@/shared/ui/button'
import { Dialog } from '@/shared/ui/dialog'

interface TemporaryPasswordDialogProps {
  member: { name: string; phone: string } | null
  password: string | null
  onClose: () => void
}

/** Shows a temporary password once, with copy and "send on WhatsApp". */
export function TemporaryPasswordDialog({
  member,
  password,
  onClose,
}: TemporaryPasswordDialogProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  if (!member || !password) return null

  const message = t('staff.password.message', {
    name: member.name,
    phone: formatPhone(member.phone),
    password,
  })
  const whatsapp = `https://wa.me/970${member.phone.replace(/^0/, '')}?text=${encodeURIComponent(message)}`

  return (
    <Dialog
      open
      onClose={onClose}
      title={t('staff.password.title', { name: member.name })}
      description={t('staff.password.body')}
      footer={
        <>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="flex h-10 items-center rounded-md bg-success px-4 text-body font-semibold text-surface-100"
          >
            {t('staff.password.whatsapp')}
          </a>
          <Button variant="ghost" onClick={onClose}>
            {t('staff.password.done')}
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-md border border-dashed border-border-strong bg-surface-0 p-4">
        <code dir="ltr" className="tabular flex-1 text-heading tracking-widest">
          {password}
        </code>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            void navigator.clipboard?.writeText(password)
            setCopied(true)
          }}
        >
          {copied ? t('staff.password.copied') : t('staff.password.copy')}
        </Button>
      </div>
    </Dialog>
  )
}
