import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

function row(name: string) {
  const cell = within(screen.getByRole('table')).getByText(name)
  const tr = cell.closest('tr')
  if (!tr) throw new Error(`no row for ${name}`)
  return within(tr)
}

describe('StaffPage', () => {
  it('lists the staff with roles, limits and status; the owner cannot be stopped', async () => {
    await renderApp('/staff')
    await screen.findByRole('table')
    await within(screen.getByRole('table')).findByText('سارة يوسف')
    expect(row('رزان').getByText('المالك · ما بيتوقف')).toBeInTheDocument()
    expect(row('رزان').getByText('بلا حد')).toBeInTheDocument()
    expect(row('سارة يوسف').getByText('10%')).toBeInTheDocument()
    expect(row('أحمد شحادة').getByRole('switch', { name: 'حساب أحمد شحادة نشط' })).not.toBeChecked()
  })

  it('adds a cashier and shows the temporary password to send', async () => {
    await renderApp('/staff')
    await userEvent.click(await screen.findByRole('button', { name: '+ موظف' }))
    const drawer = screen.getByRole('dialog', { name: 'موظف جديد' })
    await userEvent.type(within(drawer).getByLabelText('الاسم الكامل'), 'لينا خالد')
    await userEvent.type(within(drawer).getByLabelText('الجوال'), '0599318642')
    await userEvent.click(within(drawer).getByRole('radio', { name: /كاشير/ }))
    expect(within(drawer).getByRole('checkbox', { name: 'يعتمد الجرد (للصيدلي)' })).toBeDisabled()
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ' }))

    const dialog = await screen.findByRole('dialog', { name: 'كلمة المرور المؤقتة لـ لينا خالد' })
    expect(within(dialog).getByText(/K7-M4P-/)).toBeInTheDocument()
    expect(
      within(dialog).getByRole('link', { name: 'ابعتي بيانات الدخول واتساب' }),
    ).toHaveAttribute('href', expect.stringContaining('https://wa.me/970599318642'))
    await userEvent.click(within(dialog).getByRole('button', { name: 'تم' }))
    expect(await screen.findByText('لينا خالد')).toBeInTheDocument()
  })

  it('refuses a phone another member already uses', async () => {
    await renderApp('/staff?new=1')
    const drawer = await screen.findByRole('dialog', { name: 'موظف جديد' })
    await userEvent.type(within(drawer).getByLabelText('الاسم الكامل'), 'حدا')
    await userEvent.type(within(drawer).getByLabelText('الجوال'), '0598210774')
    await userEvent.click(within(drawer).getByRole('button', { name: 'حفظ' }))
    expect(await within(drawer).findByText(/في طلب أو حساب بهالرقم/)).toBeInTheDocument()
  })

  it('asks before stopping someone, and can undo it', async () => {
    await renderApp('/staff')
    await within(await screen.findByRole('table')).findByText('محمد سالم')
    await userEvent.click(row('محمد سالم').getByRole('switch'))
    const dialog = screen.getByRole('dialog', { name: 'إيقاف حساب محمد سالم؟' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'إيقاف الحساب' }))
    expect(await screen.findByText('انوقف حساب محمد سالم')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'تراجع' }))
    expect(await screen.findByText('رجع حساب محمد سالم نشط')).toBeInTheDocument()
  })

  it('makes a new temporary password for someone who forgot', async () => {
    await renderApp('/staff')
    await within(await screen.findByRole('table')).findByText('سارة يوسف')
    await userEvent.click(row('سارة يوسف').getByRole('button', { name: 'كلمة مرور جديدة' }))
    await userEvent.click(screen.getByRole('button', { name: 'اعملي كلمة جديدة' }))
    expect(
      await screen.findByRole('dialog', { name: 'كلمة المرور المؤقتة لـ سارة يوسف' }),
    ).toBeInTheDocument()
  })

  it('is closed to the pharmacist even by typing the address', async () => {
    localStorage.setItem('mockRole', 'pharmacist')
    await renderApp('/staff')
    expect(await screen.findByText('هالصفحة للمدير')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
