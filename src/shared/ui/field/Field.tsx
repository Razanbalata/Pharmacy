import { useId, type ReactElement, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'

/** What a control receives from Field so its label, hint and error are announced together. */
export interface FieldControlProps {
  id: string
  'aria-describedby'?: string
  'aria-invalid'?: true
}

interface FieldProps {
  label: ReactNode
  /** Short help under the control. */
  hint?: ReactNode
  /** Shown in red under the control; also marks it invalid for screen readers. */
  error?: string | undefined
  /** Marks the label "optional"; required is the default in forms, so it needs no mark. */
  optional?: boolean
  className?: string
  children: (control: FieldControlProps) => ReactElement
}

/**
 * Label + control + hint + error, wired with ids. Every form field in the app goes through
 * this, so all of them look and read the same.
 */
export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const { t } = useTranslation()
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-small font-semibold text-ink">
        {label}
        {optional && (
          <span className="ms-1 font-normal text-ink-muted">({t('common.optional')})</span>
        )}
      </label>
      {children({
        id,
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': true as const } : {}),
      })}
      {error && (
        <p id={errorId} className="text-small text-danger">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-caption text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  )
}
