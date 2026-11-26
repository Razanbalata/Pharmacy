import { useId } from 'react'
import { cn } from '@/shared/lib/cn'

interface SegmentedProps<Value extends string> {
  label: string
  options: { value: Value; label: string }[]
  value: Value
  onChange: (value: Value) => void
  name?: string
}

/** Two to four choices side by side, like 80 mm / 58 mm / A4. Real radio buttons inside. */
export function Segmented<Value extends string>({
  label,
  options,
  value,
  onChange,
  name,
}: SegmentedProps<Value>) {
  const fallbackName = useId()
  return (
    <fieldset className="inline-flex gap-0.5 rounded-lg bg-surface-200 p-1">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'cursor-pointer rounded-md px-3.5 py-1.5 text-small font-medium whitespace-nowrap transition-colors has-focus-visible:outline-3 has-focus-visible:outline-focus',
            value === option.value
              ? 'bg-surface-100 font-semibold text-ink shadow-card'
              : 'text-ink-muted hover:text-ink',
          )}
        >
          <input
            type="radio"
            name={name ?? fallbackName}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  )
}
