import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Combobox, type ComboboxOption } from './Combobox'

const categories: ComboboxOption[] = [
  { value: '1', label: 'مضادات حيوية', meta: '48 صنف' },
  { value: '2', label: 'مضادات حساسية', meta: '17 صنف' },
  { value: '3', label: 'مسكنات', keywords: 'painkillers' },
  { value: '4', label: 'أمراض مزمنة' },
]

function Harness({ onCreate }: { onCreate?: (label: string) => void }) {
  const [value, setValue] = useState<string | null>(null)
  return (
    <>
      <label htmlFor="category">التصنيف</label>
      <Combobox
        id="category"
        options={categories}
        value={value}
        onChange={setValue}
        {...(onCreate ? { onCreate } : {})}
      />
    </>
  )
}

describe('Combobox', () => {
  it('filters as the user types', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox', { name: 'التصنيف' }), 'مضا')
    expect(screen.getAllByRole('option')).toHaveLength(2)
  })

  it('finds an option written with hamza when typed without it', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'امراض')
    expect(screen.getByRole('option', { name: 'أمراض مزمنة' })).toBeInTheDocument()
  })

  it('finds an option by its keywords', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'pain')
    expect(screen.getByRole('option', { name: 'مسكنات' })).toBeInTheDocument()
  })

  it('picks with the keyboard and shows the choice', async () => {
    render(<Harness />)
    const input = screen.getByRole('combobox')
    await userEvent.type(input, 'مضا{ArrowDown}{Enter}')
    expect(input).toHaveValue('مضادات حساسية')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('offers to add a name that is not in the list', async () => {
    const onCreate = vi.fn<(label: string) => void>()
    render(<Harness onCreate={onCreate} />)
    await userEvent.type(screen.getByRole('combobox'), 'فيتامينات')
    await userEvent.click(screen.getByRole('option', { name: '+ أضيفي "فيتامينات"' }))
    expect(onCreate).toHaveBeenCalledWith('فيتامينات')
  })

  it('does not offer to add a name that already exists', async () => {
    render(<Harness onCreate={vi.fn<(label: string) => void>()} />)
    await userEvent.type(screen.getByRole('combobox'), 'مسكنات')
    expect(screen.queryByRole('option', { name: /أضيفي/ })).not.toBeInTheDocument()
  })

  it('says so when nothing matches and adding is not allowed', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'xyz')
    expect(screen.getByText('ما لقينا "xyz"')).toBeInTheDocument()
  })

  it('closes on Escape', async () => {
    render(<Harness />)
    await userEvent.type(screen.getByRole('combobox'), 'م{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
