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
    <fieldset className="inline-flex overflow-hidden rounded-md border border-border-strong">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            'cursor-pointer px-3.5 py-1.5 text-small has-focus-visible:outline-3 has-focus-visible:outline-focus',
            value === option.value ? 'bg-ink text-surface-100' : 'text-ink hover:bg-surface-200',
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
