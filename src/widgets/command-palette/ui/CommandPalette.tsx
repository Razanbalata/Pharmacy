/* Same ARIA combobox + listbox pattern as shared/ui/combobox: driven from the input with the keyboard. */
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events */
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { canAccess, navigationFor, type Area, type Role } from '@/entities/session'
import { i18n } from '@/shared/i18n'
import { paths, type PathKey } from '@/shared/config'
import { matchesSearch } from '@/shared/lib/arabic-search'
import { cn } from '@/shared/lib/cn'
import { usePaletteStore } from '../model/store'

interface Entry {
  id: string
  label: string
  /** The label in both languages, so English search works in the Arabic interface and back. */
  searchText: string
  to: string
  group: 'pages' | 'commands'
}

const COMMANDS: { id: 'newProduct' | 'newPurchase' | 'newCustomer'; to: string; area: Area }[] = [
  { id: 'newProduct', to: `${paths.products}?new=1`, area: 'products' },
  { id: 'newPurchase', to: `${paths.purchases}?new=1`, area: 'purchases' },
  { id: 'newCustomer', to: `${paths.customers}?new=1`, area: 'customers' },
]

function bothLanguages(key: string): string {
  return `${i18n.t(key as never, { lng: 'ar' })} ${i18n.t(key as never, { lng: 'en' })}`
}

function buildEntries(role: Role, t: (key: string) => string): Entry[] {
  const pages: Entry[] = navigationFor(role).flatMap((group) =>
    group.items.map((item) => ({
      id: `page-${item.key}`,
      label: t(`nav.${item.key}`),
      searchText: bothLanguages(`nav.${item.key}`),
      to: paths[item.key as PathKey],
      group: 'pages' as const,
    })),
  )
  const commands: Entry[] = [
    {
      id: 'newSale',
      label: t('shell.newSale'),
      searchText: bothLanguages('shell.newSale'),
      to: paths.pos,
      group: 'commands',
    },
    ...COMMANDS.filter((command) => canAccess(role, command.area)).map((command) => ({
      id: command.id,
      label: t(`palette.${command.id}`),
      searchText: bothLanguages(`palette.${command.id}`),
      to: command.to,
      group: 'commands' as const,
    })),
  ]
  return [...pages, ...commands]
}

/**
 * Search everything, from anywhere. For now it finds screens and commands; products,
 * customers and invoices join it as their modules are built.
 */
export function CommandPalette({ role }: { role: Role }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const open = usePaletteStore((state) => state.open)
  const setOpen = usePaletteStore((state) => state.setOpen)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const entries = useMemo(() => buildEntries(role, (key) => t(key as never)), [role, t])
  const results = useMemo(
    () =>
      query.trim() ? entries.filter((entry) => matchesSearch(entry.searchText, query)) : entries,
    [entries, query],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function close() {
    setOpen(false)
    setQuery('')
    setActive(0)
  }

  function go(entry: Entry | undefined) {
    if (!entry) return
    close()
    void navigate(entry.to)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      go(results[active])
    }
  }

  const groups = (['pages', 'commands'] as const)
    .map((group) => ({ group, items: results.filter((entry) => entry.group === group) }))
    .filter((group) => group.items.length > 0)

  return (
    <dialog
      ref={dialogRef}
      aria-label={t('palette.title')}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      className="mx-auto mt-[12vh] w-[min(680px,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg bg-surface-100 text-ink shadow-pop backdrop:bg-navy/50 open:flex"
    >
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span aria-hidden className="text-ink-muted">
          ⌕
        </span>
        <input
          // The palette exists to type into, so focusing it on open is expected.
          // oxlint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          aria-activedescendant={results[active] ? `palette-${results[active].id}` : undefined}
          aria-label={t('palette.title')}
          placeholder={t('palette.placeholder')}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          className="flex-1 bg-transparent text-subheading outline-none placeholder:text-ink-muted"
        />
        <kbd className="tabular rounded-sm border border-border px-1.5 text-caption text-ink-muted">
          Esc
        </kbd>
      </div>
      <div id="palette-results" role="listbox" className="max-h-[50vh] overflow-auto py-2">
        {groups.map(({ group, items }) => (
          <div key={group} role="group" aria-label={t(`palette.${group}`)}>
            <p className="px-5 pt-2 pb-1 text-caption font-semibold text-ink-muted">
              {t(`palette.${group}`)}
            </p>
            {items.map((entry) => {
              const index = results.indexOf(entry)
              return (
                <div
                  key={entry.id}
                  id={`palette-${entry.id}`}
                  role="option"
                  tabIndex={-1}
                  aria-selected={index === active}
                  onMouseDown={(event) => {
                    event.preventDefault()
                    go(entry)
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    'mx-2 cursor-pointer rounded-md px-3 py-2.5 text-body',
                    index === active && 'bg-brand-soft text-brand-strong',
                  )}
                >
                  {entry.label}
                </div>
              )
            })}
          </div>
        ))}
        {results.length === 0 && (
          <p className="px-5 py-6 text-center text-small text-ink-muted">
            {t('common.noResultsFor', { query: query.trim() })}
          </p>
        )}
      </div>
      <footer className="flex flex-wrap gap-4 border-t border-border bg-surface-0 px-5 py-2.5 text-caption text-ink-muted">
        <span>↑ ↓ {t('palette.navigate')}</span>
        <span>Enter {t('palette.open')}</span>
        <span className="ms-auto">{t('palette.hint')}</span>
      </footer>
    </dialog>
  )
}
