import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { http } from '@/shared/api'
import { renderApp } from '@test/render'

async function clearHeld() {
  await http.delete('/api/sales/held/2')
  await http.delete('/api/sales/held/3')
}

describe('ShiftPage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shows what the drawer should hold, and will not close with held sales', async () => {
    await renderApp('/sales/shift')
    expect(await screen.findByRole('heading', { name: 'إغلاق الوردية 14' })).toBeInTheDocument()
    expect(screen.getByText('محمد سالم · من 08:00 · 6 فاتورة')).toBeInTheDocument()
    expect(screen.getByText('+ 296.00')).toBeInTheDocument()
    expect(screen.getByText('496.00 ₪')).toBeInTheDocument()
    expect(screen.getByText('في 2 فواتير معلقة. كمّليها أو ألغيها قبل الإغلاق.')).toBeVisible()
    await userEvent.type(screen.getByLabelText('النقد الفعلي بعد العد'), '496')
    expect(screen.getByRole('button', { name: 'إغلاق الوردية وطباعة الملخص' })).toBeDisabled()
  })

  it('needs a note for a difference, then closes and prints', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    await clearHeld()
    const { router } = await renderApp('/sales/shift')
    await screen.findByRole('heading', { name: 'إغلاق الوردية 14' })
    await userEvent.type(screen.getByLabelText('النقد الفعلي بعد العد'), '486')
    expect(screen.getByText('− 10.00 ₪')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'إغلاق الوردية وطباعة الملخص' }))
    expect(screen.getByLabelText('ملاحظة على الفرق')).toHaveAttribute('aria-invalid', 'true')

    await userEvent.type(screen.getByLabelText('ملاحظة على الفرق'), 'أعطيت باقي زيادة لزبون')
    await userEvent.click(screen.getByRole('button', { name: 'إغلاق الوردية وطباعة الملخص' }))
    expect(await screen.findByText('انغلقت الوردية 14')).toBeInTheDocument()
    expect(print).toHaveBeenCalledOnce()
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('opens the next shift with the cash counted in the drawer', async () => {
    vi.spyOn(window, 'print').mockImplementation(() => {})
    await clearHeld()
    await http.post('/api/shifts/current/close', { countedCash: 496, note: '' })
    const { router } = await renderApp('/sales/shift')
    expect(await screen.findByRole('heading', { name: 'فتح وردية جديدة' })).toBeInTheDocument()
    const cash = screen.getByLabelText('النقد الموجود بالدرج')
    expect(cash).toHaveValue('496')
    await userEvent.clear(cash)
    await userEvent.type(cash, '500')
    expect(screen.getByText(/بيختلف عن إغلاق الوردية الماضية بـ 4.00 ₪/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'فتح الوردية والبدء بالبيع' }))
    expect(await screen.findByText('انفتحت الوردية 15')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/sales/pos'))
  })
})
