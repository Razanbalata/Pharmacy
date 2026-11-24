import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'

export interface ModalBaseProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}

/**
 * Built on the native <dialog>: the browser traps focus inside, closes on Escape and
 * returns focus to the button that opened it. We only style it.
 */
export function ModalBase({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  bodyClassName,
}: ModalBaseProps & { className: string; bodyClassName?: string }) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      {...(description ? { 'aria-describedby': descriptionId } : {})}
      onCancel={(event) => {
        // Escape: let React own the open state instead of the browser.
        event.preventDefault()
        onClose()
      }}
      className={cn(
        'flex-col bg-surface-100 text-ink shadow-pop backdrop:bg-navy/45 open:flex',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div className="flex flex-col gap-1">
          <h2 id={titleId} className="font-display text-subheading">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-small text-ink-muted">
              {description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close')}
          className="rounded-md px-2 py-1 text-ink-muted hover:bg-surface-200"
        >
          ✕
        </button>
      </header>
      {children && (
        <div className={cn('flex-1 overflow-auto px-6 py-5', bodyClassName)}>{children}</div>
      )}
      {footer && (
        <footer className="flex flex-wrap gap-2 border-t border-border px-6 py-4">{footer}</footer>
      )}
    </dialog>
  )
}
