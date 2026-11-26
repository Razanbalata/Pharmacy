/*
 * A native <select> cannot be searched, so this follows the ARIA combobox + listbox pattern.
 * Options are picked with the arrow keys and Enter from the input, which keeps focus;
 * the mouse handlers on options are an addition, not the only way in.
 */
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events */
import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { matchesSearch, normalizeArabic } from '@/shared/lib/arabic-search'
import { cn } from '@/shared/lib/cn'
import type { FieldControlProps } from '@/shared/ui/field'

export interface ComboboxOption {
  value: string
  label: string
  /** Small text on the end side, e.g. "48 صنف". */
  meta?: string
  /** Extra words that should also find this option, e.g. the English name. */
  keywords?: string
}

interface ComboboxProps extends Partial<FieldControlProps> {
  options: ComboboxOption[]
  value: string | null
  onChange: (value: string | null) => void
  /** When given, typing a name that is not in the list offers "Add ...". */
  onCreate?: (label: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

const MAX_VISIBLE = 50

/**
 * Searchable select. The rule from the design: any list with more than 7 choices uses this,
 * never a plain <select>. Search understands Arabic the way people type it.
 */
export function Combobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder,
  disabled,
  className,
  ...control
}: ComboboxProps) {
  const { t } = useTranslation()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = options.find((option) => option.value === value) ?? null
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)

  const filtered = useMemo(() => {
    if (!query.trim()) return options.slice(0, MAX_VISIBLE)
    return options
      .filter((option) => matchesSearch(`${option.label} ${option.keywords ?? ''}`, query))
      .slice(0, MAX_VISIBLE)
  }, [options, query])

  const trimmed = query.trim()
  const exactExists = options.some(
    (option) => normalizeArabic(option.label) === normalizeArabic(trimmed),
  )
  const canCreate = Boolean(onCreate && trimmed && !exactExists)
  const rowCount = filtered.length + (canCreate ? 1 : 0)

  function close() {
    setOpen(false)
    setQuery('')
    setActive(0)
  }

  function choose(index: number) {
    const option = filtered[index]
    if (option) onChange(option.value)
    else if (canCreate) onCreate?.(trimmed)
    close()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) setOpen(true)
      else setActive((index) => Math.min(index + 1, rowCount - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      choose(active)
    } else if (event.key === 'Escape') {
      close()
    }
  }

  const optionId = (index: number) => `${listId}-${index}`

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        {...control}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        {...(open && rowCount > 0 ? { 'aria-activedescendant': optionId(active) } : {})}
        disabled={disabled}
        placeholder={selected ? undefined : placeholder}
        value={open ? query : (selected?.label ?? '')}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={close}
        onKeyDown={onKeyDown}
        className={cn(
          'h-10 w-full rounded-lg border border-border bg-surface-100 ps-3 pe-9 text-body text-ink',
          'placeholder:text-ink-muted focus:border-brand focus:ring-3 focus:ring-brand-soft focus:outline-none',
          'disabled:cursor-not-allowed disabled:bg-surface-200 aria-invalid:border-danger',
        )}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-ink-muted"
      >
        ▾
      </span>
      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-auto rounded-lg border border-border bg-surface-100 shadow-card p-1 shadow-pop"
        >
          {filtered.map((option, index) => (
            <div
              key={option.value}
              id={optionId(index)}
              role="option"
              tabIndex={-1}
              aria-selected={option.value === value}
              // mousedown keeps focus in the input, so blur does not close the list first.
              onMouseDown={(event) => {
                event.preventDefault()
                choose(index)
              }}
              onMouseEnter={() => setActive(index)}
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-body',
                index === active && 'bg-brand-soft text-brand-strong',
                option.value === value && 'font-semibold',
              )}
            >
              <span>{option.label}</span>
              {option.meta && <span className="text-caption text-ink-muted">{option.meta}</span>}
            </div>
          ))}
          {canCreate && (
            <div
              id={optionId(filtered.length)}
              role="option"
              tabIndex={-1}
              aria-selected={false}
              onMouseDown={(event) => {
                event.preventDefault()
                choose(filtered.length)
              }}
              onMouseEnter={() => setActive(filtered.length)}
              className={cn(
                'cursor-pointer rounded-md border-t border-border px-3 py-2 text-body text-brand-strong',
                active === filtered.length && 'bg-brand-soft',
              )}
            >
              + {t('common.addNew', { value: trimmed })}
            </div>
          )}
          {rowCount === 0 && (
            <div className="px-3 py-2 text-small text-ink-muted">
              {t('common.noResultsFor', { query: trimmed })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
