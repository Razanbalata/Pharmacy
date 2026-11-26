import { Link } from 'react-router'
import { formatMoney } from '@/shared/lib/money'
import { buttonVariants } from '@/shared/ui/button'
import type { AssistantBlock } from '../model/types'
import { useActionLink } from '../model/use-action-link'

/** One answer: text, a small table, bars to compare, and buttons to the screens it mentions. */
export function Answer({ blocks }: { blocks: AssistantBlock[] }) {
  const link = useActionLink()
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`
        if (block.type === 'text') return <p key={key}>{block.text}</p>
        if (block.type === 'table') {
          return (
            <div key={key} className="overflow-x-auto rounded-md border border-border">
              <table className="w-full text-small">
                <thead>
                  <tr className="border-b border-border bg-surface-200/60">
                    {block.columns.map((column) => (
                      <th key={column} className="px-3 py-2 text-start font-semibold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    // Rows have no id of their own; their order never changes once shown.
                    // oxlint-disable-next-line react/no-array-index-key
                    <tr key={rowIndex} className="border-b border-border last:border-0">
                      {row.map((cell, cellIndex) => (
                        // oxlint-disable-next-line react/no-array-index-key
                        <td key={cellIndex} className="tabular px-3 py-2">
                          <bdi>{cell}</bdi>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === 'bars') {
          const max = Math.max(1, ...block.items.map((item) => Math.abs(item.value)))
          return (
            <ul key={key} className="flex flex-col gap-2">
              {block.items.map((item) => (
                <li
                  key={item.label}
                  className="grid grid-cols-[6rem_1fr_6rem] items-center gap-2 text-small"
                >
                  <span>{item.label}</span>
                  <span className="h-2 overflow-hidden rounded-pill bg-surface-200" aria-hidden>
                    <span
                      className="block h-full rounded-pill bg-brand"
                      style={{ width: `${(Math.abs(item.value) / max) * 100}%` }}
                    />
                  </span>
                  <span className="tabular text-end font-semibold">
                    {formatMoney(item.value)} ₪
                  </span>
                </li>
              ))}
            </ul>
          )
        }
        return (
          <div key={key} className="flex flex-wrap gap-2">
            {block.items.map((action) => {
              const { href, label } = link(action)
              return (
                <Link
                  key={href}
                  to={href}
                  className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                >
                  {label}
                </Link>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
