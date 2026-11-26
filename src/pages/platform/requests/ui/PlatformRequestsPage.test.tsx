import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('PlatformRequestsPage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'platform'))

  it('opens on the new requests with the first one selected', async () => {
    await renderApp('/platform/requests')
    expect(await screen.findByRole('tab', { name: 'جديدة · 3' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('heading', { level: 2, name: 'صيدلية الرحمة' })).toBeInTheDocument()
  })

  it('approves a request, which then moves to waiting for activation', async () => {
    await renderApp('/platform/requests')
    await userEvent.click(await screen.findByRole('button', { name: 'قبول وإرسال رابط التفعيل' }))
    expect(
      await screen.findByText('انقبل الطلب وانبعت رابط التفعيل لـ صيدلية الرحمة'),
    ).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'جديدة · 2' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'انقبلت وما تفعلت · 2' })).toBeInTheDocument()
  })

  it('needs a reason to reject', async () => {
    await renderApp('/platform/requests')
    await userEvent.click(await screen.findByRole('button', { name: 'رفض…' }))
    const dialog = screen.getByRole('dialog', { name: 'رفض طلب صيدلية الرحمة' })
    const confirm = within(dialog).getByRole('button', { name: 'رفض الطلب' })
    expect(confirm).toBeDisabled()
    await userEvent.type(within(dialog).getByLabelText('سبب الرفض'), 'الترخيص منتهي')
    await userEvent.click(confirm)
    expect(await screen.findByText('انرفض طلب صيدلية الرحمة')).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'مرفوضة · 2' })).toBeInTheDocument()
  })

  it('adds a pharmacy by hand, approved at once', async () => {
    await renderApp('/platform/requests')
    await userEvent.click(await screen.findByRole('button', { name: '+ إضافة صيدلية بإيدي' }))
    const drawer = screen.getByRole('dialog', { name: 'إضافة صيدلية' })
    await userEvent.type(within(drawer).getByLabelText('اسم الصيدلية'), 'صيدلية القدس')
    await userEvent.type(within(drawer).getByLabelText('اسم المالكة أو المالك'), 'سمر عودة')
    await userEvent.type(within(drawer).getByLabelText('المدينة'), 'رفح{Enter}')
    await userEvent.type(within(drawer).getByLabelText('رقم الجوال (واتساب)'), '0569998877')
    await userEvent.type(within(drawer).getByLabelText('رقم ترخيص الصيدلية'), 'PH-2026-0300')
    await userEvent.click(within(drawer).getByRole('button', { name: 'إضافة وإرسال رابط التفعيل' }))
    expect(await screen.findByText('انضافت صيدلية القدس وانبعت رابط التفعيل')).toBeInTheDocument()
    expect(await screen.findByRole('tab', { name: 'انقبلت وما تفعلت · 2' })).toBeInTheDocument()
  })
})
