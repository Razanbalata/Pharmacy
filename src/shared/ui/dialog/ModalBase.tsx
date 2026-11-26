import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
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
 * returns focus to the button that opened it. We add closing on a click outside the box
 * (on the dim backdrop), which the browser does not do by itself.
 */
function isOutside(dialog: HTMLDialogElement, x: number, y: number) {
  const box = dialog.getBoundingClientRect()
  return x < box.left || x > box.right || y < box.top || y > box.bottom
}

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
  // Only close when the press both started and ended outside, so selecting text
  // inside the box and releasing over the backdrop does not close it.
  const pressedOutside = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // Escape is handled natively (onCancel below); this adds the mouse path.
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const dialog: HTMLDialogElement = node
    function onDown(event: MouseEvent) {
      pressedOutside.current =
        event.target === dialog && isOutside(dialog, event.clientX, event.clientY)
    }
    function onUp(event: MouseEvent) {
      if (
        pressedOutside.current &&
        event.target === dialog &&
        isOutside(dialog, event.clientX, event.clientY)
      )
        closeRef.current()
      pressedOutside.current = false
    }
    dialog.addEventListener('mousedown', onDown)
    dialog.addEventListener('click', onUp)
    return () => {
      dialog.removeEventListener('mousedown', onDown)
      dialog.removeEventListener('click', onUp)
    }
  }, [])

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
        'flex-col bg-surface-100 text-ink shadow-pop backdrop:bg-[rgba(8,20,32,0.5)] backdrop:backdrop-blur-[2px] open:flex',
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
          className="grid size-9 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-200 hover:text-ink"
        >
          <X aria-hidden className="size-5" strokeWidth={2} />
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
