import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('SettingsPage', () => {
  it('shows every section with its saved values', async () => {
    await renderApp('/settings')
    const sale = await screen.findByRole('region', { name: 'البيع والدفع' })
    expect(within(sale).getByLabelText('مدة قبول المرتجع')).toHaveValue('14')
    expect(
      within(sale).getByRole('switch', { name: 'البيع لو الكمية بالنظام صفر' }),
    ).not.toBeChecked()
    for (const name of [
      'الصيدلية',
      'المخزون والتنبيهات',
      'الطباعة',
      'الاشتراك',
      'النسخة الاحتياطية',
      'اللغة والمظهر',
    ]) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
  })

  it('says there are unsaved changes, saves them and logs the change', async () => {
    await renderApp('/settings')
    const save = await screen.findByRole('button', { name: 'حفظ التعديلات' })
    expect(save).toBeDisabled()
    const days = screen.getByLabelText('نبهني قبل انتهاء الصلاحية بـ')
    await userEvent.clear(days)
    await userEvent.type(days, '120')
    expect(screen.getByText('في تعديلات ما انحفظت')).toBeInTheDocument()
    await userEvent.click(save)
    expect(await screen.findByText('انحفظت الإعدادات')).toBeInTheDocument()
  })

  it('stops a value out of range', async () => {
    await renderApp('/settings')
    const days = await screen.findByLabelText('مدة قبول المرتجع')
    await userEvent.clear(days)
    await userEvent.type(days, '-3')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ التعديلات' }))
    expect(screen.queryByText('انحفظت الإعدادات')).not.toBeInTheDocument()
    expect(days).toHaveFocus()
  })

  it('shows prices as placeholders until they are decided', async () => {
    await renderApp('/settings')
    const plan = await screen.findByRole('region', { name: 'الاشتراك' })
    expect(within(plan).getAllByText(/\[السعر\]/)).toHaveLength(3)
  })
})

describe('SettingsPage logo', () => {
  it('uploads a new logo at once and shows it', async () => {
    await renderApp('/settings')
    const picker = await screen.findByLabelText('تغيير الشعار')
    const file = new File([new Uint8Array([137, 80, 78, 71])], 'logo.png', { type: 'image/png' })
    await userEvent.upload(picker, file)
    expect(await screen.findByText('انحفظ الشعار')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'شعار الصيدلية' })).toBeInTheDocument()
  })

  it('refuses a file that is not an image without sending it', async () => {
    await renderApp('/settings')
    const picker = await screen.findByLabelText('تغيير الشعار')
    const file = new File(['x'], 'notes.pdf', { type: 'application/pdf' })
    await userEvent.upload(picker, file, { applyAccept: false })
    expect(await screen.findByRole('alert')).toHaveTextContent('لازم تكون صورة PNG أو JPG أو WebP')
  })
})
