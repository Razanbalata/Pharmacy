import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

const list = () => screen.findByRole('navigation', { name: 'المواد الفعالة' })

describe('IngredientsPage', () => {
  it('shows an ingredient with its counts and every product that shares it', async () => {
    await renderApp('/ingredients')
    await userEvent.click(
      within(await list()).getByRole('button', { name: /^Amoxicillin \+ Clavulanic acid/ }),
    )
    const panel = screen.getByRole('region', { name: 'Amoxicillin + Clavulanic acid' })
    expect(within(panel).getByText(/أموكسيسيلين مع حمض الكلافولانيك/)).toBeInTheDocument()
    const stats = within(panel)
      .getAllByRole('definition')
      .map((item) => item.textContent)
    expect(stats).toEqual(['6', '5', '1'])
    expect(
      await within(panel).findByRole('link', { name: 'Moxiclav 625mg 14 Tablets' }),
    ).toBeVisible()
    expect(within(panel).getAllByRole('row')).toHaveLength(7)
  })

  it('merges two names for the same substance from the notice', async () => {
    await renderApp('/ingredients')
    await userEvent.click(await screen.findByRole('button', { name: 'مراجعة ودمج' }))
    const dialog = screen.getByRole('dialog', { name: 'دمج Amoxicillin/Clavulanate' })
    expect(within(dialog).getByRole('combobox')).toHaveValue('Amoxicillin + Clavulanic acid')
    await userEvent.click(within(dialog).getByRole('button', { name: 'تأكيد الدمج' }))

    expect(
      await screen.findByText('اندمجت Amoxicillin/Clavulanate مع Amoxicillin + Clavulanic acid'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'مراجعة ودمج' })).not.toBeInTheDocument()
    expect(
      within(await list()).queryByRole('button', { name: /Amoxicillin\/Clavulanate/ }),
    ).not.toBeInTheDocument()
  })

  it('adds an ingredient and refuses one that exists', async () => {
    await renderApp('/ingredients')
    await list()
    await userEvent.click(screen.getByRole('button', { name: '+ مادة فعالة' }))
    let dialog = screen.getByRole('dialog', { name: 'مادة فعالة جديدة' })
    await userEvent.type(within(dialog).getByLabelText('الاسم العلمي'), 'metformin')
    await userEvent.click(within(dialog).getByRole('button', { name: 'حفظ' }))
    expect(await within(dialog).findByText('المادة موجودة من قبل')).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'إلغاء' }))

    await userEvent.click(screen.getByRole('button', { name: '+ مادة فعالة' }))
    dialog = screen.getByRole('dialog', { name: 'مادة فعالة جديدة' })
    await userEvent.type(within(dialog).getByLabelText('الاسم العلمي'), 'Loratadine')
    await userEvent.type(within(dialog).getByLabelText(/الاسم بالعربي/), 'لوراتادين')
    await userEvent.click(within(dialog).getByRole('button', { name: 'حفظ' }))

    expect(await screen.findByText('انضافت Loratadine')).toBeInTheDocument()
    const panel = await screen.findByRole('region', { name: 'Loratadine' })
    expect(await within(panel).findByText('ما في أصناف بهالمادة لسا.')).toBeInTheDocument()
  })

  it('finds an ingredient by its Arabic name', async () => {
    await renderApp('/ingredients')
    await list()
    await userEvent.type(screen.getByRole('searchbox'), 'سالبوتامول')
    expect(within(await list()).getAllByRole('button')).toHaveLength(1)
    expect(within(await list()).getByRole('button', { name: /Salbutamol/ })).toBeInTheDocument()
  })
})
