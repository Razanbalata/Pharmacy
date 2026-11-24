import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderApp } from '@test/render'

describe('ForgotPasswordPage', () => {
  beforeEach(() => localStorage.setItem('mockRole', 'none'))

  it('goes through phone, code and new password, then back to sign in', async () => {
    const { router } = await renderApp('/forgot-password')
    await userEvent.type(await screen.findByLabelText('الجوال أو البريد'), '0599920307')
    await userEvent.click(screen.getByRole('button', { name: 'ابعتي الكود' }))

    expect(await screen.findByText('بعتناه للرقم المنتهي بـ 307')).toBeInTheDocument()
    expect(screen.getByText(/بتقدري تطلبي كود جديد بعد/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('الكود'), '000000')
    await userEvent.click(screen.getByRole('button', { name: 'تأكيد' }))
    expect(await screen.findByText('الكود غلط أو انتهى. الكود صالح 10 دقايق.')).toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('الكود'))
    await userEvent.type(screen.getByLabelText('الكود'), '481927')
    await userEvent.click(screen.getByRole('button', { name: 'تأكيد' }))

    await userEvent.type(await screen.findByLabelText('كلمة المرور الجديدة'), 'NewPass2026')
    await userEvent.type(screen.getByLabelText('أعيديها'), 'NewPass2026')
    await userEvent.click(screen.getByRole('button', { name: 'حفظ والرجوع للدخول' }))

    expect(await screen.findByText('تغيرت كلمة المرور. ادخلي بالكلمة الجديدة.')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
