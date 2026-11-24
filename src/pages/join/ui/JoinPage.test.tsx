import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

async function fill(phone: string) {
  await userEvent.type(await screen.findByLabelText('اسم الصيدلية'), 'صيدلية النجمة')
  await userEvent.type(screen.getByLabelText('اسم المالكة أو المالك'), 'دعاء حلس')
  await userEvent.type(screen.getByLabelText('المدينة'), 'خان{ArrowDown}{Enter}')
  await userEvent.type(screen.getByLabelText('رقم الجوال (واتساب)'), phone)
  await userEvent.type(screen.getByLabelText('رقم ترخيص الصيدلية'), 'PH-2026-0200')
  await userEvent.click(screen.getByLabelText('موافقة على شروط الاستخدام وسياسة الخصوصية'))
}

describe('JoinPage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'none'))

  it('checks every field and the phone format before sending', async () => {
    await renderApp('/join')
    await userEvent.type(await screen.findByLabelText('رقم الجوال (واتساب)'), '0821234')
    await userEvent.click(screen.getByRole('button', { name: 'ابعتي طلب الانضمام' }))
    expect(await screen.findByText(/رقم جوال غير صحيح/)).toBeInTheDocument()
    expect(screen.getAllByText('هالحقل مطلوب').length).toBeGreaterThanOrEqual(4)
    expect(screen.getByText('لازم توافقي على الشروط')).toBeInTheDocument()
  })

  it('sends the request and shows the reference and the number it goes to', async () => {
    await renderApp('/join')
    await fill('0568 123 456')
    await userEvent.click(screen.getByRole('button', { name: 'ابعتي طلب الانضمام' }))
    expect(await screen.findByRole('heading', { name: 'وصلنا طلبك' })).toBeInTheDocument()
    expect(screen.getByText(/المنتهي بـ 456/)).toBeInTheDocument()
    expect(screen.getByText('رقم الطلب REQ-0035')).toBeInTheDocument()
  })

  it('refuses a number that already has a request or account', async () => {
    await renderApp('/join')
    await fill('0599920307')
    await userEvent.click(screen.getByRole('button', { name: 'ابعتي طلب الانضمام' }))
    expect(await screen.findByText(/في طلب أو حساب بهالرقم من قبل/)).toBeInTheDocument()
  })
})
