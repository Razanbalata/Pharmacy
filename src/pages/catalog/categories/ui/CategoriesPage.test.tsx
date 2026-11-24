import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function row(name: string) {
  const cell = await within(await screen.findByRole('table')).findByText(name)
  return within(cell.closest('tr')!)
}

describe('CategoriesPage', () => {
  it('lists categories with their product and shortage counts', async () => {
    await renderApp('/categories')
    const antibiotics = await row('مضادات حيوية')
    expect(antibiotics.getByRole('link', { name: '9 صنف' })).toHaveAttribute(
      'href',
      '/products?category=1',
    )
    const respiratory = await row('جهاز تنفسي')
    expect(respiratory.getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      '/products?category=4&tab=low',
    )
    expect(screen.getByText(/9 تصنيفات/)).toBeInTheDocument()
  })

  it('adds a category from the top row, and refuses an empty or repeated name', async () => {
    await renderApp('/categories')
    await screen.findByRole('table')
    const button = screen.getByRole('button', { name: '+ إضافة ↵' })
    await userEvent.click(button)
    expect(screen.getByText('هالحقل مطلوب')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('تصنيف جديد بالعربي'), 'مسكنات')
    await userEvent.click(button)
    expect(await screen.findByText('في تصنيف بنفس الاسم')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('تصنيف جديد بالعربي'))
    await userEvent.type(screen.getByLabelText('تصنيف جديد بالعربي'), 'مستلزمات طبية')
    await userEvent.type(screen.getByLabelText('بالإنجليزي'), 'Medical supplies{Enter}')
    expect(await screen.findByText('انضاف مستلزمات طبية')).toBeInTheDocument()
    expect((await row('مستلزمات طبية')).getByText('Medical supplies')).toBeInTheDocument()
    expect(screen.getByLabelText('تصنيف جديد بالعربي')).toHaveValue('')
  })

  it('renames a category in place', async () => {
    await renderApp('/categories')
    await userEvent.click((await row('أطفال')).getByRole('button', { name: 'تعديل أطفال' }))
    const input = screen.getByLabelText('الاسم بالعربي')
    await userEvent.clear(input)
    await userEvent.type(input, 'أطفال ورضع')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ' }))
    expect(await screen.findByText('انحفظ أطفال ورضع')).toBeInTheDocument()
    expect(await row('أطفال ورضع')).toBeTruthy()
  })

  it('merges a category into another and moves its products', async () => {
    await renderApp('/categories')
    await userEvent.click((await row('جهاز تنفسي')).getByRole('button', { name: 'دمج جهاز تنفسي' }))
    const confirm = screen.getByRole('button', { name: 'تأكيد الدمج' })
    expect(confirm).toBeDisabled()
    expect(screen.getByText('3 صنف رح ينتقلوا، والتصنيف القديم بينحذف.')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('دمج جهاز تنفسي مع:'), 'حساسية وتنفس')
    await userEvent.click(confirm)

    expect(await screen.findByText('انضم جهاز تنفسي لـحساسية وتنفس')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('جهاز تنفسي')).not.toBeInTheDocument()
    expect((await row('حساسية وتنفس')).getByRole('link', { name: '4 صنف' })).toBeInTheDocument()
  })

  it('deletes only an empty category', async () => {
    await renderApp('/categories')
    expect((await row('مسكنات')).queryByRole('button', { name: 'حذف' })).not.toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('تصنيف جديد بالعربي'), 'مؤقت{Enter}')
    await userEvent.click((await row('مؤقت')).getByRole('button', { name: 'حذف' }))
    const dialog = screen.getByRole('dialog', { name: 'حذف مؤقت؟' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'حذف' }))
    expect(await screen.findByText('انحذف مؤقت')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('مؤقت')).not.toBeInTheDocument()
  })
})
