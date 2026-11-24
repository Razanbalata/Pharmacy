import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'
import { Pagination } from './Pagination'

interface Product {
  id: string
  name: string
  price: string
}

const rows: Product[] = [
  { id: '1', name: 'Panadol Extra', price: '21.00' },
  { id: '2', name: 'Ventolin Inhaler', price: '24.00' },
]

const columns: Column<Product>[] = [
  { id: 'name', header: 'الصنف', cell: (row) => row.name },
  { id: 'price', header: 'السعر', cell: (row) => row.price, numeric: true },
]

function Selectable() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  return (
    <>
      <DataTable
        caption="الأصناف"
        columns={columns}
        rows={rows}
        getRowId={(row) => row.id}
        selection={{
          selected,
          onChange: setSelected,
          rowLabel: (id) => rows.find((row) => row.id === id)?.name ?? id,
        }}
      />
      <output>{selected.size}</output>
    </>
  )
}

describe('DataTable', () => {
  it('renders a named table with headers and rows', () => {
    render(<DataTable caption="الأصناف" columns={columns} rows={rows} getRowId={(row) => row.id} />)
    const table = screen.getByRole('table', { name: 'الأصناف' })
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((th) => th.textContent),
    ).toEqual(['الصنف', 'السعر'])
    expect(within(table).getByText('Ventolin Inhaler')).toBeInTheDocument()
  })

  it('shows the empty state when there are no rows', () => {
    render(
      <DataTable
        caption="الأصناف"
        columns={columns}
        rows={[]}
        getRowId={(row) => row.id}
        empty={<p>لسا ما في أصناف</p>}
      />,
    )
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByText('لسا ما في أصناف')).toBeInTheDocument()
  })

  it('selects one row and then all rows', async () => {
    render(<Selectable />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'تحديد Panadol Extra' }))
    expect(screen.getByRole('status')).toHaveTextContent('1')
    await userEvent.click(screen.getByRole('checkbox', { name: 'تحديد الكل' }))
    expect(screen.getByRole('status')).toHaveTextContent('2')
    await userEvent.click(screen.getByRole('checkbox', { name: 'تحديد الكل' }))
    expect(screen.getByRole('status')).toHaveTextContent('0')
  })
})

describe('Pagination', () => {
  it('shows the range and moves to the next page', async () => {
    const onPageChange = vi.fn<(page: number) => void>()
    render(<Pagination page={1} pageSize={25} total={312} onPageChange={onPageChange} />)
    expect(screen.getByText('عرض 1–25 من 312')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'السابق' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'التالي' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
