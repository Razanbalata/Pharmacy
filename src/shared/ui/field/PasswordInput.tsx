import { useState, type InputHTMLAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { passwordStrength } from '@/shared/lib/validation'
import { Input } from './Input'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  /** Shows the strength bar under the field; for new passwords only. */
  showStrength?: boolean
}

const BAR = ['bg-danger', 'bg-danger', 'bg-warning', 'bg-success', 'bg-success']

/** Password with a show/hide button and, for new passwords, a strength bar. */
export function PasswordInput({
  showStrength = false,
  className,
  onChange,
  ...props
}: PasswordInputProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  // Works with or without a controlled value: the strength follows what is typed.
  const [text, setText] = useState(typeof props.value === 'string' ? props.value : '')
  const score = passwordStrength(text)
  const labels = t('password.strength', { returnObjects: true }) as string[]

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          {...props}
          onChange={(event) => {
            setText(event.target.value)
            onChange?.(event)
          }}
          type={visible ? 'text' : 'password'}
          dir="ltr"
          // The field is always left-to-right, so the button sits on its right in both languages.
          className={cn('pr-20 text-left', className)}
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          className="absolute inset-y-0 right-2 my-auto h-7 rounded-sm px-2 text-small text-ink-muted hover:bg-surface-200"
        >
          {visible ? t('password.hide') : t('password.show')}
        </button>
      </div>
      {showStrength && text.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1" aria-hidden>
            {[1, 2, 3, 4].map((step) => (
              <span
                key={step}
                className={cn('h-1 flex-1 rounded-pill', step <= score ? BAR[score] : 'bg-border')}
              />
            ))}
          </div>
          <span className="text-caption text-ink-muted">{labels[score]}</span>
        </div>
      )}
    </div>
  )
}
