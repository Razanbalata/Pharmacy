import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/cn'
import { SkeletonRows } from '@/shared/ui/skeleton'

export interface Column<Row> {
  id: string
  header: ReactNode
  cell: (row: Row) => ReactNode
  /** Numbers line up on the end side and use tabular figures. */
  numeric?: boolean
  className?: string
}

interface SelectionProps {
  selected: ReadonlySet<string>
  onChange: (selected: Set<string>) => void
  /** How to name a row for screen readers, e.g. the product name. */
  rowLabel: (id: string) => string
}

interface DataTableProps<Row> {
  columns: Column<Row>[]
  rows: Row[]
  getRowId: (row: Row) => string
  /** Accessible name of the table, e.g. "الأصناف". */
  caption: string
  loading?: boolean
  /** Shown instead of the body when there are no rows. */
  empty?: ReactNode
  selection?: SelectionProps
}

/**
 * The table used by every list screen. Rows open their details through a link in a cell,
 * not a click on the row, so it works with the keyboard and in a new tab.
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowId,
  caption,
  loading = false,
  empty,
  selection,
}: DataTableProps<Row>) {
  const { t } = useTranslation()

  if (loading) return <SkeletonRows />
  if (rows.length === 0 && empty) return <>{empty}</>

  const ids = rows.map(getRowId)
  const allSelected = selection
    ? ids.length > 0 && ids.every((id) => selection.selected.has(id))
    : false
  const someSelected = selection ? ids.some((id) => selection.selected.has(id)) : false

  function toggleAll() {
    if (!selection) return
    const next = new Set(selection.selected)
    for (const id of ids) {
      if (allSelected) next.delete(id)
      else next.add(id)
    }
    selection.onChange(next)
  }

  function toggleOne(id: string) {
    if (!selection) return
    const next = new Set(selection.selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    selection.onChange(next)
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface-100 shadow-card">
      <table className="w-full border-collapse text-body">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {selection && (
              <th scope="col" className="w-10 border-b border-border bg-surface-200/50 px-3 py-3">
                <input
                  type="checkbox"
                  aria-label={t('common.selectAll')}
                  checked={allSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = someSelected && !allSelected
                  }}
                  onChange={toggleAll}
                  className="size-4 accent-brand"
                />
              </th>
            )}
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  'border-b border-border bg-surface-200/50 px-4 py-3 text-start text-small font-semibold whitespace-nowrap text-ink-muted',
                  column.numeric && 'text-end',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = getRowId(row)
            const isSelected = selection?.selected.has(id) ?? false
            return (
              <tr
                key={id}
                aria-selected={selection ? isSelected : undefined}
                className={cn(
                  'transition-colors hover:bg-surface-200/50 [&:last-child>td]:border-b-0',
                  isSelected && 'bg-brand-soft/40',
                )}
              >
                {selection && (
                  <td className="border-b border-border/60 px-3 py-3.5">
                    <input
                      type="checkbox"
                      aria-label={t('common.selectRow', { name: selection.rowLabel(id) })}
                      checked={isSelected}
                      onChange={() => toggleOne(id)}
                      className="size-4 accent-brand"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      'border-b border-border/60 px-4 py-3.5 whitespace-nowrap',
                      column.numeric && 'tabular text-end',
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
