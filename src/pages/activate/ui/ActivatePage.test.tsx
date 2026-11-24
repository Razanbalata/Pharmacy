import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('ActivatePage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'none'))

  it('shows which pharmacy was approved and its number, read-only', async () => {
    await renderApp('/activate/demo-token')
    expect(await screen.findByText(/انقبل طلب صيدلية الحكمة/)).toBeInTheDocument()
    expect(screen.getByLabelText('الجوال')).toHaveValue('0592 660 135')
    expect(screen.getByLabelText('الجوال')).toBeDisabled()
  })

  it('needs matching passwords that follow the rule', async () => {
    await renderApp('/activate/demo-token')
    await userEvent.type(await screen.findByLabelText('كلمة المرور'), 'short')
    await userEvent.type(screen.getByLabelText('أعيدي كلمة المرور'), 'other')
    await userEvent.click(screen.getByRole('button', { name: 'تفعيل والانتقال لتجهيز الصيدلية' }))
    expect(
      await screen.findByText('كلمة المرور لازم تكون 8 أحرف أو أكتر وفيها رقم'),
    ).toBeInTheDocument()
    expect(screen.getByText('كلمتين المرور مش متطابقتين')).toBeInTheDocument()
  })

  it('activates, signs in and goes on to set up the pharmacy', async () => {
    const { router } = await renderApp('/activate/demo-token')
    await userEvent.type(await screen.findByLabelText('كلمة المرور'), 'Pharma2026x')
    await userEvent.type(screen.getByLabelText('أعيدي كلمة المرور'), 'Pharma2026x')
    await userEvent.click(screen.getByRole('button', { name: 'تفعيل والانتقال لتجهيز الصيدلية' }))
    expect(await screen.findByRole('heading', { name: 'عرفينا على صيدليتك' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/setup')
  })

  it('offers a new link when this one expired', async () => {
    await renderApp('/activate/expired-token')
    expect(await screen.findByText('الرابط انتهى')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'ابعتولي رابط جديد' }))
    expect(await screen.findByText('طلبنا رابط جديد، رح يوصلك على واتساب.')).toBeInTheDocument()
  })

  it('says so when the link is not valid', async () => {
    await renderApp('/activate/nonsense')
    expect(await screen.findByText('الرابط مش صحيح')).toBeInTheDocument()
  })
})
